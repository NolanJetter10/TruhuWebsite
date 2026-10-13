-- TruHu funnel analytics — the database the website writes and the dashboard
-- reads. Run this once in the Supabase SQL editor (Project → SQL → New query).
-- Safe to run again: everything is create-if-missing or create-or-replace.
--
-- Access model. Row level security is ON for every table with NO policies, so
-- the publishable (anon) key can neither read nor write a row. The website's
-- server and the dashboard's server both use the secret key, which bypasses
-- RLS, and neither key ever reaches a browser.
--
-- Three tables:
--   visits    one row per page visit, upserted as the visit goes on
--   events    the raw stream: section views, clicks, calendar steps
--   bookings  one row per booked demo, kept current by the Cal.com webhook

-- ---------------------------------------------------------------- visits ----

create table if not exists public.visits (
  id            uuid primary key,
  visitor_id    uuid not null,
  page          text not null,
  started_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),

  -- Attribution, resolved once per visit from the URL tags, an earlier tagged
  -- visit, or the referrer — `attribution` says which.
  source        text,
  medium        text,
  campaign      text,
  content       text,
  term          text,
  click_id      text,   -- which ad click id was present: gclid, li_fat_id, fbclid, msclkid
  attribution   text,   -- url | stored | referrer | direct
  referrer      text,
  from_path     text,   -- the truhu.ai page they came from, when they did
  landing_url   text,

  device        text,
  browser       text,
  os            text,
  country       text,
  region        text,
  city          text,
  returning     boolean not null default false,

  -- Engagement. Every write sends running totals, and the upsert keeps the
  -- larger value, so a late or repeated beacon can never move them backwards.
  engaged_ms    integer  not null default 0,
  max_scroll    smallint not null default 0,
  furthest_step smallint not null default 0,  -- see FUNNEL in the dashboard
  last_section  text,
  exit_target   text,   -- the link they left by, when they left by one
  booked        boolean not null default false,
  booking_uid   text
);

create index if not exists visits_started_at_idx on public.visits (started_at desc);
create index if not exists visits_campaign_idx   on public.visits (campaign);
create index if not exists visits_visitor_idx    on public.visits (visitor_id);
create index if not exists visits_last_seen_idx  on public.visits (last_seen_at desc);

-- ---------------------------------------------------------------- events ----

create table if not exists public.events (
  id        bigint generated always as identity primary key,
  visit_id  uuid not null references public.visits (id) on delete cascade,
  at        timestamptz not null default now(),
  type      text not null,
  name      text,
  props     jsonb
);

create index if not exists events_visit_idx on public.events (visit_id);
create index if not exists events_at_idx    on public.events (at desc);

-- -------------------------------------------------------------- bookings ----

create table if not exists public.bookings (
  uid           text primary key,
  visit_id      uuid references public.visits (id) on delete set null,
  visitor_id    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  start_at      timestamptz not null,
  end_at        timestamptz,
  name          text not null,
  email         text not null,
  agency        text,
  client_count  text,
  time_zone     text,
  status        text not null default 'booked',  -- booked | rescheduled | cancelled
  source        text,
  medium        text,
  campaign      text
);

create index if not exists bookings_created_idx on public.bookings (created_at desc);

alter table public.visits   enable row level security;
alter table public.events   enable row level security;
alter table public.bookings enable row level security;

-- From 30 Oct 2026 Supabase stops granting new public tables to any role by
-- default, service_role included, so the grants are spelled out.
grant select, insert, update, delete on public.visits, public.events, public.bookings to service_role;
grant usage, select on all sequences in schema public to service_role;
revoke all on public.visits, public.events, public.bookings from anon, authenticated;

-- ------------------------------------------------------------- functions ----

