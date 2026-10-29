"use client";

import {
  ArrowLeft,
  CaretLeft,
  CaretRight,
  Globe,
  VideoCamera,
  Warning,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { cx } from "@/components/ui/primitives";
import { thirdPartyEvent } from "@/lib/analytics/third-party";
import {
  flushNow,
  reachStep,
  track,
  trackingContext,
} from "@/lib/analytics/tracker";
import {
  addDays,
  dateKey,
  formatLongDate,
  formatTime,
  weekday,
  zoneAbbreviation,
  zoneLongName,
} from "@/lib/booking/time";
import type { SlotsByDay } from "@/lib/booking/types";
import type { GET_STARTED_PAGE } from "@/lib/content";
import { Avatar } from "./Avatar";

/**
 * The booking calendar: our own UI over the scheduler's availability, so it
 * looks like the rest of the page and every step of it can be measured.
 *
 *   pick a day → pick a time → four fields → confirm → confirmation page
 *
 * Times are fetched a month at a time in the visitor's zone and shown in it;
 * the zone is detected and can be changed. Every step reports to the funnel
 * tracker, and the whole widget opts out of the generic click log
 * (`data-track-ignore`) because it reports its own, more specific events.
 */

type Copy = (typeof GET_STARTED_PAGE)["booking"];

type MonthData =
  | { status: "ready"; days: SlotsByDay; provider: string }
  | { status: "error" }
  | { status: "offline" };

type Fields = { name: string; email: string; agency: string; clients: string };
type FieldName = keyof Fields;

const US_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MEETING_MINUTES = 10;

/* The detected zone is read through useSyncExternalStore so the server and
   the first client render agree (nothing), and the real zone arrives on the
   very next render without an effect. */
const noSubscribe = () => () => {};
const detectZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const noZone = () => null;

const monthOf = (key: string) => key.slice(0, 7);
const firstOf = (month: string) => `${month}-01`;
const nextMonth = (month: string) => monthOf(addDays(firstOf(month), 32));
const prevMonth = (month: string) => monthOf(addDays(firstOf(month), -1));
const lastOf = (month: string) => addDays(firstOf(nextMonth(month)), -1);

function monthTitle(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 15)));
}

