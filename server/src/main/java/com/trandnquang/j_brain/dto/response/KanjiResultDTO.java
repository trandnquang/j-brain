package com.trandnquang.j_brain.dto.response;

import java.util.List;

/**
 * Full detail of a Kanji character retrieved from Jotoba.
 *
 * <p>
 * WHY: Exposes all Jotoba kanji fields including Phase 2 additions (radical,
 * grade, Chinese/Korean readings, parts) so the frontend Kanji Tab can render
 * the full detail view and stroke order animation without additional API calls.
 */
public record KanjiResultDTO(
        /** The kanji literal, e.g. "走" */
        String literal,

        /** English meaning list, e.g. ["run"] */
        List<String> meanings,

        /** On'yomi readings in katakana, e.g. ["ソウ"] */
        List<String> onyomi,

        /**
         * Kun'yomi readings in hiragana with okurigana dot notation,
         * e.g. ["はし.る"]. The frontend strips the dot for ruby display.
         */
        List<String> kunyomi,

        /** Number of strokes required to write this kanji */
        int strokeCount,

        /** JLPT level (1–5, null if not classified) */
        Integer jlptLevel,

        /** Joyo school grade (1–8, null if not in Joyo list) */
        Integer grade,

        /**
         * The primary radical for this kanji.
         * Null if Jotoba does not supply one.
         */
        String radical,

        /**
         * Kanji components (parts) that make up this character.
         * Each is clickable in the UI to navigate to its kanji detail.
         * e.g. "走" → ["走", "土"]
         */
        List<String> parts,

        /**
         * Visually similar kanji characters (from Jotoba similarity data).
         * May be null or empty.
         */
        List<String> similar,

        /**
         * Chinese pinyin readings, e.g. ["zou3"].
         * Null if Jotoba does not provide Chinese data for this character.
         */
        List<String> chinese,

        /**
         * Korean romanized (McCune-Reischauer) readings, e.g. ["ju"]
         */
        List<String> koreanRomaji,

        /**
         * Korean readings in Hangul script, e.g. ["주"]
         */
        List<String> koreanHangul) {
}
