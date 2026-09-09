-- Urban Stay Platform · Property approval workflow
-- Account approval happens once. Every property is reviewed independently.
begin;

alter table public.properties
  add column if not exists approval_status text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists review_note text;

-- Existing properties pre-date per-property moderation. Keep them usable.
update public.properties
set approval_status = 'approved',
    reviewed_at = coalesce(reviewed_at, created_at)
where approval_status is null;

alter table public.properties
  alter column approval_status set default 'pending',
  alter column approval_status set not null;

alter table public.properties drop constraint if exists properties_approval_status_check;
alter table public.properties add constraint properties_approval_status_check
  check (approval_status in ('pending','approved','rejected'));

create index if not exists idx_properties_approval_status
  on public.properties(approval_status);

-- Admins can see every property; owners continue seeing all of their own properties,
-- including pending/rejected ones, so an extra property never blocks existing ones.
drop policy if exists "properties_admin_select_all" on public.properties;
create policy "properties_admin_select_all"
on public.properties for select to authenticated
using (public.is_admin());

-- Owners must not be able to self-approve by updating moderation columns directly.
revoke update on public.properties from authenticated;
grant update (name, slug, city, country, address, status) on public.properties to authenticated;

create or replace function public.submit_property_for_review(target_property_id uuid)
returns public.properties
language plpgsql security definer set search_path = public
as $$
declare updated_property public.properties;
begin
  update public.properties
  set approval_status='pending', submitted_at=now(), reviewed_at=null,
      reviewed_by=null, review_note=null, updated_at=now()
  where id=target_property_id and owner_id=auth.uid()
  returning * into updated_property;

  if updated_property.id is null then
    raise exception 'property_not_found_or_not_owner' using errcode='42501';
  end if;

  insert into public.audit_log(actor_id,action,table_name,record_id,metadata)
  values(auth.uid(),'property_submitted','properties',target_property_id::text,'{}'::jsonb);
  return updated_property;
end;
$$;

revoke all on function public.submit_property_for_review(uuid) from public;
grant execute on function public.submit_property_for_review(uuid) to authenticated;

create or replace function public.review_property(target_property_id uuid, decision text, note text default null)
returns public.properties
language plpgsql security definer set search_path = public
as $$
declare updated_property public.properties;
begin
  if not public.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  if decision not in ('approved','rejected') then raise exception 'invalid_decision' using errcode='22023'; end if;

  update public.properties
  set approval_status=decision, reviewed_at=now(), reviewed_by=auth.uid(),
      review_note=nullif(trim(note),''), updated_at=now()
  where id=target_property_id returning * into updated_property;

  if updated_property.id is null then raise exception 'property_not_found' using errcode='P0002'; end if;

  insert into public.audit_log(actor_id,action,table_name,record_id,metadata)
  values(auth.uid(),'property_'||decision,'properties',target_property_id::text,
         jsonb_build_object('decision',decision,'note',nullif(trim(note),'')));
  return updated_property;
end;
$$;

revoke all on function public.review_property(uuid,text,text) from public;
grant execute on function public.review_property(uuid,text,text) to authenticated;

commit;
