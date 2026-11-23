CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =========================================================
-- PUBLIC SCHEMA
-- =========================================================

-- =========================================================
-- CLINIC / COMPANY PROFILE
-- =========================================================

CREATE TABLE public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL UNIQUE,

    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE,

    description TEXT,

    phone_number VARCHAR(30),
    whatsapp_number VARCHAR(30),
    email VARCHAR(255),

    address TEXT,
    google_maps_url TEXT,

    logo_url TEXT,
    favicon_url TEXT,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);


-- =========================================================
-- DOCTORS
-- =========================================================

CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    clinic_id UUID,

    code VARCHAR(50) NOT NULL UNIQUE,

    name VARCHAR(150) NOT NULL,

    title VARCHAR(100),
    specialization VARCHAR(150),

    registration_number VARCHAR(100),

    description TEXT,
    profile_image_url TEXT,
    email VARCHAR(255),
    phone VARCHAR(30),
    shift_start VARCHAR(10) DEFAULT '09:00',
    shift_end VARCHAR(10) DEFAULT '17:00',
    status VARCHAR(50) DEFAULT 'Active',
    appointments_count INTEGER DEFAULT 0,
    rating NUMERIC(3,1) DEFAULT 5.0,
    days TEXT,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);


-- =========================================================
-- SERVICES / TREATMENTS
-- =========================================================

CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    clinic_id UUID,

    code VARCHAR(50) NOT NULL UNIQUE,

    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150),

    short_description VARCHAR(500),
    description TEXT,

    duration_minutes INTEGER NOT NULL DEFAULT 30,

    price_from NUMERIC(15,2),
    price_to NUMERIC(15,2),

    image_url TEXT,

    display_order INTEGER NOT NULL DEFAULT 0,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,

    UNIQUE (clinic_id, slug)
);


-- =========================================================
-- DOCTOR - SERVICE MAPPING
-- =========================================================

CREATE TABLE public.doctor_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    doctor_id UUID NOT NULL,
    service_id UUID NOT NULL,

    custom_duration_minutes INTEGER,
    custom_price_from NUMERIC(15,2),
    custom_price_to NUMERIC(15,2),

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,

    UNIQUE (doctor_id, service_id)
);


-- =========================================================
-- DOCTOR WEEKLY SCHEDULE
-- day_of_week:
-- 0 = Sunday
-- 1 = Monday
-- ...
-- 6 = Saturday
-- =========================================================

CREATE TABLE public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    doctor_id UUID NOT NULL,

    day_of_week SMALLINT NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    slot_duration_minutes INTEGER NOT NULL DEFAULT 30,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,

    CHECK (day_of_week BETWEEN 0 AND 6),

    CHECK (end_time > start_time)
);


-- =========================================================
-- SCHEDULE EXCEPTIONS
--
-- Type example:
-- UNAVAILABLE
-- CUSTOM_HOURS
-- HOLIDAY
-- =========================================================

CREATE TABLE public.schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    doctor_id UUID,

    exception_date DATE NOT NULL,

    type_code VARCHAR(30) NOT NULL,

    start_time TIME,
    end_time TIME,

    reason TEXT,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);


-- =========================================================
-- PATIENTS
-- =========================================================

CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_code VARCHAR(50) UNIQUE,

    full_name VARCHAR(150) NOT NULL,

    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(255),

    date_of_birth DATE,

    gender_code VARCHAR(20),

    notes TEXT,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);


-- =========================================================
-- BOOKINGS
-- =========================================================

CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_code VARCHAR(50) NOT NULL UNIQUE,

    clinic_id UUID,

    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    service_id UUID NOT NULL,

    booking_date DATE NOT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    status_code VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    source_code VARCHAR(30) NOT NULL DEFAULT 'WEBSITE',

    patient_notes TEXT,
    admin_notes TEXT,

    cancellation_reason TEXT,

    confirmed_at TIMESTAMPTZ,
    checked_in_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,

    CHECK (end_time > start_time),
    CONSTRAINT bookings_doctor_time_exclusion EXCLUDE USING gist (
        doctor_id WITH =,
        tsrange(booking_date + start_time, booking_date + end_time, '[)') WITH &&
    ) WHERE (enabled = 1 AND deleted = 0 AND status_code <> 'CANCELLED')
);


-- =========================================================
-- BOOKING STATUS HISTORY
-- =========================================================

CREATE TABLE public.booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL,

    previous_status_code VARCHAR(30),
    new_status_code VARCHAR(30) NOT NULL,

    notes TEXT,

    changed_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- WHATSAPP MESSAGE LOG
-- =========================================================

CREATE TABLE public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID,
    patient_id UUID,

    recipient_number VARCHAR(30) NOT NULL,

    message_type_code VARCHAR(50) NOT NULL,

    template_name VARCHAR(150),

    message TEXT,

    provider_message_id VARCHAR(255),

    status_code VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,

    failure_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- COMPANY CONTENT
-- For editable company profile
-- =========================================================

