// backend/src/models/Event.ts
export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  date: Date;
  location?: string;
  max_attendees: number;
  cover_image?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EventInput {
  title: string;
  description: string;
  date: string;
  location?: string;
  max_attendees: number;
  cover_image?: string;
  is_active?: boolean;
}

export interface Attendee {
  id: string;
  event_id: string;
  email: string;
  full_name: string;
  phone?: string;
  additional_fields?: Record<string, any>;
  status: 'pending' | 'confirmed' | 'cancelled';
  confirmation_token?: string;
  confirmed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AttendeeInput {
  email: string;
  full_name: string;
  phone?: string;
  additional_fields?: Record<string, any>;
}