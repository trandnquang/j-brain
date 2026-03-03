import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDueCards, useSubmitReview } from "../hooks/useApi";
import { Button } from "../components/ui/button";
import { FuriganaText } from "../components/FuriganaText";
import { PitchAccentSVG } from "../components/PitchAccentSVG";
import {
    Loader2,
    CheckCircle2,
    BookOpen,
    Volume2,
    ChevronRight,
    Trophy,
} from "lucide-react";
import type { ReviewCardResponse, PitchDTO, SenseDTO } from "../types/api";

type Grade = 1 | 2 | 3 | 4;

const GRADE_CONFIG: {
    grade: Grade;
    label: string;
    sublabel: string;
    bg: string;
    text: string;
    border: string;
    ring: string;
}[] = [
    {
        grade: 1,
        label: "Again",
        sublabel: "< 10 min",
        bg: "hover:bg-red-600",
        text: "text-red-600",
        border: "border-red-200",
        ring: "hover:ring-red-300",
    },
    {
        grade: 2,
        label: "Hard",
        sublabel: "< 1 day",
        bg: "hover:bg-orange-500",
        text: "text-orange-600",
        border: "border-orange-200",
        ring: "hover:ring-orange-300",
    },
    {
        grade: 3,
        label: "Good",
        sublabel: "3 days",
        bg: "hover:bg-blue-600",
        text: "text-blue-600",
        border: "border-blue-200",
        ring: "hover:ring-blue-300",
    },
    {
        grade: 4,
        label: "Easy",
        sublabel: "1 week+",
        bg: "hover:bg-green-600",
        text: "text-green-600",
        border: "border-green-200",
        ring: "hover:ring-green-300",
    },
];

const EXAMPLE_STYLE: Record<string, { dot: string; label: string }> = {
    Keigo: { dot: "bg-blue-500", label: "Keigo (丁寧語)" },
    Daily: { dot: "bg-green-500", label: "Daily (日常)" },
    Anime: { dot: "bg-purple-500", label: "Anime (アニメ)" },
};

/**
 * parsePitch — safe parse of the pitch_accent_data JSON column.
 * Returns [] if the value is null, malformed, or not an array.
 */
