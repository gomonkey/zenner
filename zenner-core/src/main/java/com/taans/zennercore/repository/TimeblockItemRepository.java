package com.taans.zennercore.repository;

import com.taans.zennercore.domain.entity.TimeblockItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TimeblockItemRepository extends JpaRepository<TimeblockItem, UUID> {
}
