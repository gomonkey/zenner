# Repository layout

Zenner uses a monolithic backend architecture. The root orchestrates shared infrastructure and the frontend submodule.

```
zenner/
├── AGENTS.md
├── README.md / DOCKER.md
├── scripts/                 # docker-local.sh, run-core.sh, verify.sh
├── docker/                  # compose files for PostgreSQL and prod stack
├── init/                    # schema init SQL for local/prod
├── docs/                    # this folder
├── zenner-core/             # Spring Boot monolithic backend (port 8080, schema zenner_core)
└── zenner-client/           # React Native + web frontend monorepo (out of scope for backend work)
```

## Backend service

- **zenner-core** (`com.taans.zennercore`): users, auth, days, time blocks, tasks, reminders. Port `8080` (`SERVER_PORT`).

Built on Spring Boot 4.1.0 / Java 21 with its own `pom.xml`, `mvnw`, `Dockerfile`, `application*.yaml`, and Flyway migrations under `src/main/resources/db/migration`.

## Database

- Single PostgreSQL 17 instance, schema: `zenner_core`.
- Start locally: `scripts/docker-local.sh up` (port `5433`, db `zenner_dev`).
- Tables (`days`, `reminders`) reference `users(id)` with explicit foreign key constraints.
- Migrations are managed by Flyway on application startup.

## Conventions inside the service

```
src/main/java/com/taans/zennercore/
├── ZennerCoreApplication.java
├── api/v1/controller/      # REST controllers (web layer)
├── config/                 # Security, beans, properties
├── domain/entity/          # JPA entities
├── repository/             # Spring Data repositories
├── service/                # Business logic services
src/main/resources/
├── application.yaml / application-local.yaml / application-prod.yaml
└── db/migration/            # Flyway scripts (V1__, V2__, ...)
```

## Environment

- Secrets come from environment variables (`.env.local` / `.env.prod`); never committed.
- Profiles: `SPRING_PROFILES_ACTIVE=dev|prod`; empty `application-local.yaml`/`application-prod.yaml` override as needed.
- Run script loads `.env.local` for you (`scripts/run-core.sh`).

## Frontend

`zenner-client` is a separate repo (submodule). Backend agents should not edit it unless explicitly asked.