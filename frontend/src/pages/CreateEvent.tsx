import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import Layout from '../components/Layout';
import { eventService } from '../services/eventService';
import type { CreateEventData } from '../types';

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

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

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

  const validateClientSide = (data: CreateEventData): string[] => {
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
  
  // Inicializar con fecha de mañana a las 12:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    date: tomorrow.toISOString(),
    location: '',
    max_attendees: 100,
    cover_image: '',
  });

  useEffect(() => {
    const raw = localStorage.getItem('settings');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const defaultEventLocation = typeof parsed?.defaultEventLocation === 'string' ? parsed.defaultEventLocation : '';
      const defaultEventCapacity =
        typeof parsed?.defaultEventCapacity === 'number' && parsed.defaultEventCapacity > 0
          ? parsed.defaultEventCapacity
          : null;
      const defaultEventTime = typeof parsed?.defaultEventTime === 'string' ? parsed.defaultEventTime : '';

      setFormData((prev) => {
        // Solo aplicar si el usuario no ha empezado a editar campos relevantes
        const shouldApplyLocation = !prev.location && !!defaultEventLocation;
        const shouldApplyCapacity = prev.max_attendees === 100 && defaultEventCapacity !== null;

        let nextDate = prev.date;
        if (defaultEventTime && /^\d{2}:\d{2}$/.test(defaultEventTime)) {
          const [hh, mm] = defaultEventTime.split(':');
          const d = prev.date ? new Date(prev.date) : new Date();
          if (!Number.isNaN(d.getTime())) {
            d.setHours(Number.parseInt(hh, 10), Number.parseInt(mm, 10), 0, 0);
            nextDate = d.toISOString();
          }
        }

        return {
          ...prev,
          location: shouldApplyLocation ? defaultEventLocation : prev.location,
          max_attendees: shouldApplyCapacity ? (defaultEventCapacity as number) : prev.max_attendees,
          date: nextDate,
        };
      });
    } catch {
      // ignorar
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDetails([]);
    setLoading(true);

    const clientIssues = validateClientSide(formData);
    if (clientIssues.length > 0) {
      setError('Revisa los campos del formulario');
      setErrorDetails(clientIssues);
      setLoading(false);
      return;
    }

    try {
      await eventService.createEvent(formData);
      navigate('/events');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al crear el evento';
      const detailsRaw = err.response?.data?.details;
      const details = Array.isArray(detailsRaw) ? detailsRaw.map((d: any) => mapEventValidationDetail(String(d))) : [];
      setError(message);
      setErrorDetails(details);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Crear Nuevo Evento</h2>
            <button
              onClick={() => navigate('/events')}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              <X size={24} />
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Evento
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Conferencia de Tecnología"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
                  <option>Académico</option>
                  <option>Cultural</option>
                  <option>Deportivo</option>
                  <option>Social</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe los detalles del evento..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha del Evento
                </label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora
                </label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ej: Auditorio Principal"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacidad Máxima
                </label>
                <input
                  type="number"
                  required
                  value={formData.max_attendees}
                  onChange={(e) =>
                    setFormData({ ...formData, max_attendees: Number.parseInt(e.target.value, 10) || 1 })
                  }
                  min="1"
                  placeholder="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Banner del Evento
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer">
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-indigo-600 font-medium mb-1">Sube un archivo</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG, GIF hasta 10MB</p>
                <input
                  type="text"
                  placeholder="O pega la URL de la imagen"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  className="mt-4 w-full max-w-md mx-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateEvent;
