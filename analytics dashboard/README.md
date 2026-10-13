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
   │  page beacons every few seconds ─────▶ website /api/track ──────┐
   │  books, moves or cancels a time ─────▶ website /api/booking ────┤
   │      (placeholder scheduler now; Cal.com later)                 ▼
   │                                                          Supabase Postgres
   │                                                    visits · events · bookings
   │                                                                 ▲
   └──────────────────── this dashboard ── reads + live pulse ───────┘
```

The **database is the contract**. The website only writes and this app only
reads, so either one can move, redeploy or break without taking the other down.

## Run it locally

Both apps run on your computer with no accounts at all. Until a database is
connected, the website writes to `.data/analytics.ndjson` in this folder, and
this app replays that file with the same rules the database uses.

```bash
# website (repo root) — usually already running on :3000
npm run dev

# dashboard (this folder)
npm install
npm run dev            # http://localhost:3001
```

Open http://localhost:3000/get-started?utm_source=linkedin&utm_campaign=test in
one window and the dashboard in another. The visit appears within a couple of
seconds. To reset local test data, delete `.data/analytics.ndjson`.

## Connect the database (Supabase)

This is the one setup step needed now. It takes about five minutes.

**1. Create the tables.**

1. Open your project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the left sidebar, click **SQL Editor**.
3. Open [`supabase/schema.sql`](supabase/schema.sql) in VS Code. Select all
   (Ctrl+A) and copy (Ctrl+C).
4. Paste it into the Supabase editor and click **Run** (or press Ctrl+Enter).
   - If Supabase warns about "destructive operations", confirm. The script only
     creates tables and sets permissions; it deletes nothing.
   - You should see *Success. No rows returned.*
5. Click **Table Editor** in the sidebar. You should see three tables:
   `bookings`, `events` and `visits`.

The script is safe to run again whenever it changes.

**2. Copy two values out of Supabase.**

- **Project URL.** Go to **Project Settings** (the gear at the bottom of the
  sidebar), then **Data API**. It looks like `https://abcdefghijklmnop.supabase.co`.
  The **Connect** button at the top of the project shows it too.
- **Secret key.** Go to **Project Settings**, then **API Keys**, then the
  **Secret keys** section. Copy the key that starts with `sb_secret_`.
  - If there isn't one yet, create one on that page.
  - If the project only shows **Legacy API keys**, use the one labelled
    `service_role` (click Reveal).
  - Never use the *publishable* or *anon* key here.

**3. Paste them into one file.**

Open `.env.local` in the root of the TruhuWebsite folder. It already exists, so
leave what's in it and add these two lines at the bottom, with your values:

```
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxxxxxx
```

Save the file. Within a few seconds the website writes to Supabase and the
dashboard's badge switches from **Local file** to **Supabase**. Nothing needs
restarting. If something is off, the dashboard says which step to recheck.

The secret key stays on your computer and on the server. It never reaches a
visitor's browser, and `.env.local` is never committed to git. The tables have
row level security on with no policies, so the public (anon) key can't read or
write anything.

> Free projects pause after a week with **no** activity. A live page keeps it
> active; a paused one wakes from the Supabase dashboard.

## The calendar: placeholder for now

Until Bryan's calendar is connected, the booking widget runs on a
**placeholder scheduler** ([`lib/booking/placeholder.ts`](../lib/booking/placeholder.ts)
in the website). From the visitor's side it behaves like the real thing:

- It offers Bryan's working hours: weekdays, 9:00 to 4:30 ET start times every
  30 minutes, at least 3 hours ahead and up to 60 days out. Change these in
  `HOURS` in that file.
- Every booking is saved to the `bookings` table. The time disappears for
  everyone else, and the booking shows on the dashboard straight away.
- Two people racing for the same time get one booking and one "that time was
  just taken". The database guarantees it.
- Once email is on (next section), the booker gets a real **calendar
  invitation** that Gmail and Outlook show with Accept / Decline. Your team
  gets a heads-up email with their details.
- The confirmation and the email link to `/get-started/manage/<booking id>`,
  where the visitor can move or cancel. A move updates the invitation on
  their calendar, a cancellation removes it, and the freed time opens up
  again.

**What it doesn't do:** read or write Bryan's own calendar, so it can't see
his other meetings. There's also no Zoom link until one is set: invites say
*"Bryan will send the Zoom link before the call."*

If Bryan has a personal Zoom meeting link, put it in `.env.local` and every
invite will include it:

```
BOOKING_MEETING_URL=https://zoom.us/j/1234567890
```

## Turn on email invites (Resend)

