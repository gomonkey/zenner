# Spring Boot Setup

## Project Structure (Clean Architecture)

```
src/main/java/com/example/
├── domain/              # Core business logic
│   ├── model/          # Entities, value objects
│   ├── repository/     # Repository interfaces
│   └── service/        # Domain services
├── application/         # Use cases
│   ├── dto/            # Request/Response DTOs
│   ├── mapper/         # Entity <-> DTO mappers
│   └── service/        # Application services
├── infrastructure/      # External concerns
│   ├── persistence/    # JPA implementations
│   ├── config/         # Spring configuration
│   └── security/       # Security setup
└── presentation/        # API layer
    └── rest/           # REST controllers
```

## Modern pom.xml (Spring Boot 4.x, Java 21)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.1.1</version> <!-- use the latest 4.x -->
    </parent>

    <groupId>com.example</groupId>
    <artifactId>demo-service</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <java.version>21</java.version>
        <mapstruct.version>1.6.3</mapstruct.version>
    </properties>

    <dependencies>
        <!-- Spring Boot 4 starters (focused modules) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc</artifactId>   <!-- was spring-boot-starter-web -->
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-flyway</artifactId>   <!-- flyway-core alone no longer auto-configures -->
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- Mappers -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${mapstruct.version}</version>
        </dependency>

        <!-- Testing: per-technology test starters; Testcontainers 2.x is managed by Boot -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webmvc-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-testcontainers</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>testcontainers-junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>testcontainers-postgresql</artifactId>   <!-- was org.testcontainers:postgresql -->
            <scope>test</scope>
        </dependency>
        <!-- Optional API docs: springdoc-openapi 3.x is the Boot 4 line (2.x targets Boot 3) -->
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </path>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>${mapstruct.version}</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

Gradle equivalent for the Java level: `java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }`.
Verify starter artifact names against the Spring Boot 4 docs/Maven Central when adding new ones — modules were renamed and split in 4.0.

## Application Configuration

```yaml
# application.yml
spring:
  application:
    name: demo-service

  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/demo}
    username: ${DATABASE_USER:demo}
    password: ${DATABASE_PASSWORD:demo}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 20000

  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    properties:
      hibernate:
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true

  threads:
    virtual:
      enabled: true          # Java 21 virtual threads for Tomcat and @Async/@Scheduled executors

  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: 8080
  shutdown: graceful
  error:
    include-message: never         # errors are rendered by ProblemDetail handlers, not stack/message leaks
    include-binding-errors: never

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
  prometheus:
    metrics:
      export:
        enabled: true
```

Liveness/readiness probes are enabled by default in Boot 4 (`/actuator/health/liveness`, `/actuator/health/readiness`).

## Main Application Class

```java
package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class DemoServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoServiceApplication.class, args);
    }
}
```

## Configuration Classes

```java
package com.example.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Demo Service API")
                .version("1.0.0")
                .description("Enterprise microservice API"));
    }
}
```

## Exception Handling

```java
package com.example.infrastructure.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ProblemDetail handleNotFound(EntityNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND,
            ex.getMessage()
        );
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST,
            "Validation failed"
        );
        problem.setProperty("errors", ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList());
        return problem;
    }
}
```

## Quick Reference

| Component | Purpose |
|-----------|---------|
| `@SpringBootApplication` | Main application entry point |
| `@Configuration` | Configuration classes |
| `@Bean` | Bean factory method |
| `@Value` | Inject properties |
| `@ConfigurationProperties` | Type-safe config |
| `@Profile` | Environment-specific beans |
| `@EnableJpaAuditing` | Automatic audit fields |
| `ProblemDetail` | RFC 9457 error responses |
