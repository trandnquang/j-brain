-- ============================================================================
-- J-BRAIN DATABASE SCHEMA v2.0
-- Engine: PostgreSQL 16 + pgvector
-- Description: Full schema for AI-Powered Japanese SRS (Spaced Repetition System)
-- ============================================================================

-- Enable pgvector for future semantic search capabilities (milestone 2.0+)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- TABLE 1: users
-- Core identity table. Managed by the application layer (Spring Security).
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
-- A Deck is a named collection of Flashcards owned by a User.
-- Constraint: A user cannot have two decks with the same name.
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
-- Polymorphic core card entity supporting both WORD and KANJI card types.
-- SM-2 algorithm state is stored directly on this record and mutated on review.
-- ============================================================================
CREATE TABLE flashcards (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id      UUID         NOT NULL REFERENCES decks(id) ON DELETE CASCADE,

    -- Card classification: 'WORD' (vocabulary) | 'KANJI' (single character)
    card_type    VARCHAR(20)  NOT NULL DEFAULT 'WORD'
                     CHECK (card_type IN ('WORD', 'KANJI')),

    -- -------------------------------------------------------------------------
    -- JOTOBA CORE DATA (shared by both WORD and KANJI types)
    -- -------------------------------------------------------------------------
    -- The primary search term returned by Jotoba (kanji/kana for words, literal for kanji)
    keyword      TEXT         NOT NULL,
    -- Jotoba furigana format, e.g. "[走|はし]る"
    furigana     TEXT,
    -- Array of English glosses from Jotoba senses[].glosses
    meanings     TEXT[]       NOT NULL,

    -- -------------------------------------------------------------------------
    -- WORD-SPECIFIC DATA (populated when card_type = 'WORD')
    -- -------------------------------------------------------------------------
    -- Array of part-of-speech tags from Jotoba senses[].pos
    part_of_speech   TEXT[],
    -- Raw pitch accent array from Jotoba, stored as JSONB for flexible querying
    pitch_accent_data JSONB,
    -- Relative URL path to the Jotoba .ogg audio file
    audio_url        VARCHAR(500),

    -- -------------------------------------------------------------------------
    -- KANJI-SPECIFIC DATA (populated when card_type = 'KANJI')
    -- -------------------------------------------------------------------------
    stroke_count INT,
    jlpt_level   INT CHECK (jlpt_level BETWEEN 1 AND 5),
    onyomi       TEXT[],
    kunyomi      TEXT[],

    -- -------------------------------------------------------------------------
    -- SM-2 ALGORITHM STATE (ICPC Level Logic)
    -- Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
    -- -------------------------------------------------------------------------
    -- Number of times this card has been successfully reviewed consecutively
    repetition       INT              NOT NULL DEFAULT 0,
    -- Current interval until next review (in days)
    interval_days    INT              NOT NULL DEFAULT 0,
    -- Ease factor: controls how quickly the interval grows. Min value: 1.30
    ease_factor      DOUBLE PRECISION NOT NULL DEFAULT 2.50,
    -- Absolute timestamp of the next scheduled review
    next_review_date TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    -- Card lifecycle state: LEARNING -> REVIEW -> GRADUATED
    status           VARCHAR(20)      NOT NULL DEFAULT 'LEARNING'
                         CHECK (status IN ('LEARNING', 'REVIEW', 'GRADUATED')),

    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Business rule: a deck cannot contain two cards for the same keyword
    CONSTRAINT uq_keyword_per_deck UNIQUE (deck_id, keyword)
);

-- ============================================================================
-- TABLE 4: flashcard_examples
-- AI-generated or Jotoba-native example sentences linked to a flashcard.
-- Each flashcard should have exactly 3 AI rows (Keigo, Daily, Anime).
-- ============================================================================
CREATE TABLE flashcard_examples (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id         UUID        NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,

    -- Source style tag: 'Keigo' | 'Daily' | 'Anime' | 'Jotoba_Native'
    context_style        VARCHAR(50) NOT NULL,
    -- Original Japanese sentence text
    japanese_sentence    TEXT        NOT NULL,
    -- Sentence with inline furigana annotations
    furigana_sentence    TEXT,
    -- Vietnamese translation generated by Llama 3
    vietnamese_translation TEXT      NOT NULL,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 5: review_logs
-- Immutable audit trail of every review event. Never deleted or updated.
-- Used for analytics, replay, and debugging SM-2 regressions.
-- ============================================================================
CREATE TABLE review_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id   UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,

    -- User's self-reported quality of recall: 1=Again, 2=Hard, 3=Good, 4=Easy
    grade          INT  NOT NULL CHECK (grade BETWEEN 1 AND 4),

    -- SM-2 state snapshot before and after applying the algorithm
    previous_interval  INT,
    new_interval       INT,
    previous_ease      DOUBLE PRECISION,
    new_ease           DOUBLE PRECISION,

    reviewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR QUERY PERFORMANCE
-- ============================================================================

-- Critical: Drives the "due today" SRS query. Partial index filters to relevant rows only.
CREATE INDEX idx_flashcards_due_date
    ON flashcards (deck_id, next_review_date)
    WHERE next_review_date <= NOW();

-- Drives user -> deck -> card loading chain
CREATE INDEX idx_decks_user_id
    ON decks (user_id);

-- Drives card detail page (load all examples for a card)
CREATE INDEX idx_examples_flashcard_id
    ON flashcard_examples (flashcard_id);

-- Drives review history page and analytics queries
CREATE INDEX idx_reviews_flashcard_id
    ON review_logs (flashcard_id);

-- GIN index for JSONB pitch accent data (enables future JSON path queries)
CREATE INDEX idx_flashcards_pitch_jsonb
    ON flashcards USING GIN (pitch_accent_data);