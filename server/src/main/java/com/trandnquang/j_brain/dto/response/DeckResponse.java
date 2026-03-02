package com.trandnquang.j_brain.dto.response;

import java.time.ZonedDateTime;
import java.util.UUID;

public record DeckResponse(
UUID id,
String name,
String description,
ZonedDateTime createdAt
) {}
