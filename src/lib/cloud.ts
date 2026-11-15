import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { applyRemote, connectCloud, loadCloudState, setSyncStatus, type Change, type Persisted } from './store';

/* Sync between the in-memory store and the Supabase table `user_progress` (one row per user and item).
   - Writes are batched (debounced), sent as upserts that only touch the changed column, and retried with back-off.
   - Rows are never deleted: "empty" rows (done=false, starred=false, remark='') mean "nothing here".
   - Other devices are picked up live (Realtime), and on focus / reconnect / every 5 minutes (incremental pull). */
const TABLE = 'user_progress';
const PAGE = 1000;     // PostgREST returns at most 1000 rows per request
const CHUNK = 400;     // rows per upsert request
const FLUSH_MS = 700;
const POLL_MS = 5 * 60_000;

export interface Row { item_id: string; done: boolean; starred: boolean; remark: string; updated_at: string }
type Fields = { done?: boolean; starred?: boolean; remark?: string };
type FieldName = keyof Fields;

export const describe = (e: unknown) => (e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e));

export function rowsToState(rows: Row[]): Persisted {
  const s: Persisted = { v: 1, done: {}, star: {}, remark: {} };
  for (const r of rows) {
    if (r.done) s.done[r.item_id] = 1;
    if (r.starred) s.star[r.item_id] = 1;
    if (r.remark && r.remark.trim()) s.remark[r.item_id] = r.remark;
  }
  return s;
}

export class CloudSync {
  readonly userId: string;
  private sb: SupabaseClient;
  private queue = new Map<string, Fields>();
  private inflight = new Map<string, Fields>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private poll: ReturnType<typeof setInterval> | null = null;
  private channel: RealtimeChannel | null = null;
  private lastSeen = '';
  private failures = 0;
  private sending = false;
  private stopped = false;
  private off: (() => void)[] = [];

  constructor(sb: SupabaseClient, userId: string) { this.sb = sb; this.userId = userId; }

