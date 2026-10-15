-- Create schemas for zenner microservices (PRODUCTION)
-- This runs once when the postgres container is first initialized
-- User: zenner (from .env.prod)

CREATE SCHEMA IF NOT EXISTS zenner_core;
CREATE SCHEMA IF NOT EXISTS zenner_auth;

-- Grant privileges to zenner user
GRANT ALL PRIVILEGES ON SCHEMA zenner_core TO zenner;
GRANT ALL PRIVILEGES ON SCHEMA zenner_auth TO zenner;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA zenner_core GRANT ALL ON TABLES TO zenner;
ALTER DEFAULT PRIVILEGES IN SCHEMA zenner_auth GRANT ALL ON TABLES TO zenner;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Schemas zenner_core and zenner_auth created successfully for user zenner';
END $$;
