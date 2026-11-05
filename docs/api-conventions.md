# API Conventions & Design Guide

Zenner's backend APIs follow a **resource-oriented design** inspired by the [Google Cloud API Design Guide](https://cloud.google.com/apis/design) and [Google AIPs](https://google.aip.dev/), adapted for Spring Boot 4 / Java 21, REST over HTTP, and JSON.

This guide provides rules and standard patterns for URI design, standard methods, custom actions, request/response payloads, error handling, pagination, and idempotency.

---

## 1. Guiding Principles

1. **Resource-Oriented**: Everything revolves around named **resources** (entities) and **collections**, organized into intuitive hierarchies rather than procedural RPCs.
2. **Predictable & Standardized**: Common behaviors (`List`, `Get`, `Create`, `Update`, `Delete`) share identical semantics, status codes, and payload shapes across all services.
3. **Strict Domain Isolation**: JPA entities are never exposed or serialized over the wire. Web layer contracts are defined strictly with immutable Java records.
4. **Idempotent by Default**: Read operations (`GET`, `HEAD`) are strictly safe. Write operations provide natural idempotency or support request deduplication tokens.

---

## 2. Resource Hierarchy & URI Structure

### Base URL & Versioning
- **Application APIs**: `/api/v1/<collection>`
- **Health & Ops Probes**: `/actuator/health` (unauthenticated), `/actuator/metrics`, `/actuator/prometheus`
- **Gateway Reservation**: Port `8080` is reserved for the API Gateway. Services run on dedicated internal ports (`8081` for `zenner-core`, `8082` for `zenner-auth`).

### Resource Hierarchy
Resources in Zenner form parent-child hierarchies reflecting domain ownership:

```text
/api/v1/days                                             # Collection of days
/api/v1/days/{dayId}                                     # Specific day resource
/api/v1/days/{dayId}/timeblocks                          # Sub-collection of timeblocks within a day
/api/v1/days/{dayId}/timeblocks/{timeblockId}            # Specific timeblock resource
/api/v1/days/{dayId}/timeblocks/{timeblockId}/items      # Sub-collection of checklist items
/api/v1/days/{dayId}/tasks                               # Sub-collection of tasks within a day
/api/v1/days/{dayId}/tasks/{taskId}                      # Specific task resource
/api/v1/days/{dayId}/reminder-responses                  # Sub-collection of reminder answers
/api/v1/reminders                                        # Global collection of user reflection prompts
/api/v1/reminders/{reminderId}                           # Specific reminder resource
```

### Naming Rules
- **Collections**: Plural English nouns using `kebab-case` in URIs (e.g. `/timeblocks`, `/reminder-responses`).
- **Resource Identifiers**: Canonical UUIDs represented as path variables (`{dayId}`, `{taskId}`).
- **JSON Field Names**: Strictly `lowerCamelCase` (e.g. `userId`, `startTime`, `reminderResponses`).
- **Query Parameters**: Strictly `lowerCamelCase` (e.g. `pageSize`, `pageToken`, `startDate`).
- **HTTP Headers**: Strictly `Train-Case` (e.g. `X-User-Id`, `X-Request-Id`, `X-Timezone`).

---

## 3. Standard Methods

Following the Google Cloud API Design standard methods pattern (AIP-131 through AIP-135):

| Method | HTTP Verb | URI Path | Request Body | Response Body | HTTP Status | Idempotent |
|---|---|---|---|---|---|:---:|
| **List** | `GET` | `/api/v1/days/{dayId}/tasks` | *None* | `ApiResponse<List<TaskResponse>>` | `200 OK` | Yes |
| **Get** | `GET` | `/api/v1/days/{dayId}` | *None* | `ApiResponse<DayResponse>` | `200 OK` | Yes |
| **Create** | `POST` | `/api/v1/days/{dayId}/tasks` | `CreateTaskRequest` | `ApiResponse<TaskResponse>` | `201 Created` (`Location` header) | No* |
| **Update** | `PATCH` | `/api/v1/days/{dayId}/tasks/{taskId}` | `UpdateTaskRequest` | `ApiResponse<TaskResponse>` | `200 OK` | Yes |
| **Replace** | `PUT` | `/api/v1/days/{dayId}/tasks/{taskId}` | `ReplaceTaskRequest` | `ApiResponse<TaskResponse>` | `200 OK` | Yes |
| **Delete** | `DELETE` | `/api/v1/days/{dayId}/tasks/{taskId}` | *None* | *Empty* | `204 No Content` | Yes |

*\*`POST` can be made idempotent via `X-Request-Id` (see Section 8).*

### Method Rules:
- **`List`**: Returns a list of resources belonging to the parent. Must support pagination when unbounded.
- **`Get`**: Fetches a single resource by ID. Returns `404` if the resource does not exist or does not belong to the authenticated user.
- **`Create`**: Instantiates a new resource under the parent collection. Must set the `Location` response header to the URI of the newly created resource (e.g. `Location: /api/v1/days/{dayId}/tasks/{taskId}`).
- **`Update` (`PATCH`)**: Performs a partial update. Only fields explicitly supplied in the request body are modified. Fields omitted or `null` remain unchanged.
- **`Replace` (`PUT`)**: Fully replaces the resource representation. Omitted fields are reset to their default values.
- **`Delete`**: Removes the resource. Must return `204 No Content` with an empty response body. Subsequent calls return `204` or `404`.

