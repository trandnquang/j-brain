package com.trandnquang.j_brain.controller;

import com.trandnquang.j_brain.dto.request.SubmitReviewRequest;
import com.trandnquang.j_brain.dto.response.ReviewCardResponse;
import com.trandnquang.j_brain.dto.response.ReviewResultResponse;
import com.trandnquang.j_brain.service.FlashcardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST façade for the SRS (Spaced Repetition System) review session.
 *
 * <p>
 * WHY: Review endpoints are separated from Flashcard endpoints to signal
 * that they represent a distinct domain concept — the SRS learning session —
 * rather than CRUD on flashcard resources.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "SRS Review Session APIs")
public class ReviewController {

    private final FlashcardService flashcardService;

    /**
     * Fetches all flashcards due for review today in the given deck.
     * Uses the partial index on {@code next_review_date} for O(log n) queries.
     *
     * @param deckId         Target deck UUID.
     * @param authentication Spring Security context (JWT principal).
     * @return 200 with list of due cards (may be empty on a rest day).
     */
    @GetMapping("/decks/{deckId}/reviews")
    @Operation(summary = "Get all cards due for review in a deck today", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<ReviewCardResponse>> getDueCards(
            @PathVariable UUID deckId,
            Authentication authentication) {

        return ResponseEntity.ok(
                flashcardService.getDueCards(authentication.getName(), deckId));
    }

    /**
     * Submits a review grade and advances the SM-2 state of the flashcard.
     *
     * <p>
     * Grade scale: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy.
     *
     * @param request        Validated review submission payload.
     * @param authentication Spring Security context (JWT principal).
     * @return 200 with {@link ReviewResultResponse} containing the new interval.
     */
    @PostMapping("/reviews")
    @Operation(summary = "Submit a review grade for a flashcard", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ReviewResultResponse> submitReview(
            @Valid @RequestBody SubmitReviewRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                flashcardService.processReview(authentication.getName(), request));
    }
}