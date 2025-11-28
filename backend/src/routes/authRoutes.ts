// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Ruta protegida
router.get('/profile', authenticateToken, getProfile);

export default router;