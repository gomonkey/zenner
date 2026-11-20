package com.taans.zennercore.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "zenner.security.jwt")
public record JwtProperties(
    String secret,
    long accessTokenExpirySeconds,
    long refreshTokenExpirySeconds
) {
    public JwtProperties {
        if (accessTokenExpirySeconds <= 0) {
            accessTokenExpirySeconds = 900;
        }
        if (refreshTokenExpirySeconds <= 0) {
            refreshTokenExpirySeconds = 604800;
        }
    }
}
