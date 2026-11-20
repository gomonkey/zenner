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

        String setCookie = result.actual().getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        assertThat(setCookie).contains("refresh_token=test-raw-refresh-token");
        assertThat(setCookie).contains("HttpOnly");
        assertThat(setCookie).contains("Path=/api/v1/auth");
        assertThat(setCookie).contains("SameSite=Lax");
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
    @DisplayName("POST /api/v1/auth/refresh rotates token and returns new access token and cookie")
    void refresh_withValidCookie_rotatesAndReturnsTokens() {
        UUID userId = UUID.randomUUID();
        String oldToken = "old-refresh-token";
        String newToken = "new-refresh-token";

        User user = User.builder()
            .id(userId)
            .email("dev@zenner.local")
            .active(true)
            .build();

        when(refreshTokenService.rotate(oldToken)).thenReturn(new RefreshTokenService.RotateResult(newToken, userId));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(userId, "dev@zenner.local")).thenReturn("new-access-jwt");

        var result = assertThat(mvc.post().uri("/api/v1/auth/refresh")
            .cookie(new Cookie("refresh_token", oldToken)))
            .hasStatus(HttpStatus.OK);

        result.bodyJson().extractingPath("$.data.accessToken").isEqualTo("new-access-jwt");

        String setCookie = result.actual().getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).contains("refresh_token=" + newToken);
        assertThat(setCookie).contains("HttpOnly");
        assertThat(setCookie).contains("Path=/api/v1/auth");
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
    @DisplayName("POST /api/v1/auth/refresh with reused token triggers reuse detection and returns 401")
    void refresh_withReusedToken_returns401() {
        String reusedToken = "already-rotated-token";
        when(refreshTokenService.rotate(reusedToken))
            .thenThrow(new TokenReuseException("Refresh token reuse detected"));

        assertThat(mvc.post().uri("/api/v1/auth/refresh")
            .cookie(new Cookie("refresh_token", reusedToken)))
            .hasStatus(HttpStatus.UNAUTHORIZED)
            .bodyJson()
            .hasPathSatisfying("$.detail", detail -> assertThat(detail).isEqualTo("Refresh token reuse detected"))
            .hasPathSatisfying("$.status", status -> assertThat(status).isEqualTo(401));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout clears refresh cookie, revokes session, and returns LogoutResponse")
    void logout_clearsCookieAndRevokes() throws Exception {
        String rawToken = "active-token";
        LogoutRequest request = new LogoutRequest(false);

        var result = assertThat(mvc.post().uri("/api/v1/auth/logout")
            .cookie(new Cookie("refresh_token", rawToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(jsonMapper.writeValueAsString(request)))
            .hasStatus(HttpStatus.OK);

        verify(refreshTokenService).revoke(eq(rawToken), eq(false));

        result.bodyJson().extractingPath("$.data.message").isEqualTo("Logged out successfully");

        String setCookie = result.actual().getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).contains("refresh_token=");
        assertThat(setCookie).contains("Max-Age=0");
    }
}
