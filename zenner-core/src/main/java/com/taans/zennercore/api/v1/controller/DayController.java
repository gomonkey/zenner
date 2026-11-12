package com.taans.zennercore.api.v1.controller;

import com.taans.zennercore.api.v1.dto.response.DayResponse;
import com.taans.zennercore.api.v1.support.UserContextResolver;
import com.taans.zennercore.service.DayService;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/days")
@Validated
@RequiredArgsConstructor
public class DayController {

    private final DayService dayService;
    private final UserContextResolver userContextResolver;

    @GetMapping("/today")
    public DayResponse getOrCreateToday(@RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = userContextResolver.resolveUserId(headerUserId);
        return dayService.getOrCreateToday(userId, LocalDate.now());
    }

    @GetMapping("/{dayId}")
    public DayResponse get(
        @PathVariable UUID dayId,
        @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId
    ) {
        UUID userId = userContextResolver.resolveUserId(headerUserId);
        return dayService.get(dayId, userId);
    }
}

