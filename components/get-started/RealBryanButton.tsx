"use client";

import { CalendarCheck } from "@phosphor-icons/react";
import { CallCardButton } from "./CallCardActions";
import { useFlows } from "./FlowProvider";

/**
 * "Book an appointment with the real deal", the way from Bryan's AI to him
 * before a call, beside "Talk to Bryan's AI": it opens the booking calendar,
 * and Bryan's line for it replaces the calendar's usual one. The same blue
 * button as "Talk to the real Bryan" in a live call (CallCardButton; the
 * live call's pair is CallCardActions), worded as a booking and still, since
 * nothing is happening yet. Not shown while the calendar is open.
 */
export function RealBryanButton({ disabled = false }: { placement: "book"; disabled?: boolean }) {
  const flows = useFlows();
  if (!flows || flows.flow === "calendar") return null;
  const { book, line } = flows.copy.realBryan;
  return (
    <CallCardButton
      tone="blue"
      icon={CalendarCheck}
      label={book}
      onClick={() => flows.open("calendar", "book", line)}
      still
      wrap
      disabled={disabled}
    />
  );
}
