-- SCHEMA FOR HOTEL MANAGEMENT SYSTEM
-- This file defines all the tables needed for the system

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions (for password hashing)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM TYPES
CREATE TYPE user_role AS ENUM ('admin', 'agent');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded');
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'cleaning');
CREATE TYPE cleaning_status AS ENUM ('pending', 'in_progress', 'completed', 'verified');
CREATE TYPE expense_category AS ENUM ('utilities', 'maintenance', 'supplies', 'personnel', 'marketing', 'taxes', 'insurance', 'other');

-- USERS TABLE (STAFF USERS)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Plain text password for development
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    status BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- OWNERS TABLE
CREATE TABLE owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Plain text password for development
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    notes TEXT,
    birth_date DATE,
    citizenship VARCHAR(100),
    avatar_url TEXT,
    joined_date DATE DEFAULT CURRENT_DATE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- OWNER FINANCIAL INFO
CREATE TABLE owner_financial_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    payment_method VARCHAR(50),
    bank_name VARCHAR(255),
    account_number VARCHAR(255),
    iban VARCHAR(255),
    swift VARCHAR(255),
    tax_id VARCHAR(255),
    tax_residence VARCHAR(100),
    commission_rate DECIMAL(5, 2) DEFAULT 10.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PROPERTIES TABLE
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    description TEXT,
    amenities JSONB,
    active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ROOM TYPES TABLE
CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    description TEXT,
    base_rate DECIMAL(10, 2) NOT NULL,
    max_occupancy INTEGER NOT NULL DEFAULT 2,
    features JSONB,
    image_urls TEXT[],
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ROOMS TABLE
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(20) NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_type_id UUID NOT NULL REFERENCES room_types(id),
    status room_status DEFAULT 'available',
    floor VARCHAR(20),
    size INTEGER, -- Size in square feet/meters
    description TEXT,
    max_adults INTEGER DEFAULT 2,
    max_children INTEGER DEFAULT 0,
    base_rate DECIMAL(10, 2),
    active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    amenities JSONB,
    image_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (number, property_id)
);

-- ROOM OWNER ASSIGNMENTS
CREATE TABLE room_owner_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    UNIQUE (room_id, owner_id)
);

-- GUESTS TABLE
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    nationality VARCHAR(100),
    passport_number VARCHAR(100),
    id_document_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BOOKINGS TABLE
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(50) NOT NULL UNIQUE,
    room_id UUID NOT NULL REFERENCES rooms(id),
    guest_id UUID NOT NULL REFERENCES guests(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER NOT NULL DEFAULT 0,
    base_rate DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    security_deposit DECIMAL(10, 2) DEFAULT 0,
    commission DECIMAL(10, 2) NOT NULL,
    tourism_fee DECIMAL(10, 2) DEFAULT 0,
    vat DECIMAL(10, 2) DEFAULT 0,
    net_to_owner DECIMAL(10, 2) NOT NULL,
    status booking_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    pending_amount DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount + security_deposit - amount_paid) STORED,
    notes TEXT,
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- PAYMENTS TABLE
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- EXPENSES TABLE
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    category expense_category NOT NULL,
    property_id UUID REFERENCES properties(id),
    room_id UUID REFERENCES rooms(id),
    owner_id UUID REFERENCES owners(id),
    vendor VARCHAR(255),
    payment_method VARCHAR(50),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- CLEANING TASKS TABLE
