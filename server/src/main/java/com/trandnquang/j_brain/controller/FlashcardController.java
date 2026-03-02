package com.trandnquang.j_brain.controller;

import com.trandnquang.j_brain.dto.request.CreateFlashcardRequest;
import com.trandnquang.j_brain.dto.response.FlashcardResponse;
import com.trandnquang.j_brain.service.FlashcardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST façade for Flashcard creation and retrieval.
 *
 * <p>
 * WHY: Creating a flashcard is a two-phase operation: (1) synchronous DB
 * persist returns immediately, (2) async AI example generation runs in the
 * background. The controller reflects this by returning 202 Accepted to
 * signal that work is still in progress.
 */
@RestController
@RequestMapping("/api/v1/flashcards")
@RequiredArgsConstructor
@Tag(name = "Flashcards", description = "Flashcard Management and AI Generation APIs")
public class FlashcardController {

    private final FlashcardService flashcardService;

    /**
     * Creates a new Flashcard and triggers async AI example generation.
     *
     * @param request        Validated flashcard creation payload.
     * @param authentication Spring Security context (JWT principal).
     * @return 202 Accepted — flashcard is persisted, examples are being generated.
     */
    @PostMapping
    @Operation(summary = "Create a new flashcard (triggers async AI example generation)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<FlashcardResponse> createFlashcard(
            @Valid @RequestBody CreateFlashcardRequest request,
            Authentication authentication) {

        FlashcardResponse response = flashcardService.saveFlashcard(
                authentication.getName(), request);

        // 202 Accepted: card is saved but AI examples are still being generated
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    /**
     * Returns all flashcards in a deck, including their AI-generated examples.
     *
     * @param deckId         The target deck UUID (query parameter).
     * @param authentication Spring Security context (JWT principal).
     * @return 200 with the list of {@link FlashcardResponse}.
     */
    @GetMapping
    @Operation(summary = "Get all flashcards in a deck", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<FlashcardResponse>> getFlashcards(
            @RequestParam UUID deckId,
            Authentication authentication) {

        return ResponseEntity.ok(
                flashcardService.getFlashcardsByDeckId(authentication.getName(), deckId));
    }
}