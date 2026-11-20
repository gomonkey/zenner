package com.taans.zennercore.service;

import com.taans.zennercore.config.properties.JwtProperties;
import com.taans.zennercore.exception.InvalidRefreshTokenException;
import com.taans.zennercore.exception.TokenReuseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private SetOperations<String, String> setOperations;

    private JsonMapper jsonMapper;
    private JwtProperties jwtProperties;
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        lenient().when(redisTemplate.opsForSet()).thenReturn(setOperations);
        jsonMapper = JsonMapper.builder().build();
        jwtProperties = new JwtProperties("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", 900, 604800);
        refreshTokenService = new RefreshTokenService(redisTemplate, jsonMapper, jwtProperties);
    }

    @Test
    @DisplayName("createSession stores session in Redis and indexes it in user set")
    void createSession_storesSessionAndIndexesInUserSet() {
        UUID userId = UUID.randomUUID();

        String rawToken = refreshTokenService.createSession(userId);

        assertThat(rawToken).isNotBlank();
        String hash = refreshTokenService.hashToken(rawToken);

        verify(valueOperations).set(eq("auth:refresh:" + hash), anyString(), eq(Duration.ofSeconds(604800)));
        verify(setOperations).add(eq("auth:user:" + userId + ":sessions"), eq(hash));
        verify(redisTemplate).expire(eq("auth:user:" + userId + ":sessions"), eq(Duration.ofSeconds(604800)));
    }

    @Test
    @DisplayName("rotate succeeds with valid token, rotates session and removes old hash")
    void rotate_withValidToken_rotatesSession() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID familyId = UUID.randomUUID();
        String rawToken = "sample-raw-refresh-token";
        String oldHash = refreshTokenService.hashToken(rawToken);

        String sessionJson = """
            {
                "userId": "%s",
                "familyId": "%s",
                "createdAt": "2026-11-20T00:00:00Z",
                "expiresAt": "2026-11-27T00:00:00Z"
            }
            """.formatted(userId, familyId);

        when(valueOperations.get("auth:refresh:" + oldHash)).thenReturn(sessionJson);

        RefreshTokenService.RotateResult result = refreshTokenService.rotate(rawToken);

        assertThat(result.userId()).isEqualTo(userId);
        assertThat(result.newRawRefreshToken()).isNotBlank().isNotEqualTo(rawToken);

        // Verify old token deleted and tracked as rotated
        verify(redisTemplate).delete("auth:refresh:" + oldHash);
        verify(valueOperations).set(eq("auth:rotated:" + oldHash), eq(userId.toString()), eq(Duration.ofSeconds(604800)));
        verify(setOperations).remove("auth:user:" + userId + ":sessions", oldHash);

        // Verify new token stored
        String newHash = refreshTokenService.hashToken(result.newRawRefreshToken());
        verify(valueOperations).set(eq("auth:refresh:" + newHash), anyString(), eq(Duration.ofSeconds(604800)));
        verify(setOperations).add(eq("auth:user:" + userId + ":sessions"), eq(newHash));
    }

    @Test
    @DisplayName("rotate detects reuse when token was already rotated and revokes all user sessions")
    void rotate_whenTokenAlreadyRotated_revokesAllSessionsAndThrows() {
        UUID userId = UUID.randomUUID();
        String rawToken = "already-rotated-token";
        String hash = refreshTokenService.hashToken(rawToken);

        when(valueOperations.get("auth:refresh:" + hash)).thenReturn(null);
        when(valueOperations.get("auth:rotated:" + hash)).thenReturn(userId.toString());
        when(setOperations.members("auth:user:" + userId + ":sessions")).thenReturn(Set.of("otherHash1", "otherHash2"));

        assertThatThrownBy(() -> refreshTokenService.rotate(rawToken))
            .isInstanceOf(TokenReuseException.class)
            .hasMessageContaining("Refresh token reuse detected");

        verify(redisTemplate).delete(Set.of("auth:refresh:otherHash1", "auth:refresh:otherHash2"));
        verify(redisTemplate).delete("auth:user:" + userId + ":sessions");
    }

    @Test
    @DisplayName("rotate throws InvalidRefreshTokenException when token is not found")
    void rotate_whenTokenUnknown_throwsInvalidRefreshTokenException() {
        String rawToken = "completely-unknown-token";
        String hash = refreshTokenService.hashToken(rawToken);

        when(valueOperations.get("auth:refresh:" + hash)).thenReturn(null);
        when(valueOperations.get("auth:rotated:" + hash)).thenReturn(null);

        assertThatThrownBy(() -> refreshTokenService.rotate(rawToken))
            .isInstanceOf(InvalidRefreshTokenException.class);
    }

    @Test
    @DisplayName("logout revokes single session when allDevices is false, tracking revoked hash in auth:rotated")
    void logout_singleDevice_revokesSession() {
        UUID userId = UUID.randomUUID();
        String rawToken = "sample-raw-token";
        String hash = refreshTokenService.hashToken(rawToken);

        String sessionJson = """
            {
                "userId": "%s",
                "familyId": "%s",
                "createdAt": "2026-11-20T00:00:00Z",
                "expiresAt": "2026-11-27T00:00:00Z"
            }
            """.formatted(userId, UUID.randomUUID());

        when(valueOperations.get("auth:refresh:" + hash)).thenReturn(sessionJson);

        refreshTokenService.revoke(rawToken, false);

        verify(redisTemplate).delete("auth:refresh:" + hash);
        verify(valueOperations).set(eq("auth:rotated:" + hash), eq(userId.toString()), eq(Duration.ofSeconds(604800)));
        verify(setOperations).remove("auth:user:" + userId + ":sessions", hash);
        verify(redisTemplate, never()).delete("auth:user:" + userId + ":sessions");
    }

    @Test
    @DisplayName("logout revokes all user sessions when allDevices is true, tracking revoked hash in auth:rotated")
    void logout_allDevices_revokesAllSessions() {
        UUID userId = UUID.randomUUID();
        String rawToken = "sample-raw-token";
        String hash = refreshTokenService.hashToken(rawToken);

        String sessionJson = """
            {
                "userId": "%s",
                "familyId": "%s",
                "createdAt": "2026-11-20T00:00:00Z",
                "expiresAt": "2026-11-27T00:00:00Z"
            }
            """.formatted(userId, UUID.randomUUID());

        when(valueOperations.get("auth:refresh:" + hash)).thenReturn(sessionJson);
        when(setOperations.members("auth:user:" + userId + ":sessions")).thenReturn(Set.of("hash1", "hash2"));

        refreshTokenService.revoke(rawToken, true);

        verify(redisTemplate).delete("auth:refresh:" + hash);
        verify(valueOperations).set(eq("auth:rotated:" + hash), eq(userId.toString()), eq(Duration.ofSeconds(604800)));
        verify(redisTemplate).delete(Set.of("auth:refresh:hash1", "auth:refresh:hash2"));
        verify(redisTemplate).delete("auth:user:" + userId + ":sessions");
    }

    @Test
    @DisplayName("rotate detects reuse when token was previously revoked and revokes all user sessions")
    void rotate_whenTokenWasRevoked_revokesAllSessionsAndThrowsReuseException() {
        UUID userId = UUID.randomUUID();
        String rawToken = "sample-revoked-token";
        String hash = refreshTokenService.hashToken(rawToken);

        when(valueOperations.get("auth:refresh:" + hash)).thenReturn(null);
        when(valueOperations.get("auth:rotated:" + hash)).thenReturn(userId.toString());
        when(setOperations.members("auth:user:" + userId + ":sessions")).thenReturn(Set.of("activeHash"));

        assertThatThrownBy(() -> refreshTokenService.rotate(rawToken))
            .isInstanceOf(TokenReuseException.class)
            .hasMessageContaining("Refresh token reuse detected");

        verify(redisTemplate).delete(Set.of("auth:refresh:activeHash"));
        verify(redisTemplate).delete("auth:user:" + userId + ":sessions");
    }
}
