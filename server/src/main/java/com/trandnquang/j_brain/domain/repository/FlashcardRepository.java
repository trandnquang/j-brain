package com.trandnquang.j_brain.domain.repository;

import com.trandnquang.j_brain.domain.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {
    List<Flashcard> findByDeckId(UUID deckId);

    List<Flashcard> findByDeckIdAndNextReviewDateBefore(UUID deckId, OffsetDateTime date);
}
