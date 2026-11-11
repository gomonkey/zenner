# Spring Boot 4 + Java 21 — Baseline and Migration Cheat Sheet

Target stack for all skills in this repo: **Java 21 (LTS), Spring Boot 4.x, Spring Framework 7, Spring Security 7**.
Boot 4 requires Java 17+ and recommends the latest LTS; this repo standardizes on 21.
Anything you remember from Boot 2.x/3.x that conflicts with this file is out of date — this file wins.

## Baseline

| Component | Version |
|-----------|---------|
| Java | 21 (min 17) |
| Spring Boot | 4.x (4.1.x current at time of writing) |
| Spring Framework | 7.0 |
| Spring Security | 7.0 |
| Spring Data | 2025.1 |
| Jakarta EE | 11 (Servlet 6.1), Tomcat 11 |
| Hibernate ORM / Validator | 7.x / 9.0 |
| Jackson | 3 (`tools.jackson.*`) |
| Testcontainers | 2.x |
| Spring Cloud | 2025.1.x "Oakwood" — **not** managed by Boot; pick a train that matches your Boot version (2025.0.x does not work with Boot 4.0.1+) |
| Kotlin (if used) | 2.2+ |

Spring Boot 4 is **not** compatible with the 3.x-era Spring Cloud train. Always check the Spring Cloud / Boot compatibility table before bumping either.

## Starters

Boot 4 split auto-configuration into focused modules. Common renames:

| Boot 3.x | Boot 4.x |
|----------|----------|
| `spring-boot-starter-web` | `spring-boot-starter-webmvc` |
| `spring-boot-starter-aop` | `spring-boot-starter-aspectj` |
| `spring-boot-starter-web-services` | `spring-boot-starter-webservices` |
| `flyway-core` (alone) | `spring-boot-starter-flyway` |
| `liquibase-core` (alone) | `spring-boot-starter-liquibase` |
| `spring-boot-starter-oauth2-resource-server` | `spring-boot-starter-security-oauth2-resource-server` |
| `spring-boot-starter-test` (everything) | `spring-boot-starter-<tech>-test` per technology, e.g. `spring-boot-starter-webmvc-test` |
| `spring-boot-starter-undertow` | **removed** — use Tomcat or Jetty |

Flyway/Liquibase silently do nothing in Boot 4 if you only declare the library — use the starter.
Transition aid: `spring-boot-starter-classic` / `spring-boot-starter-test-classic` restore a Boot 3-like classpath. Use only to get an upgrade compiling, then move to focused starters.
Add `spring-boot-properties-migrator` (runtime scope) during an upgrade to surface renamed config keys; remove it afterwards.

## Jackson 3

- Group id/package: `com.fasterxml.jackson.*` → `tools.jackson.*`. **Exception:** `jackson-annotations` keeps `com.fasterxml.jackson.annotation` (`@JsonProperty`, `@JsonIgnore`, …).
- Primary types: `ObjectMapper` → `tools.jackson.databind.json.JsonMapper` (immutable, built with `JsonMapper.builder()`). Inject `JsonMapper`, not `ObjectMapper`.
- `@JsonComponent` → `@JacksonComponent`; `@JsonMixin` → `@JacksonMixin`; `Jackson2ObjectMapperBuilderCustomizer` → `JsonMapperBuilderCustomizer`.
- Properties: `spring.jackson.read.*` / `write.*` → `spring.jackson.json.read.*` / `json.write.*`.
- Jackson 3 exceptions are unchecked (`JacksonException`) — `throws JsonProcessingException` boilerplate goes away.
- Escape hatch: `spring-boot-jackson2` + `spring.jackson2.*` keeps Jackson 2 (deprecated; needed e.g. with Jersey).

```java
@RestController
class ExportController {
    private final JsonMapper jsonMapper;          // not ObjectMapper
    ExportController(JsonMapper jsonMapper) { this.jsonMapper = jsonMapper; }
}
```

## Testing

