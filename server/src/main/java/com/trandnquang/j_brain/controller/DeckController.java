package com.trandnquang.j_brain.controller;

import com.trandnquang.j_brain.dto.request.CreateDeckRequest;
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
 * <p>
 * WHY: Deck ownership is enforced at the service layer ({@link DeckService})
 * not here. Controllers are intentionally thin — just HTTP marshalling and
 * delegation.
 */
@RestController
@RequestMapping("/api/v1/decks")
@RequiredArgsConstructor
@Tag(name = "Decks", description = "Deck Management APIs")
public class DeckController {

    private final DeckService deckService;

    /**
     * Creates a new learning deck for the authenticated user.
     *
     * @param request        Validated deck creation payload.
     * @param authentication Spring Security context (JWT principal).
     * @return 201 Created with the new {@link DeckResponse}.
     */
    @PostMapping
    @Operation(summary = "Create a new learning deck", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<DeckResponse> createDeck(
            @Valid @RequestBody CreateDeckRequest request,
            Authentication authentication) {

        DeckResponse response = deckService.createDeck(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns all decks belonging to the authenticated user.
     *
     * @param authentication Spring Security context (JWT principal).
     * @return 200 with the list of {@link DeckResponse}.
     */
    @GetMapping
    @Operation(summary = "Get all decks for the authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<DeckResponse>> getUserDecks(Authentication authentication) {
        return ResponseEntity.ok(deckService.getUserDecks(authentication.getName()));
    }

    /**
     * Returns a single deck by ID (must be owned by the caller).
     *
     * @param deckId         Path variable UUID.
     * @param authentication Spring Security context (JWT principal).
     * @return 200 with the {@link DeckResponse}, or 403/404 via exception handler.
     */
    @GetMapping("/{deckId}")
    @Operation(summary = "Get a single deck by ID", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<DeckResponse> getDeckById(
            @PathVariable UUID deckId,
            Authentication authentication) {

        return ResponseEntity.ok(deckService.getDeckById(deckId, authentication.getName()));
    }
}