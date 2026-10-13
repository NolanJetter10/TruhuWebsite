# TruHu funnel analytics

A live dashboard for **truhu.ai/get-started**, the booking page campaigns point
at. It shows the following:

- which campaigns visitors come from
- how long they stay
- how far each visit gets toward a booked demo
- where the ones who don't book drop off

It lives in the website repo for now and is built to be lifted out into its own
project unchanged.

```
 visitor on truhu.ai/get-started
   │  page beacons every few seconds ──────▶ website /api/track ─────┐
   │  books a time ──▶ website /api/booking ──▶ Cal.com ──▶ Bryan's  │
   │                                   │          calendar + invites │
   │                                   └── record_booking ───────────┤
   │                                                                 ▼
   │          Cal.com webhook (cancel / reschedule) ─────────▶  Supabase Postgres
   │                                                           visits · events · bookings
   │                                                                 ▲
   └──────────────────── this dashboard ── reads + live pulse ───────┘
```

The **database is the contract**. The website only writes and this app only
reads, so either one can move, redeploy or break without taking the other down.

## Run it locally

You need no accounts to run it. The website's dev server writes every analytics
call to `.data/analytics.ndjson` in this folder, and this app replays that file
with the same rules the database uses.

```bash
# website (repo root) — usually already running on :3000
npm run dev

# dashboard (this folder)
npm install
npm run dev            # http://localhost:3001
```

Open http://localhost:3000/get-started?utm_source=linkedin&utm_campaign=test in
one window and the dashboard in another. The visit appears within a couple of
seconds.

The `/get-started` calendar runs on a **demo scheduler** until Cal.com is
connected. You can book through it, but it sends no invites. To reset local
data, delete `.data/analytics.ndjson`.

## Going live

### 1. Supabase (the database)

1. Create a project at supabase.com. The free tier is fine to start.
2. Open **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql)
   and run it. It's safe to re-run.
3. Under **Project Settings → API Keys**, copy:
   - the **Project URL**, for `SUPABASE_URL`
   - a **secret key** (`sb_secret_…`), for `SUPABASE_SECRET_KEY`

   Keep the secret key server-side only. It never reaches a browser.

The tables have row level security on and no policies, so the publishable
(anon) key can't read or write anything.

> Free projects pause after a week with **no** activity. A live page keeps it
> active; a paused one wakes from the Supabase dashboard.

### 2. Cal.com (the live calendar)

The booking widget on `/get-started` is our own UI. Cal.com is the engine
behind it. It does the following:

- checks Bryan's real calendar for conflicts
- writes the meeting into that calendar
- emails both sides the invite with the video link
- hosts the reschedule and cancel pages

1. Bryan signs up at cal.com and connects his work calendar (Google or
   Microsoft 365) under **Apps → Calendars**. He sets it as the destination
   calendar and checks his working hours under **Availability**.
2. Create an **event type**:
   - title like "TruHu demo", **10 minutes**
   - location **Google Meet**, Zoom or MS Teams
   - a short buffer if he wants one
3. On that event type, under **Advanced → Booking questions**, add two
   **required** questions:
   - **Agency**: type *Short text*, identifier `agency`
   - **Roughly how many clients do you serve?**: type *Short text*, identifier
     `clients`

   Name and email are built in. If you use different identifiers, set
   `CAL_FIELD_AGENCY` and `CAL_FIELD_CLIENTS`.
4. Note the event type's **ID**. It's the number in the URL when editing it.
5. Under **Settings → Developer → API keys**, create a key (`cal_live_…`).
6. Under **Settings → Developer → Webhooks**:
   - Subscriber URL: `https://truhu.ai/api/webhooks/cal`
   - Triggers: **Booking cancelled** and **Booking rescheduled**
   - Set a secret

   This keeps cancelled and moved meetings honest on the dashboard.

Make one test booking on the live page after setup. Confirm the invite reaches
both inboxes and the meeting lands on Bryan's calendar.

### 3. Environment variables

**Website** (Vercel → truhu-website → Settings → Environment Variables, and
`.env.local` at the repo root for local testing against real services):

| Variable | Value |
|---|---|
| `CAL_API_KEY` | the `cal_live_…` key |
| `CAL_EVENT_TYPE_ID` | the event type's number |
| `CAL_WEBHOOK_SECRET` | the webhook's secret |
| `CAL_FIELD_AGENCY` / `CAL_FIELD_CLIENTS` | only if the question identifiers differ from `agency` / `clients` |
| `CAL_PUBLIC_URL` | only if Bryan's Cal.com is on an org domain (e.g. `https://truhu.cal.com`) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` |

