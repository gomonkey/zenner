-- Configure default public schema for zenner backend (PRODUCTION)
-- This runs once when the postgres container is first initialized
-- User: zenner (from .env.prod)

-- Grant privileges to zenner user on public schema
GRANT ALL PRIVILEGES ON SCHEMA public TO zenner;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zenner;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Public schema privileges configured successfully for user zenner';
END $$;
