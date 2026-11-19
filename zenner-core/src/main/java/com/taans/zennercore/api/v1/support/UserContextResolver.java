package com.taans.zennercore.api.v1.support;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UserContextResolver {

    public static final UUID DEFAULT_DEV_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    public UUID resolveUserId(UUID headerUserId) {
        if (headerUserId != null) {
            return headerUserId;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getName() != null) {
            String name = authentication.getName();
            if (!"anonymousUser".equalsIgnoreCase(name)) {
                try {
                    return UUID.fromString(name);
                } catch (IllegalArgumentException ignored) {
                    // Name is not a UUID, fall through
                }
            }
        }

        return DEFAULT_DEV_USER_ID;
    }
}
