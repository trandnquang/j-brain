package com.trandnquang.j_brain.controller;

import com.trandnquang.j_brain.dto.request.GenerateExamplesRequest;
import com.trandnquang.j_brain.dto.response.ExampleResponse;
import com.trandnquang.j_brain.service.AiGenerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AiController — exposes the on-demand AI example generation endpoint.
 *
 * <p>
 * WHY: Per spec, AI generation fires ONLY when the user clicks a word card
 * to view its detail — not during list search. This endpoint is called
 * synchronously by the frontend drawer component; the 3 generated examples
 * are returned directly to the client for display before any Add-to-Deck
 * action.
 */
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI", description = "On-demand AI example sentence generation")
public class AiController {

    private final AiGenerationService aiGenerationService;

    /**
     * Generates 3 example sentences (Keigo, Daily, Anime) for a Japanese word.
     * Does NOT persist anything — examples are returned to the client and only
     * persisted if the user subsequently clicks "Add to Deck".
     *
     * @param request keyword + meanings list for LLM context
     * @return List of 3 {@link ExampleResponse} objects, or 204 if LM Studio is
     *         unreachable
     */
    @PostMapping("/examples")
    @Operation(summary = "Generate AI example sentences for a word (on-demand, non-persisting)")
    public ResponseEntity<List<ExampleResponse>> generateExamples(
            @Valid @RequestBody GenerateExamplesRequest request) {

        List<ExampleResponse> examples = aiGenerationService.generateOnDemand(
                request.keyword(), request.meanings());

        return examples.isEmpty()
                ? ResponseEntity.noContent().build()
                : ResponseEntity.ok(examples);
    }
}
