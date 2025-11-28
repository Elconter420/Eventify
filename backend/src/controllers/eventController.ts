// backend/src/controllers/eventController.ts
import { Request, Response } from 'express';
import { EventRepository } from '../repositories/EventRepository';

const eventRepo = new EventRepository();

// Helper para obtener organizerId de forma segura
const getOrganizerId = (req: Request): string => {
  if (!req.user || !req.user.userId) {
    throw new Error('User not authenticated');
  }
  return req.user.userId;
};

// Validaciones
const validateEventData = (data: any): string[] => {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }

  if (!data.date || new Date(data.date) <= new Date()) {
    errors.push('Event date must be in the future');
  }

  if (!data.max_attendees || data.max_attendees < 1 || data.max_attendees > 10000) {
    errors.push('Max attendees must be between 1 and 10,000');
  }

  return errors;
};

// Validaciones para ACTUALIZACIÓN (solo valida campos proporcionados)
const validateEventUpdate = (data: any): string[] => {
  const errors: string[] = [];

  if (data.title !== undefined) {
    if (!data.title.trim() || data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }
  }

  if (data.description !== undefined) {
    if (!data.description.trim() || data.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }
  }

  if (data.date !== undefined) {
    if (new Date(data.date) <= new Date()) {
      errors.push('Event date must be in the future');
    }
  }

  if (data.max_attendees !== undefined) {
    if (data.max_attendees < 1 || data.max_attendees > 10000) {
      errors.push('Max attendees must be between 1 and 10,000');
    }
  }

  return errors;
};

// CREATE - Crear evento
export const createEvent = async (req: Request, res: Response) => {
  try {
    const organizerId = getOrganizerId(req);
    const { title, description, date, location, max_attendees, cover_image } = req.body;

    console.log('🎯 Creating event for organizer:', organizerId);

    // Validar datos
    const validationErrors = validateEventData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid event data',
        details: validationErrors
      });
    }

    // Crear evento
    const event = await eventRepo.create({
      organizer_id: organizerId,
      title: title.trim(),
      description: description.trim(),
      date,
      location,
      max_attendees,
      cover_image
    });

    console.log('✅ Event created:', event.id);

    res.status(201).json({
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('❌ Create event error:', error);
    
    if (error instanceof Error && error.message === 'User not authenticated') {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      });
    }

    res.status(500).json({
      error: 'EVENT_CREATION_FAILED',
      message: 'Internal server error during event creation'
    });
  }
};

// READ - Listar eventos del organizador
export const getEvents = async (req: Request, res: Response) => {
  try {
    const organizerId = getOrganizerId(req);

    console.log('🎯 Fetching events for organizer:', organizerId);

    const events = await eventRepo.findByOrganizer(organizerId);

    // Enriquecer con conteo de asistentes
    const eventsWithAttendeeCount = await Promise.all(
      events.map(async (event) => {
        const attendeeCount = await eventRepo.getAttendeeCount(event.id);
        return {
          ...event,
          current_attendees: attendeeCount,
          remaining_slots: event.max_attendees - attendeeCount
        };
      })
    );

    res.json({
      events: eventsWithAttendeeCount,
      count: eventsWithAttendeeCount.length
    });

  } catch (error) {
    console.error('❌ Get events error:', error);
    
    if (error instanceof Error && error.message === 'User not authenticated') {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      });
    }

    res.status(500).json({
      error: 'EVENTS_FETCH_FAILED',
      message: 'Error fetching events'
    });
  }
};

// READ - Obtener evento específico
export const getEventById = async (req: Request, res: Response) => {
  try {
    const organizerId = getOrganizerId(req);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'MISSING_EVENT_ID',
        message: 'Event ID is required'
      });
    }

    console.log('🎯 Fetching event:', id, 'for organizer:', organizerId);

    const event = await eventRepo.findByIdAndOrganizer(id, organizerId);

    if (!event) {
      return res.status(404).json({
        error: 'EVENT_NOT_FOUND',
        message: 'Event not found or access denied'
      });
    }

    const attendeeCount = await eventRepo.getAttendeeCount(event.id);

    res.json({
      event: {
        ...event,
        current_attendees: attendeeCount,
        remaining_slots: event.max_attendees - attendeeCount
      }
    });

  } catch (error) {
    console.error('❌ Get event error:', error);
    
    if (error instanceof Error && error.message === 'User not authenticated') {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      });
    }

    res.status(500).json({
      error: 'EVENT_FETCH_FAILED',
      message: 'Error fetching event'
    });
  }
};

// UPDATE - Actualizar evento
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const organizerId = getOrganizerId(req);
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        error: 'MISSING_EVENT_ID',
        message: 'Event ID is required'
      });
    }

    console.log('🎯 Updating event:', id, 'for organizer:', organizerId);
    console.log('📝 Update data:', updateData);

    // Validar datos (ACTUALIZACIÓN - solo campos proporcionados)
    if (Object.keys(updateData).length > 0) {
      const validationErrors = validateEventUpdate(updateData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid event data',
          details: validationErrors
        });
      }
    } else {
      return res.status(400).json({
        error: 'NO_DATA_PROVIDED',
        message: 'No fields to update provided'
      });
    }

    const event = await eventRepo.update(id, organizerId, updateData);

    res.json({
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    console.error('❌ Update event error:', error);
    
    if (error instanceof Error && error.message === 'User not authenticated') {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      });
    }

    if (error instanceof Error && error.message === 'Event not found or access denied') {
      return res.status(404).json({
        error: 'EVENT_NOT_FOUND',
        message: 'Event not found or access denied'
      });
    }

    res.status(500).json({
      error: 'EVENT_UPDATE_FAILED',
      message: 'Error updating event'
    });
  }
};

// DELETE - Eliminar evento
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const organizerId = getOrganizerId(req);
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'MISSING_EVENT_ID',
        message: 'Event ID is required'
      });
    }

    console.log('🎯 Deleting event:', id, 'for organizer:', organizerId);

    const deleted = await eventRepo.delete(id, organizerId);

    if (!deleted) {
      return res.status(404).json({
        error: 'EVENT_NOT_FOUND',
        message: 'Event not found or access denied'
      });
    }

    res.json({
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete event error:', error);
    
    if (error instanceof Error && error.message === 'User not authenticated') {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      });
    }

    res.status(500).json({
      error: 'EVENT_DELETION_FAILED',
      message: 'Error deleting event'
    });
  }
};