package com.trandnquang.j_brain.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JotobaSearchRequest {
    private String query;
    private String language = "English";
    private boolean no_english = false;
}
