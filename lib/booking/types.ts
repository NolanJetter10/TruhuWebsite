/** Available start times, grouped by the date they fall on in the requested zone. */
export type SlotsByDay = Record<string, string[]>;

export type Booking = {
  uid: string;
  start: string;
  end: string;
  status: "accepted" | "pending" | "cancelled" | "rejected";
  attendee: { name: string; email: string; timeZone: string };
  agency?: string;
  clients?: string;
  /** Video link, when the scheduler has generated one. */
  meetingUrl?: string;
  rescheduleUrl?: string;
  cancelUrl?: string;
};

export type BookingRequest = {
  start: string;
  name: string;
  email: string;
  agency: string;
  clients: string;
  timeZone: string;
  /** Campaign and visit ids, carried onto the booking in the scheduler too. */
  metadata: Record<string, string>;
};

export class BookingError extends Error {
  constructor(
    message: string,
    /** `slot_taken` tells the widget to reload times rather than just complain. */
    readonly code: "slot_taken" | "invalid" | "unavailable",
  ) {
    super(message);
  }
}

export interface BookingProvider {
  readonly name: "cal" | "demo";
  getSlots(from: string, to: string, timeZone: string): Promise<SlotsByDay>;
  createBooking(request: BookingRequest): Promise<Booking>;
  getBooking(uid: string): Promise<Booking | null>;
}
