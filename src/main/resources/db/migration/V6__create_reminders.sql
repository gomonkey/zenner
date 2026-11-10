CREATE TABLE zenner_core.reminders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    content VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);