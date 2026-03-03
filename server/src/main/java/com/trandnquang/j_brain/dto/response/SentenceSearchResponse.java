package com.trandnquang.j_brain.dto.response;

import java.util.List;

/** Response envelope for proxied Tatoeba sentence results. */
public record SentenceSearchResponse(List<SentenceDTO> sentences) {
}
