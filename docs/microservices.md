# Microservices

Zenner backend is split into small, independently deployable services. Keep ownership boundaries strict.

## Services and data

| Service | Owns | Schema | Port |
|---|---|---|---|
| zenner-auth | users, credentials, tokens | `zenner_auth` | 8082 |
| zenner-core | days, time blocks, tasks, reminders | `zenner_core` | 8081 |

- **Database per service**: shared Postgres instance, separate schemas. No cross-schema FKs.
- Core references a user only by `UUID` (`user_id`); identity lives in auth.
- Each service runs its own Flyway migrations.

## Communication

- Prefer **async/event-driven** for cross-aggregate updates (none wired yet).
- Synchronous service-to-service calls, if needed, must have explicit timeouts, retry budgets, and fallbacks (Resilience4j when added).
- Propagate `X-Correlation-Id` on every outbound call and log it.
- zenner-core consumes identity via Bearer JWT validated as an OAuth2 resource server (target state; not wired yet).

## Resilience rules (apply when integrations are added)

- No unbounded retries; no blocking calls without a timeout.
- Every external call has a circuit breaker or equivalent guard and a graceful degradation path.
- Services never share mutable in-memory state.

## Deployment notes

- Separate Docker images per service (see each `Dockerfile`); `prod` compose file builds both.
- Health/readiness at `/actuator/health` for orchestrators.
- Independent scaling; update schemas via each service's migrations on deploy.

## Planned boundaries (not yet implemented)

Auth (users/tokens) and core (planning data) are the only services today. Weekly/monthly views and notifications may justify new services later, but start inside `zenner-core` until a boundary proves itself. Avoid premature decomposition.