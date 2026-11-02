# TruHu analytics: /BryanKleppe

A live dashboard for **truhu.ai/BryanKleppe**, Bryan's page that campaigns
point at. It shows the following:

- where visits come from (the tag on the link)
- how many talk to AI Bryan, by call or chat, and what was said
- which of Bryan's paths they take (samples, build a guide, rebuild last
  year's guide, book a call) and how far they get
- the leads and bookings that come out of it
- where the ones who don't convert stop

It lives in the website repo for now and is built to be lifted out into its own
project unchanged.

```
 visitor on truhu.ai/BryanKleppe
   │  page beacons every few seconds ─────▶ website /api/track ────────┐
   │  calls and chats with AI Bryan ──────▶ website /api/conversation ─┤
   │  samples or build request ───────────▶ website /api/leads ────────┤
   │  last year's guide uploaded ─────────▶ website /api/guide ────────┤
   │  books, moves or cancels a time ─────▶ website /api/booking ──────┤
   │      (placeholder scheduler now; Cal.com later)                   ▼
   │                                                          Supabase Postgres
   │                                  visits · events · bookings · leads · conversations
   │                                                                   ▲
   └──────────────────── this dashboard ── reads + live pulse ─────────┘
```

The full plan behind the paths, events and tables is
[`site-log/plans/2026-11-02-bryan-paths-and-analytics.md`](../site-log/plans/2026-11-02-bryan-paths-and-analytics.md).

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

Open http://localhost:3000/BryanKleppe?tag=test in one window and the dashboard
in another. The visit appears within a couple of seconds. To reset local test
data, delete `.data/analytics.ndjson`.

If `.env.local` has a `SUPABASE_URL` whose address no longer exists (a deleted
project, or a typo), both apps use the local file instead while on your
computer, and the dashboard's badge says **Local file**.

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
5. Click **Table Editor** in the sidebar. You should see five tables:
   `bookings`, `conversations`, `events`, `leads` and `visits`.

The script is safe to run again whenever it changes. **If you ran it before
leads and calls were tracked, run it again:** that adds `leads` and
`conversations`. Until
then the dashboard works without them and says which tables are missing.

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
- The confirmation and the email link to `/BryanKleppe/manage/<booking id>`,
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
   several addresses with commas. Requests from Bryan's other paths (samples,
   build a guide, and rebuild last year's guide with links to the visitor's
   files) go to `GUIDE_NOTIFY_TO` if it's set, and to `BOOKING_NOTIFY_TO` if
   not. Uploaded files go to the private `guide-uploads` bucket, which
   `supabase/schema.sql` creates.
4. Book a time at http://localhost:3000/BryanKleppe **using the same email you
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

## Session recordings and site analytics (Clarity + GA4)

This dashboard is the live view of `/BryanKleppe`: its funnel, Bryan's paths,
leads, bookings and calls. Two free tools add what it can't show:

