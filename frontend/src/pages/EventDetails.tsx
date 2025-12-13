import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventService } from '../services/eventService';
import type { Event } from '../types';
import { getApiErrorMessage } from '../utils/apiError';

const EventDetails: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      } catch (err: any) {
        setError(getApiErrorMessage(err, 'No se pudo cargar el evento'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No se pudo mostrar el evento</h2>
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {event.cover_image ? (
            <img src={event.cover_image} alt={event.title} className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-64 bg-gray-100 dark:bg-gray-700" />
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">{event.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{event.description}</p>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/events/${event.id}/edit`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Fecha y hora</p>
                <p className="text-gray-800 dark:text-gray-100 mt-1">{formatDateTime(event.date)}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Ubicación</p>
                <p className="text-gray-800 dark:text-gray-100 mt-1">{event.location || '—'}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Capacidad</p>
                <p className="text-gray-800 dark:text-gray-100 mt-1">{event.max_attendees}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Estado</p>
                <p className="text-gray-800 dark:text-gray-100 mt-1">{event.is_active ? 'Activo' : 'Inactivo'}</p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/events')}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Volver a eventos
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetails;
