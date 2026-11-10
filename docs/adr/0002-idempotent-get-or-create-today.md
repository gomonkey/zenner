# 2. Idempotent Get-or-Create for Current Day Endpoint

## Status
Accepted

## Context
When a user loads the "Today" page, a `Day` record might not yet exist for the current calendar date in their timezone. In strict REST semantics (RFC 9110), `GET` is a "safe" method and should not perform database writes (returning `404 Not Found` if missing). However, returning 404 forces the frontend to execute a multi-step handshake (`GET /today` -> `404` -> `POST /days` -> render) before the user can view or interact with their schedule, introducing network latency and waterfall requests.

## Decision
- We adopt a pragmatic `GET` pattern for `GET /api/v1/days/today`: if a `Day` record does not exist for `(userId, date)`, the service idempotently instantiates and persists a new `Day` record (including initializing pending `ReminderResponse`s for active reminders) and returns `200 OK`.
- The endpoint remains strictly idempotent: subsequent calls for the same user and date return the existing record without side effects.
- Database uniqueness on `(user_id, date)` guarantees data integrity across concurrent requests.

## Consequences
- Single network round-trip for the client to completely paint the Today screen.
- Frontends receive a persistent Day ID immediately, allowing instant optimistic creation of tasks and timeblocks without extra handshakes.
- The endpoint cannot be routed to read-only database replicas as it requires write capability on initial access.
