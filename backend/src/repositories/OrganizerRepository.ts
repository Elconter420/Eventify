// backend/src/repositories/OrganizerRepository.ts
import { BaseRepository } from './BaseRepository';
import { Organizer, OrganizerInput } from '../models/Organizer';
import { query } from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';

export class OrganizerRepository extends BaseRepository {
  constructor() {
    super('organizers');
  }

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const password_hash = await hashPassword(newPassword);
    const result = await query(
      `UPDATE organizers
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [password_hash, id]
    );

    return (result.rowCount ?? 0) > 0;
  }

  async updateProfileName(id: string, full_name: string): Promise<Pick<Organizer, 'id' | 'email' | 'full_name' | 'created_at' | 'updated_at'> | null> {
    const result = await query(
      `UPDATE organizers
       SET full_name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, full_name, created_at, updated_at`,
      [full_name, id]
    );

    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<Organizer | null> {
    const result = await query(
      'SELECT * FROM organizers WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async create(organizerData: OrganizerInput): Promise<Organizer> {
    const { email, password, full_name } = organizerData;
    
    // Hash the password
    const password_hash = await hashPassword(password);

    const result = await query(
      `INSERT INTO organizers (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, created_at, updated_at`,
      [email, password_hash, full_name]
    );
    
    return result.rows[0];
  }

  async verifyCredentials(email: string, password: string): Promise<Organizer | null> {
    const organizer = await this.findByEmail(email);
    
    if (!organizer) {
      return null;
    }

    const isValidPassword = await comparePassword(password, organizer.password_hash);
    
    if (!isValidPassword) {
      return null;
    }

    // No retornar el password_hash por seguridad
    const { password_hash: _, ...organizerWithoutPassword } = organizer;
    return organizerWithoutPassword as Organizer;
  }
}