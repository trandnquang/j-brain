package com.trandnquang.j_brain.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trandnquang.j_brain.domain.Sm2Result;
import com.trandnquang.j_brain.domain.entity.Deck;
import com.trandnquang.j_brain.domain.entity.Flashcard;
import com.trandnquang.j_brain.domain.entity.ReviewLog;
import com.trandnquang.j_brain.domain.entity.FlashcardExample;
import com.trandnquang.j_brain.domain.repository.FlashcardExampleRepository;
import com.trandnquang.j_brain.domain.repository.FlashcardRepository;
import com.trandnquang.j_brain.domain.repository.ReviewLogRepository;
import com.trandnquang.j_brain.dto.request.CreateFlashcardRequest;
import com.trandnquang.j_brain.dto.request.SubmitReviewRequest;
import com.trandnquang.j_brain.dto.response.ExampleResponse;
import com.trandnquang.j_brain.dto.response.FlashcardResponse;
import com.trandnquang.j_brain.dto.response.ReviewCardResponse;
import com.trandnquang.j_brain.dto.response.ReviewResultResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Orchestrates the full Flashcard lifecycle: creation, SRS scheduling, and
 * review processing.
 *
 * <p>
 * WHY: All write operations are wrapped in transactions. The SM-2 state
 * mutation in {@link #processReview} captures the *before* snapshot first so
 * the {@link ReviewLog} audit trail records the true previous values even
 * though
 * the {@link Flashcard} entity is mutated in-place.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final ReviewLogRepository reviewLogRepository;
    private final FlashcardExampleRepository exampleRepository;
    private final AiGenerationService aiGenerationService;
    private final Sm2EngineService sm2EngineService;
    private final DeckService deckService;
    private final ObjectMapper objectMapper;

    // =========================================================================
    // FLASHCARD CREATION
    // =========================================================================

    /**
     * Creates a new Flashcard in the specified Deck and triggers async AI
     * example generation.
     *
     * @param userEmail Email of the authenticated user (JWT principal).
     * @param request   Validated creation payload.
     * @return {@link FlashcardResponse} with an empty examples list
     *         (examples are populated asynchronously by
     *         {@link AiGenerationService}).
     */
    @Transactional
    public FlashcardResponse saveFlashcard(String userEmail, CreateFlashcardRequest request) {
        Deck deck = deckService.loadAndAssertOwnership(request.getDeckId(), userEmail);

        String pitchAccentJson = serializePitchAccent(request);

        Flashcard flashcard = Flashcard.builder()
                .deck(deck)
                .cardType(request.getCardType() != null ? request.getCardType() : "WORD")
                .keyword(request.getKeyword())
                .kana(request.getKana())
                .furigana(request.getFurigana())
                .common(request.getCommon() != null && request.getCommon())
                .meanings(request.getMeanings())
                .senses(request.getSerializedSenses())
                .partOfSpeech(request.getPartOfSpeech())
                .pitchAccentData(pitchAccentJson)
                .audioUrl(request.getAudioUrl())
                .kanjiComponents(request.getKanjiComponents())
                .strokeCount(request.getStrokeCount())
                .jlptLevel(request.getJlptLevel())
                .onyomi(request.getOnyomi())
                .kunyomi(request.getKunyomi())
                .grade(request.getGrade())
                .radical(request.getRadical())
                .chinese(request.getChinese())
                .koreanR(request.getKoreanR())
                .koreanH(request.getKoreanH())
                .nextReviewDate(OffsetDateTime.now())
                .build();

        flashcard = flashcardRepository.save(flashcard);

        List<ExampleResponse> savedExamples;
        if (request.getPreGeneratedExamples() != null && !request.getPreGeneratedExamples().isEmpty()) {
            // Phase 3B: persist pre-generated examples immediately — no second AI call
            final Flashcard saved = flashcard;
            List<com.trandnquang.j_brain.domain.entity.FlashcardExample> entities = request.getPreGeneratedExamples()
                    .stream()
                    .map(e -> com.trandnquang.j_brain.domain.entity.FlashcardExample.builder()
                            .flashcard(saved)
                            .contextStyle(e.contextStyle())
                            .japaneseSentence(e.japaneseSentence())
                            .furiganaSentence(e.furiganaSentence())
                            .vietnameseTranslation(e.vietnameseTranslation())
                            .build())
                    .collect(java.util.stream.Collectors.toList());
            exampleRepository.saveAll(entities);
            savedExamples = request.getPreGeneratedExamples();
        } else {
            // Fallback: async AI generation (fire-and-forget)
            aiGenerationService.generateAndSaveExamplesAsync(flashcard);
            savedExamples = Collections.emptyList();
        }

        return toFlashcardResponse(flashcard, savedExamples);
    }

    // =========================================================================
    // QUERIES
    // =========================================================================

    /**
     * Returns all flashcards in a deck with their examples.
     *
     * @param userEmail JWT principal email.
     * @param deckId    Target deck UUID.
     * @return List of {@link FlashcardResponse} ordered by creation timestamp.
     */
    @Transactional(readOnly = true)
    public List<FlashcardResponse> getFlashcardsByDeckId(String userEmail, UUID deckId) {
        deckService.loadAndAssertOwnership(deckId, userEmail);

        return flashcardRepository.findByDeckId(deckId)
                .stream()
                .map(f -> toFlashcardResponse(f, mapExamples(f)))
                .toList();
    }

    /**
     * Returns cards due for review today for the given deck.
     * Uses the partial index {@code idx_flashcards_due_date} for efficient
     * querying.
     *
     * @param userEmail JWT principal email.
     * @param deckId    Target deck UUID.
     * @return List of {@link ReviewCardResponse} — at most one per flashcard.
     */
    @Transactional(readOnly = true)
    public List<ReviewCardResponse> getDueCards(String userEmail, UUID deckId) {
        deckService.loadAndAssertOwnership(deckId, userEmail);

        return flashcardRepository.findByDeckIdAndNextReviewDateBefore(deckId, OffsetDateTime.now())
                .stream()
                .map(f -> new ReviewCardResponse(
                        f.getId(),
                        f.getCardType(),
                        f.getKeyword(),
                        f.getFurigana(),
                        f.getMeanings(),
                        f.getAudioUrl(),
                        mapExamples(f)))
                .toList();
    }

    // =========================================================================
    // SM-2 REVIEW PROCESSING
    // =========================================================================

    /**
     * Applies the SM-2 algorithm to a flashcard grade submission.
     *
     * <p>
     * IMPORTANT: Pre-mutation snapshot of interval/ease is captured BEFORE
     * the entity is mutated so the {@link ReviewLog} records the true previous
     * values. The previous implementation had a capture-after-mutation bug.
     *
     * @param userEmail JWT principal email.
     * @param request   Validated review submission with flashcardId and grade
     *                  (1–4).
     * @return {@link ReviewResultResponse} with new interval and next review date.
     */
    @Transactional
    public ReviewResultResponse processReview(String userEmail, SubmitReviewRequest request) {
        Flashcard flashcard = flashcardRepository.findById(request.flashcardId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Flashcard not found: " + request.flashcardId()));

        if (!flashcard.getDeck().getUser().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("Flashcard does not belong to user " + userEmail);
        }

        // Capture BEFORE snapshot — this is the bug fix vs. the previous implementation
        int previousInterval = flashcard.getIntervalDays();
        double previousEase = flashcard.getEaseFactor();

        Sm2Result result = sm2EngineService.calculateNextReview(
                request.grade(),
                flashcard.getRepetition(),
                previousInterval,
                previousEase);

        // Mutate SM-2 state on the entity
        flashcard.setRepetition(result.getRepetition());
        flashcard.setIntervalDays(result.getIntervalDays());
        flashcard.setEaseFactor(result.getEaseFactor());

        OffsetDateTime nextReview = OffsetDateTime.now().plusDays(result.getIntervalDays());
        flashcard.setNextReviewDate(nextReview);

        // Update learning status based on repetition milestones
        if (result.getRepetition() == 0) {
            flashcard.setStatus("LEARNING");
        } else if (result.getRepetition() >= 4) {
            flashcard.setStatus("GRADUATED");
        } else {
            flashcard.setStatus("REVIEW");
        }

        flashcardRepository.save(flashcard);

        // Immutable audit record — uses the pre-mutation snapshot
        reviewLogRepository.save(ReviewLog.builder()
                .flashcard(flashcard)
                .grade(request.grade())
                .previousInterval(previousInterval)
                .newInterval(result.getIntervalDays())
                .previousEase(previousEase)
                .newEase(result.getEaseFactor())
                .build());

        log.debug("Review processed: Flashcard [{}] grade={} → interval={}d ease={}",
                flashcard.getId(), request.grade(), result.getIntervalDays(), result.getEaseFactor());

        return new ReviewResultResponse(
                flashcard.getId(),
                result.getIntervalDays(),
                nextReview.toZonedDateTime());
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private String serializePitchAccent(CreateFlashcardRequest request) {
        if (request.getSerializedPitchAccent() == null)
            return null;
        // Already a JSON string — passed through as-is
        return request.getSerializedPitchAccent();
    }

    private List<ExampleResponse> mapExamples(Flashcard f) {
        if (f.getExamples() == null)
            return Collections.emptyList();
        return f.getExamples().stream()
                .map(e -> new ExampleResponse(
                        e.getId(),
                        e.getContextStyle(),
                        e.getJapaneseSentence(),
                        e.getFuriganaSentence(),
                        e.getVietnameseTranslation()))
                .toList();
    }

    private FlashcardResponse toFlashcardResponse(Flashcard f, List<ExampleResponse> examples) {
        return new FlashcardResponse(
                f.getId(),
                f.getDeck().getId(),
                f.getCardType(),
                f.getKeyword(),
                f.getFurigana(),
                f.getMeanings(),
                examples);
    }
}
