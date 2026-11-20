package com.taans.zennercore.service;

import com.taans.zennercore.config.properties.JwtProperties;
import com.taans.zennercore.domain.auth.RefreshTokenSession;
import com.taans.zennercore.exception.InvalidRefreshTokenException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class RefreshTokenService {

    private static final String REFRESH_PREFIX = "auth:refresh:";
    private static final String USER_SESSIONS_PREFIX = "auth:user:";
    private static final String SESSIONS_SUFFIX = ":sessions";

    private final StringRedisTemplate redisTemplate;
    private final JsonMapper jsonMapper;
    private final JwtProperties jwtProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(StringRedisTemplate redisTemplate,
                              JsonMapper jsonMapper,
                              JwtProperties jwtProperties) {
        this.redisTemplate = redisTemplate;
        this.jsonMapper = jsonMapper;
        this.jwtProperties = jwtProperties;
    }

    public String createSession(UUID userId) {
        return issueSession(userId, UUID.randomUUID());
    }

    public RefreshTokenSession validateAndTouchSession(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidRefreshTokenException("Refresh token is required");
        }

        String hash = hashToken(rawRefreshToken);
        String sessionJson = redisTemplate.opsForValue().get(REFRESH_PREFIX + hash);

        if (sessionJson == null) {
            throw new InvalidRefreshTokenException("Invalid or expired refresh token");
        }

        RefreshTokenSession session = deserializeSession(sessionJson);
        Duration ttl = Duration.ofSeconds(jwtProperties.refreshTokenExpirySeconds());

        // Slide session expiration in Redis
        redisTemplate.expire(REFRESH_PREFIX + hash, ttl);
        redisTemplate.expire(userSessionsKey(session.userId()), ttl);

        return session;
    }

    public void revoke(String rawRefreshToken, boolean allDevices) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }

        String hash = hashToken(rawRefreshToken);
        String sessionJson = redisTemplate.opsForValue().get(REFRESH_PREFIX + hash);

        if (sessionJson != null) {
            RefreshTokenSession session = deserializeSession(sessionJson);
            UUID userId = session.userId();
            if (allDevices) {
                revokeAllUserSessions(userId);
            } else {
                redisTemplate.delete(REFRESH_PREFIX + hash);
                removeUserSession(userId, hash);
            }
        }
    }

    public void revokeAllUserSessions(UUID userId) {
        String userSessionsKey = userSessionsKey(userId);
        Set<String> activeHashes = redisTemplate.opsForSet().members(userSessionsKey);
        if (activeHashes != null && !activeHashes.isEmpty()) {
            Set<String> sessionKeys = Set.copyOf(activeHashes.stream().map(h -> REFRESH_PREFIX + h).toList());
            redisTemplate.delete(sessionKeys);
        }
        redisTemplate.delete(userSessionsKey);
    }

    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private String issueSession(UUID userId, UUID familyId) {
        String rawToken = generateRawToken();
        String hash = hashToken(rawToken);
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(jwtProperties.refreshTokenExpirySeconds());

        RefreshTokenSession session = new RefreshTokenSession(userId, familyId, now, expiresAt);
        saveSession(hash, session);
        addUserSession(userId, hash);

        return rawToken;
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void saveSession(String hash, RefreshTokenSession session) {
        try {
            String json = jsonMapper.writeValueAsString(session);
            Duration ttl = Duration.ofSeconds(jwtProperties.refreshTokenExpirySeconds());
            redisTemplate.opsForValue().set(REFRESH_PREFIX + hash, json, ttl);
        } catch (JacksonException e) {
            throw new IllegalStateException("Failed to serialize session", e);
        }
    }

    private void addUserSession(UUID userId, String hash) {
        String key = userSessionsKey(userId);
        redisTemplate.opsForSet().add(key, hash);
        redisTemplate.expire(key, Duration.ofSeconds(jwtProperties.refreshTokenExpirySeconds()));
    }

    private void removeUserSession(UUID userId, String hash) {
        redisTemplate.opsForSet().remove(userSessionsKey(userId), hash);
    }

    private String userSessionsKey(UUID userId) {
        return USER_SESSIONS_PREFIX + userId + SESSIONS_SUFFIX;
    }

    private RefreshTokenSession deserializeSession(String sessionJson) {
        try {
            return jsonMapper.readValue(sessionJson, RefreshTokenSession.class);
        } catch (JacksonException e) {
            throw new IllegalStateException("Failed to deserialize session", e);
        }
    }
}