The emails go out through [Resend](https://resend.com), an email-sending
service with a free tier. There are two stages.

**Stage 1: test it on your laptop (about 5 minutes).**

1. Sign up at resend.com with your own email address.
2. Go to **API Keys → Create API Key** and copy the key. It starts with `re_`.
3. Add these lines to `.env.local` and save:

   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
   BOOKING_NOTIFY_TO=you@yourcompany.com
   ```

   `BOOKING_NOTIFY_TO` is who gets the "new demo booked" heads-up. Separate
   several addresses with commas.
4. Book a time at http://localhost:3000/get-started **using the same email you
   signed up to Resend with**. The invite arrives from `onboarding@resend.dev`.

Until a domain is verified, Resend only delivers to the address the account was
opened with. That's what Stage 2 fixes.

**Stage 2: send from truhu.ai to anyone (before real prospects book).**

1. In Resend, go to **Domains → Add Domain** and enter `truhu.ai`.
2. Resend lists a few DNS records (MX and TXT). truhu.ai's DNS is managed in
   Vercel, so add each record there:
   - Open vercel.com → **Domains** → `truhu.ai` → **DNS Records**.
   - Add each record with the Name, Type and Value exactly as Resend shows
     them.
3. Back in Resend, click **Verify**. It usually takes a few minutes.
4. Add these to `.env.local`:

   ```
   BOOKING_EMAIL_FROM=Bryan Kleppe <bryan@truhu.ai>
   BOOKING_EMAIL_REPLY_TO=bryans-real-inbox@example.com
   ```

   truhu.ai doesn't receive email, so replies and RSVPs need to go to Bryan's
   real inbox. Set that in `BOOKING_EMAIL_REPLY_TO`.

Without `RESEND_API_KEY`, nothing is sent. In development each email is
instead saved as a preview in a `truhu-outbox` folder in your system's temp
directory, and the confirmation page stops claiming an invite went out.

## Later: connect Bryan's calendar (Cal.com)

When you're ready, setting four variables switches every new booking to
Bryan's real calendar. Cal.com then does the following, and the placeholder's own emails stop:

- checks his calendar for conflicts
- adds the meeting
- emails both sides the invite with the video link
- hosts the reschedule and cancel pages

Nothing else on the page changes.

1. Bryan signs up at cal.com and connects his work calendar (Google or
   Microsoft 365) under **Apps → Calendars**.
2. He creates an **event type**:
   - **10 minutes**
   - location Google Meet, Zoom or Teams
3. On it, under **Advanced → Booking questions**, add two **required** *Short
   text* questions, with identifiers `agency` and `clients`.
4. Note the event type's **ID**. It's the number in the URL while editing it.
5. Create an API key under **Settings → Developer → API keys**.
6. Create a webhook under **Settings → Developer → Webhooks**:
   - URL: `https://truhu.ai/api/webhooks/cal`
   - Triggers: *Booking cancelled* and *Booking rescheduled*
   - Set a secret
7. Add these to `.env.local` (and to Vercel, below):

```
CAL_API_KEY=cal_live_xxxxxxxxxxxxxxxx
CAL_EVENT_TYPE_ID=1234567
CAL_WEBHOOK_SECRET=the-webhook-secret
```

8. Make one test booking and check it lands on Bryan's calendar.

## Later: put it online (Vercel)

Everything above runs on your computer. Vercel is the service that runs the
public truhu.ai site. Two things are needed when you want this live:

**The live site needs the same two Supabase values.**

1. On vercel.com, open the **truhu-website** project.
2. Go to **Settings → Environment Variables**.
3. Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` with the same values as in
   `.env.local`. Add the email settings you've set (`RESEND_API_KEY`,
   `BOOKING_EMAIL_FROM`, `BOOKING_EMAIL_REPLY_TO`, `BOOKING_NOTIFY_TO`,
   `BOOKING_MEETING_URL`) the same way.
4. Save, then redeploy the site.

Without them, the live page shows a "request a time" link instead of the
calendar, rather than taking bookings it can't store.

**The dashboard needs its own web address** if you want to open it away from
your laptop.

1. In Vercel, choose **Add New → Project** and import this GitHub repo again.
2. Set **Root Directory** to `analytics dashboard`.
3. Add these environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `DASHBOARD_PASSWORD`: any password you choose; it's required online
4. Deploy.

You get an address like `truhu-analytics.vercel.app`. Every page needs the
password, and none of them is indexed by search engines.

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
| Booked | the booking was saved (set server-side, never by the browser) |

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
| `lib/booking/` | Placeholder scheduler, Cal.com client, calendar links |
| `app/get-started/` | The page and its confirmation |
