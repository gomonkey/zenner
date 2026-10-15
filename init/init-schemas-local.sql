-- Create schemas for zenner microservices (LOCAL DEVELOPMENT)
-- This runs once when the postgres container is first initialized
-- User: zenner_dev (from .env.local)

CREATE SCHEMA IF NOT EXISTS zenner_core;
CREATE SCHEMA IF NOT EXISTS zenner_auth;

-- Grant privileges to zenner_dev user
GRANT ALL PRIVILEGES ON SCHEMA zenner_core TO zenner_dev;
GRANT ALL PRIVILEGES ON SCHEMA zenner_auth TO zenner_dev;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA zenner_core GRANT ALL ON TABLES TO zenner_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA zenner_auth GRANT ALL ON TABLES TO zenner_dev;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Schemas zenner_core and zenner_auth created successfully for user zenner_dev';
END $$;
