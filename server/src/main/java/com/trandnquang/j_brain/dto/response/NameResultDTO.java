package com.trandnquang.j_brain.dto.response;

import java.util.List;

/**
 * One name entry from the Jotoba names endpoint.
 *
 * <p>
 * WHY: Name data has a different shape from word/kanji data — it has a
 * transcription (Romaji) and name_type classification instead of senses.
 * Keeping it as a dedicated DTO prevents the frontend from having to
 * conditionally branch on nullable fields from a polymorphic response.
 */
public record NameResultDTO(
        /**
         * Kanji/mixed-script form of the name, e.g. "田中".
         * May be null for kana-only names.
         */
        String kanji,

        /** Kana reading of the name, e.g. "たなか" */
        String kana,

        /** Romanized form (Hepburn), e.g. "Tanaka" */
        String transcription,

        /**
         * Classification tags for the name, e.g. ["Surname", "Place", "Person"].
         * Drives the display in the Names Tab origin column.
         */
        List<String> nameType) {
}
