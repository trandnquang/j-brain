package com.trandnquang.j_brain.dto.response;

import java.util.List;

/**
 * One sense group from a Jotoba word entry.
 *
 * <p>
 * WHY: Jotoba groups glosses that share the same grammatical classification
 * into one sense. Preserving this grouping on the frontend lets us display
 * numbered meanings correctly (e.g. "1. to run 2. to drive; to travel") with
 * their respective POS labels — rather than a flat undifferentiated gloss list.
 */
public record SenseDTO(
        /** Human-readable gloss strings (e.g. ["to run", "to dash"]) */
        List<String> glosses,

        /**
         * Flattened, human-readable part-of-speech labels.
         * WHY: Jotoba returns POS as a deeply nested union type
         * (e.g. {"Verb":{"Godan":"Ru"}}). The backend flattens this
         * to ["Godan verb - ru ending", "Intransitive"] so the frontend
         * never needs to know about the union structure.
         */
        List<String> pos,

        /**
         * Misc usage notes (e.g. ["Usually written in kana", "Colloquialism"]).
         * Displayed as small tags below the gloss.
         */
        List<String> misc) {
}
