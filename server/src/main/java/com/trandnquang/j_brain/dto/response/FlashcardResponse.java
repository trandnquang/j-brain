package com.trandnquang.j_brain.dto.response;

import java.util.List;
import java.util.UUID;

// DTO đại diện cho toàn bộ Flashcard hoàn chỉnh
public record FlashcardResponse(
	UUID id,
	UUID deckId,
	String cardType,
	String keyword,
	String furigana,
	List<String> meanings,

	// Danh sách 3 câu ví dụ do AI tự động sinh ra
	List<ExampleResponse> examples
) {}