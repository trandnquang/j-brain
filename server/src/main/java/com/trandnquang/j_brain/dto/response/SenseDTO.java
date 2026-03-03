package com.trandnquang.j_brain.dto.response;

import java.util.List;

/**
 * One sense group from a Jotoba word entry.
 *
 * <p>
 * WHY: Jotoba groups glosses that share the same grammatical classification
 * into one sense. Preserving this grouping on the frontend lets us display
 * numbered meanings correctly with their respective POS labels and contextual
 * tags (field, xref, information, misc).
 */
public record SenseDTO(
        /** Human-readable gloss strings (e.g. ["to run", "to dash"]) */
        List<String> glosses,

        /**
         * Flattened, human-readable part-of-speech labels.
         * WHY: Jotoba returns POS as a deeply nested union type
         * (e.g. {"Verb":{"Godan":"Ru"}}). The backend flattens this to
         * ["Godan verb - ru ending"] so the frontend never needs the union logic.
         */
        List<String> pos,

        /** Misc usage notes (e.g. ["Usually written in kana", "Colloquialism"]). */
        List<String> misc,

        /**
         * Domain/field restriction (e.g. "Buddhism", "Sumo", "Geography").
         * WHY: Jotoba's "field" key indicates a specialised register. Displayed
         * as "{field} term" tag below the gloss.
         */
        String field,

        /**
         * Cross-reference — word this sense points to (e.g. "同性").
         * WHY: Displayed as "See also {xref}" with a clickable trigger that
         * sets the search keyword, enabling seamless in-app navigation.
         */
        String xref,

        /**
         * Additional contextual note (e.g. "original meaning", "honorific form").
         * WHY: Jotoba's "information" key carries human-readable usage context
         * not captured in misc or pos labels.
         */
        String information) {
}
