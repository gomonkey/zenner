package com.taans.zennercore.repository;

import com.taans.zennercore.domain.entity.Day;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface DayRepository extends JpaRepository<Day, UUID> {

    Optional<Day> findByIdAndUserId(UUID id, UUID userId);

    Optional<Day> findByUserIdAndDate(UUID userId, LocalDate date);
}
