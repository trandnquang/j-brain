package com.trandnquang.j_brain.controller;

import com.trandnquang.j_brain.dto.response.*;
import com.trandnquang.j_brain.service.JotobaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * SearchController — REST proxy layer over JotobaService.
 *
 * <p>
 * WHY: All four search modes (words, kanji, sentences, names) are routed
 * through this backend so the browser never has direct access to Jotoba or
 * Tatoeba (CORS + rate-limit protection per spec).
 *
 * <p>
 * WHY always 200: React Query requires query functions to return a
 * non-undefined
 * value. Returning 204 No Content causes the frontend fetch wrapper to return
 * undefined, which React Query rejects at runtime. Always returning 200 + []
 * is the correct contract for search endpoints.
 */
@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Validated
@Tag(name = "Search", description = "Dictionary search across all four Jotoba modes")
public class SearchController {

    private final JotobaService jotobaService;

    @GetMapping("/words")
    @Operation(summary = "Search words/vocabulary (Jotoba)")
    public Mono<List<WordResultDTO>> searchWords(
            @RequestParam @NotBlank String keyword) {
        return jotobaService.searchWords(keyword).map(WordSearchResponse::words);
    }

    @GetMapping("/kanji")
    @Operation(summary = "Search kanji characters (Jotoba)")
    public Mono<List<KanjiResultDTO>> searchKanji(
            @RequestParam @NotBlank String keyword) {
        return jotobaService.searchKanji(keyword).map(KanjiSearchResponse::kanji);
    }

    @GetMapping("/sentences")
    @Operation(summary = "Search example sentences (Tatoeba proxy via Jotoba)")
    public Mono<List<SentenceDTO>> searchSentences(
            @RequestParam @NotBlank String keyword) {
        return jotobaService.searchSentences(keyword).map(SentenceSearchResponse::sentences);
    }

    @GetMapping("/names")
    @Operation(summary = "Search Japanese names (Jotoba)")
    public Mono<List<NameResultDTO>> searchNames(
            @RequestParam @NotBlank String keyword) {
        return jotobaService.searchNames(keyword).map(NameSearchResponse::names);
    }
}