function parsePitch(raw: string | undefined | null): PitchDTO[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * parseSenses — safe parse of the senses JSONB column.
 */
function parseSenses(raw: string | undefined | null): SenseDTO[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function StudySession() {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    const { data: cards, isLoading } = useDueCards(deckId ?? null);
    const submitReview = useSubmitReview(deckId ?? "");

    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [done, setDone] = useState(false);
    const [grading, setGrading] = useState<Grade | null>(null);
    // Track how many we've graded each way in this session
    const [summary, setSummary] = useState({
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
    });

    const handleGrade = useCallback(
        async (grade: Grade) => {
            if (!cards) return;
            const card = cards[index];
            setGrading(grade);
            try {
                await submitReview.mutateAsync({
                    flashcardId: card.flashcardId,
                    grade,
                });
                setSummary((s) => ({
                    ...s,
                    again: grade === 1 ? s.again + 1 : s.again,
                    hard: grade === 2 ? s.hard + 1 : s.hard,
                    good: grade === 3 ? s.good + 1 : s.good,
                    easy: grade === 4 ? s.easy + 1 : s.easy,
                }));
                if (index + 1 >= cards.length) {
                    setDone(true);
                } else {
                    setIndex((i) => i + 1);
                    setFlipped(false);
                }
            } finally {
                setGrading(null);
            }
        },
        [cards, index, submitReview],
    );

    // ── Keyboard shortcuts: Space = flip, 1–4 = grade ────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === "INPUT") return;
            if (e.code === "Space") {
                e.preventDefault();
                setFlipped(true);
            } else if (
                flipped &&
                !grading &&
                ["1", "2", "3", "4"].includes(e.key)
            ) {
                handleGrade(Number(e.key) as Grade);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [flipped, grading, handleGrade]);

    // ── Loading ─────────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
                <p className="text-gray-400 text-sm">Loading due cards…</p>
            </div>
        );
    }

    // ── Session complete ─────────────────────────────────────────────────────────
    if (!cards || cards.length === 0 || done) {
        const reviewed =
            summary.again + summary.hard + summary.good + summary.easy;
        return (
            <div className="max-w-md mx-auto text-center py-20 space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 border border-green-100">
                    {reviewed > 0 ? (
                        <Trophy className="w-9 h-9 text-green-500" />
                    ) : (
                        <CheckCircle2 className="w-9 h-9 text-green-500" />
                    )}
                </div>

                {reviewed > 0 ? (
                    <>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Session complete!
                        </h2>
                        <p className="text-gray-500">
                            You reviewed {reviewed} card
                            {reviewed !== 1 ? "s" : ""}.
                        </p>

                        {/* Summary grid */}
                        <div className="grid grid-cols-4 gap-2 mt-4">
                            {[
                                {
                                    label: "Again",
                                    value: summary.again,
                                    color: "text-red-600 bg-red-50 border-red-100",
                                },
                                {
                                    label: "Hard",
                                    value: summary.hard,
                                    color: "text-orange-600 bg-orange-50 border-orange-100",
                                },
                                {
                                    label: "Good",
                                    value: summary.good,
                                    color: "text-blue-600 bg-blue-50 border-blue-100",
                                },
                                {
                                    label: "Easy",
                                    value: summary.easy,
                                    color: "text-green-600 bg-green-50 border-green-100",
                                },
                            ].map(({ label, value, color }) => (
                                <div
                                    key={label}
                                    className={`border rounded-xl py-3 ${color}`}
                                >
                                    <p className="text-xl font-bold">{value}</p>
                                    <p className="text-xs font-medium opacity-70">
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold tracking-tight">
                            All caught up!
                        </h2>
                        <p className="text-gray-500">
                            No cards due for review right now. Come back later.
                        </p>
                    </>
                )}

                <div className="flex gap-3 justify-center pt-2">
                    <Button
                        id="back-to-decks-btn"
                        onClick={() => navigate("/decks")}
                        className="bg-gray-900 hover:bg-gray-700 text-white"
                    >
                        Back to Decks
                    </Button>
                    <Button
                        id="search-more-btn"
                        variant="outline"
                        onClick={() => navigate("/")}
                    >
                        Search words
                    </Button>
                </div>
            </div>
        );
    }

    // ── Active review ────────────────────────────────────────────────────────────
    const card: ReviewCardResponse = cards[index];
    const total = cards.length;
    const progressPct = Math.round((index / total) * 100);

    const pitch = parsePitch(
        (card as never as { pitchAccentData?: string }).pitchAccentData,
    );
    const senses = parseSenses((card as never as { senses?: string }).senses);

    const playAudio = () => {
        if (!card.audioUrl) return;
        new Audio(`https://jotoba.de${card.audioUrl}`).play().catch(() => null);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Review Session
                    </h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        {index + 1} / {total} cards
                    </p>
                </div>
                <button
                    id="end-session-btn"
                    onClick={() => navigate("/decks")}
                    className="text-sm text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
                >
                    End session ✕
                </button>
            </div>

            {/* ── Progress bar ── */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {/* ── 3D Flip Card ── */}
            <div
                className="perspective cursor-pointer select-none"
                style={{ minHeight: 320 }}
                onClick={() => !flipped && setFlipped(true)}
                role="button"
                aria-label={flipped ? "Card revealed" : "Tap to reveal answer"}
            >
                <div
                    className={`preserve-3d relative transition-transform duration-500 ${flipped ? "rotate-y-180" : ""}`}
                    style={{ minHeight: 320 }}
                >
                    {/* ── FRONT ── */}
                    <div
                        className="backface-hidden absolute inset-0 flex flex-col items-center justify-center
            bg-white border-2 border-gray-200 rounded-2xl shadow-sm p-10 text-center"
                    >
                        {/* Keyword */}
                        <div className="mb-3">
                            {card.furigana ? (
                                <FuriganaText
                                    furigana={card.furigana}
                                    className="text-6xl font-black tracking-widest"
                                />
                            ) : (
                                <span className="text-6xl font-black tracking-widest">
                                    {card.keyword}
                                </span>
                            )}
                        </div>

                        {/* Audio */}
                        {card.audioUrl && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playAudio();
                                }}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors mb-2"
                                aria-label="Play pronunciation"
                            >
                                <Volume2 className="w-5 h-5" />
                            </button>
                        )}

                        {/* Tap hint */}
                        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-1.5 text-xs text-gray-300">
                            <ChevronRight className="w-3.5 h-3.5" />
                            Tap to reveal
                        </div>
                    </div>

                    {/* ── BACK ── */}
                    <div
                        className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col
              bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Back header */}
                        <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-start gap-3">
                            <div className="flex-1">
                                {card.furigana ? (
                                    <FuriganaText
                                        furigana={card.furigana}
                                        className="text-2xl font-black"
                                    />
                                ) : (
                                    <span className="text-2xl font-black">
                                        {card.keyword}
                                    </span>
                                )}
                            </div>
                            {card.audioUrl && (
                                <button
                                    onClick={playAudio}
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors shrink-0"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="px-6 py-4 space-y-5 flex-1">
                            {/* Pitch accent */}
                            {pitch.length > 0 && (
                                <PitchAccentSVG pitch={pitch} />
                            )}

                            {/* Senses (structured) or fallback to meanings[] */}
                            {senses.length > 0 ? (
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">
                                        Meanings
                                    </p>
                                    <ol className="space-y-2">
                                        {senses.map((s, i) => (
                                            <li key={i} className="flex gap-2">
                                                <span className="text-gray-300 text-xs font-mono min-w-[1.2rem] pt-0.5">
                                                    {i + 1}.
                                                </span>
                                                <div className="flex-1">
                                                    <span className="text-gray-800 text-sm">
                                                        {s.glosses.join(", ")}
                                                    </span>
                                                    {s.misc.length > 0 && (
                                                        <span className="ml-2 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded">
                                                            {s.misc[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                {s.pos.length > 0 && (
                                                    <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 rounded shrink-0">
                                                        {s.pos[0]}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">
                                        Meanings
                                    </p>
                                    <p className="text-gray-800 font-medium">
                                        {card.meanings.slice(0, 4).join("; ")}
                                    </p>
                                </div>
                            )}

                            {/* AI examples */}
                            {card.examples.length > 0 ? (
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">
                                        Examples
                                    </p>
                                    <div className="space-y-2">
                                        {card.examples.map((ex) => {
                                            const cfg =
                                                EXAMPLE_STYLE[
                                                    ex.contextStyle
                                                ] ?? EXAMPLE_STYLE.Daily;
                                            return (
                                                <div
                                                    key={ex.id}
                                                    className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3"
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                                                        />
                                                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                                                            {cfg.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium">
                                                        {ex.furiganaSentence ? (
                                                            <FuriganaText
                                                                furigana={
                                                                    ex.furiganaSentence
                                                                }
                                                            />
                                                        ) : (
                                                            ex.japaneseSentence
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {
                                                            ex.vietnameseTranslation
                                                        }
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg px-4 py-3">
                                    <BookOpen className="w-4 h-4 shrink-0" />
                                    AI examples are still generating — check
                                    back soon.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Grade buttons ── */}
            <div
                className={`grid grid-cols-4 gap-2.5 transition-all duration-300 ${flipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
            >
                {GRADE_CONFIG.map(
                    ({ grade, label, sublabel, bg, text, border, ring }) => (
                        <button
                            key={grade}
                            id={`grade-btn-${grade}`}
                            disabled={!!grading}
                            onClick={() => handleGrade(grade)}
                            className={`h-16 flex flex-col items-center justify-center rounded-xl border-2
              font-semibold transition-all duration-150 ring-2 ring-transparent
              ${border} ${ring} hover:text-white ${bg}
              ${grading === grade ? "scale-95 opacity-70" : ""}
              ${grading && grading !== grade ? "opacity-40" : ""}
              ${text}`}
                        >
                            {grading === grade ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span className="text-sm font-bold">
                                        {label}
                                    </span>
                                    <span className="text-xs opacity-60 font-normal">
                                        {sublabel}
                                    </span>
                                </>
                            )}
                        </button>
                    ),
                )}
            </div>

            {/* ── Keyboard hint ── */}
            <p className="text-center text-xs text-gray-300">
                {flipped ? "Press 1–4 to grade" : "Press Space to flip"}
            </p>
        </div>
    );
}
