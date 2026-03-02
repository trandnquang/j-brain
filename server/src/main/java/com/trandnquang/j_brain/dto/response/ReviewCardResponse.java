package com.trandnquang.j_brain.dto.response;

import java.util.List;
import java.util.UUID;

// Trả về dữ liệu thẻ và ví dụ để Frontend hiển thị mặt trước/mặt sau
public record ReviewCardResponse(
	UUID flashcardId,
	String cardType,
	String keyword,
	String furigana,
	List<String> meanings,
	String audioUrl,

	// UI sẽ lấy danh sách này, hiển thị japaneseSentence (che keyword đi) ở mặt trước [cite: 23]
	// và hiển thị furiganaSentence + vietnameseTranslation ở mặt sau [cite: 24]
	List<ExampleResponse> examples
) {}
