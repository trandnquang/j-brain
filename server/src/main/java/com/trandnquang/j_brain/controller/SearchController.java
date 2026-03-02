package com.trandnquang.j_brain.controller;

import com.trandnquang.j_brain.dto.response.SearchResultDTO;
import com.trandnquang.j_brain.service.JotobaService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST façade over the Jotoba dictionary API.
 *
 * <p>
 * WHY: Exposing Jotoba search directly from the backend (rather than
 * calling it from the frontend) lets us: (a) add auth guards on expensive
 * endpoints, (b) enrich/filter the upstream response before it hits the client,
 * and (c) reuse the same data for flashcard creation in
 * {@code FlashcardService}
 * without a second HTTP round-trip from the browser.
 */
@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Validated
public class SearchController {

    private final JotobaService jotobaService;

    /**
     * Search the Jotoba word dictionary.
     *
     * @param keyword Any Japanese (Kana/Kanji/Romaji) or English search term.
     * @return 200 with a list of matched word DTOs, or 204 if no results.
     */
    @GetMapping("/words")
    public ResponseEntity<List<SearchResultDTO>> searchWords(
            @RequestParam @NotBlank String keyword) {

        List<SearchResultDTO> results = jotobaService.searchWords(keyword).block();

        if (results == null || results.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(results);
    }

    /**
     * Search the Jotoba kanji dictionary.
     *
     * @param keyword A kanji character or related search term.
     * @return 200 with a list of matched kanji DTOs, or 204 if no results.
     */
    @GetMapping("/kanji")
    public ResponseEntity<List<SearchResultDTO>> searchKanji(
            @RequestParam @NotBlank String keyword) {

        List<SearchResultDTO> results = jotobaService.searchKanji(keyword).block();

        if (results == null || results.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(results);
    }
}