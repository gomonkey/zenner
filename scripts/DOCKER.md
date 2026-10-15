# Docker Compose Scripts

Helper scripts to manage the Zenner Docker infrastructure.

## Structure

```
zenner/
├── init/
│   └── init-schemas.sql          # PostgreSQL schema initialization
├── docker/
│   ├── docker-compose.local.yml  # Local development (PostgreSQL only)
│   └── docker-compose.prod.yml   # Production (full stack)
├── scripts/
│   ├── docker-local.sh           # Local development helper
│   └── docker-prod.sh            # Production helper
└── docker-compose.yml            # Root convenience file (same as local)
```

## Local Development

Runs only the shared PostgreSQL database. Services (zenner-auth, zenner-core) run via Maven/IDE.

```bash
# Start database
./scripts/docker-local.sh up

# Run services (in separate terminals)
./scripts/run-auth.sh
./scripts/run-core.sh

# Or run manually
cd zenner-auth && ./mvnw spring-boot:run
cd zenner-core && ./mvnw spring-boot:run

# View database logs
./scripts/docker-local.sh logs

# Connect to database
./scripts/docker-local.sh psql

# Stop database
./scripts/docker-local.sh down

# Clean everything (removes volumes)
./scripts/docker-local.sh clean
```

## Production

Runs the complete stack: PostgreSQL + zenner-auth + zenner-core.

```bash
# Start all services
./scripts/docker-prod.sh up

# View all logs
./scripts/docker-prod.sh logs

# View specific service logs
./scripts/docker-prod.sh logs zenner-auth

# Check health
./scripts/docker-prod.sh health

# Rebuild images
./scripts/docker-prod.sh build

# Stop all services
./scripts/docker-prod.sh down

# Clean everything (removes volumes)
./scripts/docker-prod.sh clean
```

**Service Ports (prod, host:container):**
- PostgreSQL: `5432`
- zenner-core: `8081:8080`
- zenner-auth: `8082:8080`

**Local development (run via `run-core.sh` / `run-auth.sh`):**
- zenner-core: `8081`
- zenner-auth: `8082`

## Environment Files

- `.env.local` — Local development configuration
- `.env.prod` — Production configuration

Required variables:
```env
POSTGRES_DB=zenner
POSTGRES_USER=zenner
POSTGRES_PASSWORD=secure_password
```

## Database Schemas

The PostgreSQL instance hosts two schemas:
- `zenner_auth` — Used by zenner-auth service
- `zenner_core` — Used by zenner-core service

Both schemas are automatically created on first startup via `init/init-schemas.sql`.

## Manual Docker Compose

You can also use `docker-compose` directly:

```bash
# Local
docker-compose up -d
docker-compose -f docker/docker-compose.local.yml up -d

# Production
docker-compose -f docker/docker-compose.prod.yml --env-file .env.prod up -d
```
