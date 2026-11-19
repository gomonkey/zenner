-- Seed sample reminders, timeblocks, and tasks for default dev user
DO $$
DECLARE
    v_user_id UUID := '00000000-0000-0000-0000-000000000001';
    v_day_id UUID;
    v_tb1 UUID;
    v_tb2 UUID;
    v_tb3 UUID;
    v_rem1 UUID := '10000000-0000-0000-0000-000000000001';
    v_rem2 UUID := '10000000-0000-0000-0000-000000000002';
    v_rem3 UUID := '10000000-0000-0000-0000-000000000003';
    v_rem4 UUID := '10000000-0000-0000-0000-000000000004';
BEGIN
    -- 1. Ensure reminders exist
    INSERT INTO reminders (id, user_id, content, created_at, updated_at)
    VALUES
        (v_rem1, v_user_id, 'Morning meditation (10m)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (v_rem2, v_user_id, 'Drink 2L of water', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (v_rem3, v_user_id, 'Read 20 pages', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (v_rem4, v_user_id, 'No screen 30m before sleep', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (content) DO NOTHING;

    -- 2. Ensure day exists for today
    SELECT id INTO v_day_id FROM days WHERE user_id = v_user_id AND date = CURRENT_DATE;
    IF v_day_id IS NULL THEN
        v_day_id := '20000000-0000-0000-0000-000000000001';
        INSERT INTO days (id, user_id, date, blocked, created_at, updated_at)
        VALUES (v_day_id, v_user_id, CURRENT_DATE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- 3. Seed reminder responses
    INSERT INTO reminder_responses (id, day_id, reminder_id, completed, note, answered_at)
    VALUES
        (gen_random_uuid(), v_day_id, v_rem1, TRUE, 'Felt very focused', CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_day_id, v_rem2, TRUE, 'Finished bottle at 3pm', CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_day_id, v_rem3, FALSE, NULL, NULL),
        (gen_random_uuid(), v_day_id, v_rem4, FALSE, NULL, NULL)
    ON CONFLICT (day_id, reminder_id) DO UPDATE
        SET completed = EXCLUDED.completed, note = EXCLUDED.note;

    -- 4. Seed timeblocks if day has no timeblocks
    IF NOT EXISTS (SELECT 1 FROM timeblocks WHERE day_id = v_day_id) THEN
        v_tb1 := gen_random_uuid();
        v_tb2 := gen_random_uuid();
        v_tb3 := gen_random_uuid();

        INSERT INTO timeblocks (id, day_id, title, finished, start_time, end_time, created_at, updated_at)
        VALUES
            (v_tb1, v_day_id, 'Deep Work: Architecture Design', TRUE, '08:00:00', '10:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (v_tb2, v_day_id, 'Core Team Sync & Code Review', TRUE, '10:30:00', '11:45:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (v_tb3, v_day_id, 'Client-Server Feature Integration', FALSE, '14:00:00', '16:00:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

        INSERT INTO timeblock_items (id, timeblock_id, detail, finished, created_at, updated_at)
        VALUES
            (gen_random_uuid(), v_tb1, 'Review ADR 0004 client API architecture', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid(), v_tb1, 'Draft data models and Zod schemas', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid(), v_tb2, 'Review monolithic schema consolidation', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid(), v_tb3, 'Verify end-to-end API calls through Vite proxy', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid(), v_tb3, 'Wire live React Query hooks into Home dashboard', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;

    -- 5. Seed tasks across Eisenhower quadrants
    IF NOT EXISTS (SELECT 1 FROM tasks WHERE day_id = v_day_id) THEN
        INSERT INTO tasks (id, day_id, detail, action, scheduled_time, finished, delegated_to, created_at, updated_at)
        VALUES
            -- DO quadrant
            (gen_random_uuid(), v_day_id, 'Finalize API client interceptor and dev fallback', 'DO', CURRENT_TIMESTAMP, TRUE, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid(), v_day_id, 'Run full verification suite on backend and client', 'DO', CURRENT_TIMESTAMP, FALSE, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            -- SCHEDULE quadrant
            (gen_random_uuid(), v_day_id, 'Database index and query plan optimization', 'SCHEDULE', CURRENT_TIMESTAMP + INTERVAL '1 day', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid(), v_day_id, 'Review Q1 roadmap presentation slides', 'SCHEDULE', CURRENT_TIMESTAMP + INTERVAL '2 days', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            -- DELEGATE quadrant
            (gen_random_uuid(), v_day_id, 'Set up staging environment secrets', 'DELEGATE', NULL, NULL, 'DevOps Team', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid(), v_day_id, 'Audit color tokens and typography scale', 'DELEGATE', NULL, NULL, 'Design Guild', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            -- DELETE quadrant
            (gen_random_uuid(), v_day_id, 'Legacy monolithic XML report generator', 'DELETE', NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid(), v_day_id, 'Deprecate old mockData references', 'DELETE', NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;
END $$;
