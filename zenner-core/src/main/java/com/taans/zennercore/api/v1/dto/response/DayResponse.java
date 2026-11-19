package com.taans.zennercore.api.v1.dto.response;

import com.taans.zennercore.domain.entity.Day;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DayResponse(
    UUID id,
    UUID userId,
    LocalDate date,
    boolean blocked,
    Instant createdAt,
    Instant updatedAt,
    List<TimeblockResponse> timeblocks,
    List<TaskResponse> tasks,
    List<ReminderResponseDto> reminderResponses
) {
    public static DayResponse from(Day day) {
        if (day == null) {
            return null;
        }
        List<TimeblockResponse> timeblockResponses = day.getTimeblocks() != null
            ? day.getTimeblocks().stream().map(TimeblockResponse::from).toList()
            : List.of();

        List<TaskResponse> taskResponses = day.getTasks() != null
            ? day.getTasks().stream().map(TaskResponse::from).toList()
            : List.of();

        List<ReminderResponseDto> reminderResponseDtos = day.getReminderResponses() != null
            ? day.getReminderResponses().stream().map(ReminderResponseDto::from).toList()
            : List.of();

        return new DayResponse(
            day.getId(),
            day.getUserId(),
            day.getDate(),
            day.isBlocked(),
            day.getCreatedAt(),
            day.getUpdatedAt(),
            timeblockResponses,
            taskResponses,
            reminderResponseDtos
        );
    }
}
