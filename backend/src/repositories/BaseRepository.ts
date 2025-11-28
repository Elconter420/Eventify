// backend/src/repositories/BaseRepository.ts
import { query } from '../config/database';

export abstract class BaseRepository {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async findById(id: string): Promise<any> {
    const result = await query(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async findAll(): Promise<any[]> {
    const result = await query(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return result.rows;
  }

  async exists(id: string): Promise<boolean> {
    const result = await query(`SELECT 1 FROM ${this.tableName} WHERE id = $1`, [id]);
    return result.rows.length > 0;
  }
}