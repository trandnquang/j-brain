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

    /**
     * GET /api/v1/search/suggestions?input=...
     * WHY: Browser cannot call Jotoba directly (CORS + rate-limit policy).
     * This backend proxy fetches up to 10 suggestions and formats each item
     * as "secondary (primary)" when both fields are present, or just "primary".
     */
    @GetMapping("/suggestions")
    @Operation(summary = "Fetch search suggestions (Jotoba autocomplete proxy)")
    public Mono<List<String>> suggestions(
            @RequestParam @NotBlank String input,
            @RequestParam(defaultValue = "0") int searchType) {
        return jotobaService.fetchSuggestions(input, searchType);
    }

    /**
     * GET /api/v1/search/by-radical?radicals=一,丿&language=English
     * WHY: GET (not POST) so React Query can cache results by the radical combo
     * key.
     * Radicals are comma-delimited to keep the URL cacheable without a request
     * body.
     */
    @GetMapping("/by-radical")
    @Operation(summary = "Search kanji by radical combination (Jotoba by_radical proxy)")
    public Mono<RadicalSearchResponse> searchByRadical(
            @RequestParam List<String> radicals,
            @RequestParam(defaultValue = "English") String language) {
        return jotobaService.searchByRadical(radicals, language);
    }

    @GetMapping("/words")
    @Operation(summary = "Search words/vocabulary (Jotoba)")
    public Mono<List<WordResultDTO>> searchWords(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "English") String language) {
        return jotobaService.searchWords(keyword, language).map(WordSearchResponse::words);
    }

    @GetMapping("/kanji")
    @Operation(summary = "Search kanji characters (Jotoba)")
    public Mono<List<KanjiResultDTO>> searchKanji(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "English") String language) {
        return jotobaService.searchKanji(keyword, language).map(KanjiSearchResponse::kanji);
    }

    @GetMapping("/sentences")
    @Operation(summary = "Search example sentences (Tatoeba proxy via Jotoba)")
    public Mono<List<SentenceDTO>> searchSentences(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "English") String language) {
        return jotobaService.searchSentences(keyword, language).map(SentenceSearchResponse::sentences);
    }

    @GetMapping("/names")
    @Operation(summary = "Search Japanese names (Jotoba)")
    public Mono<List<NameResultDTO>> searchNames(
            @RequestParam @NotBlank String keyword,
            @RequestParam(defaultValue = "English") String language) {
        return jotobaService.searchNames(keyword, language).map(NameSearchResponse::names);
    }
}