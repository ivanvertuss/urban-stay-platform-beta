-- Urban Stay Platform · Backend y Seguridad · Fase 1
-- Limita authenticated a privilegios CRUD en properties y property_content.
-- Evita privilegios adicionales como TRUNCATE, REFERENCES y TRIGGER.

begin;

revoke all privileges on table public.properties from authenticated;
revoke all privileges on table public.property_content from authenticated;

grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.property_content to authenticated;

commit;
