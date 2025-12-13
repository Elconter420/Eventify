import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventService } from '../services/eventService';
import type { Event, UpdateEventData } from '../types';

type EditFormState = {
  title: string;
  description: string;
  date: string;
  location: string;
  max_attendees: number;
  cover_image: string;
  is_active: boolean;
};

const EditEvent: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [event, setEvent] = useState<Event | null>(null);

  const [formData, setFormData] = useState<EditFormState>({
    title: '',
    description: '',
    date: new Date().toISOString(),
    location: '',
    max_attendees: 1,
    cover_image: '',
    is_active: true,
  });

  useEffect(() => {
    const load = async () => {
      if (!eventId) {
        setError('ID de evento inválido');
        setLoading(false);
        return;
      }

      try {
        const data = await eventService.getEvent(eventId);
        setEvent(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          date: data.date,
          location: data.location || '',
          max_attendees: data.max_attendees,
          cover_image: data.cover_image || '',
          is_active: data.is_active,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'No se pudo cargar el evento');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId]);

  const buildUpdatePayload = (): UpdateEventData => {
    // Nota: para permitir “limpiar” strings, enviamos null en campos opcionales (DB lo permite).
    // El repo del backend actualiza solo lo que se envía.
    return {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      max_attendees: formData.max_attendees,
      location: (formData.location.trim() ? formData.location.trim() : (null as any)),
      cover_image: (formData.cover_image.trim() ? formData.cover_image.trim() : (null as any)),
      is_active: formData.is_active,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!eventId) {
      setError('ID de evento inválido');
      return;
    }

    setSaving(true);
    try {
      await eventService.updateEvent(eventId, buildUpdatePayload());
      navigate(`/events/${eventId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el evento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-300">Cargando evento...</div>
        </div>
      </Layout>
    );
  }

  if (!event || error) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No se pudo editar el evento</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Evento no encontrado'}</p>
            <button
              onClick={() => navigate('/events')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Volver a eventos
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Editar Evento</h2>
            <button
              onClick={() => navigate(`/events/${eventId}`)}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Ver evento
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre del Evento</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capacidad Máxima</label>
                <input
                  type="number"
                  required
                  value={formData.max_attendees}
                  onChange={(e) =>
                    setFormData({ ...formData, max_attendees: Number.parseInt(e.target.value, 10) || 1 })
                  }
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha del Evento</label>
                <input
                  type="date"
                  required
                  value={formData.date ? formData.date.split('T')[0] : ''}
                  onChange={(e) => {
                    const existingDate = formData.date ? new Date(formData.date) : null;
                    const newDate = new Date(e.target.value);
                    if (existingDate) {
                      newDate.setHours(existingDate.getHours(), existingDate.getMinutes());
                    } else {
                      newDate.setHours(12, 0);
                    }
                    setFormData({ ...formData, date: newDate.toISOString() });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hora</label>
                <input
                  type="time"
                  required
                  value={formData.date ? new Date(formData.date).toTimeString().slice(0, 5) : '12:00'}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const date = formData.date ? new Date(formData.date) : new Date();
                    date.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10));
                    setFormData({ ...formData, date: date.toISOString() });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ubicación</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ej: Auditorio Principal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL del banner</label>
                <input
                  type="text"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <span>Evento activo</span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate(`/events/${eventId}`)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditEvent;
