package com.taans.zennercore.api.v1.controller;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.taans.zennercore.api.v1.dto.response.DayResponse;
import com.taans.zennercore.api.v1.support.GlobalResponseWrapper;
import com.taans.zennercore.api.v1.support.UserContextResolver;
import com.taans.zennercore.config.SecurityConfig;
import com.taans.zennercore.config.properties.CorsProperties;
import com.taans.zennercore.config.properties.JwtProperties;
import com.taans.zennercore.exception.GlobalExceptionHandler;
import com.taans.zennercore.exception.ResourceNotFoundException;
import com.taans.zennercore.service.DayService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

@WebMvcTest(DayController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, UserContextResolver.class, GlobalResponseWrapper.class})
@EnableConfigurationProperties({JwtProperties.class, CorsProperties.class})
@TestPropertySource(properties = "zenner.security.jwt.secret=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
class DayControllerTest {

    private static final String TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private DayService dayService;

    @Test
    @DisplayName("GET /api/v1/days/{dayId} returns 401 Unauthorized when unauthenticated")
    void getDay_whenUnauthenticated_returns401() {
        UUID dayId = UUID.randomUUID();
        assertThat(mvc.get().uri("/api/v1/days/{dayId}", dayId))
            .hasStatus(HttpStatus.UNAUTHORIZED)
            .bodyJson()
            .hasPathSatisfying("$.status", status -> assertThat(status).isEqualTo(401))
            .hasPathSatisfying("$.title", title -> assertThat(title).isEqualTo("Unauthorized"));
    }

    @Test
    @DisplayName("GET /api/v1/days/today returns 401 Unauthorized when unauthenticated")
    void getOrCreateToday_whenUnauthenticated_returns401() {
        assertThat(mvc.get().uri("/api/v1/days/today"))
            .hasStatus(HttpStatus.UNAUTHORIZED)
            .bodyJson()
            .hasPathSatisfying("$.status", status -> assertThat(status).isEqualTo(401))
            .hasPathSatisfying("$.title", title -> assertThat(title).isEqualTo("Unauthorized"));
    }

    @Test
    @DisplayName("GET /api/v1/days/today with tampered JWT returns 401 Unauthorized")
    void getOrCreateToday_withTamperedJwt_returns401() {
        assertThat(mvc.get().uri("/api/v1/days/today")
            .header(HttpHeaders.AUTHORIZATION, "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.tamperedSignature"))
            .hasStatus(HttpStatus.UNAUTHORIZED)
            .bodyJson()
            .hasPathSatisfying("$.status", status -> assertThat(status).isEqualTo(401))
            .hasPathSatisfying("$.title", title -> assertThat(title).isEqualTo("Unauthorized"));
    }

    @Test
    @DisplayName("GET /api/v1/days/today with expired JWT returns 401 Unauthorized")
    void getOrCreateToday_withExpiredJwt_returns401() throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
            .subject(UUID.randomUUID().toString())
            .expirationTime(Date.from(Instant.now().minusSeconds(3600)))
            .issueTime(Date.from(Instant.now().minusSeconds(7200)))
            .build();
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS256);
        SignedJWT signedJWT = new SignedJWT(header, claims);
        signedJWT.sign(new MACSigner(TEST_SECRET.getBytes(StandardCharsets.UTF_8)));
        String expiredToken = signedJWT.serialize();

        assertThat(mvc.get().uri("/api/v1/days/today")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
            .hasStatus(HttpStatus.UNAUTHORIZED)
            .bodyJson()
            .hasPathSatisfying("$.status", status -> assertThat(status).isEqualTo(401))
            .hasPathSatisfying("$.title", title -> assertThat(title).isEqualTo("Unauthorized"));
    }

    @Test
    @DisplayName("GET /api/v1/days/{dayId} returns 200 OK wrapped in ApiResponse when day exists and authenticated")
    void getDay_whenExists_returns200() {
        UUID dayId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        LocalDate date = LocalDate.now();

        DayResponse expectedResponse = new DayResponse(
            dayId,
            userId,
            date,
            false,
            Instant.now(),
            Instant.now(),
            List.of(),
            List.of(),
            List.of()
        );

        when(dayService.get(eq(dayId), eq(userId))).thenReturn(expectedResponse);

        var json = assertThat(mvc.get().uri("/api/v1/days/{dayId}", dayId)
            .with(jwt().jwt(builder -> builder.subject(userId.toString()))))
            .hasStatus(HttpStatus.OK)
            .bodyJson();
        json.extractingPath("$.success").isEqualTo(true);
        json.extractingPath("$.status").isEqualTo(200);
        json.extractingPath("$.data.id").isEqualTo(dayId.toString());

        verify(dayService).get(eq(dayId), eq(userId));
    }

    @Test
    @DisplayName("GET /api/v1/days/{dayId} returns 404 ProblemDetail when day not found")
    void getDay_whenNotExists_returns404() {
        UUID dayId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(dayService.get(eq(dayId), any())).thenThrow(new ResourceNotFoundException("Day not found with id: " + dayId));

        var json = assertThat(mvc.get().uri("/api/v1/days/{dayId}", dayId)
            .with(jwt().jwt(builder -> builder.subject(userId.toString()))))
            .hasStatus(HttpStatus.NOT_FOUND)
            .bodyJson();
        json.extractingPath("$.title").isEqualTo("Resource Not Found");
        json.extractingPath("$.success").isEqualTo(false);

        verify(dayService).get(eq(dayId), any());
    }

    @Test
    @DisplayName("GET /api/v1/days/{dayId} returns 400 ProblemDetail when dayId is not a valid UUID")
    void getDay_whenInvalidUuid_returns400() {
        UUID userId = UUID.randomUUID();
        assertThat(mvc.get().uri("/api/v1/days/not-a-valid-uuid")
            .with(jwt().jwt(builder -> builder.subject(userId.toString()))))
            .hasStatus(HttpStatus.BAD_REQUEST)
            .bodyJson()
            .hasPathSatisfying("$.title", title -> assertThat(title).isEqualTo("Bad Request"))
            .hasPathSatisfying("$.type", type -> assertThat(type).isEqualTo("/errors/type-mismatch"))
            .hasPathSatisfying("$.success", success -> assertThat(success).isEqualTo(false));
    }

    @Test
    @DisplayName("GET /api/v1/days/today with valid JWT returns 200 and passes authenticated user ID")
    void getOrCreateToday_withJwt_returns200() {
        UUID userId = UUID.randomUUID();
        UUID dayId = UUID.randomUUID();
        LocalDate today = LocalDate.now();

        DayResponse expectedResponse = new DayResponse(
            dayId,
            userId,
            today,
            false,
            Instant.now(),
            Instant.now(),
            List.of(),
            List.of(),
            List.of()
        );

        when(dayService.getOrCreateToday(eq(userId), any(LocalDate.class))).thenReturn(expectedResponse);

        var json = assertThat(mvc.get().uri("/api/v1/days/today")
            .with(jwt().jwt(builder -> builder.subject(userId.toString()))))
            .hasStatus(HttpStatus.OK)
            .bodyJson();
        json.extractingPath("$.success").isEqualTo(true);
        json.extractingPath("$.data.userId").isEqualTo(userId.toString());

        verify(dayService).getOrCreateToday(eq(userId), any(LocalDate.class));
    }

    @Test
    @DisplayName("GET /api/v1/days/today with JWT and X-User-Id header ignores header and uses JWT subject")
    void getOrCreateToday_withJwtAndHeader_jwtSubjectTakesPrecedence() {
        UUID jwtUserId = UUID.randomUUID();
        UUID spoofedUserId = UUID.randomUUID();
        UUID dayId = UUID.randomUUID();
        LocalDate today = LocalDate.now();

        DayResponse expectedResponse = new DayResponse(
            dayId,
            jwtUserId,
            today,
            false,
            Instant.now(),
            Instant.now(),
            List.of(),
            List.of(),
            List.of()
        );

        when(dayService.getOrCreateToday(eq(jwtUserId), any(LocalDate.class))).thenReturn(expectedResponse);

        var json = assertThat(mvc.get().uri("/api/v1/days/today")
            .header("X-User-Id", spoofedUserId.toString())
            .with(jwt().jwt(builder -> builder.subject(jwtUserId.toString()))))
            .hasStatus(HttpStatus.OK)
            .bodyJson();
        json.extractingPath("$.success").isEqualTo(true);
        json.extractingPath("$.data.userId").isEqualTo(jwtUserId.toString());

        verify(dayService).getOrCreateToday(eq(jwtUserId), any(LocalDate.class));
    }
}
