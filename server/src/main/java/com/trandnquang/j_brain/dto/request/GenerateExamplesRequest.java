package com.trandnquang.j_brain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * Request body for on-demand AI example generation.
 *
 * <p>
 * WHY: Per spec, AI generation only fires when the user opens a word detail
 * drawer — NOT during list search. This endpoint is called client-side the
 * moment
 * the drawer opens, completely decoupled from the Add-to-Deck action.
 */
public record GenerateExamplesRequest(
        /** Japanese keyword (kanji or kana form) */
        @NotBlank String keyword,

        /**
         * Flat meaning list for LLM context.
         * WHY: Providing meanings prevents the model from guessing the wrong sense
         * for polysemous words (e.g. 切る has 10+ translations — we pass the Jotoba
         * meanings so the model uses the correct semantic context).
         */
        @NotEmpty List<String> meanings) {
}
