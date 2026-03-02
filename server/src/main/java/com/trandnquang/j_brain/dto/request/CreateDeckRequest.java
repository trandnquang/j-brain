package com.trandnquang.j_brain.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDeckRequest(
@NotBlank(message = "Tên bộ bài không được để trống")
@Size(max = 100, message = "Tên bộ bài tối đa 100 ký tự")
String name,

String description
) {}