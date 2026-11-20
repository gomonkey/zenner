package com.taans.zennercore.service;

import com.nimbusds.jwt.SignedJWT;
import com.taans.zennercore.config.properties.JwtProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    private JwtProperties jwtProperties;
    private JwtService jwtService;
    private NimbusJwtDecoder jwtDecoder;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties(SECRET, 900, 604800);
        jwtService = new JwtService(jwtProperties);

        SecretKeySpec secretKey = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        jwtDecoder = NimbusJwtDecoder.withSecretKey(secretKey).build();
    }

    @Test
    @DisplayName("generateAccessToken produces valid HS256 JWT with correct claims")
    void generateAccessToken_createsValidJwt() throws ParseException {
        UUID userId = UUID.randomUUID();
        String email = "dev@zenner.local";
        Instant before = Instant.now().minusSeconds(1);

        String token = jwtService.generateAccessToken(userId, email);

        assertThat(token).isNotBlank();
        SignedJWT parsed = SignedJWT.parse(token);
        assertThat(parsed.getHeader().getAlgorithm().getName()).isEqualTo("HS256");
        assertThat(parsed.getJWTClaimsSet().getSubject()).isEqualTo(userId.toString());
        assertThat(parsed.getJWTClaimsSet().getStringClaim("email")).isEqualTo(email);

        Jwt decoded = jwtDecoder.decode(token);
        assertThat(decoded.getSubject()).isEqualTo(userId.toString());
        assertThat(decoded.getClaimAsString("email")).isEqualTo(email);
        assertThat(decoded.getExpiresAt()).isAfter(before.plusSeconds(890));
    }
}
