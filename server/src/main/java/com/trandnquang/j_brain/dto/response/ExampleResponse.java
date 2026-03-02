package com.trandnquang.j_brain.dto.response;

import java.util.UUID;

// DTO đại diện cho 1 câu ví dụ AI sinh ra
public record ExampleResponse(
	UUID id,
	String contextStyle,        // "Keigo", "Daily", "Anime"
	String japaneseSentence,
	String furiganaSentence,
	String vietnameseTranslation
) {}