# Testing Patterns (Spring Boot 4, Java 21)

Boot 4 removed `@MockBean`/`@SpyBean`, moved the test-slice annotations to new packages, stopped auto-providing `MockMvc`/`TestRestTemplate`
in `@SpringBootTest`, and ships Testcontainers 2.x (new packages). See `../../spring-boot-engineer/references/testing.md` for the
import table and `../../spring-boot-engineer/references/boot4-java21.md` for the full list.

## Unit Testing with JUnit 5

```java
package com.example.application.service;

import com.example.application.dto.UserRequest;
import com.example.application.dto.UserResponse;
import com.example.application.mapper.UserMapper;
import com.example.domain.model.User;
import com.example.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("User Service Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserRequest userRequest;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(1L)
            .email("test@example.com")
            .username("testuser")
            .active(true)
            .build();

        userRequest = new UserRequest("test@example.com", "testuser");
        userResponse = new UserResponse(1L, "test@example.com", "testuser");
    }

    @Test
    @DisplayName("Should find user by ID successfully")
    void shouldFindUserById() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userMapper.toResponse(testUser)).thenReturn(userResponse);

        // When
        UserResponse result = userService.findById(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.email()).isEqualTo("test@example.com");
        verify(userRepository).findById(1L);
        verify(userMapper).toResponse(testUser);
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void shouldThrowWhenUserNotFound() {
        // Given
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When / Then
        assertThatThrownBy(() -> userService.findById(999L))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessageContaining("User not found");

        verify(userRepository).findById(999L);
        verifyNoInteractions(userMapper);
    }

    @Test
    @DisplayName("Should create user successfully")
    void shouldCreateUser() {
        // Given
        when(userMapper.toEntity(userRequest)).thenReturn(testUser);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(userMapper.toResponse(testUser)).thenReturn(userResponse);

        // When
        UserResponse result = userService.create(userRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
        verify(userRepository).save(any(User.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"admin", "user", "moderator"})
    @DisplayName("Should validate different user roles")
    void shouldValidateUserRoles(String role) {
        // Test with multiple roles
        assertThat(role).isNotBlank();
    }
}
```

## Integration Testing with Testcontainers

```java
package com.example.integration;

import com.example.application.dto.UserRequest;
import com.example.application.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureRestTestClient
@Import(PostgresTestcontainersConfig.class)   // see "Test Containers Shared Instance"
class UserIntegrationTest {

    @Autowired
    private RestTestClient client;

    @Test
    void shouldCreateAndRetrieveUser() {
        var request = new UserRequest("test@example.com", "testuser");

        UserResponse created = client.post().uri("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .body(request)
            .exchange()
            .expectStatus().isCreated()
            .expectBody(UserResponse.class)
            .returnResult().getResponseBody();

        assertThat(created).isNotNull();

        client.get().uri("/api/users/{id}", created.id())
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.email").isEqualTo("test@example.com");
    }
}
```

## Repository Testing

```java
package com.example.domain.repository;

import com.example.domain.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(PostgresTestcontainersConfig.class)
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldFindUserByEmail() {
        // Given
        User user = User.builder()
            .email("test@example.com")
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
    void shouldCountActiveUsers() {
        // Given
        User activeUser = User.builder()
            .email("active@example.com")
            .username("active")
            .active(true)
            .build();
        User inactiveUser = User.builder()
            .email("inactive@example.com")
            .username("inactive")
            .active(false)
            .build();
        entityManager.persist(activeUser);
        entityManager.persist(inactiveUser);
        entityManager.flush();

        // When
        long count = userRepository.countByActiveTrue();

        // Then
        assertThat(count).isEqualTo(1);
    }
}
```

## REST Controller Testing

