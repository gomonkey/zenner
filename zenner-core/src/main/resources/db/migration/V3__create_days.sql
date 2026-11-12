CREATE TABLE zenner_core.days (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_days_user
        FOREIGN KEY (user_id)
        REFERENCES zenner_core.users (id)
        ON DELETE CASCADE,

    CONSTRAINT uq_days_user_date
        UNIQUE (user_id, date)
);