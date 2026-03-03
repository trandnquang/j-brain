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
    words: (keyword: string) =>
        request<WordResultDTO[]>(
            `/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`,
        ),
    kanji: (keyword: string) =>
        request<KanjiResultDTO[]>(
            `/api/v1/search/kanji?keyword=${encodeURIComponent(keyword)}`,
        ),
    sentences: (keyword: string) =>
        request<SentenceDTO[]>(
            `/api/v1/search/sentences?keyword=${encodeURIComponent(keyword)}`,
        ),
    names: (keyword: string) =>
        request<NameResultDTO[]>(
            `/api/v1/search/names?keyword=${encodeURIComponent(keyword)}`,
        ),
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
