package com.trandnquang.j_brain.service;

import com.trandnquang.j_brain.domain.Sm2Result;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class Sm2EngineServiceTest {

    private Sm2EngineService sm2Engine;

    @BeforeEach
    void setUp() {
        sm2Engine = new Sm2EngineService();
    }

    @Test
    void testFirstReview_GoodGrade() {
        // Given a new card (rep=0, int=0, ease=2.5) graded as 3 (Good)
        Sm2Result result = sm2Engine.calculateNextReview(3, 0, 0, 2.5);

        // Then iteration increases to 1, interval to 1 day, ease factor remains or
        // slightly changes based on algorithm
        assertEquals(1, result.getRepetition());
        assertEquals(1, result.getIntervalDays());
    }

    @Test
    void testSecondReview_GoodGrade() {
        // Given card in 1st rep (rep=1, int=1, ease=2.5) graded 3 (Good)
        Sm2Result result = sm2Engine.calculateNextReview(3, 1, 1, 2.5);

        assertEquals(2, result.getRepetition());
        assertEquals(6, result.getIntervalDays());
    }

    @Test
    void testReview_FailedGrade() {
        // Given an established card (rep=5, int=14, ease=2.6) graded 1 (Fail/Again)
        Sm2Result result = sm2Engine.calculateNextReview(1, 5, 14, 2.6);

        // Then repetition resets to 0, interval to 1 day, ease drops
        assertEquals(0, result.getRepetition());
        assertEquals(1, result.getIntervalDays());
        // ease should drop by 0.8 according to SM-2 formula: EF' = EF + (0.1 -
        // (5-q)*(0.08 + (5-q)*0.02))
        // wait, we map 1-4 to SuperMemo 0-5. Let's define the exact mapping in the
        // service later,
        // for now we enforce the repetition and interval reset
    }
}
