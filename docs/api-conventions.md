# API conventions

Backend APIs are REST over HTTP + JSON, served by Spring MVC with virtual threads. Versioning, errors, and validation follow these rules.

## Base URL and versioning

- Base path: `/api/v1/<resource>` for application APIs (e.g. `/api/v1/days`).
- Health probes: `/actuator/health` (unauthenticated), `/actuator/*` for metrics where enabled.
- Resource names are **plural nouns**; identifiers are path variables: `/api/v1/days/{dayId}/timeblocks`.
- Read dept in `DayController.java` (`api/v1/controller` package) for the established package location.

## HTTP semantics

- `GET` read, `POST` create, `PUT` full replace, `PATCH` partial update, `DELETE` remove.
- Return `201 Created` with a `Location` header on create; `204 No Content` when there is no body.
- Status codes: `400` validation, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `422` unprocessable, `500` unexpected.
- Idempotent writes where natural (e.g. confirm/delete).

## Request and response shapes

- Request bodies are DTOs declared as **Java records** with Jakarta validation annotations (`@NotBlank`, `@NotNull`, …).
- Always annotate mutating endpoints with `@Valid @RequestBody`.
- Never serialize JPA entities; map entity ↔ DTO in the service/web layer.
- Timestamps: ISO-8601. Domain dates use `LocalDate`, times use `LocalTime`, audit fields use `Instant` (UTC).
- Pagination: Spring Data `Pageable` / `Page<T>` with `page`, `size`, `sort` query params.

## Errors

- All errors are RFC 9457 `ProblemDetail`, produced by a `@RestControllerAdvice`.
- Validation errors include a field → message map under `errors`.
- Never leak stack traces, SQL, or internal IDs beyond the resource id.
- Domain exceptions (e.g. `EntityNotFoundException`) map to the appropriate status; unknown exceptions map to `500` with a generic detail.

## Validation

- Validate at the boundary: `@Valid` (body) and `@Validated` (params/path vars).
- Service methods re-check invariants that span fields or aggregates.
- Bad input never reaches the repository.

## Authentication and authorization (target state)

- zenner-auth issues tokens (OAuth2/OIDC-style); zenner-core is an OAuth2 resource server validating Bearer JWTs.
- Every endpoint is authenticated except `/actuator/health` and explicitly public auth endpoints (login, register, refresh).
- Prefer method security (`@PreAuthorize`) over URL rules for domain decisions.
- CSRF disabled for stateless JWT; sessions are `STATELESS`.
- **Current code**: security is still permissive in dev; wiring JWT validation is an open task. Treat as TODO before any production deploy.

## Naming

- DTOs: `*Request` / `*Response` (or a single `*Dto` where read-only). Use records.
- Controllers: `*Controller` in `api/v1/controller`.
- Services: `*Service` with constructor injection.
- Repositories: `*Repository` extends `JpaRepository`.

## Examples

Controller slice (established style):

```java
@RestController
@RequestMapping("/api/v1/days")
@Validated
public class DayController {
    private final DayService service;
    public DayController(DayService service) { this.service = service; }

    @GetMapping("/{dayId}")
    public DayResponse get(@PathVariable UUID dayId) {
        return service.get(dayId);
    }
}
```