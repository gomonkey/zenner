package com.taans.zennercore.api.v1.controller;

import com.taans.zennercore.api.v1.dto.request.LoginRequest;
import com.taans.zennercore.api.v1.dto.request.LogoutRequest;
import com.taans.zennercore.api.v1.dto.response.AuthResponse;
import com.taans.zennercore.api.v1.dto.response.LogoutResponse;
import com.taans.zennercore.config.properties.CookieProperties;
import com.taans.zennercore.config.properties.JwtProperties;
import com.taans.zennercore.domain.auth.RefreshTokenSession;
import com.taans.zennercore.domain.entity.User;
import com.taans.zennercore.exception.InvalidRefreshTokenException;
import com.taans.zennercore.repository.UserRepository;
import com.taans.zennercore.service.JwtService;
import com.taans.zennercore.service.RefreshTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    public static final String ACCESS_TOKEN_COOKIE = "access_token";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    public static final String AUTH_PATH = "/api/v1/auth";
    public static final String ROOT_PATH = "/";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final JwtProperties jwtProperties;
    private final CookieProperties cookieProperties;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          RefreshTokenService refreshTokenService,
                          JwtProperties jwtProperties,
                          CookieProperties cookieProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.jwtProperties = jwtProperties;
        this.cookieProperties = cookieProperties;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String rawRefreshToken = refreshTokenService.createSession(user.getId());

        ResponseCookie refreshCookie = buildRefreshCookie(rawRefreshToken, jwtProperties.refreshTokenExpirySeconds());
        ResponseCookie accessCookie = buildAccessCookie(accessToken, jwtProperties.accessTokenExpirySeconds());

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
            .body(AuthResponse.bearer(accessToken, jwtProperties.accessTokenExpirySeconds()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
        @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidRefreshTokenException("Refresh token cookie is missing");
        }

        RefreshTokenSession session = refreshTokenService.validateAndTouchSession(refreshToken);

        User user = userRepository.findById(session.userId())
            .orElseThrow(() -> new InvalidRefreshTokenException("User not found"));

        if (!user.isActive()) {
            throw new InvalidRefreshTokenException("User account is inactive");
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        ResponseCookie accessCookie = buildAccessCookie(accessToken, jwtProperties.accessTokenExpirySeconds());
        ResponseCookie refreshCookie = buildRefreshCookie(refreshToken, jwtProperties.refreshTokenExpirySeconds());

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
            .body(AuthResponse.bearer(accessToken, jwtProperties.accessTokenExpirySeconds()));
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(
        @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken,
        @RequestBody(required = false) LogoutRequest request
    ) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            boolean allDevices = request != null && request.allDevices();
            refreshTokenService.revoke(refreshToken, allDevices);
        }

        ResponseCookie clearRefreshCookie = buildRefreshCookie("", 0);
        ResponseCookie clearAccessCookie = buildAccessCookie("", 0);

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
            .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
            .body(new LogoutResponse("Logged out successfully"));
    }

    private ResponseCookie buildRefreshCookie(String tokenValue, long maxAge) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE, tokenValue)
            .httpOnly(true)
            .secure(cookieProperties.secure())
            .path(AUTH_PATH)
            .sameSite("Lax")
            .maxAge(maxAge)
            .build();
    }

    private ResponseCookie buildAccessCookie(String tokenValue, long maxAge) {
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE, tokenValue)
            .httpOnly(false)
            .secure(cookieProperties.secure())
            .path(ROOT_PATH)
            .sameSite("Lax")
            .maxAge(maxAge)
            .build();
    }
}
