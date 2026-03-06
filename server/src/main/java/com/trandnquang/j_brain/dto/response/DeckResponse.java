package com.trandnquang.j_brain.dto.response;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Public-facing DTO for a Deck.
 *
 * WHY: cardCount and dueCount are surfaced here (not on the entity) so the
 * deck-list page can display "12 cards • 3 due today" in a single GET /decks
 * call without requiring additional round-trips per deck.
 */
public record DeckResponse(
        UUID id,
        String name,
        String description,
        ZonedDateTime createdAt,
        long cardCount,
        long dueCount
) {}
