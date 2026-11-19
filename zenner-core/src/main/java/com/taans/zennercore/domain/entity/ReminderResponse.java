package com.taans.zennercore.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reminder_responses")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ReminderResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "day_id", nullable = false)
    private Day day;

    @ManyToOne
    @JoinColumn(name = "reminder_id", nullable = false)
    private Reminder reminder;

    @Column(nullable = false)
    @Builder.Default
    private boolean completed = false;

    @Column
    private String note;

    @Column(name = "answered_at")
    private LocalDateTime answeredAt;

}
