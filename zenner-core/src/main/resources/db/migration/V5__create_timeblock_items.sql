CREATE TABLE zenner_core.timeblock_items (
    id UUID PRIMARY KEY,
    timeblock_id UUID NOT NULL,
    detail TEXT NOT NULL,
    finished BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_timeblock_items_timeblock
        FOREIGN KEY (timeblock_id)
        REFERENCES zenner_core.timeblocks (id)
        ON DELETE CASCADE
);