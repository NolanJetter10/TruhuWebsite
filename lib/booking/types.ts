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
  /** Whether the scheduler emailed both sides a calendar invite. */
  invites: boolean;
};

export type BookingRequest = {
  start: string;
  name: string;
  email: string;
  agency: string;
  clients: string;
  timeZone: string;
  /**
   * The visit and campaign behind the booking (visit_id, visitor_id, source,
   * medium, campaign). Stored with the booking, and shown on it in Cal.com.
   */
  metadata: Record<string, string>;
};

export class BookingError extends Error {
  constructor(
    message: string,
    /** `slot_taken` tells the widget to reload times rather than just complain. */
    readonly code: "slot_taken" | "invalid" | "unavailable" | "not_found",
  ) {
    super(message);
  }
}

export interface BookingProvider {
  readonly name: "cal" | "placeholder";
  /**
   * True when the provider writes the booking row itself (the placeholder
   * does, atomically, as its double-booking guard). Otherwise the booking
   * route records it for the dashboard after the scheduler confirms.
   */
  readonly persists: boolean;
  getSlots(from: string, to: string, timeZone: string): Promise<SlotsByDay>;
  createBooking(request: BookingRequest): Promise<Booking>;
  getBooking(uid: string): Promise<Booking | null>;
  /** Our own reschedule and cancel; Cal.com hosts its own pages for these. */
  reschedule?(uid: string, start: string): Promise<Booking>;
  /** Resolves to the booking as it now stands (cancelled). */
  cancel?(uid: string): Promise<Booking>;
}
