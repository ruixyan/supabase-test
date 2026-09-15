begin;

alter table public.artworks
  add column if not exists note text,
  add column if not exists is_unavailable boolean not null default false;

alter table public.customers
  add column if not exists is_vip boolean not null default false,
  add column if not exists is_interior_designer boolean not null default false;

-- Confirmed from the live constraint definitions supplied by the project owner:
-- CHECK ((is_sold = false) OR (buyer_id IS NOT NULL)).
-- Removing this check allows Sold with an unknown purchaser. It does not
-- change any existing buyer or sale status, or remove either foreign key.
alter table public.artworks
  drop constraint sold_requires_buyer;

-- Existing rows receive is_unavailable = false, so this new check does not
-- require changing their existing sale status.
alter table public.artworks
  add constraint artworks_unavailable_not_sold
    check (not (is_unavailable and is_sold));

notify pgrst, 'reload schema';
commit;
