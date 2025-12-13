import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Send } from 'lucide-react';
import Layout from '../components/Layout';
import { eventService } from '../services/eventService';
import type { Event } from '../types';

const Communications: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<null | { totalRecipients: number; sent: number; failed: number }>(null);

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      setError('');
      try {
        const data = await eventService.getMyEvents();
        setEvents(data);
        setSelectedEventId((prev) => prev || (data[0]?.id || ''));
      } catch (err: any) {
        setError(err.response?.data?.message || 'No se pudieron cargar los eventos');
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, []);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSummary(null);

    if (!selectedEventId) {
      setError('Selecciona un evento');
      setLoading(false);
      return;
    }

    try {
      const result = await eventService.sendCommunication(selectedEventId, {
        subject,
        message,
      });
      setSummary(result.summary);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo enviar la comunicación');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Cargando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <Mail size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Compose New Message</h3>
            <p className="text-gray-600 text-sm">Craft and send a new communication to your attendees.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {summary && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              Envío procesado: {summary.sent}/{summary.totalRecipients} enviados
              {summary.failed ? `, ${summary.failed} fallidos` : ''}.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evento</label>
              <select
                required
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Selecciona un evento</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
              {selectedEvent ? (
                <p className="text-xs text-gray-500 mt-1">Se enviará a asistentes activos del evento.</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject here"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Compose your message here"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Send size={20} />
                <span>{loading ? 'Sending...' : 'Send Message'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubject('');
                  setMessage('');
                  setSummary(null);
                  setError('');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Nota</h3>
          <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            Esta función envía correos a los asistentes activos del evento usando SMTP.
            Si SMTP no está configurado, el backend puede caer en modo simulación y no enviar correos reales.
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Communications;
