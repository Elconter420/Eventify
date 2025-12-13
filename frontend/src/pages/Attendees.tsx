import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import Layout from '../components/Layout';
import { eventService } from '../services/eventService';
import type { Attendee, Event } from '../types';

type AttendeeRow = Attendee & {
  event_title?: string;
};

type AttendeeStatusFilter = 'all' | 'registered' | 'cancelled';

const Attendees: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<AttendeeRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<AttendeeStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(0);

  useEffect(() => {
    loadAttendees();
  }, [eventId]);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = attendees.filter((attendee) => {
      const matchesSearch =
        !term ||
        attendee.full_name.toLowerCase().includes(term) ||
        attendee.email.toLowerCase().includes(term) ||
        (attendee.event_title || '').toLowerCase().includes(term);

      const matchesEvent = selectedEventId === 'all' || attendee.event_id === selectedEventId;

      const attendeeStatus = (attendee.status || 'registered').toLowerCase();
      const matchesStatus = statusFilter === 'all' || attendeeStatus === statusFilter;

      return matchesSearch && matchesEvent && matchesStatus;
    });

    setFilteredAttendees(filtered);
  }, [searchTerm, attendees, selectedEventId, statusFilter]);

  useEffect(() => {
    // Mantener selectedEventId sincronizado con la ruta, cuando viene eventId.
    if (eventId) {
      setSelectedEventId(eventId);
    } else {
      setSelectedEventId('all');
    }
  }, [eventId]);

  const getAttendeeStatusLabel = (attendee: AttendeeRow) => {
    const status = (attendee.status || 'registered').toLowerCase();
    if (status === 'cancelled') return 'Cancelado';
    return 'Registrado';
  };

  const loadAttendees = async () => {
    setLoading(true);
    try {
      // Si hay eventId, cargar solo de ese evento. Si no, cargar de todos los eventos
      if (eventId) {
        const [event, data] = await Promise.all([
          eventService.getEvent(eventId),
          eventService.getAttendees(eventId),
        ]);

        setEvents([event]);
        setSelectedEventId(eventId);

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
        setEvents(events);
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
    const delimiter = ';';
    const headers = ['Nombre', 'Evento', 'Correo Electrónico', 'Fecha de Inscripción', 'Estado'];

    const formatDateTimeForCsv = (dateString: string) => {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return '';
      const pad2 = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    };

    const escapeCsvValue = (value: unknown) => {
      const s = String(value ?? '');
      const normalized = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const escapedQuotes = normalized.replace(/"/g, '""');
      return `"${escapedQuotes}"`;
    };

    const rows = filteredAttendees.map((a) => [
      a.full_name,
      a.event_title || '',
      a.email,
      formatDateTimeForCsv(a.created_at),
      getAttendeeStatusLabel(a),
    ]);

    // Tip para Excel (especialmente en ES): forzar separador de columnas
    const lines = [
      `sep=${delimiter}`,
      headers.map(escapeCsvValue).join(delimiter),
      ...rows.map((row) => row.map(escapeCsvValue).join(delimiter)),
    ];

    // BOM para que Excel detecte UTF-8 y respete tildes
    const csvContent = `\ufeff${lines.join('\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'asistentes.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (attendee: AttendeeRow) => {
    const status = (attendee.status || 'registered').toLowerCase();
    if (status === 'cancelled') {
      return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm">Cancelado</span>;
    }
    return <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Registrado</span>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Cargando asistentes...</div>
        </div>
      </Layout>
    );
  }

  const eventsForCapacity = events.filter((ev) => (selectedEventId === 'all' ? true : ev.id === selectedEventId));
  const capacityForFilter = eventsForCapacity.reduce((sum, ev) => sum + (ev.max_attendees || 0), 0);
  const denominator = capacityForFilter > 0 ? capacityForFilter : maxCount;

  const scopeAttendees = selectedEventId === 'all'
    ? attendees
    : attendees.filter((a) => a.event_id === selectedEventId);

  const registeredCount = scopeAttendees.filter(
    (a) => (a.status || 'registered').toLowerCase() !== 'cancelled'
  ).length;
  const cancelledCount = scopeAttendees.filter(
    (a) => (a.status || '').toLowerCase() === 'cancelled'
  ).length;
  const totalCount = scopeAttendees.length;
  const showingCount = filteredAttendees.length;

  const registeredPercentage = denominator > 0 ? Math.min(100, (registeredCount / denominator) * 100) : 0;
  const cancelledRatePercentage = totalCount > 0 ? Math.min(100, (cancelledCount / totalCount) * 100) : 0;

  const selectedEventTitle =
    selectedEventId === 'all'
      ? 'Todos los eventos'
      : events.find((ev) => ev.id === selectedEventId)?.title || 'Evento';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inscripciones · {selectedEventTitle}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${registeredPercentage}%` }}
                  />
                </div>
              </div>
              <span className="ml-4 text-sm font-medium text-gray-700">
                {registeredCount} / {denominator}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${cancelledRatePercentage}%` }}
                  />
                </div>
              </div>
              <span className="ml-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                Cancelados: {cancelledCount}{totalCount > 0 ? ` (${Math.round(cancelledRatePercentage)}%)` : ''}
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            <span>
              <span className="font-medium text-gray-800">Total registros:</span> {totalCount}
            </span>
            <span>
              <span className="font-medium text-gray-800">Cancelados:</span> {cancelledCount}
            </span>
            <span>
              <span className="font-medium text-gray-800">Mostrando (filtros):</span> {showingCount}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                {!eventId ? (
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="all">Todos los eventos</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="hidden md:block" />
                )}

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AttendeeStatusFilter)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="all">Todos los estados</option>
                  <option value="registered">Registrados</option>
                  <option value="cancelled">Cancelados</option>
                </select>
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
                    <td className="px-6 py-4 whitespace-nowrap align-middle text-left">{getStatusBadge(attendee)}</td>
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
