import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const getEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return v;
};

async function runMigration() {
  console.log('Iniciando migración de base de datos...\n');

  const databaseUrl = getEnv('DATABASE_URL');

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    // Conectar
    await client.connect();
    console.log('Conectado a la base de datos\n');

    console.log('Asegurando extensión pgcrypto...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // Leer archivo SQL (solo si faltan tablas base). El schema.sql no es idempotente.
    const baseTables = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('organizers', 'events')`
    );
    const baseTableNames = new Set(baseTables.rows.map((r: any) => String(r.table_name)));
    const hasBaseSchema = baseTableNames.has('organizers') && baseTableNames.has('events');

    const sqlPath = path.resolve(__dirname, '../../../docs/database/schema.sql');
    if (!hasBaseSchema && fs.existsSync(sqlPath)) {
      console.log('Ejecutando schema.sql...\n');
      const sqlScript = fs.readFileSync(sqlPath, 'utf-8');
      if (sqlScript.trim()) {
        await client.query(sqlScript);
      }
    } else if (hasBaseSchema) {
      console.log('Schema base ya existe; saltando schema.sql para evitar duplicados.\n');
    } else {
      console.log('No se encontró docs/database/schema.sql, se continuará con migraciones locales.\n');
    }

    // Asegurar tabla de attendees (esquema mínimo para el proyecto actual)
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'registered',
        CONSTRAINT unique_email_per_event UNIQUE (event_id, email)
      );

      CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
      CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);
      CREATE INDEX IF NOT EXISTS idx_attendees_created_at ON attendees(created_at);
    `);

    // Si la tabla ya existía (por schema.sql), asegurar la columna status para filtrar por estado del asistente.
    await client.query(`ALTER TABLE attendees ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'registered';`);
    await client.query(`UPDATE attendees SET status = 'registered' WHERE status IS NULL;`);

    console.log('Migración completada exitosamente!\n');
    console.log('\nBase de datos lista para usar!');

  } catch (error) {
    console.error('Error durante la migración:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Ejecutar migración
runMigration();
