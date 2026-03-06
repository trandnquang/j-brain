package com.trandnquang.j_brain.dto.response;

import java.util.List;

/**
 * Response from Jotoba's kanji-by-radical endpoint.
 *
 * <p>WHY: Jotoba returns both the matching kanji AND the set of radicals that
 * are still "valid" for the current selection. The frontend uses
 * {@code possibleRadicals} to visually disable incompatible radical buttons,
 * preventing users from building combinations that yield no kanji results.
 */
public record RadicalSearchResponse(
        /** Kanji entries matching the selected radical combination */
        List<KanjiResultDTO> kanji,

        /**
         * Radicals that can still be combined with the current selection
         * to get non-empty results. All others should be greyed out.
         */
        List<String> possibleRadicals) {
}
