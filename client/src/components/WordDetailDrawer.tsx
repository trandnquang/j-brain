import { X, Volume2, Plus, Loader2, Sparkles, BookOpen } from "lucide-react";
import { useDecks, useFlashcards, useCreateFlashcard, useAiExamples } from "../hooks/useApi";
import { Button } from "./ui/button";
import { FuriganaText } from "./FuriganaText";
import { PitchAccentSVG } from "./PitchAccentSVG";
import { SenseRow } from "./SenseRow";
import { KanjiPill } from "./KanjiPill";
import { useState, useEffect } from "react";
import type { WordResultDTO, ExampleResponse } from "../types/api";

interface Props {
    result: WordResultDTO | null;
    onClose: () => void;
    /** Called when user clicks a kanji component pill or an xref link */
    onNavigate?: (keyword: string, mode?: "words" | "kanji") => void;
}

const STYLE_CONFIG: Record<
    string,
    { label: string; accent: string; dot: string }
> = {
    Keigo: {
        label: "Keigo (丁寧語)",
        accent: "bg-blue-50 border-blue-200",
        dot: "bg-blue-500",
    },
    Daily: {
        label: "Daily (日常)",
        accent: "bg-green-50 border-green-200",
        dot: "bg-green-500",
    },
    Anime: {
        label: "Anime (アニメ)",
        accent: "bg-purple-50 border-purple-200",
        dot: "bg-purple-500",
    },
};

/**
 * WordDetailDrawer — slide-in right panel with full word detail and AI examples.
 *
 * Phase 3B/Refactor:
 * - AI examples via useAiExamples (useQuery, staleTime:Infinity) — no re-fire on remount
 * - SenseRow renders each sense with contextual tags (field, xref, information, misc)
 * - KanjiPill → onNavigate for clickable kanji navigation
 * - Duplicate kana header removed
 */
