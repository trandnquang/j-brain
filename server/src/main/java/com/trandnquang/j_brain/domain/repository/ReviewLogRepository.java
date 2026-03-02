package com.trandnquang.j_brain.domain.repository;

import com.trandnquang.j_brain.domain.entity.ReviewLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewLogRepository extends JpaRepository<ReviewLog, UUID> {
    List<ReviewLog> findByFlashcardIdOrderByReviewedAtDesc(UUID flashcardId);
}
