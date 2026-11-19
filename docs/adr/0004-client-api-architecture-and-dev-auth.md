# 4. Client API Architecture, Reverse Proxy, and Development User Authentication

## Status
Accepted

## Context
Zenner Client is a multi-target monorepo (`apps/web`, `apps/desktop`, `apps/mobile`) connecting to the monolithic Spring Boot backend service (`zenner-core` on port 8080).

During frontend development:
1. Running `apps/web` (Vite dev server on port 3000) against `zenner-core` (port 8080) triggers cross-origin (CORS) constraints unless requests are proxied or CORS headers are configured.
2. Full stateless Bearer JWT verification (ADR 0001) is planned for production authentication, but early backend endpoints (such as `GET /api/v1/days/today`, ADR 0002) are currently protected by interim header/principal fallback logic via `UserContextResolver` (supporting `X-User-Id` or default UUID `00000000-0000-0000-0000-000000000001`).
3. We need a unified API transport, query caching, and domain typing architecture across monorepo packages without duplicating API logic between web and future native targets.

## Decision
- **Local Dev Reverse Proxy**: Configure Vite dev server in `apps/web/vite.config.ts` to proxy all `/api` requests to `http://localhost:8080`.
- **Shared API Client (`@zenner/core`)**: Centralize the Axios instance in `packages/core/src/api/apiClient.ts` with `baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1'`.
- **Interim Auth Interceptor**: Axios request interceptor attaches `Authorization: Bearer <token>` from `useAuthStore` when available. When unauthenticated in development environments, it automatically supplies `X-User-Id: 00000000-0000-0000-0000-000000000001` so backend requests succeed without requiring a manual login cycle.
- **Shared Query Client**: Centralize `@tanstack/react-query` configuration in `packages/core/src/api/queryClient.ts` with standard caching and retry defaults.
- **Canonical Domain Model**: Deprecate legacy ad-hoc types (such as `CalendarEvent`) in favor of canonical domain types defined in `GLOSSARY.md` (`Day`, `Timeblock`, `Task`, `ReminderResponse`) validated with Zod schemas.

## Consequences
- Zero CORS overhead or configuration friction during local development.
- Single source of truth for API communication and query caching across web, desktop, and mobile targets.
- Frictionless migration to real Bearer JWT tokens once auth flows are completed on the backend.
