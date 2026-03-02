package com.trandnquang.j_brain.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * ReviewLog Entity mapping the `review_logs` SQL table.
 * 
 * WHY: Provides an audit trail for the SM-2 algorithm interactions, tracking
 * exactly
 * how user grading affected intervals and ease factors historically.
 */
@Entity
@Table(name = "review_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    @Column(nullable = false)
    private Integer grade;

    @Column(name = "previous_interval")
    private Integer previousInterval;

    @Column(name = "new_interval")
    private Integer newInterval;

    @Column(name = "previous_ease")
    private Double previousEase;

    @Column(name = "new_ease")
    private Double newEase;

    @CreationTimestamp
    @Column(name = "reviewed_at", updatable = false)
    private OffsetDateTime reviewedAt;
}