---

## 4. Custom Methods (Colon Syntax)

When a business operation cannot be expressed cleanly as standard CRUD, use Google's **Custom Method** colon syntax (`:<action>`) appended to the resource or collection URI:

```text
POST /api/v1/days/{dayId}:block
POST /api/v1/days/{dayId}:unblock
POST /api/v1/tasks/{taskId}:complete
POST /api/v1/timeblocks/{timeblockId}:finish
POST /api/v1/days:batchGet
```

### Why Custom Methods?
- Prevents inventing artificial sub-resources just to trigger side effects (e.g., avoiding `POST /api/v1/days/{dayId}/blocks`).
- Avoids using `PATCH` for state machine transitions that have distinct business invariants and validations.
- Custom methods use `POST` (or `GET` if strictly read-only, such as complex search: `GET /api/v1/days:search`).

---

## 5. Domain Exceptions & Pragmatic REST Patterns

### Pragmatic Get-or-Create (ADR-0002)
- **Endpoint**: `GET /api/v1/days/today`
- **Context**: When opening the app, a `Day` record might not yet exist for the user's current calendar date. Returning `404 Not Found` forces a multi-step client handshake (`GET` -> `404` -> `POST` -> render), increasing latency.
- **Decision**: `GET /api/v1/days/today` idempotently gets or instantiates today's `Day` container (including initializing pending reminder responses) and returns `200 OK`.
- **Invariance**: Subsequent calls for the same user and date return the identical record without side effects.

---

## 6. Request & Response Shapes