If the Cal.com values are missing in production, the calendar shows a "request
a time" fallback linking to `/demo`. If the Supabase values are missing,
analytics are dropped, with one warning in the logs.

**Dashboard** (this app's own Vercel project, and `.env.local` in this folder):

| Variable | Value |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | the same project as the website |
| `DASHBOARD_PASSWORD` | one shared password; **required** in production |
| `SITE_URL` | where the link builder points, default `https://truhu.ai` |

### 4. Deploy the dashboard

In Vercel, choose **Add New → Project** and import this repo again. Then:

- **Root Directory**: `analytics dashboard`
- Framework: Next.js
- Add the env vars above, and deploy

Put it on a subdomain like `analytics.truhu.ai` if you want one. The page is
`noindex` and every route sits behind the password.

## Tagging campaign links

Every link you put out should carry its own tags. Untagged clicks all land in
one bucket. Use the **Campaign link builder** at the bottom of the dashboard, or
add the tags by hand:

```
https://truhu.ai/get-started?utm_source=linkedin&utm_medium=paid&utm_campaign=q4-broker-outreach&utm_content=video-ad-a
```

| Tag | Meaning | Examples |
|---|---|---|
| `utm_source` | where the click happens | `linkedin`, `email`, `google`, `event` |
| `utm_medium` | what kind of placement | `paid`, `social`, `email`, `outbound` |
| `utm_campaign` | the name you'll filter by | `q4-broker-outreach` |
| `utm_content` | which ad or email | `video-ad-a` |

Keep values lowercase with hyphens. `?c=name` works as a short alias for
`utm_campaign` in links you type by hand.

A link to any page on the site still counts. The tags are remembered in the
visitor's browser for 90 days, so a click through from the home page credits
the right campaign.

## What's measured

**The funnel.** Each visit records the furthest step it reached:

| Step | Counts when |
|---|---|
| Landed | the page loaded |
| Engaged | 10 s of active time, a scroll, or a click |
| Saw the calendar | an engaged visit had the calendar on screen |
| Picked a time | a slot was clicked |
| Started details | name, email, agency or client count was touched |
| Hit confirm | the form was submitted |
| Booked | Cal.com confirmed the booking (set server-side) |

**Time on page** is *active* time: the tab is in view and there was some sign
of a person in the last 30 seconds. A tab left open over lunch doesn't count.

**Drop-off** has three views:

- the furthest step reached by non-bookers
- the block on screen when they left
- any link they left by

**Also recorded:**

- which blocks each visitor actually looked at
- scroll depth
- clicks on links and buttons
- day, time and time-zone changes in the calendar
- form errors
- device, browser and OS
- coarse location from Vercel's edge (city, region, country)

**Not recorded:**

- anything typed into the form before it's submitted
- IP addresses
- cookies

Visitors sending Global Privacy Control or Do Not Track are counted, but
nothing is stored in their browser between visits.

**Live.** The dashboard holds a Server-Sent Events connection to
`/api/stream`. The stream checks the database's `pulse()` every 2 seconds
(every second in local mode) and tells the page to refresh the moment anything
changes.

## Retargeting "clicked but didn't book"

The dashboard lists these visits and counts them by campaign, but they're
anonymous until they book. To actually show them ads, add your ad platform's
pixel (LinkedIn Insight Tag, Meta Pixel), build an audience of
"visited /get-started" minus "visited /get-started/confirmed", and load the
pixel only after consent. That's a decision for the site, not this dashboard.

## Moving it to its own repo

Copy this folder out as-is. It has its own `package.json`, lockfile and config,
and nothing in it imports from the website. The two contracts with the website
are:

- the tables and functions in `supabase/schema.sql`
- the funnel step numbers in `lib/funnel.ts`, which mirror `FUNNEL` in the
  website's `lib/analytics/schema.ts`

Change either on both sides.

## Files

| Path | What |
|---|---|
| `supabase/schema.sql` | Tables, the write functions the website calls, `pulse()` |
| `lib/store.ts` | Reads Supabase (or replays the local file) into rows |
| `lib/aggregate.ts` | Rows → everything the dashboard draws |
| `lib/auth.ts`, `proxy.ts` | The password gate |
| `app/api/summary` | One summary per range / campaign / time zone |
| `app/api/stream` | The live change signal |
| `components/` | Dashboard, charts, link builder |

On the website side:

| Path | What |
|---|---|
| `lib/analytics/tracker.ts` | The browser tracker |
| `app/api/track` | Its endpoint |
| `lib/analytics/store.ts` | The writer |
| `lib/booking/` | Cal.com client, demo scheduler, calendar links |
| `app/get-started/` | The page and its confirmation |
