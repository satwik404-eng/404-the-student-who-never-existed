-- Server-owned documents keep the gameplay rules identical in SQLite and Postgres.
-- The browser can read authorized documents but cannot write game state or scores.
create schema if not exists archive_private;
revoke all on schema archive_private from public, anon, authenticated;
create table public.game_documents (
  key text primary key check (key ~ '^(player:|room:|ranking:)'),
  value jsonb not null check (jsonb_typeof(value) = 'object'),
  version bigint not null default 1 check (version > 0),
  owner_id uuid not null references auth.users(id) on delete cascade,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  check (not is_public or key like 'ranking:%')
);
create index game_documents_owner_idx on public.game_documents(owner_id);
create index game_documents_ranking_idx on public.game_documents(key) where is_public;
alter table public.game_documents enable row level security;
revoke all on public.game_documents from anon, authenticated;
grant select on public.game_documents to anon, authenticated;
grant all on public.game_documents to service_role;

create policy "Own private progress" on public.game_documents for select to authenticated
using (owner_id = (select auth.uid()) and key not like 'room:%');
create policy "Opted in completions" on public.game_documents for select to anon, authenticated
using (is_public and key like 'ranking:%');
create policy "Room members read shared state" on public.game_documents for select to authenticated
using (key like 'room:%' and value->>'status' <> 'closed' and
  value->'members' @> jsonb_build_array(jsonb_build_object('id',(select auth.uid())::text)));

-- Service-role RPC only. Stable lock order and compare-and-swap make joins,
-- duplicate submissions, concurrent hints and rewards atomic across Edge isolates.
create function public.commit_game_documents(expected jsonb, writes jsonb) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare k text; current_version bigint; item jsonb;
begin
  if jsonb_typeof(expected) <> 'object' or jsonb_typeof(writes) <> 'array' or jsonb_array_length(writes) > 5 then
    raise exception 'invalid transaction';
  end if;
  for k in select jsonb_object_keys(expected) order by 1 loop
    perform pg_advisory_xact_lock(hashtextextended(k, 404));
  end loop;
  for k in select jsonb_object_keys(expected) loop
    select version into current_version from public.game_documents where key=k;
    if coalesce(current_version,0) <> (expected->>k)::bigint then return false; end if;
  end loop;
  for item in select * from jsonb_array_elements(writes) loop
    if not (expected ? (item->>'key')) then raise exception 'unread write'; end if;
    insert into public.game_documents(key,value,owner_id,is_public)
      values(item->>'key',item->'value',(item->>'owner')::uuid,(item->>'public')::boolean)
    on conflict(key) do update set value=excluded.value,owner_id=excluded.owner_id,
      is_public=excluded.is_public,version=public.game_documents.version+1,updated_at=now();
  end loop;
  return true;
end; $$;
revoke all on function public.commit_game_documents(jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.commit_game_documents(jsonb,jsonb) to service_role;

create table archive_private.request_budgets (
  actor uuid primary key references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  count integer not null
);
alter table archive_private.request_budgets enable row level security;
grant usage on schema archive_private to service_role;
grant all on archive_private.request_budgets to service_role;
create function public.consume_game_budget(actor uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
  insert into archive_private.request_budgets as b(actor,window_start,count) values(actor,now(),1)
  on conflict(actor) do update set
    count=case when b.window_start < now()-interval '1 minute' then 1 else b.count+1 end,
    window_start=case when b.window_start < now()-interval '1 minute' then now() else b.window_start end
  returning count into n;
  return n <= 240;
end; $$;
revoke all on function public.consume_game_budget(uuid) from public, anon, authenticated;
grant execute on function public.consume_game_budget(uuid) to service_role;

-- Presence is authorized by actual room membership. Shared state is delivered
-- through RLS-filtered Postgres Changes; private clues never enter a channel.
create policy "Room presence read" on realtime.messages for select to authenticated
using (extension='presence' and exists (
  select 1 from public.game_documents d where d.key=(select realtime.topic())
  and d.key like 'room:%' and d.value->>'status' <> 'closed'
  and d.value->'members' @> jsonb_build_array(jsonb_build_object('id',(select auth.uid())::text))
));
create policy "Room presence write" on realtime.messages for insert to authenticated
with check (extension='presence' and exists (
  select 1 from public.game_documents d where d.key=(select realtime.topic())
  and d.key like 'room:%' and d.value->>'status' <> 'closed'
  and d.value->'members' @> jsonb_build_array(jsonb_build_object('id',(select auth.uid())::text))
));
alter publication supabase_realtime add table public.game_documents;
