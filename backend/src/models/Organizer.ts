// backend/src/models/Organizer.ts
export interface Organizer {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizerInput {
  email: string;
  password: string;
  full_name: string;
}