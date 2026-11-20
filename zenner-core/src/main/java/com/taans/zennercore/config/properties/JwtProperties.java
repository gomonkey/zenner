package com.taans.zennercore.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "zenner.security.jwt")
public record JwtProperties(
    String secret,
    long accessTokenExpirySeconds,
    long refreshTokenExpirySeconds
) {
    public JwtProperties {
        if (secret == null || secret.isBlank()) {
            secret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        }
        if (accessTokenExpirySeconds <= 0) {
            accessTokenExpirySeconds = 900;
        }
        if (refreshTokenExpirySeconds <= 0) {
            refreshTokenExpirySeconds = 604800;
        }
    }
}
