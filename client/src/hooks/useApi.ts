import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { search, decks, flashcards, reviews, ai } from "../lib/api";
import type {
    CreateDeckRequest,
    CreateFlashcardRequest,
    SubmitReviewRequest,
} from "../types/api";

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

// ── Word search (debounced via enabled flag) ───────────────────────────────────
export function useWordSearch(keyword: string) {
    return useQuery({
        queryKey: ["search", "words", keyword],
        queryFn: () => search.words(keyword),
        enabled: keyword.trim().length > 0,
        staleTime: 10 * 60 * 1000,
    });
}

// ── Kanji search ───────────────────────────────────────────────────────────────
export function useKanjiSearch(keyword: string) {
    return useQuery({
        queryKey: ["search", "kanji", keyword],
        queryFn: () => search.kanji(keyword),
        enabled: keyword.trim().length > 0,
        staleTime: 10 * 60 * 1000,
    });
}

// ── Sentence search ────────────────────────────────────────────────────────────
export function useSentenceSearch(keyword: string) {
    return useQuery({
        queryKey: ["search", "sentences", keyword],
        queryFn: () => search.sentences(keyword),
        enabled: keyword.trim().length > 0,
        staleTime: 10 * 60 * 1000,
    });
}

// ── Name search ────────────────────────────────────────────────────────────────
export function useNameSearch(keyword: string) {
    return useQuery({
        queryKey: ["search", "names", keyword],
        queryFn: () => search.names(keyword),
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
