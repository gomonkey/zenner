CREATE TABLE zenner_core.reminder_responses (
    id UUID PRIMARY KEY,
    day_id UUID NOT NULL,
    reminder_id UUID NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT,
    answered_at TIMESTAMP,

    CONSTRAINT fk_reminder_responses_key
        FOREIGN KEY (day_id)
        REFERENCES zenner_core.days (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reminder_responses_reminder
        FOREIGN KEY (reminder_id)
        REFERENCES zenner_core.reminders (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_reminder_response
        UNIQUE (day_id, reminder_id)
);