CREATE TABLE public.company_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    clinic_id UUID NOT NULL,

    section_code VARCHAR(100) NOT NULL,

    title VARCHAR(255),
    subtitle VARCHAR(255),

    content TEXT,

    image_url TEXT,

    button_label VARCHAR(100),
    button_url TEXT,

    display_order INTEGER NOT NULL DEFAULT 0,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);


-- =========================================================
-- WEBSITE BANNERS
-- =========================================================

CREATE TABLE public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    clinic_id UUID NOT NULL,

    code VARCHAR(50) NOT NULL UNIQUE,

    title VARCHAR(255),
    subtitle VARCHAR(500),

    image_url TEXT NOT NULL,

    button_label VARCHAR(100),
    button_url TEXT,

    display_order INTEGER NOT NULL DEFAULT 0,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);


-- =========================================================
-- CONTACT / INQUIRIES
-- =========================================================

CREATE TABLE public.contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    clinic_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255),
    phone_number VARCHAR(30),

    subject VARCHAR(255),

    message TEXT NOT NULL,

    status_code VARCHAR(30) NOT NULL DEFAULT 'NEW',

    replied_by UUID,
    replied_at TIMESTAMPTZ,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);


-- =========================================================
-- APP SETTINGS
-- =========================================================

CREATE TABLE public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    clinic_id UUID,

    setting_code VARCHAR(100) NOT NULL,

    setting_value TEXT,

    description TEXT,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID,

    UNIQUE (clinic_id, setting_code)
);

CREATE UNIQUE INDEX app_settings_global_portal_config
    ON public.app_settings (setting_code)
    WHERE clinic_id IS NULL AND setting_code = 'PORTAL_CONFIG';

-- Create public.employees table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    role_code VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- TRANSACTIONS
-- =========================================================

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transaction_code VARCHAR(50) NOT NULL UNIQUE,

    clinic_id UUID,
    booking_id UUID,
    patient_id UUID NOT NULL,
    doctor_id UUID,

    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount NUMERIC(15,2) NOT NULL DEFAULT 0,
    tax NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,

    payment_method VARCHAR(50), -- CASH, DEBIT_CARD, CREDIT_CARD, QRIS, BANK_TRANSFER
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID', -- UNPAID, PAID, CANCELLED

    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,

    enabled SMALLINT NOT NULL DEFAULT 1,
    deleted SMALLINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID
);

-- =========================================================
-- TRANSACTION ITEMS
-- =========================================================

CREATE TABLE public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transaction_id UUID NOT NULL,
    service_id UUID, -- Optional: links to a registered service/treatment

    name VARCHAR(150) NOT NULL,
    price NUMERIC(15,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(15,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create public.absences table
CREATE TABLE public.absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    clock_in_location VARCHAR(255),
    clock_out_location VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- 'PRESENT' or 'LATE'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date)
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_doctors_clinic
    ON public.doctors(clinic_id);

CREATE INDEX idx_services_clinic
    ON public.services(clinic_id);

CREATE INDEX idx_doctor_services_doctor
    ON public.doctor_services(doctor_id);

CREATE INDEX idx_doctor_services_service
    ON public.doctor_services(service_id);

CREATE INDEX idx_doctor_schedules_doctor
    ON public.doctor_schedules(doctor_id);

CREATE INDEX idx_schedule_exception_doctor_date
    ON public.schedule_exceptions(
        doctor_id,
        exception_date
    );

CREATE INDEX idx_patients_phone
    ON public.patients(phone_number);

CREATE INDEX idx_bookings_clinic
    ON public.bookings(clinic_id);

CREATE INDEX idx_bookings_patient
    ON public.bookings(patient_id);

CREATE INDEX idx_bookings_doctor
    ON public.bookings(doctor_id);

CREATE INDEX idx_bookings_service
    ON public.bookings(service_id);

CREATE INDEX idx_bookings_date
    ON public.bookings(booking_date);

CREATE INDEX idx_bookings_doctor_date
    ON public.bookings(
        doctor_id,
        booking_date
    );

CREATE INDEX idx_bookings_status
    ON public.bookings(status_code);

CREATE INDEX idx_booking_history_booking
    ON public.booking_status_history(booking_id);

CREATE INDEX idx_whatsapp_booking
    ON public.whatsapp_messages(booking_id);

CREATE INDEX idx_whatsapp_patient
    ON public.whatsapp_messages(patient_id);

CREATE INDEX idx_company_contents_clinic
    ON public.company_contents(clinic_id);

CREATE INDEX idx_contact_inquiries_clinic
    ON public.contact_inquiries(clinic_id);

CREATE INDEX idx_employees_email ON public.employees(email);

CREATE INDEX idx_transactions_patient ON public.transactions(patient_id);
CREATE INDEX idx_transactions_booking ON public.transactions(booking_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transaction_items_tx ON public.transaction_items(transaction_id);

CREATE INDEX idx_absences_user_date ON public.absences(user_id, date);
