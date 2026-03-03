package com.trandnquang.j_brain.dto.response;

/**
 * One example sentence sourced via the Tatoeba proxy endpoint.
 *
 * <p>
 * WHY: Tatoeba is called from the Spring Boot backend (never from the browser)
 * to satisfy the CORS & Rate Limit Protection constraint in the spec. The
 * frontend
 * only ever touches this typed DTO — it has no knowledge of the upstream
 * Tatoeba
 * API schema.
 *
 * <p>
 * Note: {@code furigana} may be null if Tatoeba does not provide a reading
 * annotation for a given sentence.
 */
public record SentenceDTO(
        /** Tatoeba sentence ID for stable linking */
        long id,

        /** The Japanese sentence text */
        String japanese,

        /**
         * Bracket-format furigana for the sentence, or null.
         * The frontend renders this as ruby text above kanji where present.
         */
        String furigana,

        /** English translation for display below the Japanese sentence */
        String english) {
}
