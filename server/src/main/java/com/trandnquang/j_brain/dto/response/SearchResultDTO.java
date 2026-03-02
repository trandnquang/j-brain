package com.trandnquang.j_brain.dto.response;

import java.util.List;
import java.util.Map;

public record SearchResultDTO(
	String cardType,             // "WORD" hoặc "KANJI"
	String keyword,              // Từ chính (Kanji/Kana)
	String furigana,             // Định dạng bracket của Jotoba (VD: "[走|はし]る")
	List<String> meanings,       // Nghĩa tiếng Anh

	// --- CÁC TRƯỜNG DÀNH CHO TỪ VỰNG (WORDS) ---
	List<String> partOfSpeech,   // Từ loại
	List<Map<String, Object>> pitchAccentData, // Dữ liệu trọng âm
	String audioUrl,             // Đường dẫn file Audio

	// --- CÁC TRƯỜNG DÀNH CHO HÁN TỰ (KANJI) ---
	Integer strokeCount,         // Số nét
	Integer jlptLevel,           // Cấp độ JLPT
	List<String> onyomi,         // Âm On
	List<String> kunyomi         // Âm Kun
) {}