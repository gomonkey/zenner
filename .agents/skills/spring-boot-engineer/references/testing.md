# Testing - Spring Boot 4 Test

Boot 4 moved test annotations into per-technology modules and removed `@MockBean`/`@SpyBean`. Imports used below:

```java
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.webflux.test.autoconfigure.WebFluxTest;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.client.RestTestClient;
```

Dependencies: `spring-boot-starter-webmvc-test` (MockMvc, `@WebMvcTest`), `spring-boot-starter-data-jpa-test` (`@DataJpaTest`),
`spring-boot-testcontainers` + `org.testcontainers:testcontainers-junit-jupiter` + `org.testcontainers:testcontainers-postgresql`
(Testcontainers 2.x). Check exact artifact names against the Boot docs when adding one.

## Unit Testing with JUnit 5

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("Should create user successfully")
    void shouldCreateUser() {
        // Given
        UserCreateRequest request = new UserCreateRequest(
            "test@example.com",
            "Password123",
            "testuser",
            25
        );

        User user = User.builder()
            .id(1L)
            .email(request.email())
            .username(request.username())
            .build();

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        UserResponse response = userService.create(request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.email()).isEqualTo(request.email());

        verify(userRepository).existsByEmail(request.email());
        verify(passwordEncoder).encode(request.password());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when email already exists")
    void shouldThrowExceptionWhenEmailExists() {
        // Given
        UserCreateRequest request = new UserCreateRequest(
            "test@example.com",
            "Password123",
            "testuser",
            25
        );

        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> userService.create(request))
            .isInstanceOf(DuplicateResourceException.class)
            .hasMessageContaining("Email already registered");

        verify(userRepository, never()).save(any(User.class));
    }
}
```

## Integration Testing with @SpringBootTest

`@SpringBootTest` no longer provides `MockMvc`, `WebClient` or `TestRestTemplate` — opt in explicitly.
`RestTestClient` replaces `TestRestTemplate` for new tests.

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
@ActiveProfiles("test")
class UserIntegrationTest {

    @Autowired
    private RestTestClient client;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should create user via API")
    void shouldCreateUserViaApi() {
        var request = new UserCreateRequest("test@example.com", "Password123", "testuser", 25);

        client.post().uri("/api/v1/users")
            .contentType(MediaType.APPLICATION_JSON)
            .body(request)
            .exchange()
            .expectStatus().isCreated()
            .expectHeader().exists(HttpHeaders.LOCATION)
            .expectBody(UserResponse.class)
            .value(body -> assertThat(body.email()).isEqualTo(request.email()));
    }

    @Test
    @DisplayName("Should return validation error for invalid request")
    void shouldReturnValidationError() {
        var request = new UserCreateRequest("invalid-email", "short", "u", 15);

        client.post().uri("/api/v1/users")
            .contentType(MediaType.APPLICATION_JSON)
            .body(request)
            .exchange()
            .expectStatus().isBadRequest()
            .expectBody()
            .jsonPath("$.errors").isNotEmpty();   // ProblemDetail with "errors" property
    }
}
```

Tests should be independent — avoid `@TestMethodOrder`; clean state in `@BeforeEach`.

If you must keep `TestRestTemplate`, add `@AutoConfigureTestRestTemplate` (`org.springframework.boot.resttestclient.autoconfigure`)
and the `spring-boot-resttestclient` dependency.

## Web Layer Testing with MockMvc

```java
@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;            // or MockMvcTester for AssertJ-style assertions

    @MockitoBean
    private UserService userService;

    @Autowired
    private JsonMapper jsonMapper;      // tools.jackson.databind.json.JsonMapper (Jackson 3)

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Should get all users")
    void shouldGetAllUsers() throws Exception {
        // Given
        Page<UserResponse> users = new PageImpl<>(List.of(
            new UserResponse(1L, "user1@example.com", "user1", 25, true, null, null),
            new UserResponse(2L, "user2@example.com", "user2", 30, true, null, null)
        ));

        when(userService.findAll(any(Pageable.class))).thenReturn(users);

        // When & Then
        mockMvc.perform(get("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content.length()").value(2))
            .andExpect(jsonPath("$.content[0].email").value("user1@example.com"))
            .andDo(print());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("Should create user")
    void shouldCreateUser() throws Exception {
        // Given
        UserCreateRequest request = new UserCreateRequest(
            "test@example.com",
            "Password123",
            "testuser",
            25
        );

        UserResponse response = new UserResponse(
            1L,
            request.email(),
            request.username(),
            request.age(),
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        );

        when(userService.create(any(UserCreateRequest.class))).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.email").value(request.email()))
            .andExpect(jsonPath("$.username").value(request.username()))
            .andDo(print());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("Should return 403 for non-admin user")
    void shouldReturn403ForNonAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isForbidden());
    }
}
```

