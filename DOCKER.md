# Zenner Docker Setup

This directory contains Docker configurations for the Zenner backend.

## Architecture

- **PostgreSQL 17 database** with single schema:
  - `zenner_core` - Monolithic backend schema
- The backend service connects to the database via `DATABASE_SCHEMA=zenner_core`.

## Local Development

### Start the database

```bash
# From the zenner root directory
scripts/docker-local.sh up
```

This will:
- Start PostgreSQL on `localhost:5433`
- Create database `zenner_dev`
- Initialize `zenner_core` schema
- Persist data in the `postgres_data_dev` volume

### Connect from the backend

The backend service (`zenner-core`) uses these connection settings in `.env.local`:

```env
SERVER_PORT=8080
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=zenner_dev
DATABASE_SCHEMA=zenner_core
DATABASE_USERNAME=zenner_dev
DATABASE_PASSWORD=Zenner!2026
```

### Stop the database

```bash
scripts/docker-local.sh down
```

### Reset the database

```bash
# WARNING: This deletes all data
scripts/docker-local.sh clean
scripts/docker-local.sh up
```

## Production

For production deployment:

1. **PostgreSQL 17** with database `zenner` and schema `zenner_core`
2. Backend service running on port 8080
3. Schema migrations handled automatically by Flyway on startup

## Files

- `docker/docker-compose.local.yml` - Local development PostgreSQL container
- `docker/docker-compose.prod.yml` - Production stack (Postgres + backend service)
- `init/init-schemas-local.sql` - Local schema initialization script
- `init/init-schemas-prod.sql` - Production schema initialization script
- `scripts/docker-local.sh` - Local docker helper script
- `scripts/docker-prod.sh` - Production docker helper script
- `scripts/run-core.sh` - Run backend service locally via Maven
