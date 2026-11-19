package com.taans.zennercore.repository;

import com.taans.zennercore.domain.entity.ReminderResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReminderResponseRepository extends JpaRepository<ReminderResponse, UUID> {
}
