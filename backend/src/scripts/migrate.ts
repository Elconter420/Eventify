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

    // Leer archivo SQL
    const sqlPath = path.resolve(__dirname, '../../../docs/database/schema.sql');
    if (fs.existsSync(sqlPath)) {
      console.log('Ejecutando schema.sql...\n');
      const sqlScript = fs.readFileSync(sqlPath, 'utf-8');
      if (sqlScript.trim()) {
        // Ejecutar el script SQL
        await client.query(sqlScript);
      }
    } else {
      console.log('No se encontró docs/database/schema.sql, se continuará con migraciones locales.\n');
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        additional_fields JSONB,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        confirmation_token VARCHAR(255) UNIQUE,
        confirmed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, email)
      );

      CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
      CREATE INDEX IF NOT EXISTS idx_attendees_email ON attendees(email);
      CREATE INDEX IF NOT EXISTS idx_attendees_confirmation_token ON attendees(confirmation_token);
    `);

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
