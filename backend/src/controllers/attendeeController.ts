import { Request, Response } from 'express';
import { attendeeService } from '../services/attendeeService';
import { emailService } from '../services/emailService';
import { registerAttendeeSchema, eventIdParamSchema } from '../schemas/eventSchema';

export class AttendeeController {
  async registerAttendee(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = eventIdParamSchema.parse(req.params);
      const attendeeData = registerAttendeeSchema.parse(req.body);

      const attendee = await attendeeService.registerAttendee(eventId, attendeeData);

      if (attendee.confirmation_token) {
        try {
          await emailService.sendConfirmationEmail(attendee.email, attendee.confirmation_token);
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
      } else {
        console.warn('Attendee created without confirmation token:', attendee.id);
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to confirm.',
        data: {
          id: attendee.id,
          email: attendee.email,
          status: attendee.status,
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

  async confirmRegistration(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token;
      if (!token) {
        res.status(400).json({ success: false, message: 'Missing confirmation token' });
        return;
      }

      const attendee = await attendeeService.confirmAttendee(token);

      res.status(200).json({
        success: true,
        message: 'Registration confirmed successfully!',
        data: {
          id: attendee.id,
          email: attendee.email,
          status: attendee.status,
        },
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
