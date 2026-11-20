package com.taans.zennercore.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "zenner.security.cookie")
public record CookieProperties(
    boolean secure
) {}
