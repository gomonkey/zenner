package com.taans.zennercore.repository;

import com.taans.zennercore.domain.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {
    List<Reminder> findAllByUserId(UUID userId);
}
