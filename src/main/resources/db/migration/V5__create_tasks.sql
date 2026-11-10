CREATE TABLE zenner_core.tasks (
    id UUID PRIMARY KEY,
    day_id UUID NOT NULL,
    detail VARCHAR(255) NOT NULL,
    action VARCHAR(16) NOT NULL,
    scheduled_time TIMESTAMP,
    finished BOOLEAN,
    delegated_to VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_tasks_day
        FOREIGN KEY (day_id)
        REFERENCES zenner_core.days (id)
        ON DELETE CASCADE,

    CONSTRAINT chk_tasks_action
        CHECK (
            action IN (
                'DO',
                'SCHEDULE',
                'DELEGATE',
                'DELETE'
            )
        ),

    CONSTRAINT chk_tasks_action_fields
        CHECK (
            (action = 'DO'
                AND scheduled_time IS NOT NULL
                AND finished IS NOT NULL
                AND delegated_to IS NULL)
            OR
            (action = 'SCHEDULE'
                AND scheduled_time IS NOT NULL
                AND finished IS NULL
                AND delegated_to IS NULL)
            OR
            (action = 'DELEGATE'
                AND scheduled_time IS NULL
                AND finished IS NULL
                AND delegated_to IS NOT NULL)
            OR
            (action = 'DELETE'
                AND scheduled_time IS NULL
                AND finished IS NULL
                AND delegated_to IS NULL)
        )
);
