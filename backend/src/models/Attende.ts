// backend/src/models/Attendee.ts
export interface Attendee {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  created_at: Date;
}

export interface AttendeeInput {
  full_name: string;
  email: string;
}