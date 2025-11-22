// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Importar rutas
import emailRoutes from './routes/emailRoutes';

// Cargar variables de entorno
dotenv.config();

// Crear instancia de Express
const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Registrar rutas
app.use('/api/email', emailRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Eventify API is running',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

export default app;