package com.trandnquang.j_brain.controller;

import com.trandnquang.j_brain.dto.response.SearchResultDTO;
import com.trandnquang.j_brain.service.JotobaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Swagger-annotated façade for the Jotoba dictionary API.
 *
 * <p>
 * WHY: Separates OpenAPI documentation concerns (Swagger tags, security
 * requirement annotations) from the core {@link SearchController}, keeping
 * the primary controller clean. Both controllers delegate to the same
 * {@link JotobaService} — no business logic lives here.
 */
@RestController
@RequestMapping("/api/v1/dictionary")
@RequiredArgsConstructor
@Validated
@Tag(name = "Dictionary", description = "Proxy external calls to Jotoba Dictionary API")
public class DictionaryController {

    private final JotobaService jotobaService;

    /**
     * Non-blocking word search endpoint returning typed DTOs.
     *
     * @param keyword Any Japanese (Kana/Kanji/Romaji) or English search term.
     * @return {@code 200} with results list, {@code 204} if nothing found.
     */
    @GetMapping("/search")
    @Operation(summary = "Search for a Japanese word via Jotoba", security = @SecurityRequirement(name = "bearerAuth"))
    public Mono<ResponseEntity<List<SearchResultDTO>>> searchDictionary(
            @RequestParam @NotBlank String keyword) {

        return jotobaService.searchWords(keyword)
                .map(results -> results.isEmpty()
                        ? ResponseEntity.<List<SearchResultDTO>>noContent().build()
                        : ResponseEntity.ok(results));
    }
}
