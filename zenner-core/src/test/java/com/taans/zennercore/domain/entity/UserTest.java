package com.taans.zennercore.domain.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserTest {

    @Test
    @DisplayName("Dev user password hash matches password123")
    void devUserPasswordHash_matchesPassword123() {
        String hash = "$2a$10$DkpIfDt5QmNKF0LOPdlJaOSI9oGMXdXS14ut4MNrqszIpg5Wm5FUS";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        assertThat(encoder.matches("password123", hash)).isTrue();
        assertThat(encoder.matches("wrongpassword", hash)).isFalse();
    }

    @Test
    @DisplayName("User entity builder constructs instance with defaults")
    void userBuilder_constructsInstance() {
        UUID id = UUID.randomUUID();
        User user = User.builder()
            .id(id)
            .email("test@zenner.local")
            .passwordHash("hashed")
            .firstName("Test")
            .lastName("User")
            .build();

        assertThat(user.getId()).isEqualTo(id);
        assertThat(user.getEmail()).isEqualTo("test@zenner.local");
        assertThat(user.isActive()).isTrue();
        assertThat(user.isEmailVerified()).isFalse();
    }
}
