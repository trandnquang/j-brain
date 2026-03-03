package com.trandnquang.j_brain.dto.response;

import java.util.List;

/** Response envelope for Jotoba kanji search results. */
public record KanjiSearchResponse(List<KanjiResultDTO> kanji) {
}
