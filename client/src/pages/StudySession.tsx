import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDueCards, useSubmitReview } from "../hooks/useApi";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Loader2, CheckCircle2, BookOpen } from "lucide-react";
import type { ReviewCardResponse } from "../types/api";

type Grade = 1 | 2 | 3 | 4;

const GRADE_CONFIG: {
    grade: Grade;
    label: string;
    sublabel: string;
    color: string;
}[] = [
    {
        grade: 1,
        label: "Again",
        sublabel: "10 min",
        color: "border-red-200 hover:bg-red-50 hover:text-red-700",
    },
    {
        grade: 2,
        label: "Hard",
        sublabel: "1 day",
        color: "border-orange-200 hover:bg-orange-50 hover:text-orange-700",
    },
    {
        grade: 3,
        label: "Good",
        sublabel: "3 days",
        color: "border-blue-200 hover:bg-blue-50 hover:text-blue-700",
    },
    {
        grade: 4,
        label: "Easy",
        sublabel: "1 week",
        color: "border-green-200 hover:bg-green-50 hover:text-green-700",
    },
];

export default function StudySession() {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    const { data: cards, isLoading, refetch } = useDueCards(deckId ?? null);
    const submitReview = useSubmitReview(deckId ?? "");

    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [done, setDone] = useState(false);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
        );
    }

    if (!cards || cards.length === 0 || done) {
        return (
            <div className="max-w-2xl mx-auto text-center py-24 space-y-4">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                <h2 className="text-2xl font-bold">All caught up!</h2>
                <p className="text-gray-500">
                    No cards due for review right now.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                    <Button
                        onClick={() => navigate("/")}
                        className="bg-black hover:bg-gray-800 text-white"
                    >
                        Search words
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setDone(false);
                            setIndex(0);
                            refetch();
                        }}
                    >
                        Refresh
                    </Button>
                </div>
            </div>
        );
    }

    const card: ReviewCardResponse = cards[index];
    const total = cards.length;
    const progress = Math.round((index / total) * 100);

    const handleGrade = async (grade: Grade) => {
        await submitReview.mutateAsync({
            flashcardId: card.flashcardId,
            grade,
        });
        if (index + 1 >= total) {
            setDone(true);
        } else {
            setIndex((i) => i + 1);
            setRevealed(false);
        }
    };

    const dailyExample =
        card.examples.find((e) => e.contextStyle === "Daily") ??
        card.examples[0];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Review Session
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {index + 1} / {total} cards
                    </p>
                </div>
                <button
                    onClick={() => navigate("/decks")}
                    className="text-sm text-gray-400 hover:text-gray-600"
                >
                    ✕ End session
                </button>
            </div>

            {/* ── Progress bar ── */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* ── Flashcard ── */}
            <Card className="min-h-[320px] flex flex-col border-2 shadow-sm">
                <CardContent className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-4">
                    {/* Front: keyword */}
                    <div className="text-6xl font-black tracking-widest text-gray-900">
                        {card.keyword}
                    </div>
                    {card.furigana && (
                        <div className="text-gray-400 text-lg">
                            {card.furigana.replace(
                                /\[([^|]+)\|[^\]]+\]/g,
                                "$1",
                            )}
                        </div>
                    )}

                    {/* Back: revealed */}
                    {revealed ? (
                        <div className="w-full mt-4 bg-gray-50 border border-gray-100 rounded-xl p-6 text-left space-y-4 animate-in fade-in duration-300">
                            {/* Meanings */}
                            <div>
                                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1 font-medium">
                                    Meaning
                                </p>
                                <p className="text-gray-800 font-medium">
                                    {card.meanings.slice(0, 3).join("; ")}
                                </p>
                            </div>

                            {/* Example sentence */}
                            {dailyExample && (
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-1 font-medium">
                                        Example ({dailyExample.contextStyle})
                                    </p>
                                    <p className="text-lg text-gray-800">
                                        {dailyExample.japaneseSentence}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {dailyExample.vietnameseTranslation}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            id="reveal-btn"
                            onClick={() => setRevealed(true)}
                            className="mt-6 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg px-6 py-3 hover:border-gray-400 hover:text-gray-600 transition-all"
                        >
                            Tap to reveal answer
                        </button>
                    )}
                </CardContent>
            </Card>

            {/* ── Grade buttons ── */}
            <div
                className={`grid grid-cols-4 gap-3 transition-opacity duration-300 ${
                    revealed ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
                {GRADE_CONFIG.map(({ grade, label, sublabel, color }) => (
                    <Button
                        key={grade}
                        id={`grade-btn-${grade}`}
                        variant="outline"
                        disabled={submitReview.isPending}
                        onClick={() => handleGrade(grade)}
                        className={`h-16 flex flex-col gap-0.5 ${color}`}
                    >
                        {submitReview.isPending &&
                        submitReview.variables?.grade === grade ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span className="font-semibold text-sm">
                                    {label}
                                </span>
                                <span className="text-xs opacity-60">
                                    {sublabel}
                                </span>
                            </>
                        )}
                    </Button>
                ))}
            </div>

            {/* ── Example styles ── */}
            {revealed && card.examples.length > 0 && (
                <div className="space-y-3 pt-2">
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-medium">
                        All examples
                    </p>
                    {card.examples.map((ex) => (
                        <div
                            key={ex.id}
                            className="border border-gray-100 rounded-lg p-4 space-y-1"
                        >
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {ex.contextStyle}
                            </span>
                            <p className="text-base mt-2">
                                {ex.japaneseSentence}
                            </p>
                            <p className="text-sm text-gray-500">
                                {ex.vietnameseTranslation}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── No examples placeholder ── */}
            {revealed && card.examples.length === 0 && (
                <div className="text-center text-sm text-gray-400 border border-dashed rounded-lg py-4 flex items-center gap-2 justify-center">
                    <BookOpen className="w-4 h-4" />
                    AI examples are being generated — check back in a moment.
                </div>
            )}
        </div>
    );
}
