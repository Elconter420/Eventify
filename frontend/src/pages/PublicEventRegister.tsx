import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import axios from 'axios';
import { getApiErrorMessage } from '../utils/apiError';

interface EventDetails {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  max_attendees: number;
  current_attendees: number;
  cover_image?: string;
  is_active: boolean;
}

const PublicEventRegister: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    student_id: '',
  });

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      // Endpoint público para obtener detalles del evento
      const response = await axios.get(`http://localhost:5000/api/public/events/${eventId}`);
      setEvent(response.data.event);
    } catch (err) {
      setError('No se pudo cargar la información del evento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await axios.post(`http://localhost:5000/api/public/attendees/register/${eventId}`, formData);
      setSuccess(true);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Error al registrarse. Intenta nuevamente.'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">Cargando...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Evento no encontrado</h2>
          <p className="text-gray-600 dark:text-gray-400">El evento que buscas no existe o no está disponible.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">¡Registro Exitoso!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Te hemos enviado un correo de confirmación. Por favor revisa tu bandeja de entrada.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Te esperamos en: <strong>{event.title}</strong>
          </p>
        </div>
      </div>
    );
  }

  const availableSpots = event.max_attendees - event.current_attendees;
  const isFull = availableSpots <= 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Event Header */}
          {event.cover_image && (
            <img 
              src={event.cover_image} 
              alt={event.title}
              className="w-full h-48 object-cover"
            />
          )}
          
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">{event.title}</h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{event.description}</p>

            {/* Event Details */}
            <div className="space-y-3 mb-6 border-t border-b border-gray-200 dark:border-gray-700 py-4">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Calendar className="w-5 h-5 mr-3 text-indigo-600" />
                <span>{formatDate(event.date)}</span>
              </div>
              
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Clock className="w-5 h-5 mr-3 text-indigo-600" />
                <span>{formatTime(event.date)}</span>
              </div>
              
              {event.location && (
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <MapPin className="w-5 h-5 mr-3 text-indigo-600" />
                  <span>{event.location}</span>
                </div>
              )}
              
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Users className="w-5 h-5 mr-3 text-indigo-600" />
                <span>
                  {isFull ? (
                    <span className="text-red-600 font-semibold">Cupo lleno</span>
                  ) : (
                    <>
                      {availableSpots} {availableSpots === 1 ? 'cupo disponible' : 'cupos disponibles'}
                    </>
                  )}
                </span>
              </div>
            </div>

            {!event.is_active ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
                Este evento no está activo actualmente.
              </div>
            ) : isFull ? (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
                Lo sentimos, este evento ha alcanzado su capacidad máxima.
              </div>
            ) : (
              <>
                {/* Registration Form */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Formulario de Registro</h2>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Ingrese su nombre completo"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Ingrese su correo electrónico"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ID de Estudiante <span className="text-gray-500 dark:text-gray-400">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.student_id}
                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                        placeholder="Ingrese su ID de estudiante"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Registrando...' : 'Registrar'}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-8 py-4 text-center border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Powered by <span className="text-indigo-600 font-semibold">Eventify</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicEventRegister;
