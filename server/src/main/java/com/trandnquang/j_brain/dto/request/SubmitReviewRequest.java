package com.trandnquang.j_brain.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SubmitReviewRequest(
	@NotNull(message = "ID thẻ không được để trống")
	UUID flashcardId,

	@NotNull(message = "Điểm đánh giá không được để trống")
	@Min(value = 1, message = "Điểm tối thiểu là 1 (Again)")
	@Max(value = 4, message = "Điểm tối đa là 4 (Easy)")
	Integer grade
) {}
