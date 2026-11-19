# 3. Consolidate to Monolithic Backend Architecture

## Status
Accepted (supersedes microservices split from ADR 0001)

## Context
Zenner was originally structured as two independently deployable Spring Boot microservices (`zenner-auth` and `zenner-core`) backed by a shared PostgreSQL instance with distinct schemas. Because the app is in early-stage development and planning domain entities (`days`, `reminders`) directly correlate to user ownership, the microservices boundary introduced operational overhead (multi-container orchestration, cross-schema constraints prohibition) without providing independent scaling benefits.

## Decision
- Merge `zenner-auth` into `zenner-core` as a unified monolithic Spring Boot application.
- Standardize on a single database schema (`zenner_core`).
- Move the `users` table into `zenner_core` as `V2__create_users.sql`.
- Add explicit foreign key constraints from `days(user_id)` and `reminders(user_id)` to `users(id)` (`ON DELETE CASCADE`).
- Standardize the backend HTTP service on port `8080`.
- Retain OAuth2 client and security infrastructure within the unified application.

## Consequences
- Single deployable backend service, simplifying local development and production deployments.
- Full relational integrity enforced directly by PostgreSQL via foreign keys.
- Elimination of cross-service coordination and schema isolation overhead.
- Port 8080 serves all API traffic (`/api/v1/**`).
