// backend/src/config/database.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del pool de conexiones
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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