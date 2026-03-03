package com.trandnquang.j_brain.dto.response;

import java.util.List;

/**
 * Full detail for one Japanese word result returned by the Jotoba API.
 *
 * <p>
 * WHY: This DTO replaces the old {@code SearchResultDTO} for word results.
 * It preserves the structured sense grouping (see {@link SenseDTO}) which the
 * flat {@code List<String> meanings} lost. The backend is responsible for
 * all JSON extraction, POS flattening, kanji-component extraction, and furigana
 * parsing — the frontend receives a ready-to-render payload.
 */
public record WordResultDTO(
        /**
         * Kanji/mixed-script form of the word (e.g. "走る").
         * Null if the word has no kanji representation (kana-only words).
         */
        String keyword,

        /** Pure kana reading, always present (e.g. "はしる") */
        String kana,

        /**
         * Jotoba bracket furigana, e.g. "[走|はし]る".
         * The frontend uses this to render ruby text above kanji characters.
         * Null for kana-only words.
         */
        String furigana,

        /**
         * True if this word appears in Jotoba's common vocabulary lists.
         * Drives the green "C" badge on the word card.
         */
        boolean common,

        /**
         * Structured sense groups from Jotoba.
         * Each element represents one numbered meaning entry with glosses,
         * POS labels, and misc tags.
         */
        List<SenseDTO> senses,

        /**
         * Pitch accent mora sequence, guaranteed kana-only text.
         * Frontend renders these as an SVG connected-dot diagram.
         */
        List<PitchDTO> pitch,

        /**
         * Relative URL to the Jotoba .ogg pronunciation file.
         * Full URL = "https://jotoba.de" + audioUrl
         */
        String audioUrl,

        /**
         * Individual kanji characters extracted from the keyword.
         * WHY: Each character becomes a clickable button that dispatches a
         * kanji search. Extraction is done server-side to keep the frontend
         * free of Unicode character-class logic.
         * Example: "有難う" → ["有", "難"]
         */
        List<String> kanjiComponents) {
}
