-- Urban Stay Platform · Account approval workflow
begin;

alter table public.profiles
  add column if not exists account_status text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists review_note text;

update public.profiles
set account_status = 'approved'
where account_status is null;

alter table public.profiles
  alter column account_status set default 'pending',
  alter column account_status set not null;

alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check
  check (account_status in ('pending','approved','rejected'));

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.account_status = 'approved'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all"
on public.profiles for select to authenticated
using (public.is_admin());

revoke update on public.profiles from authenticated;
grant update (full_name, phone, company_name) on public.profiles to authenticated;

create or replace function public.review_account(target_user_id uuid, decision text, note text default null)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare updated_profile public.profiles;
begin
  if not public.is_admin() then raise exception 'admin_required' using errcode='42501'; end if;
  if decision not in ('approved','rejected') then raise exception 'invalid_decision' using errcode='22023'; end if;
  if target_user_id = auth.uid() then raise exception 'cannot_review_self' using errcode='22023'; end if;

  update public.profiles
  set account_status=decision, reviewed_at=now(), reviewed_by=auth.uid(),
      review_note=nullif(trim(note),''), updated_at=now()
  where id=target_user_id returning * into updated_profile;

  if updated_profile.id is null then raise exception 'profile_not_found' using errcode='P0002'; end if;

  insert into public.audit_log(actor_id,action,table_name,record_id,metadata)
  values(auth.uid(),'account_'||decision,'profiles',target_user_id::text,
         jsonb_build_object('decision',decision,'note',nullif(trim(note),'')));
  return updated_profile;
end;
$$;

revoke all on function public.review_account(uuid,text,text) from public;
grant execute on function public.review_account(uuid,text,text) to authenticated;

drop policy if exists "audit_admin_select_all" on public.audit_log;
create policy "audit_admin_select_all"
on public.audit_log for select to authenticated
using (public.is_admin());

commit;
