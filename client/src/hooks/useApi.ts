import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { search, decks, flashcards, reviews, ai } from "../lib/api";
import type {
    CreateDeckRequest,
    CreateFlashcardRequest,
    SubmitReviewRequest,
} from "../types/api";

// ── Radical search (Phase 3) ──────────────────────────────────────────────────
/**
 * useRadicalSearch — fetches kanji + possible_radicals for a radical selection.
 * WHY: queryKey uses *sorted* radicals so ["一","丿"] and ["丿","一"] resolve to
 * the same cached entry, preventing duplicate API calls on re-selection order.
 */
export function useRadicalSearch(radicals: string[], language = "English") {
    const sorted = [...radicals].sort();
    return useQuery({
        queryKey: ["by-radical", sorted, language],
        queryFn: () => search.byRadical(sorted, language),
        enabled: radicals.length > 0,
        staleTime: 5 * 60 * 1000,
        placeholderData: { kanji: [], possibleRadicals: [] },
    });
}


// ── AI — on-demand example generation (Phase 3B, Item 2) ─────────────────────
/**
 * useAiExamples — caches AI-generated examples per word keyword.
 * WHY: useQuery + staleTime:Infinity means reopening the same word returns
 * cached examples instantly without a second LM Studio call.
 */
export function useAiExamples(
    keyword: string | null,
    meanings: string[],
    enabled: boolean,
) {
    return useQuery({
        queryKey: ["ai-examples", keyword],
        queryFn: () =>
            ai.generateExamples(keyword!, meanings).then((r) => r ?? []),
        enabled: enabled && !!keyword,
        staleTime: Infinity,
        gcTime: Infinity,
        retry: false,
    });
}

// ── Search suggestions (autocomplete) ────────────────────────────────────────
/**
 * useSuggestions — debounced autocomplete query against the backend suggestion proxy.
 * WHY: staleTime 30s prevents hammering Jotoba on every keystroke; input is
 * passed directly (debounce is handled by the caller's input state update timing).
 */
export function useSuggestions(input: string) {
    return useQuery({
        queryKey: ["suggestions", input],
        queryFn: () => search.suggestions(input),
        enabled: input.trim().length > 0,
        staleTime: 30 * 1000,
        placeholderData: [],
    });
}

// ── Word search ────────────────────────────────────────────────────────────────
export function useWordSearch(keyword: string, language = "English") {
    return useQuery({
        queryKey: ["search", "words", keyword, language],
        queryFn: () => search.words(keyword, language),
        enabled: keyword.trim().length > 0,
        staleTime: 10 * 60 * 1000,
    });
}

// ── Kanji search ───────────────────────────────────────────────────────────────
export function useKanjiSearch(keyword: string, language = "English") {
    return useQuery({
        queryKey: ["search", "kanji", keyword, language],
        queryFn: () => search.kanji(keyword, language),
        enabled: keyword.trim().length > 0,
        staleTime: 10 * 60 * 1000,
    });
}

// ── Sentence search ────────────────────────────────────────────────────────────
export function useSentenceSearch(keyword: string, language = "English") {
    return useQuery({
        queryKey: ["search", "sentences", keyword, language],
        queryFn: () => search.sentences(keyword, language),
        enabled: keyword.trim().length > 0,
        staleTime: 10 * 60 * 1000,
    });
}

// ── Name search ────────────────────────────────────────────────────────────────
export function useNameSearch(keyword: string, language = "English") {
    return useQuery({
        queryKey: ["search", "names", keyword, language],
        queryFn: () => search.names(keyword, language),
        enabled: keyword.trim().length > 0,
        staleTime: 10 * 60 * 1000,
    });
}

// ── Decks ──────────────────────────────────────────────────────────────────────
export function useDecks() {
    return useQuery({ queryKey: ["decks"], queryFn: decks.list });
}
export function useCreateDeck() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateDeckRequest) => decks.create(body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
    });
}
export function useRenameDeck() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ deckId, name, description }: { deckId: string; name: string; description?: string }) =>
            decks.rename(deckId, { name, description }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
    });
}
export function useDeleteDeck() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (deckId: string) => decks.delete(deckId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
    });
}

// ── Flashcards ─────────────────────────────────────────────────────────────────
export function useFlashcards(deckId: string | null) {
    return useQuery({
        queryKey: ["flashcards", deckId],
        queryFn: () => flashcards.list(deckId!),
        enabled: !!deckId,
    });
}
export function useCreateFlashcard() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateFlashcardRequest) => flashcards.create(body),
        onSuccess: (_, vars) =>
            qc.invalidateQueries({ queryKey: ["flashcards", vars.deckId] }),
    });
}

// ── Reviews ────────────────────────────────────────────────────────────────────
export function useDueCards(deckId: string | null) {
    return useQuery({
        queryKey: ["reviews", "due", deckId],
        queryFn: () => reviews.due(deckId!),
        enabled: !!deckId,
        refetchInterval: 30_000,
    });
}
export function useSubmitReview(deckId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: SubmitReviewRequest) => reviews.submit(body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["reviews", "due", deckId] });
            qc.invalidateQueries({ queryKey: ["flashcards", deckId] });
        },
    });
}
