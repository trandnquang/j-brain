package com.trandnquang.j_brain.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result of an SM-2 algorithmic calculation.
 * 
 * WHY: This DTO isolates the SM-2 logic pure function output from JPA entities,
 * ensuring the mathematical core remains decoupled from database constraints.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Sm2Result {
    private int repetition;
    private int intervalDays;
    private double easeFactor;
}
