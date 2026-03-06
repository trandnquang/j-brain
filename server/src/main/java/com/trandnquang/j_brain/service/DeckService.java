package com.trandnquang.j_brain.service;

import com.trandnquang.j_brain.domain.entity.Deck;
import com.trandnquang.j_brain.domain.entity.User;
import com.trandnquang.j_brain.domain.repository.DeckRepository;
import com.trandnquang.j_brain.domain.repository.FlashcardRepository;
import com.trandnquang.j_brain.domain.repository.UserRepository;
import com.trandnquang.j_brain.dto.request.CreateDeckRequest;
import com.trandnquang.j_brain.dto.request.RenameDeckRequest;
import com.trandnquang.j_brain.dto.response.DeckResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Business logic for managing Decks.
 *
 * <p>WHY: Deck operations are wrapped in transactions so that, if any step
 * fails (e.g. duplicate name constraint), the entire operation rolls back
 * cleanly, preventing orphaned state.
 * cardCount and dueCount are derived from FlashcardRepository in a single
 * service call to avoid N+1 queries per deck in the list view.
 */
@Service
@RequiredArgsConstructor
public class DeckService {

    private final DeckRepository deckRepository;
    private final UserRepository userRepository;
    private final FlashcardRepository flashcardRepository;

    // =========================================================================
    // CREATE
    // =========================================================================

    @Transactional
    public DeckResponse createDeck(String userEmail, CreateDeckRequest request) {
        User user = findUser(userEmail);
        Deck deck = Deck.builder()
                .user(user)
                .name(request.name())
                .description(request.description())
                .build();
        return mapToResponse(deckRepository.saveAndFlush(deck));
    }

    // =========================================================================
    // READ
    // =========================================================================

    @Transactional(readOnly = true)
    public List<DeckResponse> getUserDecks(String userEmail) {
        User user = findUser(userEmail);
        return deckRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DeckResponse getDeckById(UUID deckId, String userEmail) {
        Deck deck = findDeck(deckId);
        assertOwnership(deck, userEmail);
        return mapToResponse(deck);
    }

    // =========================================================================
    // UPDATE — rename
    // =========================================================================

    /**
     * Renames (and optionally updates description of) an existing deck.
     *
     * @param deckId    Target deck UUID.
     * @param userEmail Email of the authenticated user (ownership check).
     * @param request   New name / description payload.
     * @return Updated {@link DeckResponse}.
     */
    @Transactional
    public DeckResponse renameDeck(UUID deckId, String userEmail, RenameDeckRequest request) {
        Deck deck = findDeck(deckId);
        assertOwnership(deck, userEmail);
        deck.setName(request.name());
        deck.setDescription(request.description());
        return mapToResponse(deckRepository.saveAndFlush(deck));
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    /**
     * Deletes a deck and all its cascaded flashcards and review logs.
     *
     * <p>WHY: Ownership is verified before delete. Cascade is handled by the
     * FK constraints (ON DELETE CASCADE) defined in the migration SQL, not by
     * JPA {@code CascadeType.ALL}, to avoid loading thousands of flashcard
     * entities into memory before deletion.
     *
     * @param deckId    Target deck UUID.
     * @param userEmail Email of the authenticated user (ownership check).
     */
    @Transactional
    public void deleteDeck(UUID deckId, String userEmail) {
        Deck deck = findDeck(deckId);
        assertOwnership(deck, userEmail);
        deckRepository.delete(deck);
    }

    // =========================================================================
    // PACKAGE-PRIVATE — used by FlashcardService
    // =========================================================================

    /**
     * Loads a Deck entity and asserts ownership — shared with FlashcardService
     * to avoid duplicate lookup logic.
     */
    Deck loadAndAssertOwnership(UUID deckId, String userEmail) {
        Deck deck = findDeck(deckId);
        assertOwnership(deck, userEmail);
        return deck;
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + email));
    }

    private Deck findDeck(UUID deckId) {
        return deckRepository.findById(deckId)
                .orElseThrow(() -> new EntityNotFoundException("Deck not found: " + deckId));
    }

    private void assertOwnership(Deck deck, String userEmail) {
        if (!deck.getUser().getEmail().equals(userEmail)) {
            throw new AccessDeniedException(
                    "Deck " + deck.getId() + " does not belong to user " + userEmail);
        }
    }

    /**
     * Maps a Deck entity to its response DTO, including live card/due counts.
     * WHY: These counts are computed at map-time (not cached) to always reflect
     * the current state of the deck without a separate refresh round-trip.
     */
    private DeckResponse mapToResponse(Deck deck) {
        long cardCount = flashcardRepository.countByDeckId(deck.getId());
        long dueCount  = flashcardRepository.countByDeckIdAndNextReviewDateBefore(
                deck.getId(), OffsetDateTime.now());
        return new DeckResponse(
                deck.getId(),
                deck.getName(),
                deck.getDescription(),
                deck.getCreatedAt().toZonedDateTime(),
                cardCount,
                dueCount);
    }
}
