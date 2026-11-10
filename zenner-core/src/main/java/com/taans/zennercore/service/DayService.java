package com.taans.zennercore.service;

import com.taans.zennercore.api.v1.dto.response.DayResponse;
import com.taans.zennercore.domain.entity.Day;
import com.taans.zennercore.domain.entity.Reminder;
import com.taans.zennercore.domain.entity.ReminderResponse;
import com.taans.zennercore.exception.ResourceNotFoundException;
import com.taans.zennercore.repository.DayRepository;
import com.taans.zennercore.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DayService {

    private final DayRepository dayRepository;
    private final ReminderRepository reminderRepository;

    @Transactional(readOnly = true)
    public DayResponse get(UUID dayId, UUID userId) {
        return dayRepository.findByIdAndUserId(dayId, userId)
            .map(DayResponse::from)
            .orElseThrow(() -> new ResourceNotFoundException("Day not found with id: " + dayId));
    }

    @Transactional
    public DayResponse getOrCreateToday(UUID userId, LocalDate date) {
        return dayRepository.findByUserIdAndDate(userId, date)
            .map(DayResponse::from)
            .orElseGet(() -> createTodayIdempotently(userId, date));
    }

    private DayResponse createTodayIdempotently(UUID userId, LocalDate date) {
        List<Reminder> activeReminders = reminderRepository.findAllByUserId(userId);

        Day day = Day.builder()
            .userId(userId)
            .date(date)
            .blocked(false)
            .build();

        for (Reminder reminder : activeReminders) {
            day.addReminder(reminder);
        }

        try {
            Day saved = dayRepository.saveAndFlush(day);
            return DayResponse.from(saved);
        } catch (DataIntegrityViolationException ex) {
            // Concurrent creation occurred; fetch the concurrently created day
            return dayRepository.findByUserIdAndDate(userId, date)
                .map(DayResponse::from)
                .orElseThrow(() -> ex);
        }
    }
}
