# Repository layout

Zenner uses a small, service-per-domain layout. The root orchestrates shared infrastructure; each backend is an independent Spring Boot app.

```
zenner/
├── AGENTS.md
├── README.md / DOCKER.md
├── scripts/                 # docker-local.sh, run-core.sh, run-auth.sh, run-*
├── docker/                  # compose files for the shared PostgreSQL (and future services)
├── init/                    # schema init SQL for local/prod
├── docs/                    # this folder
├── zenner-auth/             # Spring Boot auth service (port 8082, schema zenner_auth)
├── zenner-core/             # Spring Boot core service (port 8081, schema zenner_core)
└── zenner-client/           # React Native + web frontend monorepo (out of scope for backend work)
```

## Backend services

- **zenner-core** (`com.taans.zennercore`): days, time blocks, tasks, reminders. Port `8081` (`SERVER_PORT`).
- **zenner-auth** (`com.taans.zennerauth`): users and authentication. Port `8082`.
- Port `8080` is reserved for the future API gateway; services must not bind it.

Both are Spring Boot 4.1.0 / Java 21 modules with their own `pom.xml`, `mvnw`, `Dockerfile`, `application*.yaml`, and Flyway migrations under `src/main/resources/db/migration`.

## Shared database

- Single PostgreSQL 17 instance, multiple schemas: `zenner_core`, `zenner_auth`.
- Start locally: `scripts/docker-local.sh up` (port `5433`, db `zenner_dev`).
- Each service selects its schema via `DATABASE_SCHEMA`; migrations are owned by each service.
- **No cross-schema foreign keys.** Core stores `user_id` as a plain `UUID` and never joins into `zenner_auth`.

## Conventions inside a service

```
src/main/java/com/taans/<service>/
├── <Service>Application.java
├── api/v1/controller/      # REST controllers (web layer)
├── config/                 # Security, beans, properties
├── (feature packages: service, domain, repo)   # add as features land
src/main/resources/
├── application.yaml / application-local.yaml / application-prod.yaml
└── db/migration/            # Flyway scripts (V1__, V2__, ...)
```

## Environment

- Secrets come from environment variables (`.env.local` / `.env.prod`); never committed.
- Profiles: `SPRING_PROFILES_ACTIVE=dev|prod`; empty `application-local.yaml`/`application-prod.yaml` override as needed.
- Run scripts load `.env.local` for you (`scripts/run-core.sh`, `scripts/run-auth.sh`).

## Frontend

`zenner-client` is a separate repo (submodule). Backend agents should not edit it unless explicitly asked.