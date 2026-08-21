-- =========================================================
-- TRANSACTIONS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.transactions (
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

CREATE TABLE IF NOT EXISTS public.transaction_items (
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

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_transactions_patient ON public.transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking ON public.transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx ON public.transaction_items(transaction_id);
