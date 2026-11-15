import { useCallback, useSyncExternalStore } from 'react';

/* Progress lives in memory and is mirrored to Supabase (see cloud.ts). Nothing is written to localStorage.
   ids: problems "p:<section>:…", topics "t:<section>:…" (see catalog.ts). */
export interface Persisted { v: 1; done: Record<string, 1>; star: Record<string, 1>; remark: Record<string, string> }
export interface ResetOptions { done: boolean; star: boolean; remark: boolean }
/** One changed item; only the fields that changed are present. */
export interface Change { id: string; done?: boolean; starred?: boolean; remark?: string }
export interface Sink { write(changes: Change[]): void }
export type Phase = 'out' | 'loading' | 'ready';
export interface SyncStatus {
  phase: Phase;                                   // out = signed out, loading = first fetch, ready = live
  activity: 'idle' | 'saving' | 'error' | 'offline';
  pending: number;                                // changes not yet confirmed by the server
  lastSyncedAt: number | null;
  error: string | null;
}

const EMPTY: Persisted = { v: 1, done: {}, star: {}, remark: {} };
let state: Persisted = EMPTY;
let status: SyncStatus = { phase: 'out', activity: 'idle', pending: 0, lastSyncedAt: null, error: null };
let sink: Sink | null = null;
let blocked: ((why: 'out' | 'loading') => void) | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (cb: () => void) => { subs.add(cb); return () => { subs.delete(cb); }; };
const snap = <T,>(fn: (s: Persisted) => T) => () => fn(state);

/* ---------- called by the cloud layer ---------- */
export function connectCloud(s: Sink) { sink = s; state = EMPTY; status = { ...status, phase: 'loading', error: null }; emit(); }
export function loadCloudState(next: Persisted) { state = next; status = { ...status, phase: 'ready' }; emit(); }
export function disconnectCloud() { sink = null; state = EMPTY; status = { phase: 'out', activity: 'idle', pending: 0, lastSyncedAt: null, error: null }; emit(); }
export function setSyncStatus(p: Partial<SyncStatus>) { status = { ...status, ...p }; emit(); }
export const setBlockedHandler = (fn: ((why: 'out' | 'loading') => void) | null) => { blocked = fn; };
/** Apply rows that arrived from the server. `skip` lets the sync layer protect unsent local edits. */
export function applyRemote(rows: { id: string; done?: boolean; starred?: boolean; remark?: string }[], skip: (id: string, field: 'done' | 'starred' | 'remark') => boolean) {
  const done = { ...state.done }, star = { ...state.star }, remark = { ...state.remark };
  let touched = false;
  for (const r of rows) {
    if (r.done !== undefined && !skip(r.id, 'done')) { if (r.done) done[r.id] = 1; else delete done[r.id]; touched = true; }
    if (r.starred !== undefined && !skip(r.id, 'starred')) { if (r.starred) star[r.id] = 1; else delete star[r.id]; touched = true; }
    if (r.remark !== undefined && !skip(r.id, 'remark')) { if (r.remark.trim()) remark[r.id] = r.remark; else delete remark[r.id]; touched = true; }
  }
  if (touched) { state = { v: 1, done, star, remark }; emit(); }
}

/* ---------- hooks ---------- */
export const useDone = (id: string) => useSyncExternalStore(subscribe, snap((s) => s.done[id] === 1), () => false);
export const useStar = (id: string) => useSyncExternalStore(subscribe, snap((s) => s.star[id] === 1), () => false);
export const useRemark = (id: string) => useSyncExternalStore(subscribe, snap((s) => s.remark[id] ?? ''), () => '');
export const useStarMap = () => useSyncExternalStore(subscribe, snap((s) => s.star), () => EMPTY.star);
export const useDoneMap = () => useSyncExternalStore(subscribe, snap((s) => s.done), () => EMPTY.done);
export const useAll = () => useSyncExternalStore(subscribe, snap((s) => s), () => EMPTY);
export const useSyncStatus = () => useSyncExternalStore(subscribe, () => status, () => status);

export function useCount(ids: readonly string[], kind: 'done' | 'star'): number {
  const get = useCallback(() => { const m = state[kind]; let n = 0; for (const id of ids) if (m[id] === 1) n++; return n; }, [ids, kind]);
  return useSyncExternalStore(subscribe, get, () => 0);
}
export function useCountPrefix(prefix: string, kind: 'done' | 'star'): number {
  const get = useCallback(() => { let n = 0; for (const id in state[kind]) if (id.startsWith(prefix)) n++; return n; }, [prefix, kind]);
  return useSyncExternalStore(subscribe, get, () => 0);
}