export function BookingWidget({
  copy,
  hostName,
  hostPhoto,
  reschedule,
  section = "calendar",
  tall = false,
}: {
  copy: Copy;
  hostName: string;
  hostPhoto?: string | null;
  /** Move this booking instead of making a new one: pick a time, confirm. */
  reschedule?: { uid: string };
  /**
   * The widget's id and `data-section`. A second copy on the page (the
   * popup's) needs its own, so its ids don't collide and the funnel can
   * tell the two apart.
   */
  section?: string;
  /** Sized for the centered popup the calendar grows into (FlowPanel). */
  tall?: boolean;
}) {
  const router = useRouter();
  const detected = useSyncExternalStore(noSubscribe, detectZone, noZone);
  const [zoneChoice, setZoneChoice] = useState<string | null>(null);
  const zone = zoneChoice ?? detected;

  const [monthChoice, setMonthChoice] = useState<string | null>(null);
  const today = zone ? dateKey(Date.now(), zone) : null;
  const month = monthChoice ?? (today ? monthOf(today) : null);

  const [months, setMonths] = useState<Record<string, MonthData>>({});
  const [dayChoice, setDayChoice] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [fields, setFields] = useState<Fields>({
    name: "",
    email: "",
    agency: "",
    clients: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const touched = useRef(new Set<FieldName>());
  const autoAdvanced = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const slotButton = useRef<HTMLButtonElement | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const idp = section === "calendar" ? "bk" : `bk-${section}`;
  const formId = section === "calendar" ? "booking-form" : `${section}-form`;

  const cacheKey = zone && month ? `${zone}|${month}` : null;
  const data = cacheKey ? months[cacheKey] : undefined;

  const inflight = useRef(new Set<string>());

  // Fetch the month on screen when it isn't cached. State only changes when
  // the request settles, in the promise callback, never in the effect body.
  useEffect(() => {
    if (!zone || !month) return;
    const key = `${zone}|${month}`;
    if (months[key] || inflight.current.has(key)) return;
    inflight.current.add(key);
    void fetchMonth(month, zone).then((result) => {
      inflight.current.delete(key);
      if (result.status === "ready" && result.empty && !autoAdvanced.current) {
        // Late in a month with nothing left, open on the next one instead.
        setMonthChoice(nextMonth(month));
      }
      autoAdvanced.current = true;
      setMonths((all) => ({ ...all, [key]: result.data }));
    });
  }, [zone, month, months]);

  const days = data?.status === "ready" ? data.days : {};
  const firstAvailable = Object.keys(days).sort()[0] ?? null;
  const day = dayChoice && days[dayChoice] ? dayChoice : firstAvailable;
  const times = day ? (days[day] ?? []) : [];
  const phase = slot ? "details" : "pick";

  /* ------------------------------------------------------------ handlers */

  function chooseZone(next: string) {
    setZoneChoice(next);
    setSlot(null);
    track("tz", next);
  }

  function goMonth(next: string) {
    setMonthChoice(next);
    setDayChoice(null);
    track("month", next);
  }

  function chooseDay(next: string) {
    setDayChoice(next);
    setNotice(null);
    track("day", next);
  }

  function chooseTime(iso: string, index: number) {
    setSlot(iso);
    setNotice(null);
    setFormError(null);
    track("time", iso, { day, index, of: times.length });
    reachStep("time");
    requestAnimationFrame(() => nameInput.current?.focus({ preventScroll: true }));
  }

  function changeTime() {
    const previous = slot;
    setSlot(null);
    track("change_time");
    requestAnimationFrame(() => {
      const button = previous
        ? root.current?.querySelector<HTMLButtonElement>(`[data-slot="${previous}"]`)
        : null;
      (button ?? slotButton.current)?.focus({ preventScroll: true });
    });
  }

  function onField(name: FieldName, value: string) {
    // Autofill can fill a field without ever focusing it.
    onFocusField(name);
    setFields((all) => ({ ...all, [name]: value }));
    if (errors[name]) setErrors((all) => ({ ...all, [name]: undefined }));
  }

  function onFocusField(name: FieldName) {
    if (touched.current.has(name)) return;
    touched.current.add(name);
    track("field", name);
    reachStep("details");
  }

  async function move(uid: string, start: string) {
    setPending(true);
    setFormError(null);
    track("reschedule_submit", start);
    try {
      const res = await fetch(`/api/booking/${encodeURIComponent(uid)}/reschedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ start }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        uid?: string;
      };
      if (res.ok) {
        flushNow();
        // A moved booking can have a new uid; show that one.
        router.push(`/BryanKleppe/confirmed?b=${encodeURIComponent(body.uid ?? uid)}&moved=1`);
        return;
      }
      setPending(false);
      track("booking_error", body.code ?? String(res.status));
      if (res.status === 409) {
        setNotice(copy.slotTaken);
        setSlot(null);
        forgetMonth();
        return;
      }
      setFormError(body.error ?? "That didn't go through. Try again in a moment.");
    } catch {
      setPending(false);
      setFormError("Couldn't reach us. Check your connection and try again.");
    }
  }

  function forgetMonth() {
    if (!zone || !month) return;
    setMonths((all) => {
      const rest = { ...all };
      delete rest[`${zone}|${month}`];
      return rest;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slot || !zone || pending) return;
    if (reschedule) {
      await move(reschedule.uid, slot);
      return;
    }

    const found: Partial<Record<FieldName, string>> = {};
    if (!fields.name.trim()) found.name = "Tell us your name.";
    if (!EMAIL.test(fields.email.trim())) found.email = "Enter a valid work email.";
    if (!fields.agency.trim()) found.agency = "Which agency are you with?";
    if (!fields.clients) found.clients = "Pick the closest range.";
    if (Object.keys(found).length) {
      setErrors(found);
      track("form_invalid", Object.keys(found).join(","));
      const first = Object.keys(found)[0];
      document.getElementById(`${idp}-${first}`)?.focus();
      return;
    }

    reachStep("submitted");
    track("submit");
    // Send the steps so far before the booking exists, so they land first.
    flushNow();
    setPending(true);
    setFormError(null);

    const honeypot = new FormData(event.currentTarget).get("website");
    let res: Response;
    let body: {
      ok?: boolean;
      uid?: string | null;
      error?: string;
      code?: string;
      errors?: Partial<Record<FieldName | "start", string>>;
    } = {};
    try {
      res = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...fields,
          start: slot,
          timeZone: zone,
          website: honeypot,
          context: trackingContext(),
        }),
      });
      body = await res.json().catch(() => ({}));
    } catch {
      setPending(false);
      setFormError("Couldn't reach us. Check your connection and try again.");
      track("booking_error", "network");
      return;
    }

    if (res.ok && body.ok) {
      flushNow();
      // GA4's lead event (mark it as a key event there) and a Clarity tag
      // that keeps this recording in full.
      thirdPartyEvent("generate_lead", { method: "get_started_calendar" }, { upgrade: "booked" });
      thirdPartyEvent("funnel_booked");
      router.push(
        body.uid
          ? `/BryanKleppe/confirmed?b=${encodeURIComponent(body.uid)}`
          : "/BryanKleppe/confirmed",
      );
      return; // Stay pending while the confirmation loads.
    }

    setPending(false);
    track("booking_error", body.code ?? String(res.status));

    if (res.status === 409 || body.errors?.start) {
      setNotice(copy.slotTaken);
      setSlot(null);
      if (zone && month) {
        setMonths((all) => {
          const rest = { ...all };
          delete rest[`${zone}|${month}`];
          return rest;
        });
      }
      return;
    }
    if (body.errors) {
      const fieldErrors: Partial<Record<FieldName, string>> = {};
      for (const name of ["name", "email", "agency", "clients"] as const) {
        if (body.errors[name]) fieldErrors[name] = body.errors[name];
      }
      setErrors(fieldErrors);
    }
    setFormError(body.error ?? "The booking didn't go through. Try again in a moment.");
  }

  /* ------------------------------------------------------------- render */

  const zoneOptions = zone && !US_ZONES.includes(zone) ? [zone, ...US_ZONES] : US_ZONES;
  // Flagged on the page for as long as the placeholder scheduler is in use.
  const placeholderNote = data?.status === "ready" && data.provider === "placeholder";

  return (
    <div
      ref={root}
      id={section}
      data-section={section}
      data-track-ignore
      className="card-shape-lg relative overflow-hidden border border-white/10 bg-white text-ink shadow-[0_40px_90px_-40px_rgba(2,8,18,0.85),0_0_0_1px_rgba(255,255,255,0.04)]"
    >
      {/* Header ------------------------------------------------------------ */}
      <div className="flex items-center gap-3.5 border-b border-line px-5 py-4 sm:px-6">
        <Avatar name={hostName} photo={hostPhoto} size={44} />
        <div className="min-w-0">
          <h2 className="t-h4">{reschedule ? copy.rescheduleTitle : copy.title}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-slate-600">
            {copy.meta.map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                {i === 1 ? <VideoCamera aria-hidden className="size-3.5 text-blue-700" /> : null}
                {item}
                {i < copy.meta.length - 1 ? (
                  <span aria-hidden className="text-slate-300">
                    ·
                  </span>
                ) : null}
              </span>
            ))}
          </p>
        </div>
      </div>

      {data?.status === "offline" ? (
        <Offline copy={copy} />
      ) : phase === "pick" ? (
        <div key="pick" className="bk-enter">
          {notice ? (
            <p
              role="status"
              className="mx-5 mt-4 flex items-start gap-2 rounded-xl bg-blue-100 px-3.5 py-2.5 text-[0.8125rem] text-blue-700 sm:mx-6"
            >
              <Warning aria-hidden className="mt-0.5 size-4 shrink-0" />
              {notice}
            </p>
          ) : null}

          <div className="grid gap-6 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_10.5rem] sm:px-6">
            {/* Month ------------------------------------------------------ */}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[0.9375rem] font-bold" aria-live="polite">
                  {month ? monthTitle(month) : " "}
                </p>
                <div className="flex gap-1">
                  <MonthButton
                    label="Previous month"
                    disabled={!month || !today || month <= monthOf(today)}
                    onClick={() => month && goMonth(prevMonth(month))}
                  >
                    <CaretLeft className="size-4" />
                  </MonthButton>
                  <MonthButton
                    label="Next month"
                    disabled={!month || !today || month >= monthOf(addDays(today, 60))}
                    onClick={() => month && goMonth(nextMonth(month))}
                  >
                    <CaretRight className="size-4" />
                  </MonthButton>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-7 text-center">
                {WEEKDAYS.map((d, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className="pb-2 text-[0.6875rem] font-semibold tracking-wider text-slate-400"
                  >
                    {d}
                  </span>
                ))}
                {month
                  ? monthGrid(month).map((cell, i) =>
                      cell ? (
                        <DayCell
                          key={cell}
                          date={cell}
                          today={cell === today}
                          selected={cell === day}
                          count={days[cell]?.length ?? 0}
                          loading={!data}
                          onSelect={() => chooseDay(cell)}
                        />
                      ) : (
                        <span key={`pad-${i}`} />
                      ),
                    )
                  : null}
              </div>

              {data?.status === "ready" && !firstAvailable ? (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-paper px-3.5 py-2.5 text-[0.8125rem] text-slate-600">
                  {copy.noTimes}
                  {month ? (
                    <button
                      type="button"
                      onClick={() => goMonth(nextMonth(month))}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      {copy.nextMonth} &rarr;
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Times ------------------------------------------------------ */}
            <div className="sm:border-l sm:border-line sm:pl-6">
              <p className="text-[0.9375rem] font-bold">
                {day && zone ? shortDay(day) : " "}
              </p>
              {data?.status === "error" ? (
                <div className="mt-3 text-[0.8125rem] text-slate-600">
                  {copy.loadError}{" "}
                  <button
                    type="button"
                    className="font-semibold text-blue-700 hover:underline"
                    onClick={() => {
                      if (!zone || !month) return;
                      setMonths((all) => {
                        const rest = { ...all };
                        delete rest[`${zone}|${month}`];
                        return rest;
                      });
                    }}
                  >
                    {copy.retry}
                  </button>
                </div>
              ) : (
                <ul
                  className={cx(
                    "bk-times mt-3 grid grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-1",
                    // In the overlay: as long as it needs on a phone, where the
                    // overlay scrolls; as in the column on anything wider, where
                    // the overlay draws the whole calendar bigger.
                    tall ? "sm:max-h-[18.5rem]" : "max-h-[18.5rem]",
                  )}
                >
                  {!data
                    ? Array.from({ length: 6 }, (_, i) => (
                        <li key={i} className="bk-shimmer h-10 rounded-full" />
                      ))
                    : times.map((iso, i) => (
                        <li key={iso}>
                          <button
                            type="button"
                            data-slot={iso}
                            ref={i === 0 ? slotButton : undefined}
                            onClick={() => chooseTime(iso, i)}
                            aria-label={`${formatLongDate(iso, zone!)} at ${formatTime(iso, zone!)}`}
                            className="w-full rounded-full border border-blue-500/35 py-2 text-[0.875rem] font-semibold text-blue-700 tabular transition-[background-color,border-color,color,transform] duration-150 hover:-translate-y-px hover:border-blue-500 hover:bg-blue-500 hover:text-white focus-visible:bg-blue-500 focus-visible:text-white"
                          >
                            {formatTime(iso, zone!)}
                          </button>
                        </li>
                      ))}
                </ul>
              )}
            </div>
          </div>

          {/* Zone ------------------------------------------------------- */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line px-5 py-3.5 text-[0.8125rem] text-slate-600 sm:px-6">
            <Globe aria-hidden className="size-4 text-slate-400" />
            <label htmlFor={`${idp}-zone`}>{copy.zoneLabel}</label>
            <span className="relative">
              <select
                id={`${idp}-zone`}
                value={zone ?? ""}
                onChange={(e) => chooseZone(e.target.value)}
                className="cursor-pointer appearance-none rounded-full bg-paper py-1 pr-7 pl-3 font-semibold text-ink outline-none hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {zone
                  ? zoneOptions.map((z) => (
                      <option key={z} value={z}>
                        {zoneLongName(z)} ({zoneAbbreviation(new Date(), z)})
                      </option>
                    ))
                  : null}
              </select>
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[0.625rem] text-slate-400"
              >
                ▾
              </span>
            </span>
            {placeholderNote ? (
              <span className="basis-full text-[0.75rem] text-amber-500">
                {copy.placeholderNotice}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        /* Details ---------------------------------------------------------- */
        <form
          key="details"
          id={formId}
          onSubmit={submit}
          noValidate
          // Session recordings never show what's typed here.
          data-clarity-mask="true"
          className="bk-enter px-5 py-5 sm:px-6"
        >
          <div className="flex items-start gap-3 rounded-2xl bg-paper p-3.5">
            <button
              type="button"
              onClick={changeTime}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[0.8125rem] font-semibold text-blue-700 shadow-[0_1px_2px_rgba(10,24,38,0.08)] transition-colors hover:bg-blue-100"
            >
              <ArrowLeft aria-hidden className="size-3.5" />
              {copy.form.change}
            </button>
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-bold">{formatLongDate(slot!, zone!)}</p>
              <p className="mt-0.5 text-[0.8125rem] text-slate-600 tabular">
                {formatTime(slot!, zone!)} –{" "}
                {formatTime(new Date(new Date(slot!).getTime() + MEETING_MINUTES * 60_000), zone!)}{" "}
                {zoneAbbreviation(slot!, zone!)}
              </p>
            </div>
          </div>

          {reschedule ? null : (
          <>
          <h3 className="sr-only">{copy.form.title}</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              ref={nameInput}
              idp={idp}
              name="name"
              label={copy.form.name}
              autoComplete="name"
              value={fields.name}
              error={errors.name}
              onChange={onField}
              onFocus={onFocusField}
            />
            <Field
              idp={idp}
              name="email"
              type="email"
              label={copy.form.email}
              autoComplete="email"
              value={fields.email}
              error={errors.email}
              onChange={onField}
              onFocus={onFocusField}
            />
            <Field
              idp={idp}
              name="agency"
              label={copy.form.agency}
              autoComplete="organization"
              value={fields.agency}
              error={errors.agency}
              onChange={onField}
              onFocus={onFocusField}
            />
            <div>
              <label htmlFor={`${idp}-clients`} className="text-[0.8125rem] font-semibold">
                {copy.form.clients}
              </label>
              <span className="relative mt-1.5 block">
                <select
                  id={`${idp}-clients`}
                  name="clients"
                  value={fields.clients}
                  onChange={(e) => onField("clients", e.target.value)}
                  onFocus={() => onFocusField("clients")}
                  aria-invalid={errors.clients ? true : undefined}
                  aria-describedby={errors.clients ? `${idp}-clients-error` : undefined}
                  className={cx(
                    "w-full cursor-pointer appearance-none rounded-xl border bg-white px-3.5 py-2.5 text-[0.9375rem] outline-none transition-colors focus:border-blue-500",
                    errors.clients ? "border-red-600" : "border-line",
                    !fields.clients && "text-slate-400",
                  )}
                >
                  <option value="" disabled>
                    {copy.form.clientsPlaceholder}
                  </option>
                  {copy.form.clientBands.map((band) => (
                    <option key={band} value={band} className="text-ink">
                      {band}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[0.625rem] text-slate-400"
                >
                  ▾
                </span>
              </span>
              {errors.clients ? (
                <p id={`${idp}-clients-error`} className="t-caption mt-1 text-red-600">
                  {errors.clients}
                </p>
              ) : null}
            </div>
          </div>

          {/* Honeypot. Hidden from people, irresistible to naive bots. */}
          <div aria-hidden className="absolute -left-[9999px]">
            <label htmlFor={`${idp}-website`}>Website</label>
            <input id={`${idp}-website`} name="website" tabIndex={-1} autoComplete="off" />
          </div>
          </>
          )}

          {formError ? (
            <p role="alert" className="mt-4 text-[0.875rem] text-red-600">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="sheen group mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-green-500 px-6 py-3.5 text-base font-semibold text-ink-950 shadow-[0_10px_28px_-12px_rgba(56,176,0,0.75)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-green-400 disabled:cursor-wait disabled:opacity-70"
          >
            <span className="relative z-[2]">
              {pending
                ? copy.form.pending
                : reschedule
                  ? copy.form.submitMove
                  : copy.form.submit}
            </span>
            {pending ? (
              <span
                aria-hidden
                className="relative z-[2] size-4 animate-spin rounded-full border-2 border-ink-950/25 border-t-ink-950"
              />
            ) : (
              <span
                aria-hidden
                className="relative z-[2] transition-transform duration-200 group-hover:translate-x-1"
              >
                &rarr;
              </span>
            )}
          </button>
          {reschedule ? null : (
            <p className="t-caption mt-3 text-center text-slate-400">{copy.form.fine}</p>
          )}
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

/** One month of open times in a zone, as the widget caches it. */
async function fetchMonth(
  month: string,
  zone: string,
): Promise<{ status: MonthData["status"]; data: MonthData; empty?: boolean }> {
  const now = dateKey(Date.now(), zone);
  const from = firstOf(month) < now ? now : firstOf(month);
  const to = lastOf(month);
  if (to < now) {
    return { status: "ready", data: { status: "ready", days: {}, provider: "none" } };
  }
  try {
    const res = await fetch(
      `/api/booking/slots?from=${from}&to=${to}&tz=${encodeURIComponent(zone)}`,
      { cache: "no-store" },
    );
    if (res.status === 503) {
      track("booking_offline");
      return { status: "offline", data: { status: "offline" } };
    }
    if (!res.ok) {
      track("booking_error", `slots_${res.status}`);
      return { status: "error", data: { status: "error" } };
    }
    const body = (await res.json()) as { days: SlotsByDay; provider: string };
    const count = Object.values(body.days).reduce((n, list) => n + list.length, 0);
    track("slots", month, { days: Object.keys(body.days).length, times: count });
    return {
      status: "ready",
      data: { status: "ready", days: body.days, provider: body.provider },
      empty: count === 0,
    };
  } catch {
    track("booking_error", "slots_network");
    return { status: "error", data: { status: "error" } };
  }
}

/** "Wed, Oct 14" for a "YYYY-MM-DD" key. */
function shortDay(key: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${key}T12:00:00Z`));
}

/** The month as cells, Sunday first, padded with nulls before the 1st. */
function monthGrid(month: string) {
  const first = firstOf(month);
  const cells: (string | null)[] = Array.from({ length: weekday(first) }, () => null);
  for (let d = first; d <= lastOf(month); d = addDays(d, 1)) cells.push(d);
  return cells;
}

function MonthButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-full text-slate-600 transition-colors hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function DayCell({
  date,
  today,
  selected,
  count,
  loading,
  onSelect,
}: {
  date: string;
  today: boolean;
  selected: boolean;
  count: number;
  loading: boolean;
  onSelect: () => void;
}) {
  const open = count > 0;
  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

  return (
    <span className="grid place-items-center py-0.5">
      <button
        type="button"
        disabled={!open}
        aria-pressed={open ? selected : undefined}
        aria-label={open ? `${label}, ${count} times open` : `${label}, no times`}
        onClick={onSelect}
        className={cx(
          "relative grid size-9 place-items-center rounded-full text-[0.875rem] tabular transition-[background-color,color,transform] duration-150 sm:size-10",
          selected
            ? "bg-ink-900 font-bold text-white"
            : open
              ? "bg-blue-100 font-bold text-blue-700 hover:-translate-y-px hover:bg-blue-500 hover:text-white"
              : "text-slate-300",
          loading && "bk-shimmer text-transparent",
        )}
      >
        {Number(date.slice(8))}
        {today ? (
          <span
            aria-hidden
            className={cx(
              "absolute bottom-1 size-1 rounded-full",
              selected ? "bg-white" : "bg-blue-500",
            )}
          />
        ) : null}
      </button>
    </span>
  );
}

function Field({
  ref,
  idp,
  name,
  label,
  type = "text",
  autoComplete,
  value,
  error,
  onChange,
  onFocus,
}: {
  ref?: React.Ref<HTMLInputElement>;
  /** The widget's id prefix. */
  idp: string;
  name: FieldName;
  label: string;
  type?: string;
  autoComplete: string;
  value: string;
  error?: string;
  onChange: (name: FieldName, value: string) => void;
  onFocus: (name: FieldName) => void;
}) {
  return (
    <div>
      <label htmlFor={`${idp}-${name}`} className="text-[0.8125rem] font-semibold">
        {label}
      </label>
      <input
        ref={ref}
        id={`${idp}-${name}`}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onFocus={() => onFocus(name)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${idp}-${name}-error` : undefined}
        className={cx(
          "mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-[0.9375rem] outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500",
          error ? "border-red-600" : "border-line",
        )}
      />
      {error ? (
        <p id={`${idp}-${name}-error`} className="t-caption mt-1 text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Offline({ copy }: { copy: Copy }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="t-h4">{copy.offline.title}</p>
      <p className="measure mx-auto mt-2 text-[0.9375rem] text-slate-600">{copy.offline.body}</p>
      <a
        href={copy.offline.cta.href}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-[0.9375rem] font-semibold text-ink-950 hover:bg-green-400"
      >
        {copy.offline.cta.label} &rarr;
      </a>
    </div>
  );
}
