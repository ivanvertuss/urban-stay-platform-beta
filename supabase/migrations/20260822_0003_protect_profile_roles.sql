-- Urban Stay Platform · Backend y Seguridad · Fase 1
-- Impide que un usuario autenticado se autoasigne el rol admin.

begin;

revoke insert, update on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, company_name) on public.profiles to authenticated;

commit;
