package com.taans.zennercore.api.v1.dto.response;

import com.taans.zennercore.domain.entity.Task;
import com.taans.zennercore.domain.enums.TaskAction;

import java.time.LocalDateTime;
import java.util.UUID;

public record TaskResponse(
    UUID id,
    String detail,
    TaskAction action,
    LocalDateTime scheduledTime,
    Boolean finished,
    String delegatedTo
) {
    public static TaskResponse from(Task task) {
        if (task == null) {
            return null;
        }
        return new TaskResponse(
            task.getId(),
            task.getDetail(),
            task.getAction(),
            task.getScheduledTime(),
            task.getFinished(),
            task.getDelegatedTo()
        );
    }
}
