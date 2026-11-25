begin;

alter table public.parcels
  add column if not exists owner_id uuid references auth.users (id) on delete set null;

create index if not exists parcels_owner_id_idx
  on public.parcels (owner_id);

create or replace function public.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'staff', false);
$$;

create or replace function public.add_parcel_registration_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.parcel_status_history (parcel_id, status, note)
  values (
    new.id,
    'Registered',
    format(
      'Parcel registered for %s to %s (%s).',
      new.recipient_name,
      new.destination_town,
      new.collection_point
    )
  );

  insert into public.notifications (
    id,
    parcel_id,
    tracking_code,
    recipient_name,
    sender_name,
    status,
    message,
    is_read
  )
  values (
    'NTF-' || substr(md5(clock_timestamp()::text || random()::text), 1, 16),
    new.id,
    new.id,
    new.recipient_name,
    new.sender_name,
    'Registered',
    format(
      'Parcel %s registered for %s to %s.',
      new.id,
      new.recipient_name,
      new.collection_point
    ),
    false
  );

  return new;
end;
$$;

revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

revoke all on function public.add_parcel_registration_events() from public, anon, authenticated;

drop trigger if exists parcel_registration_events on public.parcels;
create trigger parcel_registration_events
after insert on public.parcels
for each row
when (new.status = 'Registered')
execute function public.add_parcel_registration_events();

alter table public.parcels enable row level security;
alter table public.parcel_status_history enable row level security;
alter table public.transport_handovers enable row level security;
alter table public.transport_checkpoints enable row level security;
alter table public.notifications enable row level security;

revoke all on table
  public.parcels,
  public.parcel_status_history,
  public.transport_handovers,
  public.transport_checkpoints,
  public.notifications
from anon;

grant select, insert, update, delete on table
  public.parcels,
  public.parcel_status_history,
  public.transport_handovers,
  public.transport_checkpoints,
  public.notifications
to authenticated;

revoke update on table public.parcels from authenticated;
grant update (status, collection_code, collected_at, updated_at)
on table public.parcels to authenticated;

revoke update on table public.notifications from authenticated;
grant update (is_read) on table public.notifications to authenticated;

do $$
declare
  history_id_sequence text;
begin
  history_id_sequence :=
    pg_get_serial_sequence('public.parcel_status_history', 'id');
  if history_id_sequence is not null then
    execute format(
      'grant usage, select on sequence %s to authenticated',
      history_id_sequence
    );
  end if;
end;
$$;

drop policy if exists parcels_select_owner_or_staff on public.parcels;
create policy parcels_select_owner_or_staff
on public.parcels for select to authenticated
using (owner_id = (select auth.uid()) or (select public.is_staff()));

drop policy if exists parcels_insert_owner_or_staff on public.parcels;
create policy parcels_insert_owner_or_staff
on public.parcels for insert to authenticated
with check (
  (
    owner_id = (select auth.uid())
    and status = 'Registered'
    and collection_code is null
    and collected_at is null
  )
  or (select public.is_staff())
);

drop policy if exists parcels_update_staff on public.parcels;
create policy parcels_update_staff
on public.parcels for update to authenticated
using ((select public.is_staff()))
with check ((select public.is_staff()));

drop policy if exists parcels_delete_staff on public.parcels;
create policy parcels_delete_staff
on public.parcels for delete to authenticated
using ((select public.is_staff()));

drop policy if exists parcel_history_select_owner_or_staff on public.parcel_status_history;
create policy parcel_history_select_owner_or_staff
on public.parcel_status_history for select to authenticated
using (
  (select public.is_staff())
  or exists (
    select 1
    from public.parcels p
    where p.id = parcel_status_history.parcel_id
      and p.owner_id = (select auth.uid())
  )
);

drop policy if exists parcel_history_insert_registration_or_staff on public.parcel_status_history;
drop policy if exists parcel_history_insert_staff on public.parcel_status_history;
create policy parcel_history_insert_staff
on public.parcel_status_history for insert to authenticated
with check ((select public.is_staff()));

drop policy if exists handovers_select_owner_or_staff on public.transport_handovers;
drop policy if exists handovers_select_staff on public.transport_handovers;
create policy handovers_select_staff
on public.transport_handovers for select to authenticated
using ((select public.is_staff()));

drop policy if exists handovers_write_staff on public.transport_handovers;
create policy handovers_write_staff
on public.transport_handovers for all to authenticated
using ((select public.is_staff()))
with check ((select public.is_staff()));

drop policy if exists checkpoints_select_owner_or_staff on public.transport_checkpoints;
drop policy if exists checkpoints_select_staff on public.transport_checkpoints;
create policy checkpoints_select_staff
on public.transport_checkpoints for select to authenticated
using ((select public.is_staff()));

drop policy if exists checkpoints_write_staff on public.transport_checkpoints;
create policy checkpoints_write_staff
on public.transport_checkpoints for all to authenticated
using ((select public.is_staff()))
with check ((select public.is_staff()));

drop policy if exists notifications_select_owner_or_staff on public.notifications;
create policy notifications_select_owner_or_staff
on public.notifications for select to authenticated
using (
  (select public.is_staff())
  or exists (
    select 1
    from public.parcels p
    where p.id = notifications.parcel_id
      and p.owner_id = (select auth.uid())
  )
);

drop policy if exists notifications_insert_registration_or_staff on public.notifications;
drop policy if exists notifications_insert_staff on public.notifications;
create policy notifications_insert_staff
on public.notifications for insert to authenticated
with check ((select public.is_staff()));

drop policy if exists notifications_update_owner_or_staff on public.notifications;
create policy notifications_update_owner_or_staff
on public.notifications for update to authenticated
using (
  (select public.is_staff())
  or exists (
    select 1
    from public.parcels p
    where p.id = notifications.parcel_id
      and p.owner_id = (select auth.uid())
  )
)
with check (
  (select public.is_staff())
  or exists (
    select 1
    from public.parcels p
    where p.id = notifications.parcel_id
      and p.owner_id = (select auth.uid())
  )
);

drop policy if exists notifications_delete_owner_or_staff on public.notifications;
create policy notifications_delete_owner_or_staff
on public.notifications for delete to authenticated
using (
  (select public.is_staff())
  or exists (
    select 1
    from public.parcels p
    where p.id = notifications.parcel_id
      and p.owner_id = (select auth.uid())
  )
);

commit;
