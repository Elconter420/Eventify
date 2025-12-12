import express from 'express';
import { pool } from './config/database';
import { AttendeeService } from './services/attendeeService';
import { publicRouter } from './routes/publicRoutes';

const app = express();
const attendeeService = new AttendeeService();

app.use(express.json());

// Rutas públicas
app.use('/api/public', publicRouter);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

export { app, attendeeService };