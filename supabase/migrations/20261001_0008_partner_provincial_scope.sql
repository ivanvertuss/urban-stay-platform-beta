-- Add provincial scope to Urban Stay commercial agreements.
alter table public.urban_stay_partners
  drop constraint if exists urban_stay_partners_partner_type_check;

alter table public.urban_stay_partners
  add constraint urban_stay_partners_partner_type_check
  check (partner_type in ('local','provincial','regional','national','global'));
