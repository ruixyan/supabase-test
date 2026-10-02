begin;

-- Apply after 202610020001_multiple_artwork_buyers.sql. Keep buyer_ids as
-- the relationship/search index, with one positive quantity per buyer ID.
alter table public.artworks add column buyer_quantities jsonb not null default '{}';
update public.artworks a set buyer_quantities = coalesce(
  (select jsonb_object_agg(id::text, 1) from unnest(a.buyer_ids) id), '{}'::jsonb
);

create function public.validate_artwork_buyer_quantities() returns trigger
language plpgsql security invoker set search_path = public as $$
declare
  buyer bigint;
  quantity jsonb;
  normalized jsonb := '{}';
begin
  if NEW.buyer_quantities is null or jsonb_typeof(NEW.buyer_quantities) <> 'object' then
    raise exception 'Buyer quantities must be an object of positive whole numbers.';
  end if;
  foreach buyer in array NEW.buyer_ids loop
    quantity := coalesce(NEW.buyer_quantities -> buyer::text, '1'::jsonb);
    if jsonb_typeof(quantity) <> 'number' then
      raise exception 'Purchase quantity must be a positive whole number.';
    end if;
    if (quantity::text)::numeric < 1 or (quantity::text)::numeric > 2147483647
        or trunc((quantity::text)::numeric) <> (quantity::text)::numeric then
      raise exception 'Purchase quantity must be a positive whole number up to 2147483647.';
    end if;
    if NEW.is_unique is distinct from false and (quantity::text)::numeric <> 1 then
      raise exception 'Only Multiple artworks can have more than one copy per client. Reduce the quantity before choosing Unique.';
    end if;
    normalized := normalized || jsonb_build_object(buyer::text, (quantity::text)::numeric::integer);
  end loop;
  -- Older clients can add/remove buyers without knowing about quantities.
  -- Retain counts for remaining buyers and drop counts for removed buyers.
  NEW.buyer_quantities := normalized;
  return NEW;
end;
$$;

-- PostgreSQL runs same-event triggers in name order: validate buyer_ids first.
create trigger zz_validate_artwork_buyer_quantities before insert or update on public.artworks
for each row execute function public.validate_artwork_buyer_quantities();

-- Set only this client's quantities under artwork locks. Zero removes the
-- relationship. All changed works in a request succeed or roll back together.
create function public.set_artwork_buyer_quantities(p_buyer_id bigint, p_quantities jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare
  requested record;
  work public.artworks;
  quantity integer;
  next_buyers bigint[];
  next_quantities jsonb;
begin
  if p_buyer_id is null or p_quantities is null or jsonb_typeof(p_quantities) <> 'object' then
    raise exception 'Client and artwork quantities are required.';
  end if;
  for requested in select key, value from jsonb_each(p_quantities) loop
    if requested.key !~ '^[1-9][0-9]*$' or jsonb_typeof(requested.value) <> 'number' then
      raise exception 'Artwork IDs and whole-number quantities are required.';
    end if;
    if (requested.value::text)::numeric < 0 or (requested.value::text)::numeric > 2147483647
        or trunc((requested.value::text)::numeric) <> (requested.value::text)::numeric then
      raise exception 'Quantity must be a whole number from 0 to 2147483647.';
    end if;
  end loop;
  for requested in select key::bigint as id, value from jsonb_each(p_quantities) order by key::bigint loop
    select * into work from public.artworks where id = requested.id for update;
    if not found then raise exception 'Artwork % does not exist or is not accessible.', requested.id; end if;
    quantity := (requested.value::text)::numeric::integer;
    if quantity = 0 then
      if not (p_buyer_id = any(work.buyer_ids)) then continue; end if;
      next_buyers := array_remove(work.buyer_ids, p_buyer_id);
      next_quantities := work.buyer_quantities - p_buyer_id::text;
    else
      next_buyers := case when p_buyer_id = any(work.buyer_ids) then work.buyer_ids
        else array_append(work.buyer_ids, p_buyer_id) end;
      next_quantities := work.buyer_quantities || jsonb_build_object(p_buyer_id::text, quantity);
    end if;
    update public.artworks set buyer_ids = next_buyers, buyer_quantities = next_quantities,
      is_sold = cardinality(next_buyers) > 0,
      is_unavailable = case when quantity > 0 then false else is_unavailable end
      where id = requested.id;
    if not found then raise exception 'Artwork % could not be updated.', requested.id; end if;
  end loop;
end;
$$;

notify pgrst, 'reload schema';
commit;
