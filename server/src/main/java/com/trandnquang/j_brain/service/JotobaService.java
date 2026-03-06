package com.trandnquang.j_brain.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.trandnquang.j_brain.dto.response.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * JotobaService — Non-blocking proxy to the Jotoba dictionary API.
 *
 * <p>
 * WHY: All third-party API calls MUST go through the backend (spec rule).
 * This service is the single source of truth for Jotoba data, and is
 * responsible for all JSON-to-DTO mapping including:
 * - POS union-type flattening (nested JSON enums → human-readable strings)
 * - Kanji component extraction from Unicode ranges
 * - Furigana bracket format preservation
 * - Tatoeba sentence proxy (never called from the browser)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JotobaService {

    private final WebClient jotobaWebClient;

    // Matches a single CJK Unified Ideograph — used for kanji extraction
    private static final Pattern KANJI_PATTERN = Pattern.compile("[\\u4E00-\\u9FFF\\u3400-\\u4DBF]");

    // =========================================================================
    // WORD SEARCH
    // =========================================================================

    /**
     * Searches Jotoba for word entries matching {@code keyword}.
     * Returns a fully mapped {@link WordSearchResponse} with structured senses,
     * pitch accent, furigana, common flag, audio URL, and kanji components.
     *
     * @param language Jotoba language code ("English" | "Vietnamese"), defaults to "English"
     */
    public Mono<WordSearchResponse> searchWords(String keyword, String language) {
        return jotobaWebClient.post()
                .uri("/search/words")
                .bodyValue(buildJotobaBody(keyword, language))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> {
                    List<WordResultDTO> words = new ArrayList<>();
                    JsonNode wordNodes = json.path("words");
                    if (wordNodes.isArray()) {
                        wordNodes.forEach(w -> words.add(mapWord(w)));
                    }
                    return new WordSearchResponse(words);
                })
                .onErrorResume(ex -> {
                    log.error("Jotoba word search failed for '{}': {}", keyword, ex.getMessage());
                    return Mono.just(new WordSearchResponse(Collections.emptyList()));
                });
    }

    /** Convenience overload — defaults to English. */
    public Mono<WordSearchResponse> searchWords(String keyword) {
        return searchWords(keyword, "English");
    }

    // =========================================================================
    // KANJI SEARCH
    // =========================================================================

    /**
     * Searches Jotoba for kanji entries matching {@code keyword}.
     */
    public Mono<KanjiSearchResponse> searchKanji(String keyword, String language) {
        return jotobaWebClient.post()
                .uri("/search/kanji")
                .bodyValue(buildJotobaBody(keyword, language))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> {
                    List<KanjiResultDTO> kanji = new ArrayList<>();
                    JsonNode nodes = json.path("kanji");
                    if (nodes.isArray()) {
                        nodes.forEach(k -> kanji.add(mapKanji(k)));
                    }
                    return new KanjiSearchResponse(kanji);
                })
                .onErrorResume(ex -> {
                    log.error("Jotoba kanji search failed for '{}': {}", keyword, ex.getMessage());
                    return Mono.just(new KanjiSearchResponse(Collections.emptyList()));
                });
    }

    public Mono<KanjiSearchResponse> searchKanji(String keyword) {
        return searchKanji(keyword, "English");
    }

    // =========================================================================
    // NAMES SEARCH
    // =========================================================================

    /**
     * Searches Jotoba for name entries matching {@code keyword}.
     */
    public Mono<NameSearchResponse> searchNames(String keyword, String language) {
        return jotobaWebClient.post()
                .uri("/search/names")
                .bodyValue(buildJotobaBody(keyword, language))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> {
                    List<NameResultDTO> names = new ArrayList<>();
                    JsonNode nodes = json.path("names");
                    if (nodes.isArray()) {
                        nodes.forEach(n -> names.add(mapName(n)));
                    }
                    return new NameSearchResponse(names);
                })
                .onErrorResume(ex -> {
                    log.error("Jotoba names search failed for '{}': {}", keyword, ex.getMessage());
                    return Mono.just(new NameSearchResponse(Collections.emptyList()));
                });
    }

    public Mono<NameSearchResponse> searchNames(String keyword) {
        return searchNames(keyword, "English");
    }

    // =========================================================================
    // SENTENCES SEARCH (Tatoeba proxy via Jotoba)
    // =========================================================================

    /**
     * Proxies a sentence search through Jotoba (which sources from Tatoeba).
     * WHY: The spec forbids direct browser-to-Tatoeba calls for CORS & rate
     * limit reasons. All sentence queries go through this backend proxy.
     */
    public Mono<SentenceSearchResponse> searchSentences(String keyword, String language) {
        return jotobaWebClient.post()
                .uri("/search/sentences")
                .bodyValue(buildJotobaBody(keyword, language))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> {
                    List<SentenceDTO> sentences = new ArrayList<>();
                    JsonNode nodes = json.path("sentences");
                    if (nodes.isArray()) {
                        nodes.forEach(s -> sentences.add(mapSentence(s)));
                    }
                    return new SentenceSearchResponse(sentences);
                })
                .onErrorResume(ex -> {
                    log.error("Sentence search failed for '{}': {}", keyword, ex.getMessage());
                    return Mono.just(new SentenceSearchResponse(Collections.emptyList()));
                });
    }

    public Mono<SentenceSearchResponse> searchSentences(String keyword) {
        return searchSentences(keyword, "English");
    }

    // =========================================================================
    // PRIVATE MAPPERS
    // =========================================================================

    private WordResultDTO mapWord(JsonNode w) {
        JsonNode reading = w.path("reading");
        String kanji = reading.path("kanji").asText(null);
        String kana = reading.path("kana").asText(null);
        String furigana = reading.path("furigana").asText(null);

        boolean common = w.path("common").asBoolean(false);
        String audioUrl = w.path("audio").asText(null);

        // Pitch accent
        List<PitchDTO> pitch = new ArrayList<>();
        w.path("pitch").forEach(p -> pitch.add(new PitchDTO(p.path("part").asText(), p.path("high").asBoolean())));

        // Structured senses
        List<SenseDTO> senses = new ArrayList<>();
        w.path("senses").forEach(s -> senses.add(mapSense(s)));

        // Keyword: prefer kanji form; fall back to kana
        String keyword = (kanji != null && !kanji.isBlank()) ? kanji : kana;

        // Extract kanji components from the keyword
        List<String> kanjiComponents = extractKanjiChars(keyword);

        return new WordResultDTO(keyword, kana, furigana, common, senses, pitch, audioUrl, kanjiComponents);
    }

    private SenseDTO mapSense(JsonNode s) {
        List<String> glosses = toStringList(s.path("glosses"));
        List<String> misc = resolveMisc(s.path("misc"));
        List<String> pos = resolvePos(s.path("pos"));
        // Contextual tags — null when absent so frontend skips them
        String field = s.has("field") && !s.path("field").isNull() ? s.path("field").asText(null) : null;
        String xref = s.has("xref") && !s.path("xref").isNull() ? s.path("xref").asText(null) : null;
        String info = s.has("information") && !s.path("information").isNull() ? s.path("information").asText(null)
                : null;
        return new SenseDTO(glosses, pos, misc, field, xref, info);
    }

    private KanjiResultDTO mapKanji(JsonNode k) {
        return new KanjiResultDTO(
                k.path("literal").asText(),
                toStringList(k.path("meanings")),
                toStringList(k.path("onyomi")),
                toStringList(k.path("kunyomi")),
                k.path("stroke_count").asInt(0),
                k.path("jlpt").isNull() ? null : k.path("jlpt").asInt(),
                k.path("grade").isNull() ? null : k.path("grade").asInt(),
                k.path("radical").asText(null),
                toStringList(k.path("parts")),
                toStringList(k.path("similar")),
                toStringList(k.path("chinese")),
                toStringList(k.path("korean_r")),
                toStringList(k.path("korean_h")));
    }

    private SentenceDTO mapSentence(JsonNode s) {
        return new SentenceDTO(
                s.path("id").asLong(0),
                s.path("content").asText(""),
                s.path("furigana").asText(null),
                s.path("translation").path("content").asText(""));
    }

    private NameResultDTO mapName(JsonNode n) {
        List<String> nameTypes = new ArrayList<>();
        n.path("name_type").forEach(t -> nameTypes.add(t.asText()));
        return new NameResultDTO(
                n.path("kanji").asText(null),
                n.path("kana").asText(null),
                n.path("transcription").asText(null),
                nameTypes);
    }

    // =========================================================================
    // POS FLATTENING
    // =========================================================================

    /**
     * Jotoba encodes POS as deeply nested JSON union types, e.g.:
     * {"Verb":{"Godan":"Ru"}} or {"Verb":"Intransitive"}.
     * This method flattens them to human-readable strings for the frontend.
     */
    private List<String> resolvePos(JsonNode posArray) {
        if (posArray.isNull() || posArray.isMissingNode())
            return Collections.emptyList();
        List<String> result = new ArrayList<>();
        posArray.forEach(node -> result.add(flattenPosNode(node)));
        return result;
    }

    private String flattenPosNode(JsonNode node) {
        if (node.isTextual())
            return mapPosLabel(node.asText(), null);
        if (node.isObject()) {
            String key = node.fieldNames().next();
            JsonNode val = node.get(key);
            if (val.isTextual())
                return mapPosLabel(key, val.asText());
            if (val.isObject()) {
                String subKey = val.fieldNames().next();
                return mapPosLabel(key + "." + subKey, val.get(subKey).asText(null));
            }
            return mapPosLabel(key, null);
        }
        return node.asText();
    }

    /** Maps a Jotoba POS identifier to a human-readable English label. */
    private String mapPosLabel(String key, String subKey) {
        return switch (key) {
            case "Noun" -> "Noun";
            case "Noun.Suffix" -> "Suffix";
            case "Noun.Prefix" -> "Prefix";
            case "Verb.Godan" -> buildGodanLabel(subKey);
            case "Verb.Ichidan" -> "Ichidan verb";
            case "Verb.Suru" -> "Suru verb";
            case "Verb.Kuru" -> "Kuru verb";
            case "Verb.Intransitive" -> "Intransitive";
            case "Verb.Transitive" -> "Transitive";
            case "Verb.Irregular.NounOrAuxSuru" -> "Noun/suru verb";
            case "Verb.Irregular.Su" -> "Su verb";
            case "Verb.Irregular" -> "Irregular verb";
            case "Verb" -> subKey != null ? subKey + " verb" : "Verb";
            case "Adjective.I" -> "い-adjective";
            case "Adjective.Na" -> "な-adjective";
            case "Adjective.No" -> "No adj.";
            case "Adjective.PreNounVerb" -> "Noun/verb describing a noun";
            case "Adjective" -> "Adjective";
            case "Adverb" -> "Adverb";
            case "Particle" -> "Particle";
            case "Interjection" -> "Interjection";
            case "Conjunction" -> "Conjunction";
            case "Prefix" -> "Prefix";
            case "Suffix" -> "Suffix";
            case "Expression" -> "Expression";
            case "Numeral" -> "Numeral";
            case "Counter" -> "Counter";
            default -> key;
        };
    }

    private String buildGodanLabel(String ending) {
        if (ending == null)
            return "Godan verb";
        return switch (ending) {
            case "Ru" -> "Godan verb - ru ending";
            case "U" -> "Godan verb - u ending";
            case "Ku" -> "Godan verb - ku ending";
            case "Gu" -> "Godan verb - gu ending";
            case "Su" -> "Godan verb - su ending";
            case "Tu" -> "Godan verb - tsu ending";
            case "Nu" -> "Godan verb - nu ending";
            case "Bu" -> "Godan verb - bu ending";
            case "Mu" -> "Godan verb - mu ending";
            default -> "Godan verb - " + ending.toLowerCase() + " ending";
        };
    }

    // =========================================================================
    // MISC FLATTENING
    // =========================================================================

    private List<String> resolveMisc(JsonNode miscNode) {
        if (miscNode.isNull() || miscNode.isMissingNode())
            return Collections.emptyList();
        List<String> result = new ArrayList<>();
        // misc may be a string or an array of strings/objects
        if (miscNode.isTextual()) {
            result.add(camelToWords(miscNode.asText()));
        } else if (miscNode.isArray()) {
            miscNode.forEach(m -> {
                if (m.isTextual())
                    result.add(camelToWords(m.asText()));
                else if (m.isObject())
                    m.fieldNames().forEachRemaining(f -> result.add(camelToWords(f)));
            });
        }
        return result;
    }

    /** Converts CamelCase POS/Misc identifiers to spaced English words. */
    private String camelToWords(String s) {
        return s.replaceAll("([A-Z])", " $1").trim();
    }

    // =========================================================================
    // KANJI COMPONENT EXTRACTION
    // =========================================================================

    /**
     * Extracts individual CJK characters from a keyword string.
     * WHY: Done server-side so the frontend never needs Unicode range logic.
     * Preserves order, deduplicates, returns empty list for kana-only words.
     */
    private List<String> extractKanjiChars(String keyword) {
        if (keyword == null)
            return Collections.emptyList();
        return keyword.codePoints()
                .mapToObj(cp -> String.valueOf(Character.toChars(cp)))
                .filter(c -> KANJI_PATTERN.matcher(c).matches())
                .distinct()
                .collect(Collectors.toList());
    }

    // =========================================================================
    // AUTOCOMPLETE SUGGESTIONS
    // =========================================================================

    /**
     * Fetches search suggestions from Jotoba's suggestion endpoint.
     * WHY: Proxied through backend — browser cannot call Jotoba directly (CORS).
     * Returns up to 10 formatted strings: "secondary (primary)" or just "primary".
     */
    public Mono<List<String>> fetchSuggestions(String input) {
        return jotobaWebClient.post()
                .uri("/suggestion")
                .bodyValue(Map.of("input", input, "lang", "en-US", "search_type", 0))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> {
                    List<String> suggestions = new ArrayList<>();
                    if (json.isArray()) {
                        json.forEach(item -> {
                            String primary = item.path("primary").asText("");
                            String secondary = item.has("secondary") && !item.path("secondary").isNull()
                                    ? item.path("secondary").asText("") : "";
                            if (!primary.isBlank()) {
                                suggestions.add(secondary.isBlank() ? primary : secondary + " (" + primary + ")");
                            }
                        });
                    }
                    return suggestions.stream().limit(10).collect(Collectors.toList());
                })
                .onErrorResume(ex -> {
                    log.warn("Suggestion fetch failed for '{}': {}", input, ex.getMessage());
                    return Mono.just(Collections.emptyList());
                });
    }

    // =========================================================================
    // RADICAL SEARCH
    // =========================================================================

    /**
     * Fetches kanji matching a combination of radicals via Jotoba's by_radical endpoint.
     *
     * <p>WHY: The response includes both matching kanji AND the set of radicals
     * that are still "compatible" with the current selection ({@code possible_radicals}).
     * The frontend uses this to grey-out incompatible radical buttons in real-time,
     * preventing dead-end combinations before the user makes more selections.
     *
     * @param radicals Selected radical characters (e.g. ["一", "丿"])
     * @param language Jotoba language code ("English" | "Vietnamese")
     */
    public Mono<RadicalSearchResponse> searchByRadical(List<String> radicals, String language) {
        return jotobaWebClient.post()
                .uri("/kanji/by_radical")
                .bodyValue(Map.of("radicals", radicals, "language", language))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(json -> {
                    List<KanjiResultDTO> kanji = new ArrayList<>();
                    JsonNode kanjiNodes = json.path("kanji");
                    if (kanjiNodes.isArray()) {
                        kanjiNodes.forEach(k -> kanji.add(mapKanji(k)));
                    }
                    List<String> possible = toStringList(json.path("possible_radicals"));
                    return new RadicalSearchResponse(kanji, possible);
                })
                .onErrorResume(ex -> {
                    log.error("Radical search failed for {}: {}", radicals, ex.getMessage());
                    return Mono.just(new RadicalSearchResponse(Collections.emptyList(), Collections.emptyList()));
                });
    }


    // =========================================================================
    // SHARED UTILITIES
    // =========================================================================

    private Map<String, Object> buildJotobaBody(String keyword, String language) {
        return Map.of("query", keyword, "language", language, "no_english", false);
    }

    private Map<String, Object> buildJotobaBody(String keyword) {
        return buildJotobaBody(keyword, "English");
    }

    private List<String> toStringList(JsonNode node) {
        if (node.isNull() || node.isMissingNode())
            return Collections.emptyList();
        return StreamSupport.stream(node.spliterator(), false)
                .map(JsonNode::asText)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }
}
