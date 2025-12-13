import { Request, Response } from 'express';
import emailService from '../services/emailService';
import { EventRepository } from '../repositories/EventRepository';

const eventRepo = new EventRepository();

const getOrganizerId = (req: Request): string => {
  if (!req.user || !req.user.userId) {
    throw new Error('User not authenticated');
  }
  return req.user.userId;
};

const escapeHtml = (input: string) =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const sendEventCommunication = async (req: Request, res: Response) => {
  try {
    const organizerId = getOrganizerId(req);
    const { id: eventId } = req.params as { id?: string };

    if (!eventId) {
      return res.status(400).json({
        error: 'MISSING_EVENT_ID',
        message: 'Event ID is required',
      });
    }

    const { subject, message } = req.body as { subject?: string; message?: string };

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Subject is required',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Message is required',
      });
    }

    // Verificar que el evento pertenece al organizador
    const event = await eventRepo.findByIdAndOrganizer(eventId, organizerId);
    if (!event) {
      return res.status(404).json({
        error: 'EVENT_NOT_FOUND',
        message: 'Event not found or access denied',
      });
    }

    // Enviar a asistentes activos (no cancelados)
    const attendees = await eventRepo.getActiveAttendees(eventId);

    const htmlMessage = escapeHtml(message).replace(/\n/g, '<br/>');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(subject)}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #111827; margin: 0 0 12px;">${escapeHtml(event.title)}</h2>
            <p style="margin: 0 0 16px; color: #4b5563;">${htmlMessage}</p>
            <div style="text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">Enviado por Eventify</p>
            </div>
          </div>
        </body>
      </html>
    `;

    let sent = 0;
    let failed = 0;

    // Throttle simple para evitar rate limits agresivos
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (const attendee of attendees) {
      try {
        await emailService.sendEmailSmtpOnly(attendee.email, subject.trim(), html);
        sent++;
        await sleep(150);
      } catch (err) {
        failed++;
        console.error('Error sending communication email to', attendee.email, err);
      }
    }

    return res.status(200).json({
      message: 'Communication processed',
      summary: {
        totalRecipients: attendees.length,
        sent,
        failed,
      },
    });
  } catch (error) {
    console.error('❌ sendEventCommunication error:', error);

    if (error instanceof Error && error.message === 'User not authenticated') {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User authentication required',
      });
    }

    return res.status(500).json({
      error: 'COMMUNICATION_FAILED',
      message: 'Error sending communication',
    });
  }
};
