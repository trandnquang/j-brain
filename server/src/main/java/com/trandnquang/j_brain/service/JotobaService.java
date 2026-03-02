package com.trandnquang.j_brain.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.trandnquang.j_brain.dto.request.JotobaSearchRequest;
import com.trandnquang.j_brain.dto.response.SearchResultDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.StreamSupport;

/**
 * Non-blocking gateway to the Jotoba Japanese Dictionary API.
 *
 * <p>
 * WHY: Every method returns a {@link Mono} so callers can compose them
 * into reactive pipelines (e.g. zip with AI generation) without ever blocking
 * a Tomcat/Netty thread. The raw JSON is eagerly mapped into typed
 * {@link SearchResultDTO} objects here, keeping controllers and services
 * free from Jackson tree-walking logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JotobaService {

    private final WebClient jotobaWebClient;

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Searches the Jotoba word dictionary for the given term.
     * Supports Romaji, Kana, Kanji, and English input as per Jotoba spec.
     *
     * @param keyword The search term.
     * @return A {@link Mono} of {@link SearchResultDTO} list mapped from the
     *         top-ranked word match, or empty if no results are found.
     */
    public Mono<List<SearchResultDTO>> searchWords(String keyword) {
        JotobaSearchRequest requestBody = new JotobaSearchRequest(keyword, "English", false);

        return jotobaWebClient.post()
                .uri("/search/words")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(this::mapWordsResponse)
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Jotoba /search/words HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.just(Collections.emptyList());
                })
                .onErrorResume(ex -> {
                    log.error("Jotoba /search/words connection error: {}", ex.getMessage());
                    return Mono.just(Collections.emptyList());
                });
    }

    /**
     * Searches the Jotoba kanji dictionary for the given character or term.
     *
     * @param keyword A kanji literal or search term.
     * @return A {@link Mono} of {@link SearchResultDTO} list mapped from kanji
     *         results.
     */
    public Mono<List<SearchResultDTO>> searchKanji(String keyword) {
        JotobaSearchRequest requestBody = new JotobaSearchRequest(keyword, "English", false);

        return jotobaWebClient.post()
                .uri("/search/kanji")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(this::mapKanjiResponse)
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Jotoba /search/kanji HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.just(Collections.emptyList());
                })
                .onErrorResume(ex -> {
                    log.error("Jotoba /search/kanji connection error: {}", ex.getMessage());
                    return Mono.just(Collections.emptyList());
                });
    }

    /**
     * Retrieves native example sentences from Jotoba for contextualized reading.
     * These sentences are stored as {@code context_style = 'Jotoba_Native'}.
     *
     * @param keyword The word to find example sentences for.
     * @return A {@link Mono} of raw JsonNode (sentence list) for downstream
     *         processing.
     */
    public Mono<JsonNode> searchSentences(String keyword) {
        JotobaSearchRequest requestBody = new JotobaSearchRequest(keyword, "English", false);

        return jotobaWebClient.post()
                .uri("/search/sentences")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Jotoba /search/sentences HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.empty();
                })
                .onErrorResume(ex -> {
                    log.error("Jotoba /search/sentences error: {}", ex.getMessage());
                    return Mono.empty();
                });
    }

    // =========================================================================
    // PRIVATE MAPPING — raw JsonNode → typed SearchResultDTO
    // =========================================================================

    /**
     * Maps the Jotoba {@code /search/words} JSON response to a list of typed DTOs.
     * Each word entry becomes one {@link SearchResultDTO} with card_type = 'WORD'.
     */
    private List<SearchResultDTO> mapWordsResponse(JsonNode root) {
        JsonNode wordsNode = root.path("words");
        if (wordsNode.isMissingNode() || !wordsNode.isArray()) {
            return Collections.emptyList();
        }

        List<SearchResultDTO> results = new ArrayList<>();
        for (JsonNode word : wordsNode) {
            JsonNode reading = word.path("reading");

            // keyword is the kanji form if present, falls back to kana
            String keyword = reading.path("kanji").asText(null);
            if (keyword == null || keyword.isBlank()) {
                keyword = reading.path("kana").asText("");
            }

            String furigana = reading.path("furigana").asText(null);
            String audioUrl = word.path("audio").asText(null);

            // Collect meanings from all senses, for English glosses only
            List<String> meanings = new ArrayList<>();
            List<String> partOfSpeech = new ArrayList<>();
            JsonNode senses = word.path("senses");
            if (senses.isArray()) {
                for (JsonNode sense : senses) {
                    sense.path("glosses").forEach(g -> meanings.add(g.asText()));
                    sense.path("pos").forEach(p -> partOfSpeech.add(p.asText()));
                }
            }

            // Pitch accent — stored as a raw list of {part, high} maps
            List<Map<String, Object>> pitchData = new ArrayList<>();
            JsonNode pitchArray = word.path("pitch");
            if (pitchArray.isArray()) {
                for (JsonNode p : pitchArray) {
                    pitchData.add(Map.of(
                            "part", p.path("part").asText(""),
                            "high", p.path("high").asBoolean(false)));
                }
            }

            results.add(new SearchResultDTO(
                    "WORD",
                    keyword,
                    furigana,
                    meanings,
                    partOfSpeech,
                    pitchData,
                    audioUrl,
                    null, null, null, null // Kanji-specific fields unused for words
            ));
        }
        return results;
    }

    /**
     * Maps the Jotoba {@code /search/kanji} JSON response to a list of typed DTOs.
     * Each kanji entry becomes one {@link SearchResultDTO} with card_type =
     * 'KANJI'.
     */
    private List<SearchResultDTO> mapKanjiResponse(JsonNode root) {
        JsonNode kanjiArray = root.path("kanji");
        if (kanjiArray.isMissingNode() || !kanjiArray.isArray()) {
            return Collections.emptyList();
        }

        List<SearchResultDTO> results = new ArrayList<>();
        for (JsonNode kanji : kanjiArray) {
            String literal = kanji.path("literal").asText("");
            int strokeCount = kanji.path("stroke_count").asInt(0);
            int jlptLevel = kanji.path("jlpt").asInt(0);

            List<String> meanings = StreamSupport
                    .stream(kanji.path("meanings").spliterator(), false)
                    .map(JsonNode::asText)
                    .toList();

            List<String> onyomi = StreamSupport
                    .stream(kanji.path("onyomi").spliterator(), false)
                    .map(JsonNode::asText)
                    .toList();

            List<String> kunyomi = StreamSupport
                    .stream(kanji.path("kunyomi").spliterator(), false)
                    .map(JsonNode::asText)
                    .toList();

            results.add(new SearchResultDTO(
                    "KANJI",
                    literal,
                    null, // kanji has no furigana
                    meanings,
                    null, null, null, // word-specific unused
                    strokeCount == 0 ? null : strokeCount,
                    jlptLevel == 0 ? null : jlptLevel,
                    onyomi,
                    kunyomi));
        }
        return results;
    }
}
