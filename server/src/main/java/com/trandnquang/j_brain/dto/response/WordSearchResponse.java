package com.trandnquang.j_brain.dto.response;

import java.util.List;

/** Response envelope for Jotoba word search results. */
public record WordSearchResponse(List<WordResultDTO> words) {
}
