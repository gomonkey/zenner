---
name: spring-boot-engineer
description: Generates Spring Boot 4.x configurations on Java 21, creates REST controllers, implements Spring Security 7 authentication flows, sets up Spring Data JPA repositories, and configures reactive WebFlux endpoints. Use when building or upgrading Spring Boot 4.x applications, microservices, or reactive Java applications; invoke for Spring Data JPA, Spring Security 7, WebFlux, Spring Cloud integration, Jackson 3, virtual threads, Java REST API design, or migrating from Spring Boot 3.x.
license: MIT
metadata:
  author: https://github.com/Jeffallan
  company: https://synergetic.solutions
  version: "1.1.0"
  domain: backend
  triggers: Spring Boot, Spring Boot 4, Spring Framework 7, Spring Cloud, Spring Security, Spring Data JPA, Spring WebFlux, Java 21, virtual threads, Jackson 3, Microservices Java, Java REST API, Reactive Java
  role: specialist
  scope: implementation
  output-format: code
  related-skills: java-architect, database-optimizer, microservices-architect, devops-engineer
---

# Spring Boot Engineer

**Target stack: Java 21, Spring Boot 4.x (Spring Framework 7, Spring Security 7, Jackson 3).** Read `references/boot4-java21.md` first if you are unsure whether an API/annotation/starter from Boot 3.x still exists — many were removed or renamed.

## Core Workflow

1. **Analyze requirements** — Identify service boundaries, APIs, data models, security needs
2. **Design architecture** — Plan microservices, data access, cloud integration, security; confirm design before coding
3. **Implement** — Create services with constructor injection and layered architecture (see Quick Start below); use Java 21 features (records, sealed types, pattern-matching `switch`)
4. **Secure** — Add Spring Security, OAuth2, method security, CORS configuration; verify security rules compile and pass tests. If compilation or tests fail: review error output, fix the failing rule or configuration, and re-run before proceeding
5. **Test** — Write unit, integration, and slice tests; run `./mvnw test` (or `./gradlew test`; or `scripts/verify.sh test`) and confirm all pass before proceeding. If tests fail: review the stack trace, isolate the failing assertion or component, fix the issue, and re-run the full suite
6. **Deploy** — Configure health checks and observability via Actuator; validate `/actuator/health` returns `UP`. If health is `DOWN`: check the `components` detail in the response, resolve the failing component (e.g., datasource, broker), and re-validate

## Reference Guide

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Web Layer | `references/web.md` | Controllers, REST APIs, validation, exception handling |
| Data Access | `references/data.md` | Spring Data JPA, repositories, transactions, projections |
| Security | `references/security.md` | Spring Security 7, OAuth2, JWT, method security |
| Cloud Native | `references/cloud.md` | Spring Cloud, Config, Discovery, Gateway, resilience |
| Testing | `references/testing.md` | @SpringBootTest, MockMvc, Testcontainers, test slices |
| Boot 4 / Java 21 | `references/boot4-java21.md` | Starters, Jackson 3, package moves, Security 7 changes, virtual threads, upgrading from 3.x |

## Quick Start — Minimal Working Structure

A standard Spring Boot feature consists of these layers. Use these as copy-paste starting points.

### Entity

```java
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @DecimalMin("0.0")
    private BigDecimal price;

    // getters / setters or use @Data (Lombok)
}
```

### Repository

```java
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByNameContainingIgnoreCase(String name);
}
```

### Service (constructor injection)

```java
@Service
public class ProductService {
    private final ProductRepository repo;

    public ProductService(ProductRepository repo) { // constructor injection — no @Autowired
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<Product> search(String name) {
        return repo.findByNameContainingIgnoreCase(name);
    }

    @Transactional
    public Product create(ProductRequest request) {
        var product = new Product();
        product.setName(request.name());
        product.setPrice(request.price());
        return repo.save(product);
    }
}
```

### REST Controller

