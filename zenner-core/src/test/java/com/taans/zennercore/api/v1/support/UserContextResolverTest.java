package com.taans.zennercore.api.v1.support;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserContextResolverTest {

    private UserContextResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new UserContextResolver();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("returns header user id if provided when no authentication is present")
    void resolveUserId_whenHeaderProvidedAndNoAuth_returnsHeaderUserId() {
        UUID headerUserId = UUID.randomUUID();
        UUID resolved = resolver.resolveUserId(headerUserId);
        assertThat(resolved).isEqualTo(headerUserId);
    }

    @Test
    @DisplayName("returns header user id if provided when principal is anonymousUser")
    void resolveUserId_whenHeaderProvidedAndAnonymous_returnsHeaderUserId() {
        UUID headerUserId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            "anonymousUser",
            "credentials",
            List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        UUID resolved = resolver.resolveUserId(headerUserId);
        assertThat(resolved).isEqualTo(headerUserId);
    }

    @Test
    @DisplayName("JWT subject takes absolute precedence over X-User-Id header to prevent spoofing")
    void resolveUserId_whenJwtAuthenticatedAndHeaderProvided_jwtTakesPrecedence() {
        UUID jwtUserId = UUID.randomUUID();
        UUID headerUserId = UUID.randomUUID();

        Jwt jwt = Jwt.withTokenValue("mock-token")
            .header("alg", "HS256")
            .subject(jwtUserId.toString())
            .claim("email", "dev@zenner.local")
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(900))
            .build();
        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        UUID resolved = resolver.resolveUserId(headerUserId);
        assertThat(resolved).isEqualTo(jwtUserId);
        assertThat(resolved).isNotEqualTo(headerUserId);
    }

    @Test
    @DisplayName("returns authenticated principal UUID if header is null and valid UUID principal present")
    void resolveUserId_whenHeaderNull_returnsPrincipalUuid() {
        UUID principalUserId = UUID.randomUUID();
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            principalUserId.toString(),
            "credentials",
            List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        UUID resolved = resolver.resolveUserId(null);
        assertThat(resolved).isEqualTo(principalUserId);
    }

    @Test
    @DisplayName("returns default dev UUID if header is null and principal is anonymousUser")
    void resolveUserId_whenHeaderNullAndAnonymous_returnsDefaultDevId() {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
            "anonymousUser",
            "credentials",
            List.of()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        UUID resolved = resolver.resolveUserId(null);
        assertThat(resolved).isEqualTo(UserContextResolver.DEFAULT_DEV_USER_ID);
    }

    @Test
    @DisplayName("returns default dev UUID if header is null and no authentication present")
    void resolveUserId_whenHeaderNullAndNoAuth_returnsDefaultDevId() {
        UUID resolved = resolver.resolveUserId(null);
        assertThat(resolved).isEqualTo(UserContextResolver.DEFAULT_DEV_USER_ID);
    }

    @Test
    @DisplayName("returns authenticated user UUID from Jwt authentication token")
    void resolveUserId_whenJwtAuthentication_returnsSubjectUuid() {
        UUID jwtUserId = UUID.randomUUID();
        Jwt jwt = Jwt.withTokenValue("mock-token")
            .header("alg", "HS256")
            .subject(jwtUserId.toString())
            .claim("email", "dev@zenner.local")
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(900))
            .build();
        JwtAuthenticationToken auth = new JwtAuthenticationToken(jwt, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        UUID resolved = resolver.resolveUserId(null);
        assertThat(resolved).isEqualTo(jwtUserId);
    }
}
