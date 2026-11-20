package com.taans.zennercore.api.v1.controller;

import com.taans.zennercore.api.v1.dto.request.LoginRequest;
import com.taans.zennercore.api.v1.dto.request.LogoutRequest;
import com.taans.zennercore.api.v1.support.GlobalResponseWrapper;
import com.taans.zennercore.api.v1.support.UserContextResolver;
import com.taans.zennercore.config.SecurityConfig;
import com.taans.zennercore.config.properties.CookieProperties;
import com.taans.zennercore.config.properties.CorsProperties;
import com.taans.zennercore.config.properties.JwtProperties;
import com.taans.zennercore.domain.entity.User;
import com.taans.zennercore.exception.GlobalExceptionHandler;
import com.taans.zennercore.exception.InvalidRefreshTokenException;
import com.taans.zennercore.exception.TokenReuseException;
import com.taans.zennercore.repository.UserRepository;
import com.taans.zennercore.service.JwtService;
import com.taans.zennercore.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, UserContextResolver.class, GlobalResponseWrapper.class})
@EnableConfigurationProperties({JwtProperties.class, CookieProperties.class, CorsProperties.class})
@TestPropertySource(properties = "zenner.security.jwt.secret=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
class AuthControllerTest {

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private RefreshTokenService refreshTokenService;

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    @Test
    @DisplayName("POST /api/v1/auth/login with valid credentials returns 200, JWT access token, and HttpOnly cookie")
    void login_withValidCredentials_returns200AndTokens() throws Exception {
        UUID userId = UUID.randomUUID();
        String email = "dev@zenner.local";
        String password = "password123";
        String hash = "$2a$10$DkpIfDt5QmNKF0LOPdlJaOSI9oGMXdXS14ut4MNrqszIpg5Wm5FUS";

        User user = User.builder()
            .id(userId)
            .email(email)
            .passwordHash(hash)
            .active(true)
            .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, hash)).thenReturn(true);
        when(jwtService.generateAccessToken(userId, email)).thenReturn("test-access-jwt");
        when(refreshTokenService.createSession(userId)).thenReturn("test-raw-refresh-token");

        LoginRequest request = new LoginRequest(email, password);

        var result = assertThat(mvc.post().uri("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(jsonMapper.writeValueAsString(request)))
            .hasStatus(HttpStatus.OK);

        result.bodyJson().extractingPath("$.data.accessToken").isEqualTo("test-access-jwt");
        result.bodyJson().extractingPath("$.data.tokenType").isEqualTo("Bearer");
        result.bodyJson().extractingPath("$.data.expiresIn").isEqualTo(900);

        List<String> setCookies = result.actual().getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(setCookies).anyMatch(c -> c.contains("refresh_token=test-raw-refresh-token") && c.contains("HttpOnly") && c.contains("Path=/api/v1/auth"));
        assertThat(setCookies).anyMatch(c -> c.contains("access_token=test-access-jwt") && !c.contains("HttpOnly") && c.contains("Path=/"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login with wrong password returns 401 ProblemDetail")
    void login_withWrongPassword_returns401() throws Exception {
        UUID userId = UUID.randomUUID();
        String email = "dev@zenner.local";
        String hash = "$2a$10$DkpIfDt5QmNKF0LOPdlJaOSI9oGMXdXS14ut4MNrqszIpg5Wm5FUS";

        User user = User.builder()
            .id(userId)
            .email(email)
            .passwordHash(hash)
            .active(true)
            .build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", hash)).thenReturn(false);

        LoginRequest request = new LoginRequest(email, "wrong-password");

        assertThat(mvc.post().uri("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(jsonMapper.writeValueAsString(request)))
            .hasStatus(HttpStatus.UNAUTHORIZED)
            .bodyJson()
            .hasPathSatisfying("$.title", title -> assertThat(title).isEqualTo("Unauthorized"))
            .hasPathSatisfying("$.status", status -> assertThat(status).isEqualTo(401))
            .hasPathSatisfying("$.success", success -> assertThat(success).isEqualTo(false));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh returns new access token and non-httponly cookie without rotating refresh token")
    void refresh_withValidCookie_returnsTokens() {
        UUID userId = UUID.randomUUID();
        UUID familyId = UUID.randomUUID();
        String rawToken = "valid-refresh-token";

        User user = User.builder()
            .id(userId)
            .email("dev@zenner.local")
            .active(true)
            .build();

        when(refreshTokenService.validateAndTouchSession(rawToken))
            .thenReturn(new com.taans.zennercore.domain.auth.RefreshTokenSession(userId, familyId, java.time.Instant.now(), java.time.Instant.now().plusSeconds(604800)));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(userId, "dev@zenner.local")).thenReturn("new-access-jwt");

        var result = assertThat(mvc.post().uri("/api/v1/auth/refresh")
            .cookie(new Cookie("refresh_token", rawToken)))
            .hasStatus(HttpStatus.OK);

        result.bodyJson().extractingPath("$.data.accessToken").isEqualTo("new-access-jwt");

        List<String> setCookies = result.actual().getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(setCookies).anyMatch(c -> c.contains("refresh_token=" + rawToken) && c.contains("HttpOnly"));
        assertThat(setCookies).anyMatch(c -> c.contains("access_token=new-access-jwt") && !c.contains("HttpOnly") && c.contains("Path=/"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh without cookie returns 401 ProblemDetail")
    void refresh_withoutCookie_returns401() {
        assertThat(mvc.post().uri("/api/v1/auth/refresh"))
            .hasStatus(HttpStatus.UNAUTHORIZED)
            .bodyJson()
            .hasPathSatisfying("$.status", status -> assertThat(status).isEqualTo(401))
            .hasPathSatisfying("$.success", success -> assertThat(success).isEqualTo(false));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh with invalid token returns 401 ProblemDetail")
    void refresh_withInvalidToken_returns401() {
        String invalidToken = "invalid-token";
        when(refreshTokenService.validateAndTouchSession(invalidToken))
            .thenThrow(new InvalidRefreshTokenException("Invalid or expired refresh token"));

        assertThat(mvc.post().uri("/api/v1/auth/refresh")
            .cookie(new Cookie("refresh_token", invalidToken)))
            .hasStatus(HttpStatus.UNAUTHORIZED)
            .bodyJson()
            .hasPathSatisfying("$.detail", detail -> assertThat(detail).isEqualTo("Invalid or expired refresh token"))
            .hasPathSatisfying("$.status", status -> assertThat(status).isEqualTo(401));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout clears cookies, revokes session, and returns LogoutResponse")
    void logout_clearsCookieAndRevokes() throws Exception {
        String rawToken = "active-token";
        LogoutRequest request = new LogoutRequest(false);

        var result = assertThat(mvc.post().uri("/api/v1/auth/logout")
            .cookie(new Cookie("refresh_token", rawToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(jsonMapper.writeValueAsString(request)))
            .hasStatus(HttpStatus.OK);

        result.bodyJson().extractingPath("$.data.message").isEqualTo("Logged out successfully");

        verify(refreshTokenService).revoke(rawToken, false);
        List<String> setCookies = result.actual().getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(setCookies).anyMatch(c -> c.contains("refresh_token=;") && c.contains("Max-Age=0"));
        assertThat(setCookies).anyMatch(c -> c.contains("access_token=;") && c.contains("Max-Age=0"));
    }
}
