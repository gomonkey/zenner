# Testing

Tests live next to the code in each service module (`src/test/java`). Both modules currently ship a context-load smoke test; add slices and integration tests as features land.

## Commands

Run from a service directory (`zenner-core` or `zenner-auth`):

- Fast loop: `./mvnw -B test`
- Full build + tests: `./mvnw -B verify`
- From root using the shared script: `.opencode/scripts/verify.sh test zenner-core` (or `full`).

Database-backed tests require the shared Postgres (start with `scripts/docker-local.sh up`) or Testcontainers.

## Strategy

- **Unit tests**: plain JUnit 5 + Mockito for services and pure logic. Prefer `@MockitoBean` / `@MockitoSpyBean`.
- **Web slice**: `@WebMvcTest(Clazz.class)` with `MockMvcTester` and `@MockitoBean` dependencies.
- **Persistence slice**: `@DataJpaTest` with Testcontainers PostgreSQL (`@ServiceConnection`, Testcontainers 2.x) once repositories exist.
- **Integration**: `@SpringBootTest` with Testcontainers for the datasource; verify Flyway migrations apply cleanly.
- **Smoke**: `@SpringBootTest` context load (current).

## Practices

- Test behavior, not implementation; keep tests independent and deterministic.
- Validate edge cases and validation errors (expect `ProblemDetail`).
- Integration tests must not depend on local-only state; use Testcontainers or the shared dev DB.
- Redis is disabled in health checks (`management.health.redis.enabled=false`); do not assume Redis is running in tests.
- Run the full module verify before claiming done; report skipped/blocked tests honestly.

## Example (controller slice)

```java
@WebMvcTest(DayController.class)
class DayControllerTest {
    @Autowired MockMvcTester mvc;
    @MockitoBean DayService service;

    @Test
    void getDay_returns200() {
        when(service.get(any())).thenReturn(new DayResponse(...));
        assertThat(mvc.get().uri("/api/v1/days/{id}", id))
            .hasStatus(HttpStatus.OK);
    }
}
```