import { Router } from 'express';
import { sendTestEmail } from '../controllers/emailController';

const router = Router();

router.post('/test', sendTestEmail);

export default router;