package com.trandnquang.j_brain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record CreateFlashcardRequest(
	@NotNull(message = "ID bộ bài không được để trống")
	UUID deckId,

	@NotBlank(message = "Loại thẻ (WORD/KANJI) không được để trống")
	String cardType,

	@NotBlank(message = "Từ khóa không được để trống")
	String keyword,

	String furigana,

	@NotEmpty(message = "Phải có ít nhất 1 nghĩa")
	List<String> meanings,

	// Các trường optional (có thể null tùy thuộc vào Word hay Kanji)
	List<String> partOfSpeech,
	List<Map<String, Object>> pitchAccentData,
	String audioUrl,
	Integer strokeCount,
	Integer jlptLevel,
	List<String> onyomi,
	List<String> kunyomi
) {}