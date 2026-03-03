-- ============================================================================
-- J-BRAIN DATABASE SCHEMA v3.0
-- Engine: PostgreSQL 16 + pgvector
-- Phase 2: Additive migration — 9 new columns on flashcards, nothing removed
-- ============================================================================

-- Enable pgvector for future semantic search capabilities (milestone 2.0+)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLE 1: users
-- ============================================================================
CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    username      VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 2: decks
-- ============================================================================
CREATE TABLE decks (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_deck_name_per_user UNIQUE (user_id, name)
);

-- ============================================================================
-- TABLE 3: flashcards
-- Polymorphic: supports WORD and KANJI card_types.
-- v3.0 Phase 2 additions: kana, common, senses, kanji_components, radical,
--   grade, chinese, korean_r, korean_h
-- ============================================================================
CREATE TABLE flashcards (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id      UUID         NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

    card_type    VARCHAR(20)  NOT NULL DEFAULT 'WORD'
                     CHECK (card_type IN ('WORD', 'KANJI')),

    -- -------------------------------------------------------------------------
    -- CORE WORD / KANJI IDENTITY
    -- -------------------------------------------------------------------------
    -- Primary search term: kanji form for words, literal for kanji cards
    keyword      TEXT         NOT NULL,
    -- [Phase 2] Pure kana reading, always populated (e.g. "はしる" for 走る)
    kana         TEXT,
    -- Jotoba bracket furigana format, e.g. "[走|はし]る"
    furigana     TEXT,
    -- [Phase 2] True if the word appears in Jotoba's common vocabulary lists
    common       BOOLEAN      NOT NULL DEFAULT false,

    -- -------------------------------------------------------------------------
    -- FLAT MEANINGS — kept for SM-2 review display, populated from senses[0]
    -- -------------------------------------------------------------------------
    meanings     TEXT[]       NOT NULL,

    -- -------------------------------------------------------------------------
    -- [Phase 2] STRUCTURED SENSES — full JSON from Jotoba for detail view
    -- Schema: [{ glosses: string[], pos: string[], misc: string[] }]
    -- -------------------------------------------------------------------------
    senses       JSONB,

    -- -------------------------------------------------------------------------
    -- WORD-SPECIFIC DATA
    -- -------------------------------------------------------------------------
    part_of_speech    TEXT[],
    pitch_accent_data JSONB,
    audio_url         VARCHAR(500),
    -- [Phase 2] Kanji chars extracted from the keyword, e.g. ["有","難"] for 有難う
    kanji_components  TEXT[],

    -- -------------------------------------------------------------------------
    -- KANJI-SPECIFIC DATA
    -- -------------------------------------------------------------------------
    stroke_count INT,
    jlpt_level   INT CHECK (jlpt_level BETWEEN 1 AND 5),
    onyomi       TEXT[],
    kunyomi      TEXT[],
    -- [Phase 2] School grade the kanji is taught in (Joyo grade 1–8)
    grade        INT,
    -- [Phase 2] The main radical for this kanji (single character)
    radical      TEXT,
    -- [Phase 2] Chinese pinyin readings, e.g. ["zou3"]
    chinese      TEXT[],
    -- [Phase 2] Korean readings in Romaji (McCune-Reischauer), e.g. ["ju"]
    korean_r     TEXT[],
    -- [Phase 2] Korean readings in Hangul, e.g. ["주"]
    korean_h     TEXT[],

    -- -------------------------------------------------------------------------
    -- SM-2 ALGORITHM STATE
    -- -------------------------------------------------------------------------
    repetition       INT              NOT NULL DEFAULT 0,
    interval_days    INT              NOT NULL DEFAULT 0,
    ease_factor      DOUBLE PRECISION NOT NULL DEFAULT 2.50,
    next_review_date TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    status           VARCHAR(20)      NOT NULL DEFAULT 'LEARNING'
                         CHECK (status IN ('LEARNING', 'REVIEW', 'GRADUATED')),

    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_keyword_per_deck UNIQUE (deck_id, keyword)
);

-- ============================================================================
-- TABLE 4: flashcard_examples
-- AI-generated example sentences (Keigo, Daily, Anime) per flashcard
-- ============================================================================
CREATE TABLE flashcard_examples (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id         UUID        NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    context_style        VARCHAR(50) NOT NULL,
    japanese_sentence    TEXT        NOT NULL,
    furigana_sentence    TEXT,
    vietnamese_translation TEXT      NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 5: review_logs — immutable SM-2 audit trail
-- ============================================================================
CREATE TABLE review_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id   UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    grade          INT  NOT NULL CHECK (grade BETWEEN 1 AND 4),
    previous_interval  INT,
    new_interval       INT,
    previous_ease      DOUBLE PRECISION,
    new_ease           DOUBLE PRECISION,
    reviewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Drives "due today" SRS query — partial index filters to relevant rows only
CREATE INDEX idx_flashcards_due_date
    ON flashcards (deck_id, next_review_date)
    WHERE next_review_date <= NOW();

CREATE INDEX idx_decks_user_id     ON decks (user_id);
CREATE INDEX idx_examples_flashcard_id ON flashcard_examples (flashcard_id);
CREATE INDEX idx_reviews_flashcard_id  ON review_logs (flashcard_id);

-- GIN index for JSONB pitch accent and structured senses queries
CREATE INDEX idx_flashcards_pitch_jsonb  ON flashcards USING GIN (pitch_accent_data);
CREATE INDEX idx_flashcards_senses_jsonb ON flashcards USING GIN (senses);