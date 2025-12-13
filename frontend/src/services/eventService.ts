import api from './api';
import type { Event, CreateEventData, UpdateEventData, Attendee } from '../types';

export const eventService = {
  // Obtener todos los eventos del organizador
  getMyEvents: async (): Promise<Event[]> => {
    const response = await api.get<{ events: Event[] }>('/events');
    return response.data.events;
  },

  // Obtener un evento específico
  getEvent: async (id: string): Promise<Event> => {
    const response = await api.get<{ event: Event }>(`/events/${id}`);
    return response.data.event;
  },

  // Crear un nuevo evento
  createEvent: async (data: CreateEventData): Promise<Event> => {
    const response = await api.post<{ event: Event }>('/events', data);
    return response.data.event;
  },

  // Actualizar un evento
  updateEvent: async (id: string, data: UpdateEventData): Promise<Event> => {
    const response = await api.put<{ event: Event }>(`/events/${id}`, data);
    return response.data.event;
  },

  // Eliminar un evento
  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  // Obtener asistentes de un evento
  getAttendees: async (eventId: string): Promise<Attendee[]> => {
    const response = await api.get<{ attendees: Attendee[] }>(`/events/${eventId}/attendees`);
    return response.data.attendees;
  },

  // Enviar comunicación masiva a asistentes de un evento
  sendCommunication: async (
    eventId: string,
    payload: { subject: string; message: string }
  ): Promise<{ summary: { totalRecipients: number; sent: number; failed: number } }> => {
    const response = await api.post<{ summary: { totalRecipients: number; sent: number; failed: number } }>(
      `/events/${eventId}/communications`,
      payload
    );
    return response.data;
  },
};
