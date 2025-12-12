import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Attendee, AttendeeInput } from '../models/Event';

export class AttendeeService {
  async registerAttendee(eventId: string, data: AttendeeInput): Promise<Attendee> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const evRes = await client.query(
        `SELECT id, max_attendees, is_active FROM events WHERE id = $1 FOR UPDATE`,
        [eventId]
      );

      if (evRes.rows.length === 0) {
        throw new Error('Event not found or is inactive');
      }
      const eventRow = evRes.rows[0];
      if (!eventRow.is_active) {
        throw new Error('Event not found or is inactive');
      }

      const maxAttendees = parseInt(eventRow.max_attendees, 10);

      const countRes = await client.query(
        `SELECT COUNT(*) as count FROM attendees WHERE event_id = $1 AND status != 'cancelled'`,
        [eventId]
      );
      const currentAttendees = parseInt(countRes.rows[0].count, 10);

      if (currentAttendees >= maxAttendees) {
        throw new Error('No available spots for this event');
      }

      const existing = await client.query(
        `SELECT id FROM attendees WHERE event_id = $1 AND email = $2 AND status != 'cancelled'`,
        [eventId, data.email]
      );
      if (existing.rows.length > 0) {
        throw new Error('Email already registered for this event');
      }

      const id = uuidv4();
      const confirmationToken = crypto.randomBytes(32).toString('hex');
      const now = new Date();

      const insertRes = await client.query(
        `INSERT INTO attendees (id, event_id, email, full_name, phone, additional_fields, status, confirmation_token, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, event_id, email, full_name, phone, additional_fields, status, confirmation_token, created_at, updated_at`,
        [id, eventId, data.email, data.full_name, data.phone || null, JSON.stringify(data.additional_fields || {}), 'pending', confirmationToken, now, now]
      );

      await client.query('COMMIT');

      return insertRes.rows[0] as Attendee;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  async confirmAttendee(token: string): Promise<Attendee> {
    const res = await pool.query(
      `UPDATE attendees 
       SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
       WHERE confirmation_token = $1 AND status = 'pending'
       RETURNING id, event_id, email, full_name, phone, additional_fields, status, confirmed_at, created_at, updated_at`,
      [token]
    );

    if (res.rows.length === 0) {
      throw new Error('Invalid or expired confirmation token');
    }

    return res.rows[0] as Attendee;
  }

  async getAttendeeById(id: string): Promise<Attendee | null> {
    const res = await pool.query(
      `SELECT id, event_id, email, full_name, phone, additional_fields, status, confirmed_at, created_at, updated_at
       FROM attendees WHERE id = $1`,
      [id]
    );
    return (res.rows[0] as Attendee) || null;
  }
}

export const attendeeService = new AttendeeService();
