package com.taans.zennercore.api.v1.support;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

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
    @DisplayName("returns header user id if provided")
    void resolveUserId_whenHeaderProvided_returnsHeaderUserId() {
        UUID headerUserId = UUID.randomUUID();
        UUID resolved = resolver.resolveUserId(headerUserId);
        assertThat(resolved).isEqualTo(headerUserId);
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
        org.springframework.security.oauth2.jwt.Jwt jwt = org.springframework.security.oauth2.jwt.Jwt.withTokenValue("mock-token")
            .header("alg", "HS256")
            .subject(jwtUserId.toString())
            .claim("email", "dev@zenner.local")
            .issuedAt(java.time.Instant.now())
            .expiresAt(java.time.Instant.now().plusSeconds(900))
            .build();
        org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken auth =
            new org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken(jwt, java.util.Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        UUID resolved = resolver.resolveUserId(null);
        assertThat(resolved).isEqualTo(jwtUserId);
    }
}
