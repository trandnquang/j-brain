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
 * Flashcard Entity — the core Domain Aggregate for the SRS engine.
 *
 * <p>
 * WHY: v3.0 adds Phase 2 fields (kana, common, senses JSONB, kanji_components,
 * radical, grade, chinese, korean_r, korean_h) while keeping the legacy
 * {@code meanings TEXT[]} column for SM-2 review queries that need fast array
 * access.
 * {@code senses} JSONB holds the full structured data for the detail view.
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

    // ── Identity ──────────────────────────────────────────────────────────────

    @Column(nullable = false)
    private String keyword;

    /** [Phase 2] Pure kana reading (e.g. "はしる"), always populated */
    @Column(name = "kana")
    private String kana;

    private String furigana;

    /** [Phase 2] True if Jotoba marks this word as common vocabulary */
    @Builder.Default
    @Column(name = "common")
    private Boolean common = false;

    // ── Meanings ──────────────────────────────────────────────────────────────

    /** Flat gloss list kept for SM-2 review display queries */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "meanings", columnDefinition = "text[]", nullable = false)
    private List<String> meanings;

    /**
     * [Phase 2] Structured senses from Jotoba, serialized as JSONB.
     * Schema: [{glosses:string[], pos:string[], misc:string[]}]
     * Used by the word detail drawer — not for SM-2 queries.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "senses", columnDefinition = "jsonb")
    private String senses;

    // ── Word-specific ─────────────────────────────────────────────────────────

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "part_of_speech", columnDefinition = "text[]")
    private List<String> partOfSpeech;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pitch_accent_data", columnDefinition = "jsonb")
    private String pitchAccentData;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    /**
     * [Phase 2] Kanji character components extracted from the keyword.
     * Example: "有難う" → ["有", "難"]
     */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "kanji_components", columnDefinition = "text[]")
    private List<String> kanjiComponents;

    // ── Kanji-specific ────────────────────────────────────────────────────────

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

    /** [Phase 2] Joyo school grade (1–8) */
    @Column(name = "grade")
    private Integer grade;

    /** [Phase 2] Primary radical character */
    @Column(name = "radical")
    private String radical;

    /** [Phase 2] Chinese pinyin readings */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "chinese", columnDefinition = "text[]")
    private List<String> chinese;

    /** [Phase 2] Korean romanized readings */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "korean_r", columnDefinition = "text[]")
    private List<String> koreanR;

    /** [Phase 2] Korean Hangul readings */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "korean_h", columnDefinition = "text[]")
    private List<String> koreanH;

    // ── Flashcard examples ─────────────────────────────────────────────────────

    @OneToMany(mappedBy = "flashcard", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FlashcardExample> examples;

    // ── SM-2 Metrics ──────────────────────────────────────────────────────────

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
