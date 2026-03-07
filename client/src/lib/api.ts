import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    DeckResponse,
    CreateDeckRequest,
    WordResultDTO,
    KanjiResultDTO,
    SentenceDTO,
    NameResultDTO,
    FlashcardResponse,
    CreateFlashcardRequest,
    ExampleResponse,
    ReviewCardResponse,
    SubmitReviewRequest,
    ReviewResultResponse,
} from "../types/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const getToken = (): string | null => localStorage.getItem("jwt_token");
export const setToken = (t: string) => localStorage.setItem("jwt_token", t);
export const clearToken = () => localStorage.removeItem("jwt_token");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    
    // Global Auth Interceptor
    // If we receive a 401 or 403, our token might be expired or invalid.
    if (res.status === 401 || res.status === 403) {
        clearToken();
        // Prevent redirect loops and only redirect if we aren't already logging in
        if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth';
        }
        throw new Error("Unauthorized");
    }

    if (res.status === 204) return undefined as T;
    const data = await res.json();
    if (!res.ok) throw data;
    return data as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
    login: (body: LoginRequest) =>
        request<AuthResponse>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(body),
        }),
    register: (body: RegisterRequest) =>
        request<AuthResponse>("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(body),
        }),
};

// ── Search (Phase 2) ──────────────────────────────────────────────────────────
export const search = {
    suggestions: (input: string, searchType: number = 0) =>
        request<string[]>(
            `/api/v1/search/suggestions?input=${encodeURIComponent(input)}&searchType=${searchType}`,
        ),
    words: (keyword: string, language = "English") =>
        request<WordResultDTO[]>(
            `/api/v1/search/words?keyword=${encodeURIComponent(keyword)}&language=${encodeURIComponent(language)}`,
        ),
    kanji: (keyword: string, language = "English") =>
        request<KanjiResultDTO[]>(
            `/api/v1/search/kanji?keyword=${encodeURIComponent(keyword)}&language=${encodeURIComponent(language)}`,
        ),
    sentences: (keyword: string, language = "English") =>
        request<SentenceDTO[]>(
            `/api/v1/search/sentences?keyword=${encodeURIComponent(keyword)}&language=${encodeURIComponent(language)}`,
        ),
    names: (keyword: string, language = "English") =>
        request<NameResultDTO[]>(
            `/api/v1/search/names?keyword=${encodeURIComponent(keyword)}&language=${encodeURIComponent(language)}`,
        ),
    byRadical: (radicals: string[], language = "English") => {
        const params = radicals.map((r) => `radicals=${encodeURIComponent(r)}`).join("&");
        return request<import("../types/api").RadicalSearchResponse>(
            `/api/v1/search/by-radical?${params}&language=${encodeURIComponent(language)}`,
        );
    },
};



// ── AI (Phase 3B) ─────────────────────────────────────────────────────────────
export const ai = {
    /**
     * On-demand example generation — triggered when user opens the word detail drawer.
     * Returns 3 examples (Keigo, Daily, Anime) or null if LM Studio is unreachable.
     */
    generateExamples: (keyword: string, meanings: string[]) =>
        request<ExampleResponse[] | null>("/api/v1/ai/examples", {
            method: "POST",
            body: JSON.stringify({ keyword, meanings }),
        }),
};

// ── Decks ─────────────────────────────────────────────────────────────────────
export const decks = {
    list: () => request<DeckResponse[]>("/api/v1/decks"),
    create: (body: CreateDeckRequest) =>
        request<DeckResponse>("/api/v1/decks", {
            method: "POST",
            body: JSON.stringify(body),
        }),
    rename: (deckId: string, body: import("../types/api").RenameDeckRequest) =>
        request<DeckResponse>(`/api/v1/decks/${deckId}`, {
            method: "PATCH",
            body: JSON.stringify(body),
        }),
    delete: (deckId: string) =>
        request<void>(`/api/v1/decks/${deckId}`, { method: "DELETE" }),
};

// ── Flashcards ────────────────────────────────────────────────────────────────
export const flashcards = {
    list: (deckId: string) =>
        request<FlashcardResponse[]>(`/api/v1/flashcards?deckId=${deckId}`),
    create: (body: CreateFlashcardRequest) =>
        request<FlashcardResponse>("/api/v1/flashcards", {
            method: "POST",
            body: JSON.stringify(body),
        }),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviews = {
    due: (deckId: string) =>
        request<ReviewCardResponse[]>(`/api/v1/decks/${deckId}/reviews`),
    submit: (body: SubmitReviewRequest) =>
        request<ReviewResultResponse>("/api/v1/reviews", {
            method: "POST",
            body: JSON.stringify(body),
        }),
};
