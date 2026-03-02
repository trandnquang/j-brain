// ============================================================
// J-BRAIN API TYPES — 100% aligned with backend DTOs
// ============================================================

// ---- AUTH ----
export interface AuthResponse {
    token: string;
    id: string;
    username: string;
    email: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

// ---- DECK ----
export interface DeckResponse {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
}

export interface CreateDeckRequest {
    name: string;
    description?: string;
}

// ---- SEARCH ----
export interface SearchResultDTO {
    cardType: "WORD" | "KANJI";
    keyword: string;
    furigana: string | null;
    meanings: string[];
    // WORD fields
    partOfSpeech: string[] | null;
    pitchAccentData: { part: string; high: boolean }[] | null;
    audioUrl: string | null;
    // KANJI fields
    strokeCount: number | null;
    jlptLevel: number | null;
    onyomi: string[] | null;
    kunyomi: string[] | null;
}

// ---- FLASHCARD ----
export interface ExampleResponse {
    id: string;
    contextStyle: "Keigo" | "Daily" | "Anime" | "Jotoba_Native";
    japaneseSentence: string;
    furiganaSentence: string | null;
    vietnameseTranslation: string;
}

export interface FlashcardResponse {
    id: string;
    deckId: string;
    cardType: "WORD" | "KANJI";
    keyword: string;
    furigana: string | null;
    meanings: string[];
    examples: ExampleResponse[];
}

export interface CreateFlashcardRequest {
    deckId: string;
    cardType: "WORD" | "KANJI";
    keyword: string;
    furigana?: string;
    meanings: string[];
    partOfSpeech?: string[];
    pitchAccentData?: { part: string; high: boolean }[];
    audioUrl?: string;
    strokeCount?: number;
    jlptLevel?: number;
    onyomi?: string[];
    kunyomi?: string[];
}

// ---- REVIEW ----
export interface ReviewCardResponse {
    flashcardId: string;
    cardType: "WORD" | "KANJI";
    keyword: string;
    furigana: string | null;
    meanings: string[];
    audioUrl: string | null;
    examples: ExampleResponse[];
}

export interface SubmitReviewRequest {
    flashcardId: string;
    grade: 1 | 2 | 3 | 4; // 1=Again 2=Hard 3=Good 4=Easy
}

export interface ReviewResultResponse {
    flashcardId: string;
    newIntervalDays: number;
    nextReviewDate: string;
}

// ---- ERROR ----
export interface ApiError {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    details?: Record<string, string>;
}
