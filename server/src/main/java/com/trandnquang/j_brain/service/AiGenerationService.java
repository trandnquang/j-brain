package com.trandnquang.j_brain.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trandnquang.j_brain.domain.entity.Flashcard;
import com.trandnquang.j_brain.domain.entity.FlashcardExample;
import com.trandnquang.j_brain.domain.repository.FlashcardExampleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Orchestrates AI-powered Japanese example sentence generation via LM Studio.
 *
 * <p>
 * WHY: Running generation {@link Async} decouples the LLM's latency
 * (typically 5–30 s on a local model) from the flashcard creation HTTP
 * response, giving the user instant feedback while examples are persisted
 * in the background. The JSON-schema contract in the system prompt enforces
 * deterministic, parse-safe LLM output without relying on fragile
 * post-processing heuristics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiGenerationService {

    private final ChatClient chatClient;
    private final FlashcardExampleRepository exampleRepository;
    private final ObjectMapper objectMapper;

    /**
     * System prompt engineers the LLM output format.
     *
     * WHY SYSTEM: Keeping the structural contract in the system role prevents
     * the model from "forgetting" the format when the user prompt is long.
     * The assistant role is deliberately left empty to avoid biasing the first
     * token.
     */
    private static final String SYSTEM_PROMPT = """
            You are a Japanese language expert. Your ONLY output must be a valid JSON array — no markdown fences, no explanation, nothing else.

            JSON schema (exactly 3 objects, one per style):
            [
              {
                "contextStyle": "Keigo",
                "japaneseSentence": "<formal sentence using the word>",
                "furiganaSentence": "<same sentence with inline furigana, e.g. [漢字|かんじ]>",
                "vietnameseTranslation": "<accurate Vietnamese translation>"
              },
              {
                "contextStyle": "Daily",
                "japaneseSentence": "...",
                "furiganaSentence": "...",
                "vietnameseTranslation": "..."
              },
              {
                "contextStyle": "Anime",
                "japaneseSentence": "...",
                "furiganaSentence": "...",
                "vietnameseTranslation": "..."
              }
            ]
            """;

    // A record used only for JSON deserialization of LLM output
    private record AiSentenceDto(
            String contextStyle,
            String japaneseSentence,
            String furiganaSentence,
            String vietnameseTranslation) {
    }

    /**
     * Generates and persists 3 context-specific example sentences for a flashcard.
     * Runs on the async executor thread pool; callers receive no return value.
     *
     * @param flashcard The persisted {@link Flashcard} entity whose examples will
     *                  be generated.
     *                  Must have a non-null {@code id} (i.e., already saved to DB).
     */
    @Async
    @Transactional
    public void generateAndSaveExamplesAsync(Flashcard flashcard) {
        log.info("AI generation started for Flashcard [{}] keyword='{}'",
                flashcard.getId(), flashcard.getKeyword());

        try {
            String userPrompt = buildUserPrompt(flashcard);

            String rawResponse = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(userPrompt)
                    .call()
                    .content();

            // Defensive strip: remove markdown fences if model ignores the system prompt
            String cleanJson = stripMarkdownFences(rawResponse);

            List<AiSentenceDto> parsed = objectMapper.readValue(cleanJson, new TypeReference<>() {
            });

            if (parsed.size() != 3) {
                log.warn("AI returned {} sentences instead of 3 for Flashcard [{}] — saving anyway",
                        parsed.size(), flashcard.getId());
            }

            List<FlashcardExample> entities = parsed.stream()
                    .map(dto -> FlashcardExample.builder()
                            .flashcard(flashcard)
                            .contextStyle(dto.contextStyle())
                            .japaneseSentence(dto.japaneseSentence())
                            .furiganaSentence(dto.furiganaSentence())
                            .vietnameseTranslation(dto.vietnameseTranslation())
                            .build())
                    .collect(Collectors.toList());

            exampleRepository.saveAll(entities);
            log.info("Persisted {} AI examples for Flashcard [{}]", entities.size(), flashcard.getId());

        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.error("AI returned malformed JSON for Flashcard [{}]: {}",
                    flashcard.getId(), e.getMessage());
        } catch (Exception e) {
            log.error("AI generation pipeline failed for Flashcard [{}]", flashcard.getId(), e);
        }
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Constructs the user-turn prompt with contextual word data.
     * WHY: Including meanings prevents the LLM from guessing the target sense
     * when a word is polysemous (e.g. 切る has 10+ meanings).
     */
    private String buildUserPrompt(Flashcard flashcard) {
        String meanings = String.join(", ", flashcard.getMeanings());
        return String.format(
                "Generate 3 example sentences for the Japanese word 「%s」.\n" +
                        "Core meanings: %s\n" +
                        "Follow the JSON schema exactly as specified.",
                flashcard.getKeyword(),
                meanings);
    }

    /**
     * Strips Markdown code fences ({@code ```json ... ```}) that some LLMs
     * inject despite explicit instructions not to.
     */
    private String stripMarkdownFences(String raw) {
        if (raw == null)
            return "[]";
        return raw.replaceAll("(?s)```[a-zA-Z]*\\s*", "").replaceAll("```", "").trim();
    }
}
