-- ========================================================================
-- PHẦN 1: EXTENSIONS (TỐI ƯU TÌM KIẾM MỜ & AI)
-- ========================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- Hỗ trợ Fuzzy Search (Romaji/Hiragana)
CREATE EXTENSION IF NOT EXISTS vector;   -- Chuẩn bị cho Vector Search (RAG/AI)

-- ========================================================================
-- PHẦN 2: DICTIONARY MODULE (TỪ ĐIỂN CORE)
-- ========================================================================

-- 1. Bảng lưu Tags (Từ file tag_bank_1.json - Phân loại từ vựng)
CREATE TABLE dictionary_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100),
    description TEXT,
    priority_score INT DEFAULT 0
);

-- 2. Bảng Từ vựng trung tâm (Tối ưu kết hợp JSONB và Plain Text)
CREATE TABLE vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id BIGINT UNIQUE NOT NULL,
    term VARCHAR(255) NOT NULL,
    reading VARCHAR(255),
    popularity_score INT DEFAULT 0,
    
    -- Lưu nguyên bản cấu trúc AST (Array/Object) của Yomitan để Frontend render chính xác 100% UI
    definitions_jsonb JSONB NOT NULL, 
    
    -- Lưu text thuần (đã làm sạch HTML/Tag) để Database thực hiện Full-Text Search siêu tốc
    clean_meaning TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng trung gian Many-to-Many: 1 Từ vựng có thể có nhiều Tags (N, VS, UK...)
CREATE TABLE vocabulary_tags (
    vocabulary_id UUID REFERENCES vocabulary(id) ON DELETE CASCADE,
    tag_code VARCHAR(50) REFERENCES dictionary_tags(code) ON DELETE CASCADE,
    PRIMARY KEY (vocabulary_id, tag_code)
);

-- ========================================================================
-- PHẦN 3: LEARNING MODULE (SRS ENGINE & AI EXAMPLES)
-- ========================================================================

-- 3. Bảng Decks (Quản lý Bộ bài)
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- VD: "Kanji N3", "Từ vựng IT"
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Flashcards (Lõi thuật toán SM-2)
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vocabulary_id UUID REFERENCES vocabulary(id) ON DELETE CASCADE,
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    
    -- Chỉ số cấu thành SM-2 Core
    repetition INT DEFAULT 0,                  -- Số lần lặp lại liên tiếp thành công
    interval INT DEFAULT 0,                    -- Khoảng cách (ngày) tới lần ôn tiếp theo
    ease_factor DECIMAL(5,2) DEFAULT 2.50,     -- Hệ số dễ (Khởi điểm luôn là 2.50)
    next_review_date TIMESTAMPTZ DEFAULT NOW(),-- Timestamp thẻ đến hạn
    
    status VARCHAR(20) DEFAULT 'LEARNING',     -- Trạng thái: NEW, LEARNING, REVIEW, GRADUATED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 1 user chỉ có 1 thẻ duy nhất cho 1 từ vựng trong cùng 1 deck
    CONSTRAINT unique_vocab_deck UNIQUE (vocabulary_id, deck_id)
);

-- 5. Bảng AI Examples (Đáp ứng PRD: 1 Click sinh 3 câu ví dụ theo ngữ cảnh)
CREATE TABLE flashcard_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    japanese_sentence TEXT NOT NULL,
    reading_sentence TEXT,          -- Furigana/Romaji cho câu
    vietnamese_translation TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng Review Logs (BẮT BUỘC PHẢI CÓ để Audit và Analytics quá trình học)
CREATE TABLE review_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    
    grade INT NOT NULL, -- Điểm User đánh giá: 1(Again), 2(Hard), 3(Good), 4(Easy)
    
    -- Snapshot sự thay đổi chỉ số SM-2 sau lần review này
    previous_interval INT,
    new_interval INT,
    previous_ease DECIMAL(5,2),
    new_ease DECIMAL(5,2),
    
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- PHẦN 4: HIỆU NĂNG & INDEXING (PRODUCTION-GRADE)
-- ========================================================================

-- 1. Index tra cứu Từ vựng chính xác (Kanji -> Hiragana)
CREATE INDEX idx_vocab_term_reading ON vocabulary (term, reading);

-- 2. Trigram Indexes cho Fuzzy Search (Tra cứu mờ gõ sai chính tả, tra Romaji)
CREATE INDEX idx_vocab_term_trgm ON vocabulary USING GIN (term gin_trgm_ops);
CREATE INDEX idx_vocab_reading_trgm ON vocabulary USING GIN (reading gin_trgm_ops);
CREATE INDEX idx_vocab_meaning_trgm ON vocabulary USING GIN (clean_meaning gin_trgm_ops);

-- 3. Composite Index: SỐNG CÒN CHO SM-2 (Query thẻ đến hạn theo Deck cực nhanh)
CREATE INDEX idx_flashcards_due_date ON flashcards (deck_id, next_review_date) WHERE next_review_date <= NOW();

-- 4. Foreign Key Indexes (Chống lock table khi JOIN)
CREATE INDEX idx_fc_vocab_id ON flashcards (vocabulary_id);
CREATE INDEX idx_fc_examples_fc_id ON flashcard_examples (flashcard_id);
CREATE INDEX idx_review_logs_fc_id ON review_logs (flashcard_id);