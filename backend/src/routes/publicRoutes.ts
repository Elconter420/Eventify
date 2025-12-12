import { Router } from 'express';
import { attendeeController } from '../controllers/attendeeController';

export const publicRouter = Router();

publicRouter.post('/attendees/register/:eventId', (req, res) =>
  attendeeController.registerAttendee(req, res)
);

publicRouter.get('/attendees/confirm/:token', (req, res) =>
  attendeeController.confirmRegistration(req, res)
);
