import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventService } from '../services/eventService';
import type { Event, UpdateEventData } from '../types';
import { getApiErrorMessage } from '../utils/apiError';

const buildTimeOptions = (stepMinutes = 15): string[] => {
  const options: string[] = [];
  const clampedStep = stepMinutes > 0 ? stepMinutes : 15;
  for (let minutes = 0; minutes < 24 * 60; minutes += clampedStep) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    options.push(`${hh}:${mm}`);
  }
  return options;
};

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
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [event, setEvent] = useState<Event | null>(null);

  const timeOptions = buildTimeOptions(30);

  const toDateInputValue = (iso: string | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const toTimeInputValue = (iso: string | undefined, fallback = '12:00') => {
    if (!iso) return fallback;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return fallback;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const mapEventValidationDetail = (detail: string) => {
    switch (detail) {
      case 'Title must be at least 3 characters long':
        return 'El título debe tener al menos 3 caracteres.';
      case 'Description must be at least 10 characters long':
        return 'La descripción debe tener al menos 10 caracteres.';
      case 'Event date must be in the future':
        return 'La fecha y hora deben ser futuras.';
      case 'Max attendees must be between 1 and 10,000':
        return 'La capacidad debe estar entre 1 y 10.000.';
      default:
        return detail;
    }
  };

  const validateClientSide = (data: EditFormState): string[] => {
    const issues: string[] = [];
    const title = (data.title || '').trim();
    const description = (data.description || '').trim();
    const max = Number(data.max_attendees);
    const d = new Date(data.date);

    if (title.length < 3) issues.push('El título debe tener al menos 3 caracteres.');
    if (description.length < 10) issues.push('La descripción debe tener al menos 10 caracteres.');
    if (Number.isNaN(d.getTime()) || d <= new Date()) issues.push('La fecha y hora deben ser futuras.');
    if (!Number.isFinite(max) || max < 1 || max > 10000) issues.push('La capacidad debe estar entre 1 y 10.000.');

    return issues;
  };

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
        setError(getApiErrorMessage(err, 'No se pudo cargar el evento'));
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
    setErrorDetails([]);

    if (!eventId) {
      setError('ID de evento inválido');
      return;
    }

    const clientIssues = validateClientSide(formData);
    if (clientIssues.length > 0) {
      setError('Revisa los campos del formulario');
      setErrorDetails(clientIssues);
      return;
    }

    setSaving(true);
    try {
      await eventService.updateEvent(eventId, buildUpdatePayload());
      navigate(`/events/${eventId}`);
    } catch (err: any) {
      const message = getApiErrorMessage(err, 'Error al actualizar el evento');
      const detailsRaw = err.response?.data?.details;
      const details = Array.isArray(detailsRaw) ? detailsRaw.map((d: any) => mapEventValidationDetail(String(d))) : [];
      setError(message);
      setErrorDetails(details);
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
              <div className="font-medium">{error}</div>
              {errorDetails.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                  {errorDetails.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : null}
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
                  value={toDateInputValue(formData.date)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const parts = raw.split('-').map((n) => Number.parseInt(n, 10));
                    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return;
                    const [year, month, day] = parts;

                    const existing = formData.date ? new Date(formData.date) : null;
                    const hh = existing && !Number.isNaN(existing.getTime()) ? existing.getHours() : 12;
                    const mm = existing && !Number.isNaN(existing.getTime()) ? existing.getMinutes() : 0;

                    const next = new Date(year, month - 1, day, hh, mm, 0, 0);
                    setFormData({ ...formData, date: next.toISOString() });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hora</label>
                <select
                  required
                  value={toTimeInputValue(formData.date, '12:00')}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const [hhRaw, mmRaw] = raw.split(':');
                    const hh = Number.parseInt(hhRaw, 10);
                    const mm = Number.parseInt(mmRaw, 10);
                    if (Number.isNaN(hh) || Number.isNaN(mm)) return;

                    const base = formData.date ? new Date(formData.date) : new Date();
                    const safe = Number.isNaN(base.getTime()) ? new Date() : base;
                    const next = new Date(safe.getFullYear(), safe.getMonth(), safe.getDate(), hh, mm, 0, 0);
                    setFormData({ ...formData, date: next.toISOString() });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-gray-800"
                >
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Elige una hora (intervalos de 30 min).
                </div>
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