| Boot 3.x | Boot 4.x |
|----------|----------|
| `@MockBean` / `@SpyBean` (`o.s.boot.test.mock.mockito`) | **removed** → `@MockitoBean` / `@MockitoSpyBean` (`org.springframework.test.context.bean.override.mockito`). Fields only — not allowed in `@Configuration` classes |
| `@WebMvcTest` in `o.s.boot.test.autoconfigure.web.servlet` | `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest` |
| `@DataJpaTest` in `o.s.boot.test.autoconfigure.orm.jpa` | `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest` |
| `TestEntityManager` | `org.springframework.boot.jpa.test.autoconfigure.TestEntityManager` |
| `@AutoConfigureTestDatabase` | `org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase` |
| `@WebFluxTest` | `org.springframework.boot.webflux.test.autoconfigure.WebFluxTest` |
| `@SpringBootTest` auto-provides `MockMvc` | **no longer** — add `@AutoConfigureMockMvc` (`org.springframework.boot.webmvc.test.autoconfigure`) |
| `@SpringBootTest` auto-provides `TestRestTemplate`/`WebClient` | **no longer** — use `@AutoConfigureRestTestClient` (preferred) or `@AutoConfigureTestRestTemplate` (`org.springframework.boot.resttestclient.autoconfigure`) |
| `TestRestTemplate` | prefer `RestTestClient` (`org.springframework.test.web.servlet.client`) |
| `MockMvc` + `jsonPath` | `MockMvcTester` (`org.springframework.test.web.servlet.assertj`) gives AssertJ-style assertions |
| `org.testcontainers.containers.PostgreSQLContainer` | `org.testcontainers.postgresql.PostgreSQLContainer`; artifacts renamed `org.testcontainers:postgresql` → `org.testcontainers:testcontainers-postgresql`; JUnit 4 support removed |
| `@DynamicPropertySource` wiring | `@ServiceConnection` (`org.springframework.boot.testcontainers.service.connection`) |

Test starters are per technology; declare what you test with, e.g. `spring-boot-starter-webmvc-test`, `spring-boot-starter-data-jpa-test`, plus `spring-boot-testcontainers` and `testcontainers-junit-jupiter` for containers. Verify exact artifact names against the Boot docs when you add one.

## Spring Security 7

- Lambda DSL only: `.and()` chaining is gone. Always `http.csrf(c -> …).authorizeHttpRequests(a -> …)`.
- `authorizeRequests`, `antMatchers`, `mvcMatchers`, `@EnableGlobalMethodSecurity`, `WebSecurityConfigurerAdapter` are all gone. Use `authorizeHttpRequests`, `requestMatchers(...)`, `@EnableMethodSecurity`, a `SecurityFilterChain` bean.
- `AntPathRequestMatcher` / `MvcRequestMatcher` are removed; `requestMatchers("/path/**")` strings use path-pattern matching. Use `PathPatternRequestMatcher.withDefaults().matcher(...)` when you need an explicit matcher.
- `AccessDecisionManager`/voters moved to a separate `spring-security-access` artifact — migrate to `AuthorizationManager` instead of depending on it.
- OAuth2 password grant is removed. Spring Authorization Server is now part of Spring Security (version follows `spring-security.version`).
- Security's JSON persistence (session/remember-me) uses Jackson 3.
- Prefer `oauth2ResourceServer(jwt)` over a hand-written JWT filter. If you must parse JWTs yourself, use JJWT **0.12+** API (see `security.md`).

## Web / HTTP

- **API versioning** is built in: `@GetMapping(path = "/orders", version = "1.1")`, configured via `spring.mvc.apiversion.*` (or `spring.webflux.apiversion.*`). Prefer it over hand-rolled `/v1/` path forks for new APIs.
- **Declarative HTTP clients**: `@HttpExchange` interfaces with generated implementations and Boot auto-configuration — prefer over hand-written `RestClient` wrappers.
- Blocking client: `RestClient`. `RestTemplate` still exists but is not recommended for new code.
- `HttpMessageConverters` is deprecated; use `ServerHttpMessageConvertersCustomizer` / `ClientHttpMessageConvertersCustomizer`.
- Errors: RFC 9457 `ProblemDetail`; set `spring.mvc.problemdetails.enabled=true` for framework exceptions.
- Spring Framework 7 ships core resilience annotations (`@Retryable`, `@ConcurrencyLimit`, enabled with `@EnableResilientMethods`). Prefer them for simple retry/throttling; keep Resilience4j for circuit breakers/bulkheads.

