// backend/src/repositories/EventRepository.ts
import { BaseRepository } from './BaseRepository';
import { Event, EventInput } from '../models/Event';
import { query } from '../config/database';

export class EventRepository extends BaseRepository {
  constructor() {
    super('events');
  }

  async findByOrganizer(organizerId: string): Promise<Event[]> {
    const result = await query(
      'SELECT * FROM events WHERE organizer_id = $1 ORDER BY created_at DESC',
      [organizerId]
    );
    return result.rows;
  }

  async create(eventData: EventInput & { organizer_id: string }): Promise<Event> {
    const { organizer_id, title, description, date, location, max_attendees, cover_image } = eventData;
    
    const result = await query(
      `INSERT INTO events (organizer_id, title, description, date, location, max_attendees, cover_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [organizer_id, title, description, date, location || null, max_attendees, cover_image || null]
    );
    
    return result.rows[0];
  }

  async update(id: string, organizerId: string, eventData: Partial<EventInput>): Promise<Event> {
    const allowedFields = ['title', 'description', 'date', 'location', 'max_attendees', 'cover_image', 'is_active'];
    
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    allowedFields.forEach(field => {
      const value = eventData[field as keyof EventInput];
      if (value !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Agregar ID y organizer_id para la condición WHERE
    values.push(id, organizerId);

    const result = await query(
      `UPDATE events SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramCount} AND organizer_id = $${paramCount + 1} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Event not found or access denied');
    }

    return result.rows[0];
  }

  async delete(id: string, organizerId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM events WHERE id = $1 AND organizer_id = $2 RETURNING id',
      [id, organizerId]
    );
    return result.rows.length > 0;
  }

  async findByIdAndOrganizer(id: string, organizerId: string): Promise<Event | null> {
    const result = await query(
      'SELECT * FROM events WHERE id = $1 AND organizer_id = $2',
      [id, organizerId]
    );
    return result.rows[0] || null;
  }

  async getAttendeeCount(eventId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM attendees WHERE event_id = $1',
      [eventId]
    );
    return parseInt(result.rows[0].count);
  }
}