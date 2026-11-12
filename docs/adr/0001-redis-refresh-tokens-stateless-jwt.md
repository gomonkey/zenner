# 1. Redis for Refresh Tokens and Stateless JWT in Resource Servers

## Status
Accepted

## Context
Zenner backend is split into `zenner-auth` (identity, authentication) and `zenner-core` (planning data). We needed a token management and verification strategy that maintains strict service boundaries without creating synchronous bottlenecks or single points of failure across internal API calls.

## Decision
- `zenner-auth` owns Redis and uses it exclusively to store and rotate long-lived Refresh Tokens.
- Access Tokens are short-lived, cryptographically signed JWTs carrying user identity claims (`sub: userId`). Access tokens are never stored in Redis.
- `zenner-core` acts as a stateless OAuth2 Resource Server. It validates Access Tokens purely via cryptographic signature in-memory and never communicates with Redis or `zenner-auth` on incoming API requests.
- Resource-level authorization (ensuring users only access their own days and tasks) is enforced locally within `zenner-core`.

## Consequences
- `zenner-core` remains completely decoupled from `zenner-auth` runtime availability.
- Sub-millisecond token verification latency in `zenner-core` with zero database or cache overhead.
- Immediate session revocation is managed via refresh token deletion in `zenner-auth` when user logs out.
