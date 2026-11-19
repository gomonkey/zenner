# Zenner Backend — Agent Guide

Zenner is a daily planning and reflection app: a user lives one day at a time, and each day is intentional and unique. Everything in the backend revolves around the *current day*; Zenner never decides what the user should do, it forces a conscious decision. Days are records that can be adjusted while happening, then reflected on and archived within a short window. This guide focuses on the **backend** (auth + core services); see `zenner-client/` for the frontend.

Detailed reference material lives in `docs/` (linked per section) so this file stays concise.

## Repository layout

Monolithic Spring Boot backend service (`zenner-core`, port 8080, schema `zenner_core`) backed by PostgreSQL 17; frontend is a separate submodule. See `docs/repository-layout.md`.

- `zenner-core` (port 8080, schema `zenner_core`): users, auth, days, time blocks, tasks, reminders.
- Port 8080 is the standard backend port.

## API conventions

REST + JSON under `/api/v1/<resource>` (plural nouns, path-variable ids); RFC 9457 `ProblemDetail` errors; `@Valid` input; DTOs as records; entities never serialized; `LocalDate`/`LocalTime`/`Instant` for time. See `docs/api-conventions.md`. Auth is Bearer JWT in the target state (not fully wired yet).

## Technologies we use

Java 21, Spring Boot 4.1.0, Spring MVC + virtual threads, Spring Security 7, JPA/Hibernate, PostgreSQL 17, Redis, Flyway, Maven, Docker. Boot 4 starter names (`-webmvc`, not `-web`); Jackson 3 via `tools.jackson.databind.json.JsonMapper`. See `docs/technologies.md`.

## Testing

Per-service Maven: fast loop `./mvnw -B test`, full `./mvnw -B verify` (DB-backed tests need Postgres or Testcontainers). JUnit 5, `@MockitoBean`, `@WebMvcTest` slices. See `docs/testing.md`.

## Architecture

Monolithic architecture: single Spring Boot application (`zenner-core`) owning all domain aggregates (users, auth, days, time blocks, tasks, reminders) in schema `zenner_core`. Foreign keys enforce relational integrity directly between `days`/`reminders` and `users`. Flyway migrations manage schema evolution.

## Agent workflow

1. Understand — read code + `pom.xml` before changing; match conventions.
2. Design — state plan for service/schema/security changes and confirm.
3. Implement — small steps, tests alongside.
4. Verify — `./mvnw -B verify` in the touched service (or `scripts/verify.sh full <service-dir>`). Do not claim done until green.
5. Report — changes made, commands run, real result; flag failures/skips.

Skills (load if available): `spring-boot-engineer`, `java-architect`, `microservices-architect`, `database-optimizer`, `devops-engineer`. When an example disagrees with Boot 4, `boot4-java21.md` wins.

## Conventions (on top of skills)

- Constructor injection only (no field `@Autowired`); records for DTOs/`@ConfigurationProperties`; never expose entities.
- Starters `spring-boot-starter-webmvc`, `spring-boot-starter-flyway`; per-tech `*-test` starters.
- Security 7 lambda DSL only; prefer `oauth2ResourceServer(jwt)`; CSRF disabled for stateless.
- `@MockitoBean`/`@MockitoSpyBean`; `@AutoConfigureMockMvc` opt-in; Testcontainers 2.x + `@ServiceConnection`.
- Blocking MVC + virtual threads; WebFlux only for streaming/back-pressure.
- Validate all input; map to `ProblemDetail`.
- Secrets from env/secret store — never committed or defaulted.
- Schema changes via Flyway (never `ddl-auto=update` outside local dev).
- Actuator health/metrics exposed; structured logs, no PII/secrets.
- Packages by feature within a service (`com.acme.days.{web,service,domain,repo}`).

## Guardrails

- No destructive commands (drop DB, `git reset --hard`, force-push, delete volumes) without asking.
- No dependencies/version bumps without justification.
- Do not edit generated code, `target/`, or `build/`.
- Never commit `.env`, credentials, or keystores.

## Agent skills

### Issue tracker

GitHub Issues via `gh` CLI (`gomonkey/zenner`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`GLOSSARY.md` + `docs/adr/` at repo root). See `docs/agents/domain.md`.

## Commands

| Purpose | Command |
|---|---|
| Start DB | `scripts/docker-local.sh up` |
| Run backend | `scripts/run-core.sh` |
| Fast tests | `cd zenner-core && ./mvnw -B test` |
| Full verify | `cd zenner-core && ./mvnw -B verify` |