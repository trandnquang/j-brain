package com.trandnquang.j_brain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Payload for PATCH /api/v1/decks/{deckId} — rename a deck. */
public record RenameDeckRequest(
        @NotBlank(message = "Deck name must not be blank")
        @Size(max = 100, message = "Deck name max 100 characters")
        String name,
        String description
) {}
