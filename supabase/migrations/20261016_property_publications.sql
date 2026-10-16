-- Publication records are private and default to unpublished.
create table if not exists public.property_publications (
 property_id uuid primary key references public.properties(id) on delete cascade,
 owner_id uuid not null references auth.users(id),
 slug text not null unique,
 is_published boolean not null default false,
 updated_at timestamptz not null default now(),
 constraint property_publications_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
alter table public.property_publications enable row level security;
revoke all on public.property_publications from anon;
grant select, insert, update, delete on public.property_publications to authenticated;
drop policy if exists "Owner manages publication" on public.property_publications;
create policy "Owner manages publication" on public.property_publications
 for all to authenticated
 using (owner_id = auth.uid())
 with check (owner_id = auth.uid() and exists (
 select 1 from public.properties p
 where p.id = property_id and p.owner_id = auth.uid() and p.review_status = 'approved'
 ));
-- Return only guest-safe fields; WiFi, entry codes, owner details and full JSON remain private.
create or replace function public.get_public_property(requested_slug text)
returns jsonb language sql stable security definer set search_path = ''
as $$
 select jsonb_build_object(
  'name', p.name, 'city', p.city, 'country', p.country,
  'template', coalesce(c.content->>'template','urban-classic'),
  'welcome', coalesce(c.content->>'bedSummary',''),
  'photos', coalesce(c.content->'photos','[]'::jsonb),
  'coverIndex', coalesce((c.content->>'coverIndex')::integer,0),
  'amenities', coalesce(c.content->'amenities','{}'::jsonb),
  'restaurants', coalesce(c.content->>'restaurants',''),
  'services', coalesce(c.content->>'services',''),
  'events', coalesce((c.content->>'events')::boolean,false),
  'eventNotes', coalesce(c.content->>'eventNotes',''),
  'manualEvents', coalesce(c.content->'manualEvents','[]'::jsonb)
 )
 from public.property_publications pub
 join public.properties p on p.id = pub.property_id
 join public.property_content c on c.property_id = p.id
 where pub.slug = requested_slug and pub.is_published = true
 and p.review_status = 'approved'
 limit 1;
$$;
revoke all on function public.get_public_property(text) from public;
grant execute on function public.get_public_property(text) to anon, authenticated;