export function WordDetailDrawer({ result, onClose, onNavigate }: Props) {
    const { data: deckList } = useDecks();
    const createFlashcard = useCreateFlashcard();

    const [selectedDeckId, setSelectedDeckId] = useState("");
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** WHY: Reset save-to-deck UI when switching between words to prevent stale "Saved" state. */
    useEffect(() => {
        setSaved(false);
        setSaving(false);
        setError(null);
    }, [result?.keyword, result?.kana]);

    /**
     * WHY: Fetch flashcards for the selected deck so we can detect duplicates
     * client-side, preventing a 409 Conflict from the backend unique constraint.
     */
    const { data: deckCards } = useFlashcards(selectedDeckId || null);

    /** Auto-detect if the current word already exists in the selected deck. */
    useEffect(() => {
        if (!deckCards || !result) return;
        const displayKw = result.keyword ?? result.kana;
        const exists = deckCards.some((c) => c.keyword === displayKw);
        if (exists) setSaved(true);
    }, [deckCards, result]);
    // ── AI examples via useQuery (cached per keyword, no re-fire on remount) ───
    const meanings = result?.senses.flatMap((s) => s.glosses) ?? [];
    const keyword = result?.keyword ?? result?.kana ?? null;
    const { data: examples = [], isFetching: isGenerating } = useAiExamples(
        keyword,
        meanings,
        !!result, // only enabled when a word is open
    );

    if (!result) return null;

    const displayKeyword = result.keyword ?? result.kana;

    const playAudio = () => {
        if (!result.audioUrl) return;
        new Audio(`https://jotoba.de${result.audioUrl}`)
            .play()
            .catch(() => null);
    };

    const handleAdd = async () => {
        if (!selectedDeckId) {
            setError("Please choose a deck.");
            return;
        }
        setError(null);
        setSaving(true);
        try {
            const partOfSpeech = [
                ...new Set(result.senses.flatMap((s) => s.pos)),
            ];
            await createFlashcard.mutateAsync({
                deckId: selectedDeckId,
                cardType: "WORD",
                keyword: displayKeyword,
                kana: result.kana,
                furigana: result.furigana ?? undefined,
                common: result.common,
                serializedSenses: JSON.stringify(result.senses),
                meanings: meanings.length > 0 ? meanings : [result.kana],
                partOfSpeech,
                serializedPitchAccent:
                    result.pitch.length > 0
                        ? JSON.stringify(result.pitch)
                        : undefined,
                audioUrl: result.audioUrl ?? undefined,
                kanjiComponents: result.kanjiComponents,
                preGeneratedExamples:
                    examples.length > 0
                        ? (examples as ExampleResponse[])
                        : undefined,
            });
            setSaved(true);
        } catch (e: unknown) {
            setError((e as { message?: string })?.message ?? "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Drawer */}
            <aside
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50
        overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300"
            >
                {/* ── Header ── */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
                    <div>
                        {result.furigana ? (
                            <FuriganaText
                                furigana={result.furigana}
                                className="text-3xl font-black tracking-tight"
                            />
                        ) : (
                            <h2 className="text-3xl font-black tracking-tight">
                                {displayKeyword}
                            </h2>
                        )}
                        {/* Item 4: removed duplicate kana <p> — kana is already in the ruby above */}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        {result.audioUrl && (
                            <button
                                onClick={playAudio}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                aria-label="Play pronunciation"
                            >
                                <Volume2 className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 px-6 py-6 space-y-7">
                    {result.common && (
                        <div className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                            <span
                                className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-black
                flex items-center justify-center"
                            >
                                C
                            </span>
                            Common vocabulary word
                        </div>
                    )}

                    {/* ── Senses (Item 4 / 7 / 8) ── */}
                    <section>
                        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> Meanings
                        </h3>
                        <ol className="space-y-3">
                            {result.senses.map((sense, i) => (
                                <SenseRow
                                    key={i}
                                    sense={sense}
                                    index={i}
                                    onXrefClick={(xref) =>
                                        onNavigate?.(xref, "words")
                                    }
                                />
                            ))}
                        </ol>
                    </section>

                    {/* ── Pitch accent (Item 5) ── */}
                    {result.pitch.length > 0 && (
                        <section>
                            <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">
                                Pitch Accent
                            </h3>
                            <PitchAccentSVG pitch={result.pitch} />
                        </section>
                    )}

                    {/* ── Kanji components (Item 7 — KanjiPill) ── */}
                    {result.kanjiComponents.length > 0 && (
                        <section>
                            <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">
                                Kanji Components
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {result.kanjiComponents.map((c) => (
                                    <KanjiPill
                                        key={c}
                                        char={c}
                                        onSelect={(char) =>
                                            onNavigate?.(char, "kanji")
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── AI Examples (Item 2 — cached via useQuery) ── */}
                    <section>
                        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Example Sentences
                            {isGenerating && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin ml-1 text-blue-400" />
                            )}
                        </h3>

                        {isGenerating && examples.length === 0 && (
                            <div className="border border-dashed border-gray-200 rounded-xl px-4 py-8 text-center text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-300" />
                                <p className="text-sm">
                                    Generating Keigo · Daily · Anime examples…
                                </p>
                                <p className="text-xs mt-1">
                                    First open takes 5–30 s with a local LLM
                                </p>
                            </div>
                        )}

                        {!isGenerating && examples.length === 0 && (
                            <div className="border border-dashed border-gray-200 rounded-xl px-4 py-6 text-center text-gray-400 text-sm">
                                ⚠ LM Studio not reachable — start LM Studio to
                                generate examples.
                            </div>
                        )}

                        <div className="space-y-3">
                            {(examples as ExampleResponse[]).map((ex) => {
                                const cfg =
                                    STYLE_CONFIG[ex.contextStyle] ??
                                    STYLE_CONFIG.Daily;
                                return (
                                    <div
                                        key={ex.contextStyle}
                                        className={`rounded-xl border px-4 py-3 ${cfg.accent}`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span
                                                className={`w-2 h-2 rounded-full ${cfg.dot}`}
                                            />
                                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-base font-medium leading-relaxed mb-1">
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
                                        <p className="text-sm text-gray-500">
                                            {ex.vietnameseTranslation}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* ── Footer — Add to Deck ── */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3">
                    {!deckList || deckList.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center">
                            Create a deck first to save this word.
                        </p>
                    ) : (
                        <>
                            <select
                                id="drawer-deck-select"
                                className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm
                  focus:outline-none focus:ring-2 focus:ring-gray-300"
                                value={selectedDeckId}
                                onChange={(e) => {
                                    setSelectedDeckId(e.target.value);
                                    setError(null);
                                }}
                                disabled={saved}
                            >
                                <option value="">— Choose a deck —</option>
                                {deckList.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                            {error && (
                                <p className="text-sm text-red-600">{error}</p>
                            )}
                            <Button
                                id="drawer-add-btn"
                                className="w-full h-11"
                                disabled={saved || saving || !selectedDeckId}
                                onClick={handleAdd}
                                style={
                                    saved
                                        ? {
                                              backgroundColor: "#16a34a",
                                              color: "white",
                                          }
                                        : undefined
                                }
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : saved ? (
                                    "Saved to Deck ✓"
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        {isGenerating
                                            ? "Add to Deck (generating…)"
                                            : "Add to Deck"}
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
}
