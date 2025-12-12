// backend/src/config/database.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return v;
};

// Configuración del pool de conexiones (DATABASE_URL validada)
export const pool = new Pool({
  connectionString: getEnv('DATABASE_URL'),
  // Opciones adicionales para mejor performance
  max: 20, // máximo de clientes en el pool
  idleTimeoutMillis: 30000, // cierra clientes inactivos después de 30s
  connectionTimeoutMillis: 2000, // timeout de conexión de 2s
});

// Función para probar la conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado a PostgreSQL exitosamente');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    return false;
  }
};

// Función para ejecutar queries
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};