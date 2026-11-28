begin;

drop policy if exists checkpoints_select_staff
on public.transport_checkpoints;

drop policy if exists checkpoints_select_owner_or_staff
on public.transport_checkpoints;

create policy checkpoints_select_owner_or_staff
on public.transport_checkpoints for select to authenticated
using (
  (select public.is_staff())
  or exists (
    select 1
    from public.parcels p
    where p.id = transport_checkpoints.parcel_id
      and p.owner_id = (select auth.uid())
  )
);

commit;