### Standard Envelope (`ApiResponse<T>`)
All non-error responses are automatically wrapped in a standardized envelope by [`GlobalResponseWrapper`](file:///home/taans14/storage/code/projects/zenner/zenner-core/src/main/java/com/taans/zennercore/api/v1/support/GlobalResponseWrapper.java):

```json
{
  "success": true,
  "status": 200,
  "message": "Operation successful",
  "data": {
    "id": "d475545a-d177-4a0b-aa75-69c824c4b885",
    "userId": "00000000-0000-0000-0000-000000000001",
    "date": "2026-11-05",
    "blocked": false,
    "createdAt": "2026-11-05T15:23:36.739Z",
    "updatedAt": "2026-11-05T15:23:36.739Z",
    "timeblocks": [],
    "tasks": [],
    "reminderResponses": []
  }
}
```

> [!NOTE]
> Spring MVC controllers return domain DTO records (`DayResponse`, `TaskResponse`, etc.) directly. The `@RestControllerAdvice` envelope wrapper handles serialization transparently without polluting controller signatures.

### Standard Field Types
Following Google Cloud standard fields (AIP-148):
- **Dates**: `java.time.LocalDate` formatted as ISO-8601 calendar date (`YYYY-MM-DD`). Used for date-bounded aggregates like `Day.date`.
- **Time of Day**: `java.time.LocalTime` formatted as `HH:mm[:ss]`. Used for daily schedules (`startTime`, `endTime`).
- **Audit / Absolute Timestamps**: `java.time.Instant` in UTC, formatted with `Z` suffix (`YYYY-MM-DD'T'HH:mm:ss.SSS'Z'`). Used for `createdAt`, `updatedAt`, `answeredAt`.
- **Identifiers**: `java.util.UUID` formatted in canonical 8-4-4-4-12 hex format.

---

## 7. Error Model (RFC 9457 ProblemDetail)

Errors follow the IETF RFC 9457 standard produced by [`GlobalExceptionHandler`](file:///home/taans14/storage/code/projects/zenner/zenner-core/src/main/java/com/taans/zennercore/exception/GlobalExceptionHandler.java), augmented with `"success": false`:

```json
{
  "success": false,
  "status": 404,
  "title": "Resource Not Found",
  "detail": "Day not found with id: d475545a-d177-4a0b-aa75-69c824c4b885",
  "type": "/errors/not-found",
  "instance": "/api/v1/days/d475545a-d177-4a0b-aa75-69c824c4b885"
}
```

### Validation Errors (`400 Bad Request`)
Field-level constraint violations report an `errors` property mapping field names to human-readable error messages:

```json
{
  "success": false,
  "status": 400,
  "title": "Bad Request",
  "detail": "Validation failed",
  "type": "/errors/validation-failed",
  "instance": "/api/v1/days/d475545a-d177-4a0b-aa75-69c824c4b885/timeblocks",
  "errors": {
    "title": "must not be blank",
    "endTime": "must be after start time"
  }
}
```

### HTTP Status Code Mapping (Google AIP Canonical Codes)

| HTTP Status | Canonical Name | Meaning / Usage |
|:---:|---|---|
| **`200`** | `OK` | Standard successful response. |
| **`201`** | `Created` | Resource created successfully; includes `Location` header. |
| **`204`** | `No Content` | Request succeeded with no response body (e.g., `DELETE`). |
| **`400`** | `INVALID_ARGUMENT` | Malformed JSON, constraint failure, or invalid parameter format. |
| **`401`** | `UNAUTHENTICATED` | Missing or invalid OAuth2 / JWT bearer token. |
| **`403`** | `PERMISSION_DENIED` | Caller lacks permission or does not own the requested resource. |
| **`404`** | `NOT_FOUND` | Resource not found or hidden due to tenant boundary. |
| **`409`** | `ALREADY_EXISTS` | Unique constraint violation (e.g. duplicate user/date). |
| **`412`** | `FAILED_PRECONDITION` | Precondition failed (e.g. `If-Match` ETag mismatch). |
| **`422`** | `UNPROCESSABLE_ENTITY` | Semantic validation failure (valid format, invalid domain state). |
| **`429`** | `RESOURCE_EXHAUSTED` | Rate limit or quota exceeded. |
| **`500`** | `INTERNAL` | Unexpected server failure. Never leak stack traces or internal SQL. |

---

## 8. Advanced Design Patterns

### 1. Pagination (AIP-158)
Unbounded collections must be paginated:
- **Query Parameters**:
  - `pageSize` (integer, default `20`, maximum `100`): Maximum items to return.
  - `pageToken` (string): Opaque pagination cursor. Or Spring Data `page` & `size`.
- **Response Shape**:
  ```json
  {
    "success": true,
    "status": 200,
    "data": {
      "items": [ ... ],
      "nextPageToken": "eyJwYWdlIjoxfQ==",
      "totalSize": 42
    }
  }
  ```

### 2. Idempotency & Request Deduplication (AIP-155)
Clients can supply an idempotency key in the `X-Request-Id` header for mutating requests (`POST` / `PATCH`):
- `X-Request-Id: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`
- If a network drop occurs and the client retries with the same `X-Request-Id`, the server recognizes the token, skips redundant processing, and returns the original cached response.

### 3. Concurrency Control (ETags & If-Match)
To prevent the "lost update" problem in multi-device sync:
- The resource representation includes an `etag` string (derived from `updatedAt` or version number).
- Mutating endpoints (`PATCH` / `PUT` / `DELETE`) check the `If-Match` request header. If the ETag does not match current state, the server aborts with `412 Precondition Failed`.

---

## 9. Authentication & Tenant Isolation

- **Target State**: `zenner-auth` issues short-lived RS256 JWTs (`sub: userId`). `zenner-core` validates Bearer tokens as a stateless OAuth2 Resource Server.
- **Dev Fallback**: Supported via optional `X-User-Id` request header with fallback to dev UUID `00000000-0000-0000-0000-000000000001`.
- **Strict Tenant Isolation**: Core references users exclusively by `UUID` (`user_id`). **Every repository query and data access operation must include `userId` in its WHERE clause** (e.g. `dayRepository.findByIdAndUserId(id, userId)`). Direct `findById` without owner verification is forbidden to prevent Insecure Direct Object References (IDOR).

---

## 10. Canonical Controller Implementation Example

```java
@RestController
@RequestMapping("/api/v1/days/{dayId}/tasks")
@Validated
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final UserContextResolver userContextResolver;

    @GetMapping
    public List<TaskResponse> list(
        @PathVariable UUID dayId,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID userId = userContextResolver.resolveUserId(headerUserId);
        return taskService.listTasksForDay(dayId, userId);
    }

    @GetMapping("/{taskId}")
    public TaskResponse get(
        @PathVariable UUID dayId,
        @PathVariable UUID taskId,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID userId = userContextResolver.resolveUserId(headerUserId);
        return taskService.getTask(dayId, taskId, userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<TaskResponse> create(
        @PathVariable UUID dayId,
        @Valid @RequestBody CreateTaskRequest request,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID userId = userContextResolver.resolveUserId(headerUserId);
        TaskResponse created = taskService.createTask(dayId, request, userId);
        URI location = URI.create("/api/v1/days/%s/tasks/%s".formatted(dayId, created.id()));
        return ResponseEntity.created(location).body(created);
    }

    @PatchMapping("/{taskId}")
    public TaskResponse update(
        @PathVariable UUID dayId,
        @PathVariable UUID taskId,
        @Valid @RequestBody UpdateTaskRequest request,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID userId = userContextResolver.resolveUserId(headerUserId);
        return taskService.updateTask(dayId, taskId, request, userId);
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @PathVariable UUID dayId,
        @PathVariable UUID taskId,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID userId = userContextResolver.resolveUserId(headerUserId);
        taskService.deleteTask(dayId, taskId, userId);
    }

    // Custom Method: Mark task as complete
    @PostMapping("/{taskId}:complete")
    public TaskResponse complete(
        @PathVariable UUID dayId,
        @PathVariable UUID taskId,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID userId = userContextResolver.resolveUserId(headerUserId);
        return taskService.completeTask(dayId, taskId, userId);
    }
}
```
