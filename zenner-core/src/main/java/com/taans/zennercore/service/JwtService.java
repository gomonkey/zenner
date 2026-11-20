package com.taans.zennercore.service;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.taans.zennercore.config.properties.JwtProperties;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private final byte[] secretKeyBytes;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKeyBytes = jwtProperties.secret().getBytes(StandardCharsets.UTF_8);
    }

    public String generateAccessToken(UUID userId, String email) {
        try {
            Instant now = Instant.now();
            Instant expiresAt = now.plusSeconds(jwtProperties.accessTokenExpirySeconds());

            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(userId.toString())
                .claim("email", email)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(expiresAt))
                .build();

            SignedJWT signedJWT = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS256),
                claims
            );

            MACSigner signer = new MACSigner(secretKeyBytes);
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate JWT access token", e);
        }
    }
}