  /* ----- lifecycle ----- */
  async start() {
    connectCloud({ write: (c) => this.enqueue(c) });
    await this.loadInitial();
    if (this.stopped) return;
    this.listen();
  }
  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.poll) clearInterval(this.poll);
    this.off.forEach((f) => f());
    if (this.channel) void this.sb.removeChannel(this.channel);
  }
  /** Try to send what is waiting (used before signing out). */
  async flushNow(timeoutMs = 4000) {
    const t0 = Date.now();
    while ((this.queue.size || this.sending) && Date.now() - t0 < timeoutMs) {
      if (!this.sending) await this.flush();
      else await new Promise((r) => setTimeout(r, 50));
    }
  }
  async syncNow() { await this.pull(); await this.flush(); }

  /* ----- reading ----- */
  private async fetchRows(since: string): Promise<Row[]> {
    const out: Row[] = [];
    for (let from = 0; ; from += PAGE) {
      let q = this.sb.from(TABLE).select('item_id,done,starred,remark,updated_at').eq('user_id', this.userId).order('updated_at', { ascending: true }).order('item_id', { ascending: true });
      if (since) q = q.gt('updated_at', since);
      const { data, error } = await q.range(from, from + PAGE - 1);
      if (error) throw error;
      const page = (data ?? []) as Row[];
      out.push(...page);
      if (page.length < PAGE) break;
    }
    return out;
  }
  private note(rows: Row[]) { for (const r of rows) if (r.updated_at > this.lastSeen) this.lastSeen = r.updated_at; }
  private async loadInitial() {
    for (let attempt = 0; !this.stopped; attempt++) {
      try {
        const rows = await this.fetchRows('');
        if (this.stopped) return;
        this.note(rows);
        loadCloudState(rowsToState(rows));
        setSyncStatus({ activity: 'idle', error: null, lastSyncedAt: Date.now() });
        return;
      } catch (e) {
        setSyncStatus({ activity: navigator.onLine ? 'error' : 'offline', error: describe(e) });
        await new Promise((r) => setTimeout(r, Math.min(15000, 1500 * 2 ** Math.min(attempt, 4))));
      }
    }
  }
  async pull() {
    if (this.stopped) return;
    try {
      const rows = await this.fetchRows(this.lastSeen);
      if (rows.length) { this.note(rows); this.apply(rows); }
      setSyncStatus({ lastSyncedAt: Date.now(), ...(this.queue.size || this.sending ? {} : { activity: 'idle' as const, error: null }) });
    } catch (e) { setSyncStatus({ activity: navigator.onLine ? 'error' : 'offline', error: describe(e) }); }
  }
  private pending(id: string, f: FieldName) { return this.queue.get(id)?.[f] !== undefined || this.inflight.get(id)?.[f] !== undefined; }
  private apply(rows: Row[]) {
    applyRemote(rows.map((r) => ({ id: r.item_id, done: r.done, starred: r.starred, remark: r.remark })), (id, f) => this.pending(id, f));
  }

  /* ----- writing ----- */
  enqueue(changes: Change[]) {
    for (const c of changes) {
      const cur = this.queue.get(c.id) ?? {};
      if (c.done !== undefined) cur.done = c.done;
      if (c.starred !== undefined) cur.starred = c.starred;
      if (c.remark !== undefined) cur.remark = c.remark;
      this.queue.set(c.id, cur);
    }
    setSyncStatus({ activity: 'saving', pending: this.queue.size + this.inflight.size });
    this.schedule(FLUSH_MS);
  }
  private schedule(ms: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; void this.flush(); }, ms);
  }
  private async flush() {
    if (this.sending || this.stopped || this.queue.size === 0) return;
    if (!navigator.onLine) { setSyncStatus({ activity: 'offline', pending: this.queue.size }); return; }
    this.sending = true;
    const batch = this.queue;
    this.queue = new Map();
    this.inflight = batch;
    setSyncStatus({ activity: 'saving', pending: batch.size });
    try {
      const groups: Record<FieldName, Record<string, unknown>[]> = { done: [], starred: [], remark: [] };
      for (const [id, c] of batch) for (const f of ['done', 'starred', 'remark'] as const) if (c[f] !== undefined) groups[f].push({ user_id: this.userId, item_id: id, [f]: c[f] });
      for (const f of ['done', 'starred', 'remark'] as const) {
        for (let i = 0; i < groups[f].length; i += CHUNK) {
          const { error } = await this.sb.from(TABLE).upsert(groups[f].slice(i, i + CHUNK), { onConflict: 'user_id,item_id' });
          if (error) throw error;
        }
      }
      this.failures = 0;
      this.inflight = new Map();
      setSyncStatus({ activity: this.queue.size ? 'saving' : 'idle', pending: this.queue.size, lastSyncedAt: Date.now(), error: null });
      if (this.queue.size) this.schedule(FLUSH_MS);
    } catch (e) {
      for (const [id, c] of batch) this.queue.set(id, { ...c, ...(this.queue.get(id) ?? {}) }); // newer edits win
      this.inflight = new Map();
      this.failures++;
      setSyncStatus({ activity: navigator.onLine ? 'error' : 'offline', pending: this.queue.size, error: describe(e) });
      this.schedule(Math.min(30000, 1000 * 2 ** Math.min(this.failures, 5)));
    } finally { this.sending = false; }
  }

  /* ----- keeping other devices in step ----- */
  private listen() {
    const visible = () => { if (document.visibilityState === 'visible') { void this.pull(); void this.flush(); } };
    const online = () => { void this.pull(); void this.flush(); };
    const offline = () => setSyncStatus({ activity: 'offline' });
    const guard = (e: BeforeUnloadEvent) => { if (this.queue.size || this.sending) { e.preventDefault(); e.returnValue = ''; } };
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('focus', visible);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    window.addEventListener('beforeunload', guard);
    this.off.push(() => { document.removeEventListener('visibilitychange', visible); window.removeEventListener('focus', visible); window.removeEventListener('online', online); window.removeEventListener('offline', offline); window.removeEventListener('beforeunload', guard); });
    this.poll = setInterval(() => { if (document.visibilityState === 'visible') void this.pull(); }, POLL_MS);
    this.channel = this.sb.channel(`progress:${this.userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: `user_id=eq.${this.userId}` }, (p) => {
        const r = p.new as Partial<Row> | undefined;
        if (r?.item_id !== undefined && typeof r.updated_at === 'string') { this.note([r as Row]); this.apply([r as Row]); }
      })
      .subscribe();
  }
}
