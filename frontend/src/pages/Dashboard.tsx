import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, FileText, Link2, Check } from 'lucide-react';
import Layout from '../components/Layout';
import { eventService } from '../services/eventService';
import type { Event } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeEvents: 0,
    totalRegistrations: 0,
    attendanceRate: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await eventService.getMyEvents();
      setEvents(data);
      
      // Calcular estadísticas
      const activeEvents = data.filter((e) => e.is_active).length;
      const totalRegistrations = data.reduce((sum, e) => sum + (e.current_attendees || 0), 0);
      const upcomingEvents = data.filter((e) => new Date(e.date) > new Date()).length;
      
      // Calcular tasa de asistencia real
      const totalCapacity = data.reduce((sum, e) => sum + e.max_attendees, 0);
      const attendanceRate = totalCapacity > 0 
        ? Math.round((totalRegistrations / totalCapacity) * 100) 
        : 0;
      
      setStats({
        activeEvents,
        totalRegistrations,
        attendanceRate,
        upcomingEvents,
      });
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyPublicLink = (eventId: string) => {
    const publicUrl = `${window.location.origin}/event/${eventId}/register`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopiedId(eventId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (event: Event) => {
    if (!event.is_active) {
      return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Inactivo</span>;
    }
    
    const eventDate = new Date(event.date);
    const now = new Date();
    
    if (eventDate < now) {
      return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Completado</span>;
    }
    
    if ((event.current_attendees || 0) >= event.max_attendees) {
      return <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">Lleno</span>;
    }
    
    return <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Activo</span>;
  };

  if (loading) {
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
      <div className="space-y-6 h-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-600">
            <div className="text-center">
              <p className="text-5xl font-bold text-indigo-600">{stats.activeEvents}</p>
              <p className="text-gray-600 mt-3 font-medium">Eventos Activos</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-600">{stats.totalRegistrations}</p>
              <p className="text-gray-600 mt-3 font-medium">Inscripciones Totales</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="text-center">
              <p className="text-5xl font-bold text-green-600">{stats.attendanceRate}%</p>
              <p className="text-gray-600 mt-3 font-medium">Tasa de Asistencia</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="text-center">
              <p className="text-5xl font-bold text-purple-600">{stats.upcomingEvents}</p>
              <p className="text-gray-600 mt-3 font-medium">Próximos Eventos</p>
            </div>
          </div>
        </div>

        {/* Eventos Recientes */}
        <div className="bg-white rounded-lg shadow-md flex-1">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">Eventos Recientes</h3>
            <button
              onClick={() => navigate('/events/new')}
              className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              <span className="font-medium">Nuevo Evento</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    NOMBRE DEL EVENTO
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    FECHA
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    INSCRITOS
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ESTADO
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.slice(0, 5).map((event) => (
                  <tr key={event.id} className="hover:bg-indigo-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">{event.title}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(event.date)}</td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-semibold">{event.current_attendees || 0}</span>
                      <span className="text-gray-500 text-sm"> / {event.max_attendees}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(event)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyPublicLink(event.id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors relative"
                          title="Copiar link público"
                        >
                          {copiedId === event.id ? (
                            <Check size={18} className="text-green-600" />
                          ) : (
                            <Link2 size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => navigate(`/events/${event.id}`)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => navigate(`/events/${event.id}/edit`)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {events.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg mb-2">No hay eventos creados aún.</p>
                <p className="text-sm">¡Crea tu primer evento para comenzar!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
