-- Create schema for zenner backend (PRODUCTION)
-- This runs once when the postgres container is first initialized
-- User: zenner (from .env.prod)

CREATE SCHEMA IF NOT EXISTS zenner_core;

-- Grant privileges to zenner user
GRANT ALL PRIVILEGES ON SCHEMA zenner_core TO zenner;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA zenner_core GRANT ALL ON TABLES TO zenner;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Schema zenner_core created successfully for user zenner';
END $$;
