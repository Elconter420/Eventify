import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno ANTES de cualquier otra importación
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 🔍 DIAGNÓSTICO RÁPIDO
console.log('🔧 Quick env check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);


// Ahora importar express y demás
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import emailRoutes from './routes/emailRoutes';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';

import { testConnection, query } from './config/database';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered');

// Registrar rutas
app.use('/api/email', emailRoutes);
console.log('✅ Email routes registered');

app.use('/api/events', eventRoutes);
console.log('✅ Event routes registered');

// Ruta de salud
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    
    res.status(200).json({
      status: 'OK',
      message: 'Eventify API is running',
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      database: dbConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await query('SELECT version(), current_database(), current_user');
    const dbInfo = result.rows[0];
    
    res.json({
      success: true,
      message: '✅ Conexión a PostgreSQL exitosa',
      database: {
        version: dbInfo.version,
        name: dbInfo.current_database,
        user: dbInfo.current_user
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database connection error:', error);
    res.status(500).json({
      success: false,
      message: '❌ Error conectando a PostgreSQL',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 🗃️ NUEVA RUTA: VER TABLAS EXISTENTES
app.get('/api/db/tables', async (req, res) => {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.json({
      success: true,
      tables: result.rows.map(row => row.table_name),
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tablas',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  console.log('❌ Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});


// 🔧 INICIALIZACIÓN CON VERIFICACIÓN DE BD
async function startServer() {
  try {
    // Verificar conexión a BD al iniciar
    console.log('🔌 Conectando a la base de datos...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.warn('⚠️  No se pudo conectar a la base de datos');
      console.warn('💡 Asegúrate de que:');
      console.warn('   1. PostgreSQL esté corriendo');
      console.warn('   2. La base de datos "eventflow" exista');
      console.warn('   3. Las credenciales en .env sean correctas');
    } else {
      console.log('✅ Conectado a PostgreSQL exitosamente');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development (default)'}`);
      console.log(`🗃️  Database: ${dbConnected ? 'Connected ✅' : 'Disconnected ⚠️'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗃️  DB test: http://localhost:${PORT}/api/test-db`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`🎯 Event endpoints: http://localhost:${PORT}/api/events`);
      console.log(`📧 Email endpoint: http://localhost:${PORT}/api/email/test (POST)`);
      console.log(`📊 Tables: http://localhost:${PORT}/api/db/tables`);
    });

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

export default app;