package com.taans.zennercore.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "timeblock_items")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class TimeblockItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "timeblock_id", nullable = false)
    private Timeblock timeblock;

    @Column(nullable = false)
    private String detail;

    @Column(nullable = false)
    @Builder.Default
    private boolean finished = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

}