CREATE TABLE cleaning_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    status cleaning_status DEFAULT 'pending',
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- CLEANING CHECKLIST ITEMS
CREATE TABLE cleaning_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES cleaning_tasks(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ROOM AVAILABILITY TABLE
CREATE TABLE room_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status room_status DEFAULT 'available',
    booking_id UUID REFERENCES bookings(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (room_id, date)
);

-- MAINTENANCE RECORDS
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to VARCHAR(255),
    resolved_date DATE,
    resolution_notes TEXT,
    cost DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    owner_id UUID REFERENCES owners(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- SETTINGS TABLE
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    currency_format VARCHAR(5) DEFAULT 'USD',
    email_notifications BOOLEAN DEFAULT TRUE,
    auto_checkout BOOLEAN DEFAULT TRUE,
    default_check_in_time TIME DEFAULT '14:00',
    default_check_out_time TIME DEFAULT '11:00',
    default_tax_rate DECIMAL(5, 2) DEFAULT 7.50,
    reminder_days INTEGER DEFAULT 1,
    booking_confirmation_template TEXT,
    check_in_reminder_template TEXT,
    check_out_reminder_template TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- EMAIL TEMPLATES
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    variables JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- SMS TEMPLATES
CREATE TABLE sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update timestamps on all tables
DO $$
DECLARE
    table_names TEXT[] := ARRAY['users', 'owners', 'owner_financial_info', 'properties', 'room_types', 'rooms', 
                                'bookings', 'expenses', 'cleaning_tasks', 'maintenance_records', 'email_templates',
                                'sms_templates', 'settings'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_names LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_timestamp
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        ', table_name, table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to log audit records
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
    old_values JSONB := NULL;
    new_values JSONB := NULL;
    user_id UUID := NULL;
BEGIN
    -- In a real application, you would get the current user ID from a session variable
    -- For now, we'll leave it as NULL

    IF TG_OP = 'DELETE' THEN
        old_values := to_jsonb(OLD);
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
        VALUES (user_id, 'DELETE', TG_TABLE_NAME, OLD.id, old_values);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (user_id, 'UPDATE', TG_TABLE_NAME, NEW.id, old_values, new_values);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        new_values := to_jsonb(NEW);
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
        VALUES (user_id, 'INSERT', TG_TABLE_NAME, NEW.id, new_values);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit log triggers for important tables
DO $$
DECLARE
    audit_tables TEXT[] := ARRAY['users', 'owners', 'properties', 'rooms', 'bookings', 'expenses'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY audit_tables LOOP
        EXECUTE format('
            CREATE TRIGGER audit_%I_changes
            AFTER INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION log_audit();
        ', table_name, table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a view for owner dashboard
CREATE VIEW owner_room_bookings AS
SELECT
    o.id AS owner_id,
    o.first_name || ' ' || o.last_name AS owner_name,
    o.email AS owner_email,
    p.id AS property_id,
    p.name AS property_name,
    r.id AS room_id,
    r.number AS room_number,
    b.id AS booking_id,
    b.reference AS booking_reference,
    g.first_name || ' ' || g.last_name AS guest_name,
    b.check_in_date,
    b.check_out_date,
    b.total_amount,
    b.net_to_owner,
    b.status AS booking_status,
    b.payment_status,
    b.created_at AS booking_created_at
FROM
    owners o
JOIN
    room_owner_assignments roa ON o.id = roa.owner_id
JOIN
    rooms r ON roa.room_id = r.id
JOIN
    properties p ON r.property_id = p.id
LEFT JOIN
    bookings b ON r.id = b.room_id
LEFT JOIN
    guests g ON b.guest_id = g.id
WHERE
    roa.active = TRUE;

-- Create a view for cleaning status dashboard
CREATE VIEW room_cleaning_status AS
SELECT
    r.id AS room_id,
    r.number AS room_number,
    p.id AS property_id,
    p.name AS property_name,
    ct.id AS task_id,
    ct.scheduled_date,
    ct.status AS cleaning_status,
    u.id AS cleaner_id,
    u.first_name || ' ' || u.last_name AS cleaner_name,
    b.check_out_date AS last_checkout,
    b.check_in_date AS next_checkin
FROM
    rooms r
JOIN
    properties p ON r.property_id = p.id
LEFT JOIN
    cleaning_tasks ct ON r.id = ct.room_id AND ct.scheduled_date >= CURRENT_DATE
LEFT JOIN
    users u ON ct.assigned_to = u.id
LEFT JOIN
    bookings b ON r.id = b.room_id AND 
    (b.check_out_date = CURRENT_DATE OR 
     (b.check_in_date >= CURRENT_DATE AND b.check_in_date = (
         SELECT MIN(check_in_date) 
         FROM bookings 
         WHERE room_id = r.id AND check_in_date >= CURRENT_DATE
     )))
ORDER BY
    p.name, r.number, ct.scheduled_date;

-- Insert default settings
INSERT INTO settings (
    company_name, company_email, date_format, currency_format
) VALUES (
    'Bookopia Hotel Management', 'info@bookopia.com', 'MM/DD/YYYY', 'USD'
);

-- Insert demo admin user with plain text password (password: Admin123!)
INSERT INTO users (email, password, first_name, last_name, role)
VALUES ('admin@example.com', 'Admin123!', 'Admin', 'User', 'admin');

-- Insert demo agent user with plain text password (password: Agent123!)
INSERT INTO users (email, password, first_name, last_name, role)
VALUES ('agent@example.com', 'Agent123!', 'Agent', 'User', 'agent');

-- Insert demo properties
INSERT INTO properties (name, address, city, state, zip_code, country, phone, email, description)
VALUES 
('Marina Bay Resort', '123 Marina Bay Road', 'Dubai', 'Dubai', '12345', 'United Arab Emirates', '+971-4-123-4567', 'info@marinabay.com', 'Luxury resort overlooking the marina'),
('Palm Residences', '456 Palm Avenue', 'Dubai', 'Dubai', '23456', 'United Arab Emirates', '+971-4-234-5678', 'info@palmresidences.com', 'Exclusive apartments on the Palm'),
('Downtown Suites', '789 Sheikh Zayed Road', 'Dubai', 'Dubai', '34567', 'United Arab Emirates', '+971-4-345-6789', 'info@downtownsuites.com', 'Modern suites in the heart of Downtown Dubai');

-- Insert demo room types
INSERT INTO room_types (name, property_id, description, base_rate, max_occupancy, features)
VALUES 
('Standard Room', (SELECT id FROM properties WHERE name = 'Marina Bay Resort'), 'Comfortable standard room with city view', 350.00, 2, '{"wifi": true, "tv": true, "minibar": true}'),
('Deluxe Room', (SELECT id FROM properties WHERE name = 'Marina Bay Resort'), 'Spacious deluxe room with marina view', 550.00, 3, '{"wifi": true, "tv": true, "minibar": true, "balcony": true}'),
('Studio Apartment', (SELECT id FROM properties WHERE name = 'Palm Residences'), 'Modern studio apartment with kitchen', 450.00, 2, '{"wifi": true, "tv": true, "kitchen": true}'),
('One-Bedroom Apartment', (SELECT id FROM properties WHERE name = 'Palm Residences'), 'Spacious one-bedroom apartment with sea view', 650.00, 4, '{"wifi": true, "tv": true, "kitchen": true, "balcony": true}'),
('Executive Suite', (SELECT id FROM properties WHERE name = 'Downtown Suites'), 'Luxurious suite with separate living area', 750.00, 2, '{"wifi": true, "tv": true, "minibar": true, "livingRoom": true}');

-- Insert demo rooms
INSERT INTO rooms (number, property_id, room_type_id, status, floor, size, max_adults, max_children, base_rate)
VALUES 
('Marina 102', (SELECT id FROM properties WHERE name = 'Marina Bay Resort'), (SELECT id FROM room_types WHERE name = 'Standard Room' AND property_id = (SELECT id FROM properties WHERE name = 'Marina Bay Resort')), 'available', '1', 32, 2, 1, 350.00),
('Marina 202', (SELECT id FROM properties WHERE name = 'Marina Bay Resort'), (SELECT id FROM room_types WHERE name = 'Deluxe Room' AND property_id = (SELECT id FROM properties WHERE name = 'Marina Bay Resort')), 'available', '2', 45, 3, 1, 550.00),
('Palm 101', (SELECT id FROM properties WHERE name = 'Palm Residences'), (SELECT id FROM room_types WHERE name = 'Studio Apartment' AND property_id = (SELECT id FROM properties WHERE name = 'Palm Residences')), 'available', '1', 40, 2, 0, 450.00),
('Palm 201', (SELECT id FROM properties WHERE name = 'Palm Residences'), (SELECT id FROM room_types WHERE name = 'One-Bedroom Apartment' AND property_id = (SELECT id FROM properties WHERE name = 'Palm Residences')), 'available', '2', 60, 2, 2, 650.00),
('Room 868', (SELECT id FROM properties WHERE name = 'Downtown Suites'), (SELECT id FROM room_types WHERE name = 'Executive Suite' AND property_id = (SELECT id FROM properties WHERE name = 'Downtown Suites')), 'available', '8', 75, 2, 2, 750.00);

-- Insert demo owner with plain text password (password: Rehan8688@)
INSERT INTO owners (email, password, first_name, last_name, phone, address, city, state, country)
VALUES ('rehan@gmail.com', 'Rehan8688@', 'Rehan', 'Ahmed', '+971-50-123-4567', '123 Owner Street', 'Dubai', 'Dubai', 'United Arab Emirates');

-- Assign rooms to owner
INSERT INTO room_owner_assignments (room_id, owner_id, assigned_by)
VALUES 
((SELECT id FROM rooms WHERE number = 'Marina 102'), (SELECT id FROM owners WHERE email = 'rehan@gmail.com'), (SELECT id FROM users WHERE email = 'admin@example.com')),
((SELECT id FROM rooms WHERE number = 'Marina 202'), (SELECT id FROM owners WHERE email = 'rehan@gmail.com'), (SELECT id FROM users WHERE email = 'admin@example.com')),
((SELECT id FROM rooms WHERE number = 'Room 868'), (SELECT id FROM owners WHERE email = 'rehan@gmail.com'), (SELECT id FROM users WHERE email = 'admin@example.com'));

-- Insert demo guests
INSERT INTO guests (first_name, last_name, email, phone, nationality)
VALUES 
('John', 'Smith', 'johnsmith@example.com', '+1-202-555-0123', 'USA'),
('Sarah', 'Johnson', 'sarahjohnson@example.com', '+44-20-1234-5678', 'UK'),
('Ahmed', 'Al-Farsi', 'ahmed@example.com', '+971-50-123-4567', 'UAE');

-- Insert demo bookings
INSERT INTO bookings (
    reference, room_id, guest_id, check_in_date, check_out_date, 
    adults, children, base_rate, total_amount, commission, 
    tourism_fee, vat, net_to_owner, status, payment_status, 
    amount_paid, notes, created_by
)
VALUES 
(
    'BK-230501', 
    (SELECT id FROM rooms WHERE number = 'Marina 102'), 
    (SELECT id FROM guests WHERE first_name = 'John'), 
    (CURRENT_DATE + INTERVAL '1 day'), 
    (CURRENT_DATE + INTERVAL '4 days'), 
    2, 0, 350.00, 1050.00, 105.00, 
    21.00, 52.50, 871.50, 'confirmed', 'partial', 
    500.00, 'Guest arriving late evening', 
    (SELECT id FROM users WHERE email = 'admin@example.com')
),
(
    'BK-230502', 
    (SELECT id FROM rooms WHERE number = 'Marina 202'), 
    (SELECT id FROM guests WHERE first_name = 'Sarah'), 
    (CURRENT_DATE + INTERVAL '7 days'), 
    (CURRENT_DATE + INTERVAL '10 days'), 
    2, 1, 550.00, 1650.00, 165.00, 
    33.00, 82.50, 1369.50, 'confirmed', 'pending', 
    0.00, 'Requested extra bed', 
    (SELECT id FROM users WHERE email = 'agent@example.com')
),
(
    'BK-230503', 
    (SELECT id FROM rooms WHERE number = 'Room 868'), 
    (SELECT id FROM guests WHERE first_name = 'Ahmed'), 
    (CURRENT_DATE - INTERVAL '2 days'), 
    (CURRENT_DATE + INTERVAL '3 days'), 
    2, 0, 750.00, 3750.00, 375.00, 
    75.00, 187.50, 3112.50, 'checked_in', 'partial', 
    2000.00, 'Extended stay possible', 
    (SELECT id FROM users WHERE email = 'admin@example.com')
);

-- Insert demo expenses
INSERT INTO expenses (
    description, amount, date, category, property_id, vendor, payment_method, 
    notes, created_by
)
VALUES 
(
    'Monthly electricity bill', 
    1250.00, 
    CURRENT_DATE - INTERVAL '7 days', 
    'utilities', 
    (SELECT id FROM properties WHERE name = 'Marina Bay Resort'), 
    'Dubai Electricity & Water Authority', 
    'bank transfer', 
    'Includes common areas and vacant rooms', 
    (SELECT id FROM users WHERE email = 'admin@example.com')
),
(
    'AC repair in room 202', 
    450.00, 
    CURRENT_DATE - INTERVAL '3 days', 
    'maintenance', 
    (SELECT id FROM properties WHERE name = 'Marina Bay Resort'), 
    'Cool Air Services', 
    'credit card', 
    'Replaced compressor unit', 
    (SELECT id FROM users WHERE email = 'agent@example.com')
),
(
    'Quarterly pest control service', 
    800.00, 
    CURRENT_DATE - INTERVAL '14 days', 
    'maintenance', 
    (SELECT id FROM properties WHERE name = 'Palm Residences'), 
    'SafeGuard Pest Control', 
    'cash', 
    'Complete treatment for all rooms', 
    (SELECT id FROM users WHERE email = 'admin@example.com')
);

-- Insert demo cleaning tasks
INSERT INTO cleaning_tasks (
    room_id, scheduled_date, status, assigned_to, notes
)
VALUES 
(
    (SELECT id FROM rooms WHERE number = 'Marina 102'), 
    CURRENT_DATE + INTERVAL '4 days', 
    'pending',
    (SELECT id FROM users WHERE email = 'agent@example.com'),
    'Checkout cleaning, prepare for next guest'
),
(
    (SELECT id FROM rooms WHERE number = 'Marina 202'), 
    CURRENT_DATE, 
    'in_progress',
    (SELECT id FROM users WHERE email = 'agent@example.com'),
    'Deep cleaning requested'
),
(
    (SELECT id FROM rooms WHERE number = 'Room 868'), 
    CURRENT_DATE + INTERVAL '3 days', 
    'pending',
    (SELECT id FROM users WHERE email = 'agent@example.com'),
    'Checkout cleaning, VIP guest arriving same day'
);

-- Insert demo email templates
INSERT INTO email_templates (name, subject, body, variables)
VALUES 
(
    'Booking Confirmation', 
    'Your Booking Confirmation - {{booking_reference}}',
    'Dear {{guest_name}},\n\nWe are pleased to confirm your booking with reference {{booking_reference}} at {{property_name}}.\n\nCheck-in: {{check_in_date}}\nCheck-out: {{check_out_date}}\nRoom: {{room_number}}\n\nWe look forward to welcoming you!\n\nBest regards,\n{{company_name}}',
    '{"guest_name": "Guest full name", "booking_reference": "Booking reference number", "property_name": "Property name", "check_in_date": "Check-in date", "check_out_date": "Check-out date", "room_number": "Room number", "company_name": "Company name"}'
),
(
    'Payment Receipt', 
    'Payment Receipt - {{booking_reference}}',
    'Dear {{guest_name}},\n\nThank you for your payment of {{amount_paid}} {{currency}} for booking {{booking_reference}}.\n\nAmount paid: {{amount_paid}} {{currency}}\nRemaining balance: {{pending_amount}} {{currency}}\n\nIf you have any questions, please contact us.\n\nBest regards,\n{{company_name}}',
    '{"guest_name": "Guest full name", "booking_reference": "Booking reference number", "amount_paid": "Amount paid", "currency": "Currency", "pending_amount": "Pending amount", "company_name": "Company name"}'
);

-- Insert demo audit logs
INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, created_at)
VALUES
(
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'INSERT',
    'bookings',
    (SELECT id FROM bookings WHERE reference = 'BK-230501'),
    (SELECT to_jsonb(b) FROM bookings b WHERE reference = 'BK-230501'),
    '192.168.1.100',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    (SELECT id FROM users WHERE email = 'agent@example.com'),
    'INSERT',
    'bookings',
    (SELECT id FROM bookings WHERE reference = 'BK-230502'),
    (SELECT to_jsonb(b) FROM bookings b WHERE reference = 'BK-230502'),
    '192.168.1.101',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
);
