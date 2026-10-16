-- Public guest pages: explicit publication, no direct access to private property content.
create table if not exists public.property_publications (
 property_id uuid primary key references public.properties(id) on delete cascade,
 owner_id uuid not null references auth.users(id),
 slug text not null unique,
 is_published boolean not null default false,
 updated_at timestamptz not null default now()
);
alter table public.property_publications enable row level security;
create policy "Owner manages publication" on public.property_publications
 for all to authenticated using (owner_id = auth.uid())
 with check (owner_id = auth.uid());