/* ---------- actions (every one goes through the sink, so the cloud sees every change) ---------- */
function writable(): boolean {
  if (status.phase === 'ready' && sink) return true;
  blocked?.(status.phase === 'loading' ? 'loading' : 'out');
  return false;
}
function commit(next: Persisted, changes: Change[]) {
  if (!changes.length) return;
  state = next; emit(); sink?.write(changes);
}
export function toggleDone(id: string) {
  if (!writable()) return;
  const done = { ...state.done }, on = !done[id];
  if (on) done[id] = 1; else delete done[id];
  commit({ ...state, done }, [{ id, done: on }]);
}
export function toggleStar(id: string) {
  if (!writable()) return;
  const star = { ...state.star }, on = !star[id];
  if (on) star[id] = 1; else delete star[id];
  commit({ ...state, star }, [{ id, starred: on }]);
}
export function setDone(ids: readonly string[], value: boolean) {
  if (!writable()) return;
  const done = { ...state.done }, changes: Change[] = [];
  for (const id of new Set(ids)) {
    if (value && !done[id]) { done[id] = 1; changes.push({ id, done: true }); }
    else if (!value && done[id]) { delete done[id]; changes.push({ id, done: false }); }
  }
  commit({ ...state, done }, changes);
}
export function setRemark(id: string, text: string) {
  if (!writable()) return;
  const remark = { ...state.remark };
  if (text.trim() === '') delete remark[id]; else remark[id] = text;
  commit({ ...state, remark }, [{ id, remark: text.trim() === '' ? '' : text }]);
}
export function resetWhere(match: (id: string) => boolean, o: ResetOptions) {
  if (!writable()) return;
  const by = new Map<string, Change>();
  const put = (id: string, patch: Partial<Change>) => by.set(id, { ...(by.get(id) ?? { id }), ...patch });
  const done = { ...state.done }, star = { ...state.star }, remark = { ...state.remark };
  if (o.done) for (const id of Object.keys(done)) if (match(id)) { delete done[id]; put(id, { done: false }); }
  if (o.star) for (const id of Object.keys(star)) if (match(id)) { delete star[id]; put(id, { starred: false }); }
  if (o.remark) for (const id of Object.keys(remark)) if (match(id)) { delete remark[id]; put(id, { remark: '' }); }
  commit({ v: 1, done, star, remark }, [...by.values()]);
}
export const resetIds = (ids: readonly string[], o: ResetOptions) => { const s = new Set(ids); resetWhere((id) => s.has(id), o); };
export const resetPrefixes = (prefixes: readonly string[], o: ResetOptions) => resetWhere((id) => prefixes.some((p) => id.startsWith(p)), o);

/* ---------- backup ---------- */
export function parseState(raw: unknown): Persisted {
  const o = (raw ?? {}) as Partial<Persisted>;
  const rec = (x: unknown) => (x && typeof x === 'object' ? (x as Record<string, never>) : {});
  return { v: 1, done: rec(o.done), star: rec(o.star), remark: rec(o.remark) } as Persisted;
}
export function exportData(): string {
  return JSON.stringify({ app: 'interview-preparation', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2);
}
/** Import a backup (or the old local-storage data) into the signed-in account. */
export function importState(inc: Persisted, mode: 'merge' | 'replace'): { ok: boolean; message: string } {
  if (!writable()) return { ok: false, message: status.phase === 'loading' ? 'Still loading your account, try again in a moment.' : 'Sign in first, then import.' };
  const by = new Map<string, Change>();
  const put = (id: string, patch: Partial<Change>) => by.set(id, { ...(by.get(id) ?? { id }), ...patch });
  const next: Persisted = mode === 'replace' ? { v: 1, done: {}, star: {}, remark: {} } : { v: 1, done: { ...state.done }, star: { ...state.star }, remark: { ...state.remark } };
  if (mode === 'replace') {
    for (const id of Object.keys(state.done)) if (!inc.done[id]) put(id, { done: false });
    for (const id of Object.keys(state.star)) if (!inc.star[id]) put(id, { starred: false });
    for (const id of Object.keys(state.remark)) if (!(inc.remark[id] ?? '').trim()) put(id, { remark: '' });
  }
  for (const id of Object.keys(inc.done)) { next.done[id] = 1; put(id, { done: true }); }
  for (const id of Object.keys(inc.star)) { next.star[id] = 1; put(id, { starred: true }); }
  for (const id of Object.keys(inc.remark)) { if ((inc.remark[id] ?? '').trim()) { next.remark[id] = inc.remark[id]; put(id, { remark: inc.remark[id] }); } }
  commit(next, [...by.values()]);
  return { ok: true, message: `Imported ${Object.keys(inc.done).length} done, ${Object.keys(inc.star).length} starred and ${Object.keys(inc.remark).length} remarks (${mode}). Syncing to your account…` };
}
export function importData(text: string, mode: 'merge' | 'replace'): { ok: boolean; message: string } {
  try {
    const parsed = JSON.parse(text);
    if (parsed?.app !== 'interview-preparation' || !parsed.data) return { ok: false, message: 'This file is not an Interview preparation backup.' };
    return importState(parseState(parsed.data), mode);
  } catch { return { ok: false, message: 'Could not read that file.' }; }
}
