-- Atomic deletion for bounded room allocation and cleanup.
create or replace function public.commit_game_documents(expected jsonb, writes jsonb) returns boolean
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
    if coalesce((item->>'deleted')::boolean,false) then
      delete from public.game_documents where key=item->>'key';
      continue;
    end if;
    insert into public.game_documents(key,value,owner_id,is_public)
      values(item->>'key',item->'value',(item->>'owner')::uuid,(item->>'public')::boolean)
    on conflict(key) do update set value=excluded.value,owner_id=excluded.owner_id,
      is_public=excluded.is_public,version=public.game_documents.version+1,updated_at=now();
  end loop;
  return true;
end; $$;
revoke all on function public.commit_game_documents(jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.commit_game_documents(jsonb,jsonb) to service_role;


create or replace function public.consume_game_budget(actor uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
  insert into archive_private.request_budgets as b(actor,window_start,count) values(actor,now(),1)
  on conflict on constraint request_budgets_pkey do update set
    count=case when b.window_start < now()-interval '1 minute' then 1 else b.count+1 end,
    window_start=case when b.window_start < now()-interval '1 minute' then now() else b.window_start end
  returning count into n;
  return n <= 240;
end; $$;
revoke all on function public.consume_game_budget(uuid) from public, anon, authenticated;
grant execute on function public.consume_game_budget(uuid) to service_role;


-- Reclaim expired room documents even when their host never returns.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('archive_expired_rooms','17 * * * *',
  $cron$delete from public.game_documents where key like 'room:%'
  and (value->>'createdAt')::numeric < extract(epoch from now()-interval '1 day')*1000;$cron$);
