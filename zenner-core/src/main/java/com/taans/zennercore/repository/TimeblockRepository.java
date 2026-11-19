package com.taans.zennercore.repository;

import com.taans.zennercore.domain.entity.Timeblock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TimeblockRepository extends JpaRepository<Timeblock, UUID> {
}