```java
package com.example.presentation.rest;

import com.example.application.dto.UserRequest;
import com.example.application.dto.UserResponse;
import com.example.application.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper jsonMapper;      // Jackson 3

    @MockitoBean
    private UserService userService;

    @Test
    @WithMockUser
    void shouldGetUserById() throws Exception {
        // Given
        UserResponse response = new UserResponse(1L, "test@example.com", "testuser");
        when(userService.findById(1L)).thenReturn(response);

        // When / Then
        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    @WithMockUser
    void shouldCreateUser() throws Exception {
        // Given
        UserRequest request = new UserRequest("test@example.com", "testuser");
        UserResponse response = new UserResponse(1L, "test@example.com", "testuser");
        when(userService.create(any(UserRequest.class))).thenReturn(response);

        // When / Then
        mockMvc.perform(post("/api/users")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void shouldReturn401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/users/1"))
            .andExpect(status().isUnauthorized());
    }
}
```

## Test Configuration

```java
package com.example.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@TestConfiguration
public class TestSecurityConfig {

    @Bean
    @Primary
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }
}
```

## Test Data Builders

```java
package com.example.test.builders;

import com.example.domain.model.User;

public class UserTestBuilder {

    private Long id = 1L;
    private String email = "test@example.com";
    private String username = "testuser";
    private Boolean active = true;

    public static UserTestBuilder aUser() {
        return new UserTestBuilder();
    }

    public UserTestBuilder withId(Long id) {
        this.id = id;
        return this;
    }

    public UserTestBuilder withEmail(String email) {
        this.email = email;
        return this;
    }

    public UserTestBuilder inactive() {
        this.active = false;
        return this;
    }

    public User build() {
        return User.builder()
            .id(id)
            .email(email)
            .username(username)
            .active(active)
            .build();
    }
}

// Usage
User user = aUser()
    .withEmail("custom@example.com")
    .inactive()
    .build();
```

## Performance Testing with JMH

```java
package com.example.benchmark;

import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.runner.Runner;
import org.openjdk.jmh.runner.options.Options;
import org.openjdk.jmh.runner.options.OptionsBuilder;

import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@State(Scope.Benchmark)
@Fork(value = 2, warmups = 1)
@Warmup(iterations = 3)
@Measurement(iterations = 5)
public class UserServiceBenchmark {

    private UserService userService;

    @Setup
    public void setup() {
        // Initialize test data
        userService = new UserService();
    }

    @Benchmark
    public void benchmarkFindUser() {
        userService.findById(1L);
    }

    public static void main(String[] args) throws Exception {
        Options opt = new OptionsBuilder()
            .include(UserServiceBenchmark.class.getSimpleName())
            .build();
        new Runner(opt).run();
    }
}
```

## Test Containers Shared Instance

Testcontainers 2.x: `org.testcontainers.postgresql.PostgreSQLContainer` (non-generic), artifact `testcontainers-postgresql`.
`@ServiceConnection` replaces `@DynamicPropertySource` wiring. Because Spring caches the context, importing this config
in every test shares one container.

```java
package com.example.test;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

@TestConfiguration(proxyBeanMethods = false)
public class PostgresTestcontainersConfig {

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgres() {
        return new PostgreSQLContainer("postgres:17-alpine")   // match the production major version
            .withReuse(true);
    }
}
```

## Quick Reference

| Annotation | Purpose |
|-----------|---------|
| `@Test` | Mark test method |
| `@BeforeEach` | Run before each test |
| `@AfterEach` | Run after each test |
| `@DisplayName` | Readable test name |
| `@ParameterizedTest` | Data-driven tests |
| `@ExtendWith` | Register extensions |
| `@SpringBootTest` | Full application context |
| `@WebMvcTest` | Test MVC layer only |
| `@DataJpaTest` | Test repository layer |
| `@MockitoBean` | Mock Spring bean (replaces removed `@MockBean`) |
| `@AutoConfigureRestTestClient` | `RestTestClient` in `@SpringBootTest` |
| `@ServiceConnection` | Auto-wire a Testcontainers container |
| `@WithMockUser` | Mock authenticated user |
| `assertThat()` | AssertJ fluent assertions |
| `verify()` | Mockito verification |
