-- Configure default public schema for zenner backend (LOCAL DEVELOPMENT)
-- This runs once when the postgres container is first initialized
-- User: zenner_dev (from .env.local)

-- Grant privileges to zenner_dev user on public schema
GRANT ALL PRIVILEGES ON SCHEMA public TO zenner_dev;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zenner_dev;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Public schema privileges configured successfully for user zenner_dev';
END $$;
