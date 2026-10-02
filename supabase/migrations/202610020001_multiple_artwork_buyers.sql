begin;

-- Preserve the existing buyer_id for compatibility. buyer_ids is authoritative
-- for the updated app; the trigger keeps the legacy first-buyer field in sync.
alter table public.artworks add column buyer_ids bigint[] not null default '{}';
update public.artworks set buyer_ids = array[buyer_id] where buyer_id is not null;
create index artworks_buyer_ids_idx on public.artworks using gin (buyer_ids);

create function public.validate_artwork_buyers() returns trigger
language plpgsql security invoker set search_path = public as $$
declare
  buyer bigint;
begin
  if TG_OP = 'INSERT' then
    if cardinality(NEW.buyer_ids) = 0 and NEW.buyer_id is not null then
      NEW.buyer_ids := array[NEW.buyer_id];
    end if;
  elsif NEW.buyer_ids is not distinct from OLD.buyer_ids
      and NEW.buyer_id is distinct from OLD.buyer_id then
    -- An old single-buyer client must not silently erase other buyers.
    if cardinality(OLD.buyer_ids) > 1 then
      raise exception 'This artwork has multiple buyers. Update buyer_ids instead.';
    end if;
    NEW.buyer_ids := case when NEW.buyer_id is null then '{}'::bigint[] else array[NEW.buyer_id] end;
  end if;

  if NEW.buyer_ids is null or coalesce(array_ndims(NEW.buyer_ids), 1) <> 1 then
    raise exception 'Buyers must be a one-dimensional list of distinct client IDs.';
  end if;
  if array_position(NEW.buyer_ids, null) is not null
      or cardinality(NEW.buyer_ids) <> (select count(distinct id) from unnest(NEW.buyer_ids) id) then
    raise exception 'Buyers must be a one-dimensional list of distinct client IDs.';
  end if;
  if NEW.is_unique is distinct from false and cardinality(NEW.buyer_ids) > 1 then
    raise exception 'Unique artworks can have only one buyer. Remove extra buyers before choosing Unique.';
  end if;
  -- Row locks serialize buyer assignment against customer deletion.
  for buyer in select id from unnest(NEW.buyer_ids) id order by id loop
    perform 1 from public.customers where id = buyer for key share;
    if not found then
      raise exception 'Client % does not exist or is not accessible.', buyer;
    end if;
  end loop;
  NEW.buyer_id := NEW.buyer_ids[array_lower(NEW.buyer_ids, 1)];
  return NEW;
end;
$$;
create trigger validate_artwork_buyers before insert or update on public.artworks
for each row execute function public.validate_artwork_buyers();

-- Enforce references for every array member, including buyers hidden by RLS.
-- This function only rejects deletion; it never returns or changes protected data.
create function public.restrict_artwork_buyer_deletion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'UPDATE' and NEW.id is not distinct from OLD.id then return NEW; end if;
  if exists (select 1 from public.artworks where buyer_ids @> array[OLD.id]::bigint[]) then
    raise exception 'Remove this client from their artworks before deleting the client or changing their ID.';
  end if;
  if TG_OP = 'UPDATE' then return NEW; end if;
  return OLD;
end;
$$;
revoke all on function public.restrict_artwork_buyer_deletion() from public;
create trigger restrict_artwork_buyer_deletion before delete on public.customers
for each row execute function public.restrict_artwork_buyer_deletion();
create trigger restrict_artwork_buyer_id_change before update of id on public.customers
for each row execute function public.restrict_artwork_buyer_deletion();

-- Computed relationships keep lists/searches subject to existing table RLS.
create function public.artwork_buyers(public.artworks) returns setof public.customers
language sql stable security invoker set search_path = public as $$
  select c.* from public.customers c where c.id = any(($1).buyer_ids);
$$;
create function public.purchased_artworks(public.customers) returns setof public.artworks
language sql stable security invoker set search_path = public as $$
  select a.* from public.artworks a where a.buyer_ids @> array[($1).id]::bigint[];
$$;

-- Append/remove only this client under row locks, preserving other buyers.
-- A whole request is atomic, including the uniqueness check in the trigger.
create function public.change_artwork_buyer(p_artwork_ids bigint[], p_buyer_id bigint, p_add boolean)
returns void language plpgsql security invoker set search_path = public as $$
declare
  work public.artworks;
  requested_id bigint;
  next_buyers bigint[];
begin
  if p_buyer_id is null or p_add is null then raise exception 'Client and action are required.'; end if;
  for requested_id in select distinct id from unnest(p_artwork_ids) id order by id loop
    select * into work from public.artworks where id = requested_id for update;
    if not found then raise exception 'Artwork % does not exist or is not accessible.', requested_id; end if;
    if p_add then
      next_buyers := case when p_buyer_id = any(work.buyer_ids) then work.buyer_ids
        else array_append(work.buyer_ids, p_buyer_id) end;
    else
      if not (p_buyer_id = any(work.buyer_ids)) then continue; end if;
      next_buyers := array_remove(work.buyer_ids, p_buyer_id);
    end if;
    update public.artworks set buyer_ids = next_buyers,
      is_sold = cardinality(next_buyers) > 0,
      is_unavailable = case when p_add then false else is_unavailable end
      where id = requested_id;
    if not found then raise exception 'Artwork % could not be updated.', requested_id; end if;
  end loop;
end;
$$;

notify pgrst, 'reload schema';
commit;
