package com.taans.zennercore.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "timeblocks")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Timeblock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "day_id", nullable = false)
    private Day day;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private boolean finished;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @OneToMany(mappedBy = "timeblock", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<TimeblockItem> timeblockItems = new ArrayList<>();


}
