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
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsError, setRecipientsError] = useState('');
  const [recipientCounts, setRecipientCounts] = useState<null | {
    total: number;
    active: number;
    cancelled: number;
  }>(null);

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

  const formattedEventDate = useMemo(() => {
    if (!selectedEvent?.date) return '';
    const date = new Date(selectedEvent.date);
    if (Number.isNaN(date.getTime())) return selectedEvent.date;
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [selectedEvent?.date]);

  const applyTemplate = (template: { subject: string; message: string }) => {
    const locationSuffix = selectedEvent?.location ? ` en ${selectedEvent.location}` : '';
    const filled = (text: string) =>
      text
        .replaceAll('{EVENTO}', selectedEvent?.title || '')
        .replaceAll('{FECHA}', formattedEventDate)
        .replaceAll('{LUGAR}', selectedEvent?.location || '')
        .replaceAll('{EN_LUGAR}', locationSuffix);

    setSubject(filled(template.subject));
    setMessage(filled(template.message));
  };

  const templates = useMemo(
    () => [
      {
        id: 'reminder',
        label: 'Recordatorio',
        subject: 'Recordatorio: {EVENTO}',
        message:
          'Hola,\n\nTe recordamos que el evento “{EVENTO}” será el {FECHA}{EN_LUGAR}.\n\n¡Te esperamos!\n',
      },
      {
        id: 'schedule-change',
        label: 'Cambio de horario',
        subject: 'Actualización de horario: {EVENTO}',
        message:
          'Hola,\n\nQueremos informarte que el evento “{EVENTO}” tiene un cambio de horario.\nNueva fecha/hora: {FECHA}.\n\nGracias por tu comprensión.\n',
      },
      {
        id: 'location-change',
        label: 'Cambio de ubicación',
        subject: 'Actualización de ubicación: {EVENTO}',
        message:
          'Hola,\n\nEl evento “{EVENTO}” cambia de ubicación.\nNueva ubicación: {LUGAR}.\n\nNos vemos pronto.\n',
      },
      {
        id: 'thanks',
        label: 'Gracias por asistir',
        subject: 'Gracias por asistir: {EVENTO}',
        message:
          'Hola,\n\nGracias por participar en “{EVENTO}”.\nNos encantaría conocer tu opinión.\n\n¡Hasta la próxima!\n',
      },
      {
        id: 'important',
        label: 'Información importante',
        subject: 'Información importante: {EVENTO}',
        message:
          'Hola,\n\nTe compartimos información importante sobre “{EVENTO}”.\n\n- Punto 1\n- Punto 2\n\nSaludos.\n',
      },
    ],
    [formattedEventDate, selectedEvent?.location, selectedEvent?.title]
  );

  useEffect(() => {
    const loadRecipients = async () => {
      setRecipientsError('');

      if (!selectedEventId) {
        setRecipientCounts(null);
        return;
      }

      setRecipientsLoading(true);
      try {
        const attendees = await eventService.getAttendees(selectedEventId);
        const cancelled = attendees.filter((a) => a.status === 'cancelled').length;
        const active = attendees.length - cancelled;
        setRecipientCounts({ total: attendees.length, active, cancelled });
      } catch (err: any) {
        setRecipientsError(err.response?.data?.message || 'No se pudieron cargar los destinatarios');
        setRecipientCounts(null);
      } finally {
        setRecipientsLoading(false);
      }
    };

    loadRecipients();
  }, [selectedEventId]);

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
      let finalMessage = message;

      try {
        const raw = localStorage.getItem('settings');
        if (raw) {
          const s = JSON.parse(raw);
          const autoAppendSignature = !!s?.autoAppendSignature;
          const signature = typeof s?.communicationSignature === 'string' ? s.communicationSignature.trim() : '';

          if (autoAppendSignature && signature) {
            const signatureBlock = `\n\n--\n${signature}`;
            const currentTrimmed = (message || '').replace(/\s+$/g, '');
            const signatureAlreadyPresent = currentTrimmed.endsWith(signatureBlock.trim());
            finalMessage = signatureAlreadyPresent ? message : `${message}${signatureBlock}`;
          }
        }
      } catch {
        // ignorar
      }

      const result = await eventService.sendCommunication(selectedEventId, {
        subject,
        message: finalMessage,
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Mail size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Redactar nuevo mensaje</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Redacta y envía una comunicación a tus asistentes.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {summary && (
            <div className="bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/25 dark:border-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">
              Envío procesado: {summary.sent}/{summary.totalRecipients} enviados
              {summary.failed ? `, ${summary.failed} fallidos` : ''}.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Evento</label>
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Se enviará a asistentes activos del evento.</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asunto</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Escribe el asunto aquí"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mensaje</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Redacta tu mensaje aquí"
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
                <span>{loading ? 'Enviando...' : 'Enviar mensaje'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubject('');
                  setMessage('');
                  setSummary(null);
                  setError('');
                }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">Destinatarios</h3>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300">
            {selectedEvent ? (
              <div className="space-y-2">
                <div className="text-gray-800 dark:text-gray-100 font-medium">{selectedEvent.title}</div>

                {recipientsLoading ? (
                  <div className="text-gray-600 dark:text-gray-300">Cargando destinatarios...</div>
                ) : recipientsError ? (
                  <div className="text-red-700 dark:text-red-300">{recipientsError}</div>
                ) : recipientCounts ? (
                  <div className="space-y-1">
                    <div>
                      Total registrados:{' '}
                      <span className="font-medium text-gray-800 dark:text-gray-100">{recipientCounts.total}</span>
                    </div>
                    <div>
                      Activos (reciben el correo):{' '}
                      <span className="font-medium text-gray-800 dark:text-gray-100">{recipientCounts.active}</span>
                    </div>
                    <div>
                      Cancelados (excluidos):{' '}
                      <span className="font-medium text-gray-800 dark:text-gray-100">{recipientCounts.cancelled}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600 dark:text-gray-300">Selecciona un evento para ver sus destinatarios.</div>
                )}

                <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
                  El envío se realiza solo a asistentes activos. Los cancelados quedan excluidos.
                </div>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-300">Selecciona un evento para ver sus destinatarios.</div>
            )}
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Plantillas rápidas</h4>

            {!selectedEvent ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Selecciona un evento para usar plantillas.</div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate({ subject: t.subject, message: t.message })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors text-sm"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Las plantillas reemplazan el asunto y el mensaje actuales.
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Tips</h4>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <div>Incluye fecha y lugar cuando aplique.</div>
              <div>Usa un asunto claro (p. ej., “Recordatorio” o “Actualización”).</div>
              <div>Si hay cambios, indica qué cambió y cuál es la información nueva.</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Communications;
