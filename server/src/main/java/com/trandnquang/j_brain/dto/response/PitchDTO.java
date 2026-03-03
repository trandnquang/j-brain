package com.trandnquang.j_brain.dto.response;

/**
 * One mora in a Japanese pitch accent pattern.
 *
 * <p>
 * WHY: Pitch accent is visualized as a connected SVG path on the frontend.
 * The backend splits the Jotoba pitch array into individual character parts
 * with their high/low boolean so the React SVG component only needs to
 * iterate and draw — no parsing required client-side.
 *
 * <p>
 * Constraint from spec: text displayed beneath the SVG path MUST be kana,
 * never romaji or kanji. The {@code part} field is guaranteed to be kana-only
 * because it comes directly from Jotoba's pitch accent data.
 */
public record PitchDTO(
        /** Kana mora text (e.g. "は", "し", "る") */
        String part,
        /** true = high pitch, false = low pitch */
        boolean high) {
}
