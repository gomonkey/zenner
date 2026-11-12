package com.taans.zennercore.api.v1.dto.response;

import com.taans.zennercore.domain.entity.TimeblockItem;

import java.util.UUID;

public record TimeblockItemResponse(
    UUID id,
    String detail,
    boolean finished
) {
    public static TimeblockItemResponse from(TimeblockItem item) {
        if (item == null) {
            return null;
        }
        return new TimeblockItemResponse(
            item.getId(),
            item.getDetail(),
            item.isFinished()
        );
    }
}
