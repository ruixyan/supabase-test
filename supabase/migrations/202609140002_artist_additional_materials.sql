begin;

-- Add an optional artist field without changing existing values or constraints.
alter table public.artists
  add column if not exists additional_materials text;

notify pgrst, 'reload schema';
commit;
