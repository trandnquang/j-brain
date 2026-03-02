package com.trandnquang.j_brain.dto.response;

import java.util.List;

// DTO gốc chứa danh sách kết quả (Có thể trả về nhiều nghĩa/từ đồng âm)
public record SearchResponse(
	List<SearchResultDTO> results
) {}