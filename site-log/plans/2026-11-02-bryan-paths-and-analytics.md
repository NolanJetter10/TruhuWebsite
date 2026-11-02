# /BryanKleppe: Bryan's paths, and the dashboard repointed at them

2026-11-02 · Nolan's request, built by three agents in parallel. This file is the contract between them: names, shapes and who owns which file. Change it here first if something has to change.

## What Nolan asked for

1. Repoint the analytics dashboard at /BryanKleppe and capture everything the page does now. A tag on the URL says where a visit came from. New funnel steps built on Bryan's paths. Minimal dashboard: critical numbers only, no filler words.
2. When a visitor shows any interest in a guide, three bubbles over the centre of the screen under the title **"How would you like to move forward?"**:
   - **"Rebuild last year's guide"**
   - **"Show me some generic samples of what TruHu can produce"** (then: website, guide, flipbook, flyer)
   - **"Build a guide for your client"**

   Each then asks for the fields that path needs. This replaces Bryan asking which materials to pull up.
3. In a live call, **"Build a guide now"** beside "Talk to the real Bryan", the two placed symmetrically on the call card.
4. The outcomes text under the chat is replaced by three clickable options: **"Check out some sample TruHu deliverables"**, **"Build a guide now"**, **"Check out TruHu's trailer video"**. They open the same flows Bryan opens. **Reuse, don't recreate.**
5. Call histories are recorded.

Bryan's paths (his note, quoted in site-log/sources/2026-11-02-bryan-paths.md):

| Bryan's # | Path key | On the page | Converts when |
|---|---|---|---|
| 1 | `samples` | the sample picker, then a sample | work email sent from the picker |
| 2 | `build` | work email + the client's website | the request is sent |
| 3 | `rebuild` | last year's guide uploaded (the existing guide upload) + work email | the request is sent |
| 5 | `book` | the trailer, then the calendar | a booking is saved |

Bryan's #4 (Advisor plus Workforce by text) is not built.

## Flows (components/get-started/flows.ts)

Existing: `calendar`, `guide`, `sampleGuide`, `flipbook`, `microsite`, `flyer`. New:

- `options`: the chooser. Title "How would you like to move forward?" and three bubbles, which open `guide`, `samples` and `build` with `from: "options"`.
- `samples`: the picker. Website (`microsite`), Guide (`sampleGuide`), Flipbook (`flipbook`) and Flyer (`flyer`), each opened with `from: "samples"`, plus one work-email field to have the samples sent (a `samples` lead). The samples are not gated: the picker shows straight away.
- `build`: work email + the client's website.
- `trailer`: the trailer video, `public/videos/truhu-trailer.mp4` with poster `public/videos/truhu-trailer-poster.jpg` (already encoded from "TruHu Trailer 5 - Patra Advisor 60s (draft v5)", 69 s, 1080p, 15 MB).

`guide` keeps its key and becomes "Rebuild last year's guide" (copy only; same upload).

Path of each flow (`PATH_OF_FLOW` in flows.ts): `samples`, `sampleGuide`, `flipbook`, `microsite`, `flyer` → `samples`; `build` → `build`; `guide` → `rebuild`; `calendar`, `trailer` → `book`; `options` → none.

