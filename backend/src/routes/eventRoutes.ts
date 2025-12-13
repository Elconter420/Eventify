// backend/src/routes/eventRoutes.ts
import { Router } from 'express';
import { 
  createEvent, 
  getEvents, 
  getEventById, 
  updateEvent, 
  deleteEvent,
  getEventAttendees
} from '../controllers/eventController';
import { sendEventCommunication } from '../controllers/communicationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD Routes
router.post('/', createEvent);
router.get('/', getEvents);
router.get('/:id', getEventById);
router.get('/:id/attendees', getEventAttendees);
router.post('/:id/communications', sendEventCommunication);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;