-- One beacon from the page: upsert the visit, append its events.
create or replace function public.ingest(visit jsonb, events jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  vid uuid := (visit ->> 'id')::uuid;
begin
  insert into public.visits as v (
    id, visitor_id, page, started_at, last_seen_at,
    source, medium, campaign, content, term, click_id, attribution,
    referrer, from_path, landing_url,
    device, browser, os, country, region, city, returning,
    engaged_ms, max_scroll, furthest_step, last_section, exit_target
  )
  values (
    vid,
    (visit ->> 'visitor_id')::uuid,
    visit ->> 'page',
    coalesce((visit ->> 'started_at')::timestamptz, now()),
    coalesce((visit ->> 'last_seen_at')::timestamptz, now()),
    visit ->> 'source', visit ->> 'medium', visit ->> 'campaign',
    visit ->> 'content', visit ->> 'term', visit ->> 'click_id',
    visit ->> 'attribution',
    visit ->> 'referrer', visit ->> 'from_path', visit ->> 'landing_url',
    visit ->> 'device', visit ->> 'browser', visit ->> 'os',
    visit ->> 'country', visit ->> 'region', visit ->> 'city',
    coalesce((visit ->> 'returning')::boolean, false),
    coalesce((visit ->> 'engaged_ms')::integer, 0),
    coalesce((visit ->> 'max_scroll')::smallint, 0),
    coalesce((visit ->> 'furthest_step')::smallint, 0),
    visit ->> 'last_section',
    visit ->> 'exit_target'
  )
  on conflict (id) do update set
    last_seen_at  = greatest(v.last_seen_at, excluded.last_seen_at),
    engaged_ms    = greatest(v.engaged_ms, excluded.engaged_ms),
    max_scroll    = greatest(v.max_scroll, excluded.max_scroll),
    furthest_step = greatest(v.furthest_step, excluded.furthest_step),
    last_section  = coalesce(excluded.last_section, v.last_section),
    exit_target   = coalesce(excluded.exit_target, v.exit_target);

  insert into public.events (visit_id, at, type, name, props)
  select vid,
         coalesce((e ->> 'at')::timestamptz, now()),
         e ->> 'type',
         e ->> 'name',
         e -> 'props'
  from jsonb_array_elements(coalesce(events, '[]'::jsonb)) as e;
end;
$$;

-- A booking made on the page: store it, mark the visit booked, and drop a
-- `booked` event into the stream so the dashboard's live feed shows it.
create or replace function public.record_booking(booking jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  vid uuid := nullif(booking ->> 'visit_id', '')::uuid;
  known boolean := vid is not null and exists (select 1 from public.visits where id = vid);
begin
  insert into public.bookings (
    uid, visit_id, visitor_id, start_at, end_at, name, email, agency,
    client_count, time_zone, status, source, medium, campaign
  )
  values (
    booking ->> 'uid',
    case when known then vid end,
    nullif(booking ->> 'visitor_id', '')::uuid,
    (booking ->> 'start_at')::timestamptz,
    (booking ->> 'end_at')::timestamptz,
    booking ->> 'name',
    booking ->> 'email',
    booking ->> 'agency',
    booking ->> 'client_count',
    booking ->> 'time_zone',
    coalesce(booking ->> 'status', 'booked'),
    booking ->> 'source',
    booking ->> 'medium',
    booking ->> 'campaign'
  )
  on conflict (uid) do update set
    start_at   = excluded.start_at,
    end_at     = excluded.end_at,
    status     = excluded.status,
    updated_at = now();

  if known then
    update public.visits
       set booked = true,
           booking_uid = booking ->> 'uid',
           furthest_step = greatest(furthest_step, 6),
           last_seen_at = greatest(last_seen_at, now())
     where id = vid;

    insert into public.events (visit_id, type, name, props)
    values (vid, 'booked', booking ->> 'uid',
            jsonb_build_object('agency', booking ->> 'agency',
                               'client_count', booking ->> 'client_count'));
  end if;
end;
$$;

-- A change reported by the Cal.com webhook: cancelled or moved.
create or replace function public.update_booking_status(
  booking_uid text,
  new_status text,
  new_start timestamptz default null,
  new_end timestamptz default null,
  new_uid text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  vid uuid;
begin
  update public.bookings
     set status = new_status,
         start_at = coalesce(new_start, start_at),
         end_at = coalesce(new_end, end_at),
         uid = coalesce(new_uid, uid),
         updated_at = now()
   where uid = booking_uid
  returning visit_id into vid;

  if vid is not null then
    if new_uid is not null then
      update public.visits set booking_uid = new_uid where id = vid;
    end if;
    insert into public.events (visit_id, type, name, props)
    values (vid, 'booking_' || new_status, coalesce(new_uid, booking_uid),
            jsonb_build_object('start', new_start));
  end if;
end;
$$;

-- The dashboard's change signal: one cheap string that moves whenever any
-- event lands, any visit heartbeats, or any booking changes. The dashboard
-- polls it every couple of seconds and refreshes only when it moves.
create or replace function public.pulse()
returns text
language sql
stable
security invoker
set search_path = public
as $$
  select concat_ws('|',
    (select max(id) from public.events),
    (select max(last_seen_at) from public.visits),
    (select max(updated_at) from public.bookings));
$$;

-- Only the secret key may call these.
revoke all on function public.ingest(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.record_booking(jsonb) from public, anon, authenticated;
revoke all on function public.update_booking_status(text, text, timestamptz, timestamptz, text) from public, anon, authenticated;
revoke all on function public.pulse() from public, anon, authenticated;
grant execute on function public.ingest(jsonb, jsonb) to service_role;
grant execute on function public.record_booking(jsonb) to service_role;
grant execute on function public.update_booking_status(text, text, timestamptz, timestamptz, text) to service_role;
grant execute on function public.pulse() to service_role;
