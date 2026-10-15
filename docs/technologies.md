# Technologies we use

## Runtime

- **Java 21** (records, sealed types, pattern-matching `switch`, virtual threads).
- **Spring Boot 4.1.0** — Spring Framework 7, Spring Security 7, Jackson 3, Hibernate 7.
- **Spring MVC + virtual threads** for blocking workloads (`spring.threads.virtual.enabled=true`). WebFlux only for streaming/back-pressure.

## Starters (per service)

`spring-boot-starter-webmvc`, `-data-jpa`, `-data-redis`, `-security`, `-validation`, `-flyway`, `-actuator`, plus `-security-oauth2-client` (auth) and the matching `*-test` starters for tests.

## Data

- **PostgreSQL 17** (one instance, schema per service).
- **Redis** (starter present; available for caching/session helpers).
- **Flyway** for schema changes (`ddl-auto=validate`; never `update` outside local dev).
- **Hibernate/JPA** with `open-in-view=false`.

## Security

- Spring Security 7, lambda DSL only (no `.and()`, `antMatchers`, `authorizeRequests`).
- OAuth2 client in `zenner-auth`; resource server (JWT) targeted for `zenner-core`.
- JSpecify (`org.jspecify.annotations.*`) for nullability; no `org.springframework.lang.*`.

## Build and tooling

- **Maven** with wrapper (`./mvnw`); Java target in `pom.xml` (`<java.version>21</java.version>`).
- **Lombok** for boilerplate (annotation processor configured in `pom.xml`).
- **Docker** multi-stage builds based on `maven:3.9-eclipse-temurin-21` and `eclipse-temurin:21-jre-alpine`.
- Shared DB via `docker/docker-compose.local.yml`.

## JSON

- Inject `tools.jackson.databind.json.JsonMapper` (Jackson 3). Annotations remain `com.fasterxml.jackson.annotation.*`.

## Observability

- Spring Boot Actuator: expose `health` (and more as needed); structured logging; no PII or secrets.

## Conventions that follow from the stack

- Constructor injection only; records for DTOs and `@ConfigurationProperties`.
- `@MockitoBean` in tests (`@MockBean` removed in Boot 4).
- Boot 4 starter names (`-webmvc`, not `-web`). When memory/examples disagree, `boot4-java21.md` wins.