- **[Microsoft Clarity](https://clarity.microsoft.com)** records sessions so you
  can watch real visits, and draws heatmaps of clicks and scrolling.
  - Every recording carries the visitor's `campaign`, `source` and `medium` as
    custom tags.
  - Funnel steps are Clarity events (`funnel_engaged`, `funnel_interested`,
    `funnel_started`, `funnel_converted`).
  - Leads and bookings are `generate_lead`.
  - So you can filter to, say, "visits from `q4-broker-outreach` that started a
    path but didn't convert".
  - Each visit's Clarity *custom user ID* is its visitor ID, the one this
    dashboard's tables are built from.
- **[Google Analytics 4](https://analytics.google.com)** covers traffic and
  campaigns across the whole site. It reads the `utm_` tags itself. A lead or
  a booking is sent as `generate_lead`, the event GA4 uses for leads, with the
  path it came from.

Both load on every page of the site, with this consent logic:

- **Most visitors:** they load straight away.
- **Visitors from the EU, UK and Switzerland:** a small Accept/Decline banner
  appears first, and the tools load only after Accept.
- **Browsers sending Global Privacy Control:** they don't load.
- "Cookie preferences" in the footer reopens the banner for anyone.

Clarity also hides everything typed into the booking form, and the name and
email shown on the confirmation pages.

**Set up Clarity (about 3 minutes).**

1. Go to clarity.microsoft.com and sign in with a Microsoft, Google or Facebook
   account.
2. Click **New project**. Name it `TruHu website`, set the URL to
   `https://truhu.ai`, and create it.
3. If it asks how to install, choose **Install manually** and close the
   snippet; you don't need it.
4. Go to **Settings → Overview** and copy the **Project ID**, a short code like
   `abcd1234ef`.
5. Add it to `.env.local`:

   ```
   NEXT_PUBLIC_CLARITY_ID=abcd1234ef
   ```

Recordings show up in Clarity within about an hour. Visits from your laptop
are tagged `environment = development`, so you can filter them out.

**Set up Google Analytics 4 (about 5 minutes).**

1. Go to analytics.google.com and create an account named `TruHu`.
2. Create a property named `truhu.ai`, with your time zone.
3. For business objectives, choose **Generate leads**.
4. Choose **Web** as the platform. Set the website URL to `truhu.ai` and the
   stream name to `truhu.ai`, then create the stream.
5. Copy the **Measurement ID**, which looks like `G-ABC123DEF4`.
6. Add it to `.env.local`:

   ```
   NEXT_PUBLIC_GA_ID=G-ABC123DEF4
   ```

7. Go to **Admin → Data display → Key events → New key event**, enter
   `generate_lead` and save. Leads and bookings now count as conversions in
   every campaign report.

From your laptop, events show in GA4's **Admin → DebugView** within seconds.
Live-site traffic fills the normal reports over the following day.

Once the IDs are in `.env.local`, this dashboard's header links straight to
Clarity's recordings and to GA4.

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
   `BOOKING_MEETING_URL`) and the tool IDs (`NEXT_PUBLIC_CLARITY_ID`,
   `NEXT_PUBLIC_GA_ID`) the same way.
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

Every link you put out should carry its own tag. Untagged clicks all land in
one bucket ("Direct"). Use the **Link builder** at the bottom of the dashboard
(click it to open), or add the tag by hand.

**The quick way: one tag.** Add `?tag=` and a name for where the link is going:

```
https://truhu.ai/BryanKleppe?tag=spring-webinar
```

That name shows in the dashboard's **Sources** table and its source filter.
`?c=name` does the same thing.

**The full way: UTM tags**, when you also want the source and medium:

```
https://truhu.ai/BryanKleppe?utm_source=linkedin&utm_medium=paid&utm_campaign=q4-broker-outreach&utm_content=video-ad-a
```

| Tag | Meaning | Examples |
|---|---|---|
| `utm_source` | where the click happens | `linkedin`, `email`, `google`, `event` |
| `utm_medium` | what kind of placement | `paid`, `social`, `email`, `outbound` |
| `utm_campaign` | the name you'll filter by | `q4-broker-outreach` |
| `utm_content` | which ad or email | `video-ad-a` |

`?tag=`, `?c=` and `utm_campaign` all fill the same field, the campaign. A link
with no campaign is grouped by its source instead, and one with neither is
"Direct". Keep values lowercase with hyphens.

A link to any page on the site still counts. The tags are remembered in the
visitor's browser for 90 days, so a click through from the home page credits
the right campaign.

## What's measured

The dashboard, top to bottom: the headline numbers, the funnel beside a live
feed, Bryan's paths, sources, leads, bookings, calls, then visits by day, the
trailer and where non-converters stopped. Hover any heading or column name for
its definition. The confirmation and manage pages count as the same visit.

**Headline numbers.**

| Number | What it counts |
|---|---|
| Visits | visits to /BryanKleppe |
| Talked to Bryan | visits with a call or chat with AI Bryan, and their share of visits |
| Leads | requests sent from samples, build or rebuild |
| Booked | calls booked with Bryan, cancellations left out |
| Conversion | visits with a lead or a booking, divided by visits |

**The funnel.** Each visit records the furthest step it reached:

| Step | Counts when |
|---|---|
| Landed | the page loaded |
| Engaged | 10 s of active time, a scroll, or a click |
| Interested | any popup opened (the chooser, a sample, the build form, the upload, the trailer, the calendar) |
| Started | the visitor viewed a sample, typed in a form, added a file or picked a time |
| Converted | a lead or a booking was saved (set by the server, never by the browser) |

*Active time* means the tab is in view and there was some sign of a person in
the last 30 seconds. A tab left open over lunch doesn't count.

**Bryan's paths.** Each row counts visits:

| Path | Opened when | Converted when |
|---|---|---|
| Samples | the sample picker or any sample opened | a work email was sent from the picker |
| Build a guide | the build form opened | the request (work email and the client's website) was sent |
| Rebuild last year's guide | the guide upload opened | last year's guide was uploaded with a work email |
| Book a call | the trailer or the calendar opened | a booking was saved |

*Started* is the first real step on that path, as in the funnel, and *Rate* is
converted divided by opened. Beside the table, **Opened from** counts what
opened each popup: Bryan's call, the chat, the call-card button ("Build a guide
now"), the three links under the chat, the chooser, the sample picker, or the
end of the trailer.

**Sources** groups visits by campaign (see tagging above): visits, how many
talked to Bryan, were interested and converted, and the rate. Click a row to
filter the whole dashboard to it.

**Leads** lists each request newest first: when, which path, the work email,
the client's website (build) or how many files (rebuild), and the source.

**Calls** lists every call and typed chat with AI Bryan: when, call or chat,
how long, how many things the visitor said, which popups opened during it, how
it ended (the visitor ended it, left the page, an error, the microphone was
refused, or it dropped), and the source. Click a row to read the transcript. A
call still going shows **Live**, and its transcript fills in as it goes.

**Trailer** counts the visits that played it and how many reached 25, 50, 75
and 100%. **Stopped at** is the furthest funnel step of the visits that didn't
convert.

**Also recorded:**

- which blocks and popups each visitor looked at
- scroll depth
- clicks on links and buttons
- day, time and time-zone changes in the calendar
- form errors
- device, browser and OS
- coarse location from Vercel's edge (city, region, country)
- what was said in each call or chat with AI Bryan (the transcript)

**Not recorded:**

- anything typed into a form (booking, samples, build or upload) before it's
  sent; once sent, the booking or lead keeps what the form asked for
- what's typed into a form during a call, which never reaches the transcript
- IP addresses
- cookies

Visitors sending Global Privacy Control or Do Not Track are counted, but
nothing is stored in their browser between visits.

**Live.** The dashboard holds a Server-Sent Events connection to
`/api/stream`. The stream checks the database's `pulse()` every 2 seconds
(every second in local mode) and tells the page to refresh the moment anything
changes.

## Retargeting visitors who didn't convert

The dashboard counts these visits by step and by source, but they're anonymous
until they leave an email or book. To actually show them ads, add your ad
platform's pixel (LinkedIn Insight Tag, Meta Pixel), build an audience of
"visited /BryanKleppe" minus "sent `generate_lead`", and load the pixel only
after consent. That's a decision for the site, not this dashboard.

## Moving it to its own repo

Copy this folder out as-is. It has its own `package.json`, lockfile and config,
and nothing in it imports from the website. The two contracts with the website
are:

- the tables and functions in `supabase/schema.sql`
- the names in `lib/funnel.ts`: the page id, the funnel step numbers, the paths
  and which popup belongs to which path. They mirror `TRACKED_PAGE`, `FUNNEL`
  and `PATHS` in the website's `lib/analytics/schema.ts` and `PATH_OF_FLOW` in
  `components/get-started/flows.ts`

Change either on both sides.

## Files

| Path | What |
|---|---|
| `supabase/schema.sql` | Tables, the write functions the website calls, `pulse()` |
| `lib/funnel.ts` | The names shared with the website: page, funnel, paths, popups |
| `lib/store.ts` | Reads Supabase (or replays the local file) into rows |
| `lib/aggregate.ts` | Rows → everything the dashboard draws |
| `lib/auth.ts`, `proxy.ts` | The password gate |
| `app/api/summary` | One summary per range / source / time zone |
| `app/api/transcript` | One call's transcript, read when its row is opened |
| `app/api/stream` | The live change signal |
| `components/` | Dashboard, charts, link builder |

On the website side:

| Path | What |
|---|---|
| `lib/analytics/tracker.ts` | The browser tracker |
| `lib/analytics/conversation.ts` | Records each call and chat with AI Bryan |
| `app/api/track` | The tracker's endpoint |
| `app/api/leads`, `app/api/guide` | Samples and build requests; rebuild uploads |
| `app/api/conversation` | The conversation recorder's endpoint |
| `lib/analytics/store.ts` | The writer |
| `lib/booking/` | Placeholder scheduler, Cal.com client, calendar links |
| `app/BryanKleppe/` | The page, its confirmation and the manage page |
