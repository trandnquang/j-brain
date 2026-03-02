package com.trandnquang.j_brain.service;

import com.trandnquang.j_brain.domain.entity.Deck;
import com.trandnquang.j_brain.domain.entity.User;
import com.trandnquang.j_brain.domain.repository.DeckRepository;
import com.trandnquang.j_brain.domain.repository.UserRepository;
import com.trandnquang.j_brain.dto.request.CreateDeckRequest;
import com.trandnquang.j_brain.dto.response.DeckResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Business logic for managing Decks.
 *
 * <p>
 * WHY: Deck creation is wrapped in a transaction to ensure that, if the
 * user-lookup succeeds but the deck INSERT fails (e.g. duplicate name), the
 * entire operation rolls back cleanly, preventing orphaned state.
 */
@Service
@RequiredArgsConstructor
public class DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;

    /**
     * Creates a new {@link Deck} for the authenticated user.
     *
     * @param userEmail Email extracted from the JWT principal.
     * @param request   Validated deck creation payload.
     * @return The persisted {@link DeckResponse}.
     * @throws jakarta.persistence.EntityNotFoundException if the user is not found.
     */
    @Transactional
    public DeckResponse createDeck(String userEmail, CreateDeckRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "User not found: " + userEmail));

        Deck deck = Deck.builder()
                .user(user)
                .name(request.name())
                .description(request.description())
                .build();

        return mapToResponse(deckRepository.saveAndFlush(deck));
    }

    /**
     * Returns all decks belonging to the authenticated user.
     *
     * @param userEmail Email extracted from the JWT principal.
     * @return Ordered list of {@link DeckResponse} DTOs.
     */
    @Transactional(readOnly = true)
    public List<DeckResponse> getUserDecks(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "User not found: " + userEmail));

        return deckRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Retrieves a single deck by ID and validates ownership.
     *
     * @param deckId    The target deck UUID.
     * @param userEmail Email of the requesting user.
     * @return {@link DeckResponse} if found and owned by the user.
     * @throws jakarta.persistence.EntityNotFoundException               if deck not
     *                                                                   found.
     * @throws org.springframework.security.access.AccessDeniedException if deck
     *                                                                   belongs to
     *                                                                   another
     *                                                                   user.
     */
    @Transactional(readOnly = true)
    public DeckResponse getDeckById(UUID deckId, String userEmail) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Deck not found: " + deckId));
        assertOwnership(deck, userEmail);
        return mapToResponse(deck);
    }

    // =========================================================================
    // PACKAGE-PRIVATE HELPER — used by FlashcardService
    // =========================================================================

    /**
     * Loads a Deck entity and asserts ownership. Used by FlashcardService to
     * avoid duplicate lookup logic.
     */
    Deck loadAndAssertOwnership(UUID deckId, String userEmail) {
        Deck deck = deckRepository.findById(deckId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Deck not found: " + deckId));
        assertOwnership(deck, userEmail);
        return deck;
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private void assertOwnership(Deck deck, String userEmail) {
        if (!deck.getUser().getEmail().equals(userEmail)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Deck " + deck.getId() + " does not belong to user " + userEmail);
        }
    }

    private DeckResponse mapToResponse(Deck deck) {
        return new DeckResponse(
                deck.getId(),
                deck.getName(),
                deck.getDescription(),
                deck.getCreatedAt().toZonedDateTime());
    }
}
