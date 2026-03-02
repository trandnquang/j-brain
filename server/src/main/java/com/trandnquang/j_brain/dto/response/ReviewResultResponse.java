package com.trandnquang.j_brain.dto.response;

import java.time.ZonedDateTime;
import java.util.UUID;

public record ReviewResultResponse(
UUID flashcardId,
Integer newIntervalDays,
ZonedDateTime nextReviewDate
) {}