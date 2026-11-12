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

Runs only the PostgreSQL database. The backend service (`zenner-core`) runs via Maven/IDE.

```bash
# Start database
./scripts/docker-local.sh up

# Run backend
./scripts/run-core.sh

# Or run manually
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

Runs the complete stack: PostgreSQL + zenner-core.

```bash
# Start all services
./scripts/docker-prod.sh up

# View all logs
./scripts/docker-prod.sh logs

# View specific service logs
./scripts/docker-prod.sh logs zenner-core

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
- zenner-core: `8080:8080`

**Local development (run via `run-core.sh`):**
- zenner-core: `8080`

## Environment Files

- `.env.local` — Local development configuration
- `.env.prod` — Production configuration

Required variables:
```env
POSTGRES_DB=zenner
POSTGRES_USER=zenner
POSTGRES_PASSWORD=secure_password
```

## Database Schema

The PostgreSQL instance hosts the backend schema:
- `zenner_core` — Used by zenner-core monolithic service

The schema is automatically created on first startup via `init/init-schemas.sql`.

## Manual Docker Compose

You can also use `docker-compose` directly:

```bash
# Local
docker-compose up -d
docker-compose -f docker/docker-compose.local.yml up -d

# Production
docker-compose -f docker/docker-compose.prod.yml --env-file .env.prod up -d
```
