package com.taans.zennercore.api.v1.dto.response;

import com.taans.zennercore.domain.entity.Timeblock;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record TimeblockResponse(
    UUID id,
    String title,
    boolean finished,
    LocalTime startTime,
    LocalTime endTime,
    List<TimeblockItemResponse> items
) {
    public static TimeblockResponse from(Timeblock timeblock) {
        if (timeblock == null) {
            return null;
        }
        List<TimeblockItemResponse> itemResponses = timeblock.getTimeblockItems() != null
            ? timeblock.getTimeblockItems().stream().map(TimeblockItemResponse::from).toList()
            : List.of();

        return new TimeblockResponse(
            timeblock.getId(),
            timeblock.getTitle(),
            timeblock.isFinished(),
            timeblock.getStartTime(),
            timeblock.getEndTime(),
            itemResponses
        );
    }
}
