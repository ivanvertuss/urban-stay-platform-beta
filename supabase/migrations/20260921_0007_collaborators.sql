-- Urban Stay Platform · Collaborators module
begin;

create table if not exists public.property_collaborators (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  city text not null,
  promotion text,
  category text,
  description text,
  address text,
  website text,
  image_url text,
  latitude double precision,
  longitude double precision,
  distance_meters integer,
  is_active boolean not null default true,
  enrichment_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on table public.property_collaborators to authenticated;
alter table public.property_collaborators enable row level security;

drop policy if exists "Owners can view their collaborators" on public.property_collaborators;
create policy "Owners can view their collaborators" on public.property_collaborators
for select to authenticated using (
  exists (select 1 from public.properties p where p.id=property_id and p.owner_id=auth.uid())
);
drop policy if exists "Owners can create their collaborators" on public.property_collaborators;
create policy "Owners can create their collaborators" on public.property_collaborators
for insert to authenticated with check (
  owner_id=auth.uid() and exists (select 1 from public.properties p where p.id=property_id and p.owner_id=auth.uid())
);
drop policy if exists "Owners can update their collaborators" on public.property_collaborators;
create policy "Owners can update their collaborators" on public.property_collaborators
for update to authenticated using (
  owner_id=auth.uid() and exists (select 1 from public.properties p where p.id=property_id and p.owner_id=auth.uid())
) with check (
  owner_id=auth.uid() and exists (select 1 from public.properties p where p.id=property_id and p.owner_id=auth.uid())
);
drop policy if exists "Owners can delete their collaborators" on public.property_collaborators;
create policy "Owners can delete their collaborators" on public.property_collaborators
for delete to authenticated using (
  owner_id=auth.uid() and exists (select 1 from public.properties p where p.id=property_id and p.owner_id=auth.uid())
);

create table if not exists public.urban_stay_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  partner_type text not null default 'local' check (partner_type in ('local','regional','national','global')),
  category text,
  promotion text,
  description text,
  website text,
  image_url text,
  city text,
  region text,
  country text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on table public.urban_stay_partners to authenticated;
alter table public.urban_stay_partners enable row level security;
drop policy if exists "Authenticated users can view active Urban Stay partners" on public.urban_stay_partners;
create policy "Authenticated users can view active Urban Stay partners"
on public.urban_stay_partners for select to authenticated
using (is_active=true and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now()));

create index if not exists idx_property_collaborators_property on public.property_collaborators(property_id);
create index if not exists idx_property_collaborators_owner on public.property_collaborators(owner_id);
create index if not exists idx_urban_stay_partners_scope on public.urban_stay_partners(partner_type,country,region,city);

commit;
