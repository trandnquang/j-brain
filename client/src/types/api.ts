// ============================================================
// J-BRAIN API TYPES — Phase 2, aligned with all backend DTOs
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

// ---- SEARCH — Phase 2 ----
export interface SenseDTO {
    glosses: string[];
    pos: string[]; // backend-flattened POS labels
    misc: string[]; // usage notes e.g. "Usually written in kana"
}
export interface PitchDTO {
    part: string;
    high: boolean;
} // kana mora, guaranteed kana-only

export interface WordResultDTO {
    keyword: string | null; // kanji form; null for kana-only words
    kana: string;
    furigana: string | null; // bracket format [走|はし]る
    common: boolean;
    senses: SenseDTO[];
    pitch: PitchDTO[];
    audioUrl: string | null;
    kanjiComponents: string[];
}

export interface KanjiResultDTO {
    literal: string;
    meanings: string[];
    onyomi: string[];
    kunyomi: string[];
    strokeCount: number;
    jlptLevel: number | null;
    grade: number | null;
    radical: string | null;
    parts: string[];
    similar: string[];
    chinese: string[];
    koreanRomaji: string[];
    koreanHangul: string[];
}

export interface SentenceDTO {
    id: number;
    japanese: string;
    furigana: string | null;
    english: string;
}

export interface NameResultDTO {
    kanji: string | null;
    kana: string;
    transcription: string;
    nameType: string[];
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
    kana?: string;
    furigana?: string;
    common?: boolean;
    serializedSenses?: string; // JSON string of SenseDTO[]
    meanings: string[];
    partOfSpeech?: string[];
    serializedPitchAccent?: string; // JSON string of PitchDTO[]
    audioUrl?: string;
    kanjiComponents?: string[];
    strokeCount?: number;
    jlptLevel?: number;
    onyomi?: string[];
    kunyomi?: string[];
    grade?: number;
    radical?: string;
    chinese?: string[];
    koreanR?: string[];
    koreanH?: string[];
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
    grade: 1 | 2 | 3 | 4;
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
