import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { Attendee, AttendeeInput } from '../models/Attende';

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
        `SELECT COUNT(*) as count
         FROM attendees
         WHERE event_id = $1
           AND COALESCE(status, 'registered') <> 'cancelled'`,
        [eventId]
      );
      const currentAttendees = parseInt(countRes.rows[0].count, 10);

      if (currentAttendees >= maxAttendees) {
        throw new Error('No available spots for this event');
      }

      const existing = await client.query(
        `SELECT id FROM attendees WHERE event_id = $1 AND email = $2`,
        [eventId, data.email]
      );
      if (existing.rows.length > 0) {
        throw new Error('Email already registered for this event');
      }

      const id = uuidv4();
      const now = new Date();

      const insertRes = await client.query(
        `INSERT INTO attendees (id, event_id, email, full_name, created_at, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, event_id, email, full_name, created_at, status`,
        [id, eventId, data.email, data.full_name, now, 'registered']
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

  async cancelAttendee(eventId: string, attendeeId: string): Promise<Attendee> {
    const result = await pool.query(
      `UPDATE attendees
       SET status = 'cancelled'
       WHERE event_id = $1 AND id = $2
       RETURNING id, event_id, email, full_name, created_at, status`,
      [eventId, attendeeId]
    );

    if (result.rows.length === 0) {
      throw new Error('Attendee not found');
    }

    return result.rows[0] as Attendee;
  }

  async confirmAttendee(_token: string): Promise<Attendee> {
    throw new Error('Confirmation not supported by current database schema');
  }
}

export const attendeeService = new AttendeeService();
