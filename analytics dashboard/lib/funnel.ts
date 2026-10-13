/**
 * The funnel steps, as the website's tracker records them in
 * `visits.furthest_step`. This mirrors FUNNEL in the website's
 * `lib/analytics/schema.ts` — when this app moves to its own repo, that file
 * and this one are the contract between them.
 */
export const FUNNEL = [
  { step: 0, key: "landed", label: "Landed", hint: "Opened the page" },
  { step: 1, key: "engaged", label: "Engaged", hint: "Stayed 10 seconds, scrolled, or clicked" },
  { step: 2, key: "calendar", label: "Saw the calendar", hint: "Engaged with the calendar on screen" },
  { step: 3, key: "time", label: "Picked a time", hint: "Chose a slot" },
  { step: 4, key: "details", label: "Started details", hint: "Began typing name, email or agency" },
  { step: 5, key: "submitted", label: "Hit confirm", hint: "Submitted the form" },
  { step: 6, key: "booked", label: "Booked", hint: "Meeting on the calendar" },
] as const;

/** Human names for the page's `data-section` blocks. */
export const SECTIONS: Record<string, string> = {
  intro: "Headline",
  host: "Who you'll meet",
  outcomes: "What you'll get",
  calendar: "Calendar",
  proof: "Testimonial & stats",
  agenda: "How the 10 minutes go",
  confirmed: "Confirmation",
  note: "Bryan's note",
};
