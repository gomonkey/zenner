package com.taans.zennercore.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "zenner.security.cors")
public record CorsProperties(
    List<String> allowedOrigins
) {
    public CorsProperties {
        if (allowedOrigins == null || allowedOrigins.isEmpty()) {
            allowedOrigins = List.of("http://localhost:3000", "http://localhost:5173");
        }
    }
}