## Null-safety

Spring 7 is annotated with **JSpecify** (`org.jspecify.annotations.@Nullable`, `@NullMarked`). Use these, not `org.springframework.lang.Nullable`/`@NonNull` (deprecated; actuator endpoint parameters no longer accept the Spring ones).

## Observability

- Liveness/readiness probes are **on by default**.
- `spring-boot-starter-opentelemetry` exports metrics and traces over OTLP and configures the OTel SDK — prefer it over Zipkin-specific wiring for new services. Micrometer Tracing remains the API (`Tracer`).
- Logback file logs default to UTF-8.

## Persistence

- `@EntityScan` → `org.springframework.boot.persistence.autoconfigure.EntityScan`.
- `spring.dao.exceptiontranslation.enabled` → `spring.persistence.exceptiontranslation.enabled`.
- `hibernate-jpamodelgen` → `hibernate-processor`.
- Spring Batch defaults to in-memory metadata; add `spring-boot-starter-batch-jdbc` to persist job state.
- MongoDB: many `spring.data.mongodb.*` keys moved to `spring.mongodb.*`; set UUID/BigDecimal representation explicitly.

## Java 21 idioms to use

- **Records** for DTOs, config properties (`@ConfigurationProperties`), projections, events. Never expose JPA entities from controllers.
- **Sealed interfaces + pattern-matching `switch`** for closed domain hierarchies and result types (exhaustive, no default branch):
  ```java
  sealed interface PaymentResult permits Approved, Declined, Pending {}
  String message(PaymentResult r) {
      return switch (r) {
          case Approved a -> "ok " + a.id();
          case Declined d -> "declined: " + d.reason();
          case Pending p  -> "pending";
      };
  }
  ```
- **Virtual threads** for blocking MVC/JDBC workloads: `spring.threads.virtual.enabled=true`. Don't also hand-tune huge platform thread pools. Watch for `synchronized` blocks around blocking I/O (Java 21 pins the carrier thread; JDK 24+ fixes this) — prefer `ReentrantLock`. Cap DB concurrency with the connection pool size, not the thread count.
- **Reactive (WebFlux) is only worth it for streaming/back-pressure or an already-reactive stack.** For ordinary request/response services on Java 21, MVC + virtual threads is the default.
- `var` for obvious locals, text blocks for SQL/JSON, `SequencedCollection` (`getFirst()`, `reversed()`), `Stream.toList()`.
- Build config: Maven `<java.version>21</java.version>`; Gradle `java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }`.
- Container images: `eclipse-temurin:21-jre` runtime; set `-XX:MaxRAMPercentage=75` rather than a fixed `-Xmx`.

## Upgrade checklist (3.x → 4.x)

1. Get to the latest 3.5.x and clear **all** deprecation warnings (anything deprecated in 3.x is removed in 4.0).
2. Bump Boot; add `spring-boot-properties-migrator`; fix renamed keys.
3. Swap to focused starters (or classic starters temporarily).
4. Jackson 3 imports and `JsonMapper`; custom serializers/mixins.
5. Security 7: remove `.and()`, legacy matchers, `AccessDecisionManager`.
6. Tests: `@MockitoBean`, `@AutoConfigureMockMvc`, `RestTestClient`, Testcontainers 2 packages, new slice-annotation packages.
7. Spring Cloud → 2025.1.x; Gateway artifacts/properties renamed (see `cloud.md`).
8. Run `scripts/verify.sh`, then smoke-test `/actuator/health` including liveness/readiness.
