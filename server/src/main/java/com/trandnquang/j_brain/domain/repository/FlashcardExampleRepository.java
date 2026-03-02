package com.trandnquang.j_brain.domain.repository;

import com.trandnquang.j_brain.domain.entity.FlashcardExample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FlashcardExampleRepository extends JpaRepository<FlashcardExample, UUID> {
    List<FlashcardExample> findByFlashcardId(UUID flashcardId);
}
