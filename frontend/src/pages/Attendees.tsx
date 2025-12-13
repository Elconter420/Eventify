import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import Layout from '../components/Layout';
import { eventService } from '../services/eventService';
import type { Attendee } from '../types';

type AttendeeRow = Attendee & {
  event_title?: string;
};

const Attendees: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<AttendeeRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(0);

  useEffect(() => {
    loadAttendees();
  }, [eventId]);

  useEffect(() => {
    const filtered = attendees.filter(
      (attendee) =>
        attendee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (attendee.event_title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAttendees(filtered);
  }, [searchTerm, attendees]);

  const loadAttendees = async () => {
    setLoading(true);
    try {
      // Si hay eventId, cargar solo de ese evento. Si no, cargar de todos los eventos
      if (eventId) {
        const [event, data] = await Promise.all([
          eventService.getEvent(eventId),
          eventService.getAttendees(eventId),
        ]);

        const rows: AttendeeRow[] = data.map((a) => ({
          ...a,
          event_title: event.title,
        }));

        setMaxCount(event.max_attendees || 0);
        setAttendees(rows);
        setFilteredAttendees(rows);
      } else {
        // Cargar todos los eventos y luego todos sus asistentes
        const events = await eventService.getMyEvents();
        const totalCapacity = events.reduce((sum, ev) => sum + (ev.max_attendees || 0), 0);
        const allAttendees: AttendeeRow[] = [];
        
        for (const event of events) {
          try {
            const eventAttendees = await eventService.getAttendees(event.id);
            allAttendees.push(
              ...eventAttendees.map((a) => ({
                ...a,
                event_title: event.title,
              }))
            );
          } catch (err) {
            console.error(`Error loading attendees for event ${event.id}:`, err);
          }
        }

        setMaxCount(totalCapacity);
        setAttendees(allAttendees);
        setFilteredAttendees(allAttendees);
      }
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Nombre', 'Evento', 'Correo Electrónico', 'Fecha de Inscripción', 'Estado'];
    const rows = filteredAttendees.map((a) => [
      a.full_name,
      a.event_title || '',
      a.email,
      new Date(a.created_at).toLocaleDateString('es-ES'),
      'Registrado',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asistentes.csv';
    a.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => (
    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
      Registrado
    </span>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Cargando asistentes...</div>
        </div>
      </Layout>
    );
  }

  const currentCount = attendees.length;
  const percentage = maxCount > 0 ? Math.min(100, (currentCount / maxCount) * 100) : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inscripciones</h3>
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <span className="ml-4 text-sm font-medium text-gray-700">
              {currentCount} / {maxCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Buscar asistente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download size={20} />
              <span>Exportar a CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">
                    Correo Electrónico
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">
                    Fecha de Inscripción
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800 whitespace-nowrap align-middle text-left">
                      {attendee.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap align-middle text-left">
                      {attendee.event_title || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap align-middle text-left">
                      {attendee.email}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap align-middle text-left">
                      {formatDate(attendee.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-middle text-left">{getStatusBadge()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAttendees.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchTerm
                  ? 'No se encontraron asistentes con ese criterio'
                  : 'No hay asistentes registrados aún'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Attendees;
