import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { search, decks, flashcards, reviews } from "../lib/api";
import type {
    CreateDeckRequest,
    CreateFlashcardRequest,
    SubmitReviewRequest,
} from "../types/api";

// ============================================================
// SEARCH HOOKS
// ============================================================

/**
 * useWordSearch — Fetches word results from Jotoba lazily (enabled only when a keyword is provided).
 */
export function useWordSearch(keyword: string) {
    return useQuery({
        queryKey: ["search", "words", keyword],
        queryFn: () => search.words(keyword),
        enabled: keyword.trim().length > 0,
        staleTime: 10 * 60 * 1000, // Jotoba responses are stable — 10 min cache
    });
}

// ============================================================
// DECK HOOKS
// ============================================================

/** useDecks — Fetches all decks belonging to the authenticated user. */
export function useDecks() {
    return useQuery({
        queryKey: ["decks"],
        queryFn: decks.list,
    });
}

/** useCreateDeck — Mutation to create a new deck; invalidates the deck list on success. */
export function useCreateDeck() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateDeckRequest) => decks.create(body),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
    });
}

// ============================================================
// FLASHCARD HOOKS
// ============================================================

/** useFlashcards — Fetches all flashcards for a given deck. */
export function useFlashcards(deckId: string | null) {
    return useQuery({
        queryKey: ["flashcards", deckId],
        queryFn: () => flashcards.list(deckId!),
        enabled: !!deckId,
    });
}

/** useCreateFlashcard — Mutation to save a flashcard (202 Accepted — AI runs async). */
export function useCreateFlashcard() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateFlashcardRequest) => flashcards.create(body),
        onSuccess: (_, vars) =>
            qc.invalidateQueries({ queryKey: ["flashcards", vars.deckId] }),
    });
}

// ============================================================
// REVIEW HOOKS
// ============================================================

/** useDueCards — Fetches cards due for review in a deck today. */
export function useDueCards(deckId: string | null) {
    return useQuery({
        queryKey: ["reviews", "due", deckId],
        queryFn: () => reviews.due(deckId!),
        enabled: !!deckId,
        // Refresh every 30s so newly-added cards appear without a reload
        refetchInterval: 30_000,
    });
}

/** useSubmitReview — Mutation to submit a grade; invalidates the due-cards list. */
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
