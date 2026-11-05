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
    if item->>'key' = 'ranking:' || (item->>'owner') then
      update public.game_documents set is_public=false,version=version+1,updated_at=now()
      where owner_id=(item->>'owner')::uuid and key like (item->>'key') || ':%';
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
create index game_rank_order_idx on public.game_documents (((value->>'score')::int) desc, ((value->>'seconds')::int) asc) where is_public and key like 'ranking:%';
create or replace function public.read_public_rankings() returns setof jsonb
language sql stable security invoker set search_path='' as $$
 select value from (
  select d.value,row_number() over(partition by d.owner_id order by (d.value->>'score')::int desc,(d.value->>'seconds')::int asc) n
  from public.game_documents d where d.is_public and d.key like 'ranking:%'
  and not exists(select 1 from public.game_documents c where c.key='ranking:'||d.owner_id::text and c.key<>d.key)
 ) ranked where n=1 order by (value->>'score')::int desc,(value->>'seconds')::int asc limit 50;
$$;
revoke all on function public.read_public_rankings() from public,anon,authenticated;
grant execute on function public.read_public_rankings() to service_role;