## Data JPA Testing

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(PostgresTestcontainersConfig.class)   // real DB; see Testcontainers section
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("Should find user by email")
    void shouldFindUserByEmail() {
        // Given
        User user = User.builder()
            .email("test@example.com")
            .password("password")
            .username("testuser")
            .active(true)
            .build();

        entityManager.persistAndFlush(user);

        // When
        Optional<User> found = userRepository.findByEmail("test@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("Should check if email exists")
    void shouldCheckIfEmailExists() {
        // Given
        User user = User.builder()
            .email("test@example.com")
            .password("password")
            .username("testuser")
            .active(true)
            .build();

        entityManager.persistAndFlush(user);

        // When
        boolean exists = userRepository.existsByEmail("test@example.com");

        // Then
        assertThat(exists).isTrue();
    }

    @Test
    @DisplayName("Should fetch user with roles")
    void shouldFetchUserWithRoles() {
        // Given
        Role adminRole = Role.builder().name("ADMIN").build();
        entityManager.persist(adminRole);

        User user = User.builder()
            .email("admin@example.com")
            .password("password")
            .username("admin")
            .active(true)
            .roles(Set.of(adminRole))
            .build();

        entityManager.persistAndFlush(user);
        entityManager.clear();

        // When
        Optional<User> found = userRepository.findByEmailWithRoles("admin@example.com");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getRoles()).hasSize(1);
        assertThat(found.get().getRoles()).extracting(Role::getName).contains("ADMIN");
    }
}
```

## Testcontainers for Database

Testcontainers 2.x: modules are `testcontainers-*` artifacts and classes moved packages
(`org.testcontainers.postgresql.PostgreSQLContainer`). Use `@ServiceConnection` — no `@DynamicPropertySource` needed.

```java
@TestConfiguration(proxyBeanMethods = false)
public class PostgresTestcontainersConfig {

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgres() {
        return new PostgreSQLContainer("postgres:17-alpine");   // pin to the production major version
    }
}

@SpringBootTest
@Import(PostgresTestcontainersConfig.class)
class UserServiceIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should create and find user in real database")
    void shouldCreateAndFindUser() {
        var request = new UserCreateRequest("test@example.com", "Password123", "testuser", 25);

        UserResponse created = userService.create(request);
        UserResponse found = userService.findById(created.id());

        assertThat(found).isNotNull();
        assertThat(found.email()).isEqualTo(request.email());
    }
}
```

`PostgreSQLContainer` is no longer generic in 2.x (`PostgreSQLContainer`, not `PostgreSQLContainer<?>`).
To share one container across all test classes, keep it in a `@TestConfiguration` imported by each test (the Spring context is cached).
For local dev, the same config can be started with `SpringApplication.from(Application::main).with(PostgresTestcontainersConfig.class).run(args)`.

## Testing Reactive Endpoints with WebTestClient

```java
@WebFluxTest(UserReactiveController.class)
class UserReactiveControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private UserReactiveService userService;

    @Test
    @DisplayName("Should get user reactively")
    void shouldGetUserReactively() {
        // Given
        UserResponse user = new UserResponse(
            1L,
            "test@example.com",
            "testuser",
            25,
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        );

        when(userService.findById(1L)).thenReturn(Mono.just(user));

        // When & Then
        webTestClient.get()
            .uri("/api/v1/users/{id}", 1L)
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus().isOk()
            .expectBody(UserResponse.class)
            .value(response -> {
                assertThat(response.id()).isEqualTo(1L);
                assertThat(response.email()).isEqualTo("test@example.com");
            });
    }

    @Test
    @DisplayName("Should create user reactively")
    void shouldCreateUserReactively() {
        // Given
        UserCreateRequest request = new UserCreateRequest(
            "test@example.com",
            "Password123",
            "testuser",
            25
        );

        UserResponse response = new UserResponse(
            1L,
            request.email(),
            request.username(),
            request.age(),
            true,
            LocalDateTime.now(),
            LocalDateTime.now()
        );

        when(userService.create(any(UserCreateRequest.class))).thenReturn(Mono.just(response));

        // When & Then
        webTestClient.post()
            .uri("/api/v1/users")
            .contentType(MediaType.APPLICATION_JSON)
            .body(Mono.just(request), UserCreateRequest.class)
            .exchange()
            .expectStatus().isCreated()
            .expectHeader().exists("Location")
            .expectBody(UserResponse.class)
            .value(user -> {
                assertThat(user.email()).isEqualTo(request.email());
            });
    }
}
```

## Testing Configuration

```java
// application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  security:
    user:
      name: test
      password: test

logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE

// Test Configuration Class
@TestConfiguration
public class TestConfig {

    @Bean
    @Primary
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(4); // Faster for tests
    }

    @Bean
    public Clock fixedClock() {
        return Clock.fixed(
            Instant.parse("2026-01-01T00:00:00Z"),
            ZoneId.of("UTC")
        );
    }
}
```

## Test Fixtures with @DataJpaTest

```java
@Component
public class TestDataFactory {

    public static User createUser(String email, String username) {
        return User.builder()
            .email(email)
            .password("encodedPassword")
            .username(username)
            .active(true)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }

    public static UserCreateRequest createUserRequest() {
        return new UserCreateRequest(
            "test@example.com",
            "Password123",
            "testuser",
            25
        );
    }
}
```

## Quick Reference

| Annotation | Purpose |
|------------|---------|
| `@SpringBootTest` | Full application context integration test |
| `@WebMvcTest` | Test MVC controllers with mocked services |
| `@WebFluxTest` | Test reactive controllers |
| `@DataJpaTest` | Test JPA repositories with in-memory database |
| `@MockitoBean` / `@MockitoSpyBean` | Replace/spy a bean in the Spring context (fields only; replaces `@MockBean`/`@SpyBean`) |
| `@AutoConfigureMockMvc` | Opt in to `MockMvc`/`MockMvcTester` in `@SpringBootTest` |
| `@AutoConfigureRestTestClient` | Opt in to `RestTestClient` (replaces `TestRestTemplate`) |
| `@ServiceConnection` | Wire a Testcontainers container into Spring properties automatically |
| `@WithMockUser` | Mock authenticated user for security tests |
| `@ActiveProfiles` | Activate specific Spring profiles for test |

## Testing Best Practices

- Write tests following AAA pattern (Arrange, Act, Assert)
- Use descriptive test names with @DisplayName
- Mock external dependencies, use real DB with Testcontainers
- Achieve 85%+ code coverage
- Test happy path and edge cases
- Use @Transactional for test data cleanup
- Separate unit tests from integration tests
- Use parameterized tests for multiple scenarios
- Test security rules and validation
- Keep tests fast and independent
