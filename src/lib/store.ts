import { useCallback, useSyncExternalStore } from 'react';

/* All progress lives in this browser's localStorage under one key.
   ids: problems "p:<section>:…", topics "t:<section>:…" (see catalog.ts). */
export interface Persisted { v: 1; done: Record<string, 1>; star: Record<string, 1>; remark: Record<string, string> }
export interface ResetOptions { done: boolean; star: boolean; remark: boolean }

const KEY = 'interview-preparation:v1';
export const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // typical per-origin quota; browsers differ

const EMPTY: Persisted = { v: 1, done: {}, star: {}, remark: {} };
let state: Persisted = EMPTY;
let loaded = false;
let storageError: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const subs = new Set<() => void>();

function parse(raw: string | null): Persisted {
  if (!raw) return EMPTY;
  const o = JSON.parse(raw) as Partial<Persisted>;
  const rec = (x: unknown) => (x && typeof x === 'object' ? (x as Record<string, never>) : {});
  return { v: 1, done: rec(o.done), star: rec(o.star), remark: rec(o.remark) } as Persisted;
}
function emit() { subs.forEach((f) => f()); }
function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  try { localStorage.setItem(KEY, JSON.stringify(state)); storageError = null; }
  catch (e) { storageError = e instanceof Error ? e.message : String(e); emit(); }
}
function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try { state = parse(localStorage.getItem(KEY)); } catch { state = EMPTY; }
  window.addEventListener('storage', (e) => { if (e.key === KEY) { try { state = parse(e.newValue); } catch { state = EMPTY; } emit(); } });
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
}
function commit(next: Persisted) {
  state = next; emit();
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 200);
}
const subscribe = (cb: () => void) => { load(); subs.add(cb); return () => { subs.delete(cb); }; };
const snap = <T,>(fn: (s: Persisted) => T) => () => { load(); return fn(state); };

/* ---------- hooks ---------- */
export const useDone = (id: string) => useSyncExternalStore(subscribe, snap((s) => s.done[id] === 1), () => false);
export const useStar = (id: string) => useSyncExternalStore(subscribe, snap((s) => s.star[id] === 1), () => false);
export const useRemark = (id: string) => useSyncExternalStore(subscribe, snap((s) => s.remark[id] ?? ''), () => '');
export const useStarMap = () => useSyncExternalStore(subscribe, snap((s) => s.star), () => EMPTY.star);
export const useDoneMap = () => useSyncExternalStore(subscribe, snap((s) => s.done), () => EMPTY.done);
export const useRemarkMap = () => useSyncExternalStore(subscribe, snap((s) => s.remark), () => EMPTY.remark);
export const useAll = () => useSyncExternalStore(subscribe, snap((s) => s), () => EMPTY);
export const useStorageError = () => useSyncExternalStore(subscribe, () => storageError, () => null);

export function useCount(ids: readonly string[], kind: 'done' | 'star'): number {
  const get = useCallback(() => { load(); const m = state[kind]; let n = 0; for (const id of ids) if (m[id] === 1) n++; return n; }, [ids, kind]);
  return useSyncExternalStore(subscribe, get, () => 0);
}
export function useCountPrefix(prefix: string, kind: 'done' | 'star'): number {
  const get = useCallback(() => { load(); let n = 0; for (const id in state[kind]) if (id.startsWith(prefix)) n++; return n; }, [prefix, kind]);
  return useSyncExternalStore(subscribe, get, () => 0);
}

/* ---------- actions ---------- */
export function toggleDone(id: string) { load(); const done = { ...state.done }; if (done[id]) delete done[id]; else done[id] = 1; commit({ ...state, done }); }
export function toggleStar(id: string) { load(); const star = { ...state.star }; if (star[id]) delete star[id]; else star[id] = 1; commit({ ...state, star }); }
export function setDone(ids: readonly string[], value: boolean) {
  load(); const done = { ...state.done };
  for (const id of ids) { if (value) done[id] = 1; else delete done[id]; }
  commit({ ...state, done });
}
export function setRemark(id: string, text: string) {
  load(); const remark = { ...state.remark };
  if (text.trim() === '') delete remark[id]; else remark[id] = text;
  commit({ ...state, remark });
}
function strip(map: Record<string, unknown>, match: (id: string) => boolean) {
  const out: Record<string, never> = {};
  for (const id in map) if (!match(id)) out[id] = map[id] as never;
  return out;
}
export function resetWhere(match: (id: string) => boolean, o: ResetOptions) {
  load();
  commit({
    ...state,
    done: o.done ? (strip(state.done, match) as Persisted['done']) : state.done,
    star: o.star ? (strip(state.star, match) as Persisted['star']) : state.star,
    remark: o.remark ? (strip(state.remark, match) as Persisted['remark']) : state.remark,
  });
}
export const resetIds = (ids: readonly string[], o: ResetOptions) => { const s = new Set(ids); resetWhere((id) => s.has(id), o); };
export const resetPrefixes = (prefixes: readonly string[], o: ResetOptions) => resetWhere((id) => prefixes.some((p) => id.startsWith(p)), o);

/* ---------- backup ---------- */
export function exportData(): string {
  load();
  return JSON.stringify({ app: 'interview-preparation', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2);
}
export function importData(text: string, mode: 'merge' | 'replace'): { ok: boolean; message: string } {
  try {
    const parsed = JSON.parse(text);
    if (parsed?.app !== 'interview-preparation' || !parsed.data) return { ok: false, message: 'This file is not an Interview preparation backup.' };
    const inc = parse(JSON.stringify(parsed.data));
    load();
    commit(mode === 'replace' ? inc : { v: 1, done: { ...state.done, ...inc.done }, star: { ...state.star, ...inc.star }, remark: { ...state.remark, ...inc.remark } });
    flush();
    return { ok: true, message: `Imported ${Object.keys(inc.done).length} done, ${Object.keys(inc.star).length} starred and ${Object.keys(inc.remark).length} remarks (${mode}).` };
  } catch { return { ok: false, message: 'Could not read that file.' }; }
}
const sizeNow = () => { load(); try { return (localStorage.getItem(KEY) ?? '').length; } catch { return 0; } };
/** Approximate size of the saved data (characters), hydration-safe (0 on the server). */
export const useStorageBytes = () => useSyncExternalStore(subscribe, sizeNow, () => 0);
