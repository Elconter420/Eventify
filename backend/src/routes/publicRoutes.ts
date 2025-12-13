import { Router } from 'express';
import { attendeeController } from '../controllers/attendeeController';
import { EventRepository } from '../repositories/EventRepository';
import { Request, Response } from 'express';

export const publicRouter = Router();

const eventRepo = new EventRepository();

// Obtener detalles públicos de un evento
publicRouter.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }
    
    const event = await eventRepo.findById(id);
    
    if (!event || !event.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or not available'
      });
    }

    const attendeeCount = await eventRepo.getAttendeeCount(id);

    res.json({
      event: {
        ...event,
        current_attendees: attendeeCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event details'
    });
  }
});

publicRouter.post('/attendees/register/:eventId', (req, res) =>
  attendeeController.registerAttendee(req, res)
);

// Cancelación pública (link clickeable desde email)
publicRouter.get('/attendees/cancel/:eventId/:attendeeId', (req, res) =>
  attendeeController.cancelRegistration(req, res)
);

publicRouter.get('/attendees/confirm/:token', (req, res) =>
  attendeeController.confirmRegistration(req, res)
);