Flow sources (`FlowSource`, the `from` on `flow_open`): existing `call`, `chat`, `realBryan`, `book`, plus `options` (picked in the chooser), `samples` (picked in the picker), `buildButton` ("Build a guide now" on the call card), `links` (the three options under the chat) and `trailer` (the "pick a time" at the end of the trailer, Bryan's #5: trailer, then calendar).

A sample opened any way (by Bryan, the picker or a link) also calls `startPath("samples", flow)`, from FlowProvider.open, since viewing a sample is that path's first real step.

Widgets the agent can send: add `open_options` (any interest in building or getting a guide, or in what TruHu can do for them, with no specific path named; this replaces asking which materials), `open_samples` (wants examples, samples or deliverables without naming one), `open_build_guide` (wants a guide built for a client and has no documents to hand) and `open_trailer` (asks for a video, trailer or overview). Narrow `open_guide_upload` to "has last year's guide or plan documents to send". The named sample widgets stay.

## Funnel (visits.furthest_step)

| Step | Key | Label | Reached when |
|---|---|---|---|
| 0 | `landed` | Landed | page loaded |
| 1 | `engaged` | Engaged | 10 s active, a scroll or a click |
| 2 | `interested` | Interested | any flow opened (`flow_open`) |
| 3 | `started` | Started | `startPath()`: viewed a sample, typed in a form, added a file, picked a time |
| 4 | `converted` | Converted | a lead or booking saved, set by the server only |

The browser may send up to 3; `/api/track` clamps to 3. `record_lead` and `record_booking` set 4. The calendar no longer moves the funnel by being on screen.

Tracked page id: **`/BryanKleppe`** (`TRACKED_PAGE` in lib/analytics/schema.ts and in the dashboard). The confirmation and manage pages resume the same visit. Rows under the old id `/get-started` are localhost test data and drop out of the dashboard.

Tags: `utm_*` as before; `?c=` and now **`?tag=`** are aliases for `utm_campaign`.

## Events (events.type, name, props)

Unchanged: `view`, `section`, `scroll`, `click`, `exit`, `hide`, `return`, `step`, the booking events (`day`, `time`, `tz`, `month`, `field`, `submit`, `form_invalid`, `booking_error`, `slots`, `booking_offline`, `booked`, `booking_cancelled`, `booking_rescheduled`), `guide_*`, `deliverable_*`, `microsite_open`, `flow_close`.

Changed or new:

| type | name | props | Sent by |
|---|---|---|---|
| `flow_open` | flow | `{ from, path }` (`path` null for `options`) | FlowProvider.open |
| `path_start` | path | `{ flow }` | `startPath(path, flow)` in lib/analytics/tracker.ts, once per path per visit |
| `lead` | path | `{ lead_id }` | server, inside `record_lead` |
| `lead_error` | code | `{ path }` | the build form and the samples email field |
| `call_start` | `call` or `chat` | `{ conversation }` | the conversation recorder |
| `call_end` | `call` or `chat` | `{ conversation, seconds, turns, ended_by }` | the conversation recorder |
| `trailer_play` | — | — | the trailer flow |
| `trailer_progress` | `25`, `50`, `75` or `100` | — | the trailer flow, once each |

UI code calls only `track()` and `startPath()`. Funnel steps 2 and 3 are moved inside the tracker (`flow_open` → `interested`, `path_start` → `started`), so components never name funnel keys.

## Tables (analytics dashboard/supabase/schema.sql)

```sql
create table if not exists public.leads (
  id          uuid primary key,
  visit_id    uuid references public.visits (id) on delete set null,
  visitor_id  uuid,
  created_at  timestamptz not null default now(),
  path        text not null,        -- samples | build | rebuild
  email       text not null,
  client_url  text,                 -- build
  upload_id   text,                 -- rebuild
  file_count  smallint,             -- rebuild
  source text, medium text, campaign text
);

create table if not exists public.conversations (
  id          uuid primary key,     -- made in the browser, one per call or chat session
  visit_id    uuid references public.visits (id) on delete set null,
  visitor_id  uuid,
  mode        text not null,        -- call | chat
  started_at  timestamptz not null,
  updated_at  timestamptz not null default now(),
  ended_at    timestamptz,
  duration_ms integer not null default 0,
  ended_by    text,                 -- visitor | left | error | denied | dropped
  turns       smallint not null default 0,   -- things the visitor said or typed
  flows       text[] not null default '{}',  -- flows opened during it, in order
  transcript  jsonb not null default '[]',   -- [{ "role": "visitor" | "bryan", "text": "...", "at": iso }]
  source text, medium text, campaign text
);
```

Functions, called with the secret key like the others:

- `record_lead(lead jsonb)`: insert (`on conflict (id) do nothing`); when the visit is known, set `furthest_step = greatest(furthest_step, 4)`, bump `last_seen_at`, and insert event `lead` (name = path, props `{ lead_id }`).
- `record_conversation(convo jsonb)`: upsert by id. `duration_ms` and `turns` keep the larger value, `transcript` is replaced only by one at least as long, `ended_at`/`ended_by` take the new value when given, `flows` takes the longer array, `updated_at = now()`.
- `record_booking`: the step it sets becomes 4 (was 6).
- `pulse()`: also moves on `max(created_at)` of leads and `max(updated_at)` of conversations.
- Grants and RLS as for the other tables.

Local file (no Supabase): the same calls appended as `{"op":"record_lead","args":{"lead":{…}}}` and `{"op":"record_conversation","args":{"convo":{…}}}`, which the dashboard replays with the same rules.

## APIs (website)

- `POST /api/leads`: body `{ path: "samples" | "build", email, clientUrl?, website (honeypot), context: trackingContext() }`. Validates the email and, for `build`, a client URL (normalised to `https://host/...`). Rate limits like /api/guide. Calls `recordLead`, then emails the team and the visitor through the same email module as the guide upload (lib/guide/email.ts, extended, not copied). Returns `{ ok: true }` or `{ error, code }` with 422 or 429.
- `POST /api/guide` (the rebuild path) additionally calls `recordLead({ path: "rebuild", upload_id, file_count, ... })`.
- `POST /api/conversation`: body `{ id, mode, startedAgo, endedAgo?, durationMs, endedBy?, turns, flows, transcript: [{ role, text, ago }], context }`. The server stamps times from `ago`, as /api/track does. Same-origin, size-capped (400 entries, 2,000 characters each), works with `sendBeacon`.

Client helpers (lib/analytics/):

- `startPath(path, flow?)` in tracker.ts: already in place; the tracking agent wires it to step 3.
- `startConversation(mode)` in conversation.ts returns `{ said(role, text), flow(name), end(endedBy) }`, posts at start, on changes (debounced) and at the end or pagehide by beacon, and sends `call_start`/`call_end`.

## As built (tracking agent): precisions to the above

Replay rules the dashboard mirrors for the local file (they're what the SQL does):

- `record_lead`: the visit's step 4 and the `lead` event happen only when the row is new; a repeated id changes nothing. `visit_id` is kept only when that visit exists. The lead carries `created_at` (server time); fall back to the line's `ts`. A rebuild lead's id is its `upload_id` written as a UUID (8-4-4-4-12), so sending one upload twice is one lead.
- `record_conversation`: also `visit_id = coalesce(old, new)`, and `started_at` is the first write's. `flows` is replaced only by a strictly longer list, `ended_at`/`ended_by` by a write that has them. The last post at page close can carry `transcript: []` (a beacon must stay under 64 KB); the longer transcript wins, as above.

Op shapes in the file (and the jsonb the functions take):

- `{"op":"record_lead","args":{"lead":{ id, visit_id, visitor_id, source, medium, campaign, created_at, path, email, client_url }}}`. `client_url` is null for `samples`. A rebuild has `upload_id` and `file_count` instead of `client_url`.
- `{"op":"record_conversation","args":{"convo":{ id, visit_id, visitor_id, source, medium, campaign, mode, started_at, ended_at, duration_ms, ended_by, turns, flows, transcript: [{ role, text, at }] }}}`.

Events: `step` names are now `engaged`, `interested` and `started` (props `{ from }`), never `converted`. The old `calendar`/`time`/`details`/`submitted`/`booked` steps are no longer sent. `call_end.seconds` is rounded. A call's duration runs from the click to the end. A chat starts at its first finished reply and lasts until the visitor leaves (`ended_by: "left"`), and its duration runs from its first line to its last. A call lists every flow opened while it was on; a chat lists only those it opened (`from: "chat"`).

Client API additions:

- tracker.ts: `onTrack(listener)` (the recorder hears `flow_open` through it) and `converted(path)`: GA4 `generate_lead { method: path }`, a Clarity upgrade, and `funnel_converted { path }`. Call `converted` once a lead or booking is saved. BookingWidget does (`converted("book")`; the GA4 method was `get_started_calendar`). `reachStep` and `setCalendarVisible` are gone.
- conversation.ts: `said(role, text, key?)`, where a repeated `key` updates its line (Anam and chat message ids). Also `recordChatReply(finish, widgetLine)` and `endChat(by)` for the typed chat, and the dev hook `window.__conversation`.
- store.ts: `contextFields(context)` turns `trackingContext()` into row fields for the three routes.

## Who owns what

Edit only your own files. Where two agents share a file, re-read it right before each edit and keep the change to your region.

- **Page agent:** components/get-started/{flows.ts, FlowProvider.tsx, FlowPanel.tsx, RealBryanButton.tsx, GuideUpload.tsx, DeliverableViewer.tsx, MicrositeCard.tsx, FlipbookOverlay.tsx} and the new components; BryanCall.tsx (the buttons JSX only); EnsembleChat.tsx (the widget cards only); app/BryanKleppe/page.tsx; `GET_STARTED_PAGE` in lib/content.ts.
- **Tracking agent:** lib/analytics/*, components/get-started/FunnelTracker.tsx, app/api/{track, leads, conversation, guide}/, lib/guide/email.ts, analytics dashboard/supabase/schema.sql, the `reachStep` lines in BookingWidget.tsx, the `page=` prop in app/BryanKleppe/{confirmed, manage/[uid]}/page.tsx (and the one line in app/BryanKleppe/page.tsx), conversation recording in BryanCall.tsx (start, finish and listeners only) and in EnsembleChat.tsx (message hooks only).
- **Dashboard agent:** everything under analytics dashboard/ except supabase/schema.sql.

No agent writes to site-log/ or commits; the lead session logs and reviews the whole change.
