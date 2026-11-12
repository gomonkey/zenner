CREATE TABLE zenner_core.timeblocks (
    id UUID PRIMARY KEY,
    day_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    finished BOOLEAN NOT NULL DEFAULT FALSE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_timeblocks_day
        FOREIGN KEY (day_id)
        REFERENCES zenner_core.days (id)
        ON DELETE CASCADE,

    CONSTRAINT chk_timeblocks_valid_time
        CHECK (start_time < end_time)
);