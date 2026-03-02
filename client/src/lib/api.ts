import type {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    DeckResponse,
    CreateDeckRequest,
    SearchResultDTO,
    FlashcardResponse,
    CreateFlashcardRequest,
    ReviewCardResponse,
    SubmitReviewRequest,
    ReviewResultResponse,
} from "../types/api";

// ============================================================
// BASE CONFIG
// ============================================================
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/** Retrieve the stored JWT from localStorage */
export const getToken = (): string | null => localStorage.getItem("jwt_token");
/** Persist the JWT to localStorage */
export const setToken = (token: string) =>
    localStorage.setItem("jwt_token", token);
/** Remove the JWT from localStorage (logout) */
export const clearToken = () => localStorage.removeItem("jwt_token");

// ============================================================
// CORE FETCH WRAPPER
// ============================================================
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 204) return undefined as T; // No Content

    const data = await res.json();
    if (!res.ok) throw data; // Throws the ApiError envelope from GlobalExceptionHandler
    return data as T;
}

// ============================================================
// AUTH
// ============================================================
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

// ============================================================
// SEARCH
// ============================================================
export const search = {
    words: (keyword: string) =>
        request<SearchResultDTO[]>(
            `/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`,
        ),

    kanji: (keyword: string) =>
        request<SearchResultDTO[]>(
            `/api/v1/search/kanji?keyword=${encodeURIComponent(keyword)}`,
        ),
};

// ============================================================
// DECKS
// ============================================================
export const decks = {
    list: () => request<DeckResponse[]>("/api/v1/decks"),

    create: (body: CreateDeckRequest) =>
        request<DeckResponse>("/api/v1/decks", {
            method: "POST",
            body: JSON.stringify(body),
        }),
};

// ============================================================
// FLASHCARDS
// ============================================================
export const flashcards = {
    list: (deckId: string) =>
        request<FlashcardResponse[]>(`/api/v1/flashcards?deckId=${deckId}`),

    create: (body: CreateFlashcardRequest) =>
        request<FlashcardResponse>("/api/v1/flashcards", {
            method: "POST",
            body: JSON.stringify(body),
        }),
};

// ============================================================
// REVIEWS
// ============================================================
export const reviews = {
    due: (deckId: string) =>
        request<ReviewCardResponse[]>(`/api/v1/decks/${deckId}/reviews`),

    submit: (body: SubmitReviewRequest) =>
        request<ReviewResultResponse>("/api/v1/reviews", {
            method: "POST",
            body: JSON.stringify(body),
        }),
};
