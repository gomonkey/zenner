# Zenner Shared Docker Compose

This directory contains the shared PostgreSQL database for all Zenner microservices.

## Architecture

- **Single PostgreSQL database** with multiple schemas:
  - `zenner_core` - Core service schema
  - `zenner_auth` - Authentication service schema
  
- Each microservice connects to the same database but uses its own schema via the `DATABASE_SCHEMA` environment variable.

## Local Development

### Start the shared database

```bash
# From the zenner root directory
docker-compose --env-file .env.local up -d
```

This will:
- Start PostgreSQL on `localhost:5433`
- Create database `zenner_dev`
- Initialize both `zenner_core` and `zenner_auth` schemas
- Persist data in the `postgres_data` volume

### Connect from microservices

Each service (zenner-core, zenner-auth) should use these connection settings in their `.env.local`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=zenner_dev
DATABASE_SCHEMA=zenner_core  # or zenner_auth
DATABASE_USERNAME=zenner_dev
DATABASE_PASSWORD=Zenner!2026
```

### Stop the database

```bash
docker-compose down
```

### Reset the database

```bash
# WARNING: This deletes all data
docker-compose down -v
docker-compose --env-file .env.local up -d
```

## Production

For production deployment to AWS:

1. **RDS PostgreSQL instance** with database `zenner`
2. Schemas `zenner_core` and `zenner_auth` created by migration scripts
3. Each ECS service connects with `DATABASE_SCHEMA` set appropriately
4. Use Secrets Manager for credentials

## Files

- `docker-compose.yml` - Shared PostgreSQL service definition
- `.env.local` - Local development environment variables
- `.env.prod` - Production environment template
- `.env.example` - Example environment file (committed to git)
- `scripts/init-schemas.sql` - Schema initialization script

## Notes

- The `.env.local` and `.env.prod` files should be added to `.gitignore`
- Schema migrations are handled by each microservice independently
- Both microservices can run simultaneously against the same database
