package com.trandnquang.j_brain.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trandnquang.j_brain.domain.entity.Flashcard;
import com.trandnquang.j_brain.domain.entity.FlashcardExample;
import com.trandnquang.j_brain.domain.repository.FlashcardExampleRepository;
import com.trandnquang.j_brain.dto.response.ExampleResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Orchestrates AI-powered Japanese example sentence generation via LM Studio.
 *
 * <p>
 * WHY: Two distinct generation paths:
 * <ol>
 * <li>{@link #generateOnDemand} — synchronous, returns {@link ExampleResponse}
 * list without persisting. Called when the user opens a word detail drawer
 * (spec: AI triggered only on detail view, not during list search).</li>
 * <li>{@link #generateAndSaveExamplesAsync} — fire-and-forget, persists
 * examples
 * for a saved {@link Flashcard}. Fallback when examples were NOT
 * pre-generated.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiGenerationService {

    private final ChatClient chatClient;
    private final FlashcardExampleRepository exampleRepository;
    private final ObjectMapper objectMapper;

    private static final String SYSTEM_PROMPT = """
            You are a strict Japanese language teacher. You MUST follow ALL rules below without exception.

            OUTPUT RULES — violating any rule makes your entire response invalid:
            1. Output ONLY a valid JSON array. No markdown fences, no explanation, no extra text before or after.
            2. The array contains EXACTLY 3 objects with keys: contextStyle, japaneseSentence, furiganaSentence, vietnameseTranslation.
            3. contextStyle values MUST be exactly: "Keigo", "Daily", "Anime" (in that order).
            4. japaneseSentence MUST be pure Japanese script (Kanji/Hiragana/Katakana/punctuation only). NO romaji, NO English.
            5. The target Japanese word MUST appear verbatim in every japaneseSentence.
            6. furiganaSentence MUST add [漢字|かな] bracket notation for every kanji group. Plain kana stays as-is.
            7. vietnameseTranslation must be a natural, accurate Vietnamese translation of the japaneseSentence.
            8. Each sentence must be natural, grammatically correct Japanese for its register (formal/casual/anime).

            ONE-SHOT EXAMPLE for the word 食べる (meanings: to eat):
            [{"contextStyle":"Keigo","japaneseSentence":"お客様は何を食べますか？","furiganaSentence":"お[客様|きゃくさま]は[何|なに]を[食|た]べますか？","vietnameseTranslation":"Quý khách muốn dùng gì ạ?"},{"contextStyle":"Daily","japaneseSentence":"今日の夜は何を食べる？","furiganaSentence":"[今日|きょう]の[夜|よる]は[何|なに]を[食|た]べる？","vietnameseTranslation":"Tối nay ăn gì vậy?"},{"contextStyle":"Anime","japaneseSentence":"うわ、この料理めちゃくちゃうまい！また食べたい！","furiganaSentence":"うわ、この[料理|りょうり]めちゃくちゃうまい！また[食|た]べたい！","vietnameseTranslation":"Trời ơi, món này ngon quá! Muốn ăn mãi!"}]

            Now generate for the requested word. Output ONLY the JSON array.
            """;

    private record AiSentenceDto(
            String contextStyle,
            String japaneseSentence,
            String furiganaSentence,
            String vietnameseTranslation) {
    }

    // =========================================================================
    // ON-DEMAND (synchronous, non-persisting)
    // =========================================================================

    /**
     * Generates 3 AI example sentences for a word without persisting them.
     *
     * @param keyword  Japanese keyword (kanji or kana form)
     * @param meanings Flat meaning list for LLM context
     * @return List of 3 ExampleResponse (Keigo, Daily, Anime), or empty on AI error
     */
    public List<ExampleResponse> generateOnDemand(String keyword, List<String> meanings) {
        log.info("On-demand AI generation for keyword='{}'", keyword);
        try {
            List<AiSentenceDto> parsed = parse(
                    chatClient.prompt()
                            .system(SYSTEM_PROMPT)
                            .user(buildUserPrompt(keyword, meanings))
                            .call()
                            .content());

            return parsed.stream()
                    .map(dto -> new ExampleResponse(
                            null,
                            dto.contextStyle(),
                            dto.japaneseSentence(),
                            dto.furiganaSentence(),
                            dto.vietnameseTranslation()))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("On-demand AI generation failed for keyword='{}': {}", keyword, e.getMessage());
            return Collections.emptyList();
        }
    }

    // =========================================================================
    // ASYNC SAVE (fire-and-forget, persists to DB)
    // =========================================================================

    /**
     * Generates and persists 3 example sentences for an already-saved flashcard.
     * Fallback path — used only when examples were NOT pre-generated in the drawer.
     *
     * @param flashcard Persisted entity with non-null id.
     */
    @Async
    @Transactional
    public void generateAndSaveExamplesAsync(Flashcard flashcard) {
        log.info("Async AI generation started for Flashcard [{}] keyword='{}'",
                flashcard.getId(), flashcard.getKeyword());
        try {
            List<AiSentenceDto> parsed = parse(
                    chatClient.prompt()
                            .system(SYSTEM_PROMPT)
                            .user(buildUserPrompt(flashcard.getKeyword(), flashcard.getMeanings()))
                            .call()
                            .content());

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
            log.error("Malformed JSON from AI for Flashcard [{}]: {}", flashcard.getId(), e.getMessage());
        } catch (Exception e) {
            log.error("AI generation pipeline failed for Flashcard [{}]", flashcard.getId(), e);
        }
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private String buildUserPrompt(String keyword, List<String> meanings) {
        String meaningsStr = meanings != null ? String.join(", ", meanings) : "";
        return String.format(
                "Generate 3 example sentences for the Japanese word 「%s」.\nCore meanings: %s\nFollow the JSON schema exactly.",
                keyword, meaningsStr);
    }

    private List<AiSentenceDto> parse(String raw) throws com.fasterxml.jackson.core.JsonProcessingException {
        String clean = (raw == null) ? "[]"
                : raw.replaceAll("(?s)```[a-zA-Z]*\\s*", "").replaceAll("```", "").trim();
        return objectMapper.readValue(clean, new TypeReference<>() {
        });
    }
}
