package com.trandnquang.j_brain.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Flashcard Entity mapping the `flashcards` PostgreSQL table.
 * 
 * WHY: This entity acts as the core Domain Aggregate for the SRS engine.
 * Relies on Hibernate Types mapping for PostgreSQL specific features like
 * TEXT[] and JSONB.
 */
@Entity
@Table(name = "flashcards", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "deck_id", "keyword" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id", nullable = false)
    private Deck deck;

    @Builder.Default
    @Column(name = "card_type", length = 20)
    private String cardType = "WORD";

    @Column(nullable = false)
    private String keyword;

    private String furigana;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "meanings", columnDefinition = "text[]", nullable = false)
    private List<String> meanings;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "part_of_speech", columnDefinition = "text[]")
    private List<String> partOfSpeech;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pitch_accent_data", columnDefinition = "jsonb")
    private String pitchAccentData;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "stroke_count")
    private Integer strokeCount;

    @Column(name = "jlpt_level")
    private Integer jlptLevel;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "onyomi", columnDefinition = "text[]")
    private List<String> onyomi;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "kunyomi", columnDefinition = "text[]")
    private List<String> kunyomi;

    @OneToMany(mappedBy = "flashcard", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FlashcardExample> examples;

    // SM-2 Metrics
    @Builder.Default
    private Integer repetition = 0;

    @Builder.Default
    @Column(name = "interval_days")
    private Integer intervalDays = 0;

    @Builder.Default
    @Column(name = "ease_factor")
    private Double easeFactor = 2.50;

    @Column(name = "next_review_date")
    private OffsetDateTime nextReviewDate;

    @Builder.Default
    @Column(length = 20)
    private String status = "LEARNING";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
