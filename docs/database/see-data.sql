-- =============================================
-- EventFlow Seed Data
-- Test data for development
-- =============================================

-- Clear existing data (optional - use with caution)
-- DELETE FROM attendees;
-- DELETE FROM events;
-- DELETE FROM organizers;

-- =============================================
-- Insert Organizers
-- =============================================
INSERT INTO organizers (id, email, password_hash, full_name) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'tech@eventflow.com',
    '$2b$10$examplehashedpassword123', -- En producción usar bcrypt
    'Tech Events Co.'
),
(
    'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a12', 
    'maria@community.org',
    '$2b$10$examplehashedpassword456',
    'María González'
),
(
    'c2eecc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'conferences@university.edu',
    '$2b$10$examplehashedpassword789',
    'Universidad Central'
);

-- =============================================
-- Insert Events
-- =============================================
INSERT INTO events (id, organizer_id, title, description, date, location, max_attendees, cover_image) VALUES
(
    'd3ffd99-9c0b-4ef8-bb6d-6bb9bd380a14',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Conferencia de Tecnología 2025',
    'Una conferencia sobre las últimas tendencias en desarrollo web, AI y cloud computing. Perfecta para desarrolladores y entusiastas de la tecnología.',
    '2025-12-15 09:00:00-05',
    'Centro de Convenciones Bogotá',
    150,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
),
(
    'e4ffe99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'b1ffc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'Taller de React Avanzado',
    'Aprende hooks avanzados, performance optimization, y patrones de diseño en React. Trae tu laptop para los ejercicios prácticos.',
    '2025-11-30 14:00:00-05',
    'Coworking Innovation Space',
    30,
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800'
),
(
    'f5fff99-9c0b-4ef8-bb6d-6bb9bd380a16',
    'c2eecc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'Meetup: PostgreSQL para Desarrolladores',
    'Deep dive en PostgreSQL: índices, performance tuning, y features avanzados. Incluye sesión de Q&A con expertos.',
    '2025-12-20 18:30:00-05',
    'Auditorio Universidad Central',
    80,
    NULL
),
(
    'g6fff99-9c0b-4ef8-bb6d-6bb9bd380a17',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Evento Lleno - Prueba de Cupos',
    'Este evento está configurado para probar el límite de asistentes y mensajes de "evento lleno".',
    '2025-12-10 10:00:00-05',
    'Sala de Conferencias',
    2,  -- Solo 2 cupos para probar límites
    NULL
);

-- =============================================
-- Insert Attendees
-- =============================================
INSERT INTO attendees (event_id, full_name, email) VALUES
-- Conferencia de Tecnología
('d3ffd99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Carlos Rodríguez', 'carlos@email.com'),
('d3ffd99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Ana Martínez', 'ana.martinez@corp.com'),
('d3ffd99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Pedro López', 'pedro.lopez@tech.co'),

-- Taller de React
('e4ffe99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Laura García', 'laura.garcia@dev.com'),
('e4ffe99-9c0b-4ef8-bb6d-6bb9bd380a15', 'David Smith', 'david.smith@web.com'),

-- Meetup PostgreSQL
('f5fff99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Sofía Ramírez', 'sofia.ramirez@data.com'),

-- Evento Lleno (usar para probar límites)
('g6fff99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Usuario Prueba 1', 'test1@email.com'),
('g6fff99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Usuario Prueba 2', 'test2@email.com');

-- =============================================
-- Verification Queries
-- =============================================

-- Verificar datos insertados
SELECT 'Organizers:' as verification;
SELECT id, email, full_name FROM organizers;

SELECT 'Events:' as verification;
SELECT id, title, max_attendees FROM events;

SELECT 'Attendees count per event:' as verification;
SELECT e.title, COUNT(a.id) as attendee_count
FROM events e
LEFT JOIN attendees a ON e.id = a.event_id
GROUP BY e.id, e.title;

SELECT 'Event Summary View:' as verification;
SELECT title, organizer_name, current_attendees, remaining_slots, registration_status
FROM event_summary;

-- Probar función de validación de registro
SELECT 'Registration Validation Test:' as verification;
SELECT * FROM can_register_to_event('g6fff99-9c0b-4ef8-bb6d-6bb9bd380a17', 'test3@email.com');