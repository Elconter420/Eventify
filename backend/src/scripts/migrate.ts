import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Client } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runMigration() {
  console.log('Iniciando migración de base de datos...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Conectar
    await client.connect();
    console.log('Conectado a la base de datos\n');

    // Leer archivo SQL
    const sqlPath = path.resolve(__dirname, '../../../docs/database/schema.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Ejecutando schema.sql...\n');

    // Ejecutar el script SQL
    await client.query(sqlScript);

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
