-- Interview preparation: one row per (user, item). Run once in the Supabase SQL editor (or `supabase db push`).
-- Row Level Security: a signed-in user can only ever read or write their own rows.

create table if not exists public.user_progress (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  item_id    text        not null check (char_length(item_id) between 1 and 300),
  done       boolean     not null default false,
  starred    boolean     not null default false,
  remark     text        not null default '' check (char_length(remark) <= 200000),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- incremental sync ("what changed since I last looked?")
create index if not exists user_progress_user_updated_idx on public.user_progress (user_id, updated_at);

alter table public.user_progress enable row level security;

drop policy if exists "progress: read own"   on public.user_progress;
drop policy if exists "progress: insert own" on public.user_progress;
drop policy if exists "progress: update own" on public.user_progress;
drop policy if exists "progress: delete own" on public.user_progress;
create policy "progress: read own"   on public.user_progress for select to authenticated using (auth.uid() = user_id);
create policy "progress: insert own" on public.user_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "progress: update own" on public.user_progress for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress: delete own" on public.user_progress for delete to authenticated using (auth.uid() = user_id);

-- keep updated_at honest, whatever the client sends
create or replace function public.touch_user_progress() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists user_progress_touch on public.user_progress;
create trigger user_progress_touch before insert or update on public.user_progress
  for each row execute function public.touch_user_progress();

-- live updates between your devices (Realtime). Safe to re-run.
do $$
begin
  alter publication supabase_realtime add table public.user_progress;
exception when duplicate_object then null;
end $$;
