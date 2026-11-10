package com.taans.zennercore.api.v1.dto.response;

import com.taans.zennercore.domain.entity.ReminderResponse;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReminderResponseDto(
    UUID id,
    UUID reminderId,
    String content,
    boolean completed,
    String note,
    LocalDateTime answeredAt
) {
    public static ReminderResponseDto from(ReminderResponse response) {
        if (response == null) {
            return null;
        }
        UUID reminderId = response.getReminder() != null ? response.getReminder().getId() : null;
        String content = response.getReminder() != null ? response.getReminder().getContent() : null;

        return new ReminderResponseDto(
            response.getId(),
            reminderId,
            content,
            response.isCompleted(),
            response.getNote(),
            response.getAnsweredAt()
        );
    }
}
