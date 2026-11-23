CREATE SCHEMA IF NOT EXISTS logging;

CREATE TABLE logging.events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
    event TEXT NOT NULL,
    request_id UUID,
    method TEXT,
    route TEXT,
    http_status SMALLINT,
    duration_ms DOUBLE PRECISION,
    error_type TEXT
);

CREATE INDEX idx_logging_events_occurred_at
    ON logging.events (occurred_at DESC);
