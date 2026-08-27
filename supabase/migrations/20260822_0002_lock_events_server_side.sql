-- Urban Stay Platform · Backend y Seguridad · Fase 1
-- Endurecimiento de la agenda: los propietarios solo leen eventos.
-- Las altas, cambios y borrados de eventos quedarán reservados al backend/server-side.

begin;

drop policy if exists "events_insert_own" on public.events;
drop policy if exists "events_update_own" on public.events;
drop policy if exists "events_delete_own" on public.events;

revoke insert, update, delete on public.events from authenticated;
grant select on public.events to authenticated;

commit;
