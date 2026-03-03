package com.trandnquang.j_brain.controller;

import com.trandnquang.j_brain.dto.response.WordResultDTO;
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
 * Swagger-annotated façade for the Jotoba word search endpoint.
 *
 * <p>
 * WHY: Keeps the primary {@link SearchController} clean by separating
 * OpenAPI documentation annotations that also require
 * {@code @SecurityRequirement}.
 * Phase 2: Updated return type to {@link WordResultDTO}.
 */
@RestController
@RequestMapping("/api/v1/dictionary")
@RequiredArgsConstructor
@Validated
@Tag(name = "Dictionary", description = "Swagger-annotated proxy for Jotoba word search")
public class DictionaryController {

    private final JotobaService jotobaService;

    @GetMapping("/search")
    @Operation(summary = "Search for a Japanese word via Jotoba", security = @SecurityRequirement(name = "bearerAuth"))
    public Mono<ResponseEntity<List<WordResultDTO>>> searchDictionary(
            @RequestParam @NotBlank String keyword) {

        return jotobaService.searchWords(keyword)
                .map(resp -> resp.words().isEmpty()
                        ? ResponseEntity.<List<WordResultDTO>>noContent().build()
                        : ResponseEntity.ok(resp.words()));
    }
}
