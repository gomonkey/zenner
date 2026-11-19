package com.taans.zennercore.domain.entity;

import com.taans.zennercore.domain.enums.TaskAction;
import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "day_id", nullable = false)
    private Day day;

    @Column(nullable = false)
    private String detail;

    @Column(nullable = false)
    @Enumerated(value = EnumType.STRING)
    private TaskAction action;

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;

    @Column
    private Boolean finished;

    @Column(name = "delegated_to")
    private String delegatedTo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @AssertTrue(message = "Task action fields do not match constraints")
    public boolean isValidTask() {
        return switch (action) {
            case DO -> scheduledTime != null && finished != null && delegatedTo == null;
            case SCHEDULE -> scheduledTime != null && finished == null && delegatedTo == null;
            case DELEGATE -> scheduledTime == null && finished == null && delegatedTo != null;
            case DELETE -> scheduledTime == null && finished == null && delegatedTo == null;
        };
    }

}
