package com.trandnquang.j_brain.service;

import com.trandnquang.j_brain.domain.Sm2Result;
import org.springframework.stereotype.Service;

/**
 * SuperMemo-2 Spaced Repetition Engine.
 * 
 * WHY: This service implements the core mathematical logic for the spaced
 * repetition feature.
 * It is structured as a pure service that calculates intervals without causing
 * side-effects,
 * allowing it to be thoroughly unit tested and utilized independently of entity
 * lifecycles.
 */
@Service
public class Sm2EngineService {

    public Sm2Result calculateNextReview(int grade, int previousRepetition, int previousInterval,
            double previousEaseFactor) {
        int quality;
        switch (grade) {
            case 1:
                quality = 1;
                break; // Again
            case 2:
                quality = 3;
                break; // Hard
            case 3:
                quality = 4;
                break; // Good
            case 4:
                quality = 5;
                break; // Easy
            default:
                quality = 1;
        }

        int repetition = previousRepetition;
        int intervalDays = previousInterval;
        double easeFactor = previousEaseFactor;

        if (quality >= 3) {
            if (repetition == 0) {
                intervalDays = 1;
            } else if (repetition == 1) {
                intervalDays = 6;
            } else {
                intervalDays = (int) Math.round(intervalDays * easeFactor);
            }
            repetition++;
        } else {
            repetition = 0;
            intervalDays = 1;
        }

        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) {
            easeFactor = 1.3;
        }

        return new Sm2Result(repetition, intervalDays, easeFactor);
    }
}
