import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().datetime('Date must be a valid ISO 8601 date string'),
  location: z.string().max(255).optional().nullable(),
  max_attendees: z.number().int().positive('Max attendees must be a positive integer').max(10000, 'Max attendees cannot exceed 10000'),
  cover_image: z.string().url('Cover image must be a valid URL').optional().nullable(),
});

export const updateEventSchema = createEventSchema.partial();

export const eventParamsSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});

export const registerAttendeeSchema = z.object({
  email: z.string().email('Email must be valid'),
  full_name: z.string().min(2, 'Full name is required').max(100),
  phone: z.string().max(20).optional().nullable(),
  additional_fields: z.record(z.any()).optional(),
});

export const eventIdParamSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
});

export type RegisterAttendeeInput = {
  email: string;
  full_name: string;
  phone?: string | null;
  additional_fields?: Record<string, any>;
};