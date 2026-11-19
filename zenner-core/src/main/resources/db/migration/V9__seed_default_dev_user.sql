-- Seed default development user for unauthenticated / local testing
-- Matches DEFAULT_DEV_USER_ID: 00000000-0000-0000-0000-000000000001
INSERT INTO users (id, email, first_name, last_name, is_active, is_email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'dev@zenner.local',
    'Dev',
    'User',
    TRUE,
    TRUE
)
ON CONFLICT (id) DO NOTHING;
