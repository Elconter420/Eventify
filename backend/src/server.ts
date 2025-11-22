import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno ANTES de cualquier otra importación
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 🔍 DIAGNÓSTICO RÁPIDO
console.log('🔧 Quick env check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

// Ahora importar express y demás
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import emailRoutes from './routes/emailRoutes';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Registrar rutas
app.use('/api/email', emailRoutes);
console.log('✅ Email routes registered');

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Eventify API is running',
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    timestamp: new Date().toISOString()
  });
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development (default)'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📧 Email endpoint: http://localhost:${PORT}/api/email/test (POST)`);
});