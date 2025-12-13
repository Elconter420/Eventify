import { Request, Response } from 'express';
import { attendeeService } from '../services/attendeeService';
import emailService from '../services/emailService';
import { EventRepository } from '../repositories/EventRepository';
import { registerAttendeeSchema, eventIdParamSchema, attendeeCancelParamSchema } from '../schemas/eventSchema';

const eventRepo = new EventRepository();

export class AttendeeController {
  async registerAttendee(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = eventIdParamSchema.parse(req.params);
      const attendeeData = registerAttendeeSchema.parse(req.body);

      const phone = attendeeData.phone?.trim();
      const attendee = await attendeeService.registerAttendee(eventId, {
        email: attendeeData.email,
        full_name: attendeeData.full_name,
        ...(phone ? { phone } : {}),
        ...(attendeeData.additional_fields ? { additional_fields: attendeeData.additional_fields } : {}),
      });

      // Email de validación (no bloquea el registro si falla)
      try {
        const event = await eventRepo.findById(eventId);
        const eventDateISO = event?.date ? String(event.date) : undefined;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const cancelUrl = `${frontendUrl}/event/${eventId}/cancel/${attendee.id}`;

        await emailService.sendRegistrationSuccessEmail({
          to: attendee.email,
          attendeeName: attendee.full_name,
          eventTitle: event?.title || 'Evento',
          ...(eventDateISO ? { eventDateISO } : {}),
          eventLocation: (event as any)?.location || null,
          cancelUrl,
          smtpOnly: true,
        });
      } catch (emailError) {
        console.error('Error sending registration email:', emailError);
      }

      res.status(201).json({
        success: true,
        message: 'Registro exitoso.',
        data: {
          id: attendee.id,
          email: attendee.email,
        },
      });
    } catch (error: any) {
      const message = error.message || 'Registration failed';
      const statusCode = message.includes('available spots') ? 409 :
                         message.includes('already registered') ? 409 :
                         message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  async cancelRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { eventId, attendeeId } = attendeeCancelParamSchema.parse(req.params);

      const updated = await attendeeService.cancelAttendee(eventId, attendeeId);

      res.status(200).json({
        success: true,
        message: 'Registro cancelado correctamente.',
        data: {
          id: updated.id,
          event_id: updated.event_id,
          status: updated.status || 'cancelled',
        },
      });
    } catch (error: any) {
      const message = error.message || 'Cancellation failed';
      const statusCode = message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  async confirmRegistration(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token;
      if (!token) {
        res.status(400).json({ success: false, message: 'Missing confirmation token' });
        return;
      }

      res.status(410).json({
        success: false,
        message: 'Confirmación no disponible con el esquema actual de la base de datos.',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Confirmation failed',
      });
    }
  }
}

export const attendeeController = new AttendeeController();
