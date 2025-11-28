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