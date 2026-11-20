package com.taans.zennercore.domain.auth;

import java.time.Instant;
import java.util.UUID;

public record RefreshTokenSession(
    UUID userId,
    UUID familyId,
    Instant createdAt,
    Instant expiresAt
) {}
