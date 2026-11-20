# 5. HttpOnly Cookie Refresh Tokens and In-Memory Stateless JWT

## Status
Accepted (refines ADR 0001 and ADR 0003)

## Context
Following the consolidation of identity into the monolithic backend (`zenner-core`, ADR 0003), we needed an authentication and token management strategy that provides seamless user persistence while defending against credential and token theft.

Storing refresh tokens in client-side storage (e.g. `localStorage`) leaves long-lived session credentials permanently exposed to Cross-Site Scripting (XSS) extraction. Conversely, storing access tokens in cookies increases Cross-Site Request Forgery (CSRF) exposure on standard data mutation endpoints.

## Decision
- **Access Tokens (JWT)**: Issued as short-lived (15 minutes), cryptographically signed HMAC-SHA256 (`HS256`) tokens carrying standard claims (`sub: <userId>`, `email: <email>`). Access tokens are returned in the JSON response body and stored strictly in-memory on the client (within Zustand state), never written to browser persistent storage (`localStorage` or `sessionStorage`).
- **Refresh Tokens (Opaque Strings & SHA-256 Hashing)**: Generated as high-entropy 256-bit random strings with a 7-day sliding expiration and delivered in a browser-managed `HttpOnly`, `SameSite=Lax` cookie scoped strictly to `Path=/api/v1/auth`. Raw tokens are never stored in Redis; the server hashes the token using SHA-256 before indexing (`auth:refresh:<sha256Hash>`).
- **Single-Use Refresh Token Rotation (RTR)**: Every call to `POST /api/v1/auth/refresh` invalidates the submitted refresh token in Redis and issues a newly rotated refresh token cookie alongside a new in-memory access token. If an already-rotated refresh token is re-submitted, the backend detects token reuse and immediately invalidates all active sessions for that user family.
- **Multi-Session Redis Architecture**: Active sessions are tracked in Redis using a dual-index schema: `auth:refresh:<sha256Hash>` (containing session metadata) and a user session set `auth:user:<userId>:sessions` storing active token hashes. This enables independent concurrent sessions across devices as well as selective single-device or global session revocation (`POST /api/v1/auth/logout` supporting `allDevices: true`).
- **Client Concurrency & Silent Hydration**: The client Axios interceptor coordinates silent token refresh during app boot (`checkAuth()`) and buffers concurrent `401 Unauthorized` requests during runtime so pending requests are automatically retried without interrupting the user.
- **CORS & Credentials**: Axios is configured with `withCredentials: true`, and Spring Security's CORS configuration explicitly permits credentials for trusted client origins.

## Amendment (Post-Implementation Refinement)
- **Problem**: Single-use RTR with zero grace window caused race conditions when users refreshed pages rapidly or opened multiple tabs: re-submitting an already-rotated token before cookie updates settled triggered false-positive reuse detection and revoked all active sessions. In addition, losing access tokens on every reload forced unnecessary `/refresh` calls on every mount.
- **Access Token Persistence via Cookie**: The backend delivers the 15-minute access token in a non-HttpOnly cookie (`access_token`, `Path=/`, `Max-Age=900`, `SameSite=Lax`) in addition to the JSON payload. On page reload, the client checks this cookie; if valid and unexpired, the client initializes as authenticated immediately without issuing `/auth/refresh`. Access tokens persist for their intended 15-minute window regardless of page reloads.
- **Static Refresh Token with Sliding Expiration**: The refresh token remains an `HttpOnly`, `Path=/api/v1/auth` cookie. Calling `POST /api/v1/auth/refresh` validates the refresh token and slides its 7-day TTL in Redis without rotating the token string. Refresh tokens are only revoked on explicit logout (`POST /api/v1/auth/logout`) or after 7 days of inactivity.

## Consequences
- Protection against persistent XSS token exfiltration; JavaScript running in the browser cannot read or steal the refresh token.
- Defense-in-depth against database or Redis data breaches; refresh tokens are hashed with SHA-256 in Redis, preventing an attacker with Redis read access from hijacking user sessions.
- Seamless, persistent login experience across browser refreshes via background cookie-based refresh without presenting login prompts.
- Protected resource endpoints (`/api/v1/days/**`, etc.) perform in-memory cryptographic JWT verification without making synchronous database or cache calls.
- `zenner.security.jwt.secret` is loaded securely via environment configuration (`.env`).
