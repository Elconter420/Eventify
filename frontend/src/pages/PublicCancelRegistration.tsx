import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { getApiErrorMessage } from '../utils/apiError';

type CancelResult = {
  success: boolean;
  message?: string;
};

const PublicCancelRegistration: React.FC = () => {
  const { eventId, attendeeId } = useParams<{ eventId: string; attendeeId: string }>();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CancelResult | null>(null);

  const cancelEndpoint = useMemo(() => {
    if (!eventId || !attendeeId) return null;
    return `http://localhost:5000/api/public/attendees/cancel/${eventId}/${attendeeId}`;
  }, [eventId, attendeeId]);

  useEffect(() => {
    const run = async () => {
      if (!cancelEndpoint) {
        setResult({ success: false, message: 'Link de cancelación inválido.' });
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(cancelEndpoint);
        const success = Boolean(response.data?.success);
        const message = response.data?.message || (success ? 'Registro cancelado correctamente.' : 'No se pudo cancelar el registro.');
        setResult({ success, message });
      } catch (err: any) {
        setResult({
          success: false,
          message: getApiErrorMessage(err, 'No se pudo cancelar el registro. Intenta nuevamente.'),
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [cancelEndpoint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Procesando cancelación...</div>
      </div>
    );
  }

  const ok = result?.success;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            ok ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
          }`}
        >
          {ok ? (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {ok ? 'Registro cancelado' : 'No se pudo cancelar'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{result?.message}</p>

        {eventId ? (
          <Link
            to={`/event/${eventId}/register`}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Volver al evento
          </Link>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Ir al inicio
          </Link>
        )}

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          Powered by <span className="text-indigo-600 font-semibold">Eventify</span>
        </div>
      </div>
    </div>
  );
};

export default PublicCancelRegistration;
