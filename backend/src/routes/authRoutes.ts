// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Ruta protegida
router.get('/profile', authenticateToken, getProfile);
router.patch('/profile', authenticateToken, updateProfile);

export default router;