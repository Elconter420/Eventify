-- =============================================
-- EventFlow Database Schema
-- PostgreSQL 16+
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TABLE: organizers
-- =============================================
CREATE TABLE organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: events
-- =============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    location VARCHAR(255),
    max_attendees INTEGER NOT NULL CHECK (max_attendees > 0),
    cover_image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Business logic constraints
    CONSTRAINT chk_event_date_future CHECK (date > NOW()),
    CONSTRAINT chk_max_attendees_reasonable CHECK (max_attendees <= 10000)
);

-- =============================================
-- TABLE: attendees
-- =============================================
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One email per event constraint
    CONSTRAINT unique_email_per_event UNIQUE (event_id, email)
);

-- =============================================
-- INDEXES for Performance
-- =============================================

-- Organizers indexes
CREATE INDEX idx_organizers_email ON organizers(email);
CREATE INDEX idx_organizers_created_at ON organizers(created_at);

-- Events indexes
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_is_active ON events(is_active);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_date_active ON events(date) WHERE is_active = true;

-- Attendees indexes
CREATE INDEX idx_attendees_event_id ON attendees(event_id);
CREATE INDEX idx_attendees_email ON attendees(email);
CREATE INDEX idx_attendees_created_at ON attendees(created_at);

-- =============================================
-- TRIGGERS for updated_at automation
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for organizers table
CREATE TRIGGER update_organizers_updated_at 
    BEFORE UPDATE ON organizers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for events table
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS for common queries
-- =============================================

-- Event summary view with calculated fields
CREATE VIEW event_summary AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.date,
    e.location,
    e.max_attendees,
    e.cover_image,
    e.is_active,
    e.created_at as event_created,
    o.id as organizer_id,
    o.full_name as organizer_name,
    o.email as organizer_email,
    COUNT(a.id) as current_attendees,
    (e.max_attendees - COUNT(a.id)) as remaining_slots,
    (CASE 
        WHEN e.date <= NOW() THEN 'past'
        WHEN COUNT(a.id) >= e.max_attendees THEN 'full'
        WHEN e.date <= NOW() + INTERVAL '1 day' THEN 'closing_soon'
        ELSE 'open'
    END) as registration_status
FROM events e
LEFT JOIN organizers o ON e.organizer_id = o.id
LEFT JOIN attendees a ON e.id = a.event_id
WHERE e.is_active = true
GROUP BY e.id, o.id;

-- =============================================
-- FUNCTIONS for business logic
-- =============================================

-- Function to check if event can accept more attendees
CREATE OR REPLACE FUNCTION can_register_to_event(
    p_event_id UUID,
    p_email VARCHAR
)
RETURNS TABLE(
    can_register BOOLEAN,
    reason TEXT
) AS $$
DECLARE
    event_record RECORD;
    existing_attendee_count INTEGER;
    is_email_registered BOOLEAN;
BEGIN
    -- Get event details
    SELECT * INTO event_record 
    FROM events 
    WHERE id = p_event_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Event not found or inactive';
        RETURN;
    END IF;
    
    -- Check if event date is valid (more than 1 day in future)
    IF event_record.date <= NOW() + INTERVAL '1 day' THEN
        RETURN QUERY SELECT false, 'Registration closed - event is too soon';
        RETURN;
    END IF;
    
    -- Check if email already registered
    SELECT EXISTS(
        SELECT 1 FROM attendees 
        WHERE event_id = p_event_id AND email = p_email
    ) INTO is_email_registered;
    
    IF is_email_registered THEN
        RETURN QUERY SELECT false, 'Email already registered for this event';
        RETURN;
    END IF;
    
    -- Check current attendee count
    SELECT COUNT(*) INTO existing_attendee_count
    FROM attendees 
    WHERE event_id = p_event_id;
    
    IF existing_attendee_count >= event_record.max_attendees THEN
        RETURN QUERY SELECT false, 'Event is full';
        RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'Can register';
END;
$$ LANGUAGE plpgsql;