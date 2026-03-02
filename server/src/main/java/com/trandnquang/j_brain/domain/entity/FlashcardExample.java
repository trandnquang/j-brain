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
 * FlashcardExample Entity mapping the `flashcard_examples` SQL table.
 * 
 * WHY: Stores LLM-generated context sentences (Keigo, Daily, Anime) tied to a
 * specific flashcard.
 */
@Entity
@Table(name = "flashcard_examples")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardExample {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private Flashcard flashcard;

    @Column(name = "context_style", nullable = false, length = 50)
    private String contextStyle;

    @Column(name = "japanese_sentence", nullable = false, columnDefinition = "text")
    private String japaneseSentence;

    @Column(name = "furigana_sentence", columnDefinition = "text")
    private String furiganaSentence;

    @Column(name = "vietnamese_translation", nullable = false, columnDefinition = "text")
    private String vietnameseTranslation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
