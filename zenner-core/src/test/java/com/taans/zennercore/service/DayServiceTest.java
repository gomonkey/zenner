package com.taans.zennercore.service;

import com.taans.zennercore.api.v1.dto.response.DayResponse;
import com.taans.zennercore.domain.entity.Day;
import com.taans.zennercore.exception.ResourceNotFoundException;
import com.taans.zennercore.repository.DayRepository;
import com.taans.zennercore.repository.ReminderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DayServiceTest {

    @Mock
    private DayRepository dayRepository;

    @Mock
    private ReminderRepository reminderRepository;

    private DayService dayService;

    @BeforeEach
    void setUp() {
        dayService = new DayService(dayRepository, reminderRepository);
    }

    @Nested
    @DisplayName("get(UUID dayId, UUID userId)")
    class GetByIdTests {

        @Test
        @DisplayName("returns DayResponse when day exists for user")
        void getDay_whenExists_returnsDayResponse() {
            UUID dayId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            LocalDate today = LocalDate.now();

            Day day = Day.builder()
                .id(dayId)
                .userId(userId)
                .date(today)
                .blocked(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

            when(dayRepository.findByIdAndUserId(dayId, userId)).thenReturn(Optional.of(day));

            DayResponse response = dayService.get(dayId, userId);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(dayId);
            assertThat(response.userId()).isEqualTo(userId);
            assertThat(response.date()).isEqualTo(today);
            assertThat(response.blocked()).isFalse();
            verify(dayRepository).findByIdAndUserId(dayId, userId);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when day does not exist for user")
        void getDay_whenNotExists_throwsResourceNotFoundException() {
            UUID dayId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            when(dayRepository.findByIdAndUserId(dayId, userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> dayService.get(dayId, userId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(dayId.toString());

            verify(dayRepository).findByIdAndUserId(dayId, userId);
        }
    }

    @Nested
    @DisplayName("getOrCreateToday(UUID userId, LocalDate date)")
    class GetOrCreateTodayTests {

        @Test
        @DisplayName("returns existing Day when already present for user and date")
        void getOrCreateToday_whenExists_returnsExistingDayWithoutCreating() {
            UUID userId = UUID.randomUUID();
            LocalDate today = LocalDate.now();
            UUID dayId = UUID.randomUUID();

            Day existingDay = Day.builder()
                .id(dayId)
                .userId(userId)
                .date(today)
                .blocked(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

            when(dayRepository.findByUserIdAndDate(userId, today)).thenReturn(Optional.of(existingDay));

            DayResponse response = dayService.getOrCreateToday(userId, today);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(dayId);
            assertThat(response.userId()).isEqualTo(userId);
            assertThat(response.date()).isEqualTo(today);

            verify(dayRepository).findByUserIdAndDate(userId, today);
            verify(dayRepository, never()).save(any());
            verifyNoInteractions(reminderRepository);
        }

        @Test
        @DisplayName("creates new Day with active reminders when none exists")
        void getOrCreateToday_whenNotExists_createsDayWithActiveReminders() {
            UUID userId = UUID.randomUUID();
            LocalDate today = LocalDate.now();
            UUID dayId = UUID.randomUUID();
            UUID reminderId1 = UUID.randomUUID();
            UUID reminderId2 = UUID.randomUUID();

            com.taans.zennercore.domain.entity.Reminder reminder1 = com.taans.zennercore.domain.entity.Reminder.builder()
                .id(reminderId1)
                .userId(userId)
                .content("Drink 2L of water")
                .build();

            com.taans.zennercore.domain.entity.Reminder reminder2 = com.taans.zennercore.domain.entity.Reminder.builder()
                .id(reminderId2)
                .userId(userId)
                .content("Exercise 30 mins")
                .build();

            when(dayRepository.findByUserIdAndDate(userId, today)).thenReturn(Optional.empty());
            when(reminderRepository.findAllByUserId(userId)).thenReturn(java.util.List.of(reminder1, reminder2));

            when(dayRepository.saveAndFlush(any(Day.class))).thenAnswer(invocation -> {
                Day dayToSave = invocation.getArgument(0);
                dayToSave.setId(dayId);
                dayToSave.setCreatedAt(Instant.now());
                dayToSave.setUpdatedAt(Instant.now());
                return dayToSave;
            });

            DayResponse response = dayService.getOrCreateToday(userId, today);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(dayId);
            assertThat(response.userId()).isEqualTo(userId);
            assertThat(response.date()).isEqualTo(today);
            assertThat(response.blocked()).isFalse();
            assertThat(response.reminderResponses()).hasSize(2);
            assertThat(response.reminderResponses())
                .extracting("content")
                .containsExactlyInAnyOrder("Drink 2L of water", "Exercise 30 mins");
            assertThat(response.reminderResponses())
                .extracting("completed")
                .containsOnly(false);

            verify(dayRepository).findByUserIdAndDate(userId, today);
            verify(reminderRepository).findAllByUserId(userId);
            verify(dayRepository).saveAndFlush(any(Day.class));
        }

        @Test
        @DisplayName("idempotently recovers if race condition causes DataIntegrityViolationException on save")
        void getOrCreateToday_whenConcurrentInsert_recoversIdempotently() {
            UUID userId = UUID.randomUUID();
            LocalDate today = LocalDate.now();
            UUID dayId = UUID.randomUUID();

            Day concurrentlyCreatedDay = Day.builder()
                .id(dayId)
                .userId(userId)
                .date(today)
                .blocked(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

            when(dayRepository.findByUserIdAndDate(userId, today))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(concurrentlyCreatedDay));
            when(reminderRepository.findAllByUserId(userId)).thenReturn(java.util.List.of());
            when(dayRepository.saveAndFlush(any(Day.class))).thenThrow(new org.springframework.dao.DataIntegrityViolationException("duplicate key"));

            DayResponse response = dayService.getOrCreateToday(userId, today);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(dayId);
            assertThat(response.userId()).isEqualTo(userId);

            verify(dayRepository, times(2)).findByUserIdAndDate(userId, today);
            verify(dayRepository).saveAndFlush(any(Day.class));
        }
    }
}
