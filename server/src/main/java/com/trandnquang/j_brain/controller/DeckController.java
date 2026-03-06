package com.trandnquang.j_brain.controller;

import com.trandnquang.j_brain.dto.request.CreateDeckRequest;
import com.trandnquang.j_brain.dto.request.RenameDeckRequest;
import com.trandnquang.j_brain.dto.response.DeckResponse;
import com.trandnquang.j_brain.service.DeckService;
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
 * REST façade for Deck management (CRUD).
 *
 * <p>WHY: Controllers are intentionally thin — HTTP marshalling and delegation
 * only. All business rules (ownership, deduplication) live in {@link DeckService}.
 */
@RestController
@RequestMapping("/api/v1/decks")
@RequiredArgsConstructor
@Tag(name = "Decks", description = "Deck Management APIs")
public class DeckController {

    private final DeckService deckService;

    @PostMapping
    @Operation(summary = "Create a new learning deck", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<DeckResponse> createDeck(
            @Valid @RequestBody CreateDeckRequest request,
            Authentication authentication) {
        DeckResponse response = deckService.createDeck(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get all decks for the authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<DeckResponse>> getUserDecks(Authentication authentication) {
        return ResponseEntity.ok(deckService.getUserDecks(authentication.getName()));
    }

    @GetMapping("/{deckId}")
    @Operation(summary = "Get a single deck by ID", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<DeckResponse> getDeckById(
            @PathVariable UUID deckId,
            Authentication authentication) {
        return ResponseEntity.ok(deckService.getDeckById(deckId, authentication.getName()));
    }

    /**
     * PATCH /api/v1/decks/{deckId} — rename or update description.
     * WHY: PATCH (not PUT) because we allow partial updates (name only or both).
     */
    @PatchMapping("/{deckId}")
    @Operation(summary = "Rename a deck or update its description", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<DeckResponse> renameDeck(
            @PathVariable UUID deckId,
            @Valid @RequestBody RenameDeckRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(deckService.renameDeck(deckId, authentication.getName(), request));
    }

    /**
     * DELETE /api/v1/decks/{deckId} — permanently delete a deck and all its cards.
     * WHY: Cascaded deletion is handled at the DB level by ON DELETE CASCADE on
     * flashcards.deck_id and review_logs.flashcard_id, avoiding JPA N+1 deletes.
     */
    @DeleteMapping("/{deckId}")
    @Operation(summary = "Delete a deck and all its flashcards", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deleteDeck(
            @PathVariable UUID deckId,
            Authentication authentication) {
        deckService.deleteDeck(deckId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}