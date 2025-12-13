export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  max_attendees: number;
  cover_image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_attendees?: number;
}

export interface Attendee {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  created_at: string;
  status?: 'registered' | 'cancelled' | string;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  location?: string;
  max_attendees: number;
  cover_image?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  is_active?: boolean;
}