```java
@RestController
@RequestMapping("/api/v1/products")
@Validated
public class ProductController {
    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public List<Product> search(@RequestParam(defaultValue = "") String name) {
        return service.search(name);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product create(@Valid @RequestBody ProductRequest request) {
        return service.create(request);
    }
}
```

### DTO (record)

```java
public record ProductRequest(
    @NotBlank String name,
    @DecimalMin("0.0") BigDecimal price
) {}
```

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        problem.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage, (a, b) -> a)));
        return problem;
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ProblemDetail handleNotFound(EntityNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }
}
```

### Test Slice

```java
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;           // moved in Boot 4
import org.springframework.test.context.bean.override.mockito.MockitoBean;       // replaces @MockBean

@WebMvcTest(ProductController.class)
class ProductControllerTest {
    @Autowired MockMvcTester mvc;
    @MockitoBean ProductService service;

    @Test
    void createProduct_validRequest_returns201() {
        var product = new Product(); product.setName("Widget"); product.setPrice(BigDecimal.TEN);
        when(service.create(any())).thenReturn(product);

        assertThat(mvc.post().uri("/api/v1/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"name":"Widget","price":10.0}"""))
            .hasStatus(HttpStatus.CREATED)
            .bodyJson().extractingPath("$.name").isEqualTo("Widget");
    }
}
```

## Constraints

### MUST DO

| Rule | Correct Pattern |
|------|----------------|
| Constructor injection | `public MyService(Dep dep) { this.dep = dep; }` |
| Validate API input | `@Valid @RequestBody MyRequest req` on every mutating endpoint |
| Type-safe config | `@ConfigurationProperties(prefix = "app")` bound to a record/class |
| Appropriate stereotype | `@Service` for business logic, `@Repository` for data, `@RestController` for HTTP |
| Transaction scope | `@Transactional` on multi-step writes; `@Transactional(readOnly = true)` on reads |
| Hide internals | Catch domain exceptions in `@RestControllerAdvice`; return problem details, not stack traces |
| Externalize secrets | Use environment variables or Spring Cloud Config — never `application.properties` |
| Java 21 baseline | `<java.version>21</java.version>`; records for DTOs/config; sealed types + pattern `switch` for closed hierarchies |
| Blocking workloads | `spring.threads.virtual.enabled=true` on MVC; avoid `synchronized` around blocking I/O |
| JSON | Inject `tools.jackson.databind.json.JsonMapper` (Jackson 3); annotations stay `com.fasterxml.jackson.annotation.*` |
| Boot 4 starters | `spring-boot-starter-webmvc`, `spring-boot-starter-flyway`, `spring-boot-starter-<tech>-test` — see `references/boot4-java21.md` |
| Test mocks | `@MockitoBean` / `@MockitoSpyBean`; `@AutoConfigureMockMvc` and `@AutoConfigureRestTestClient` are opt-in |

### MUST NOT DO
- Use field injection (`@Autowired` on fields)
- Skip input validation on API endpoints
- Use `@Component` when `@Service`/`@Repository`/`@Controller` applies
- Mix blocking and reactive code (e.g., calling `.block()` inside a WebFlux chain)
- Store secrets or credentials in `application.properties`/`application.yml`
- Hardcode URLs, credentials, or environment-specific values
- Use removed Spring Boot 2.x/3.x patterns: `WebSecurityConfigurerAdapter`, `authorizeRequests`, `antMatchers`, security `.and()` chaining, `@MockBean`/`@SpyBean`, `spring-boot-starter-web`, Undertow, `com.fasterxml.jackson.databind.ObjectMapper` injection
- Use `javax.*` imports (Jakarta EE 11: `jakarta.*` only)
- Use `org.springframework.lang.Nullable`/`@NonNull` (use JSpecify `org.jspecify.annotations.*`)
- Use `TestRestTemplate`/`RestTemplate` in new code (use `RestTestClient` / `RestClient`)

Maintained by [@jeffallan](https://github.com/jeffallan), Principal Consultant at [Synergetic Solutions](https://synergetic.solutions)

[Documentation](https://jeffallan.github.io/claude-skills/skills/backend/spring-boot-engineer/)
