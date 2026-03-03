import { X, Volume2, Plus, Loader2, Sparkles, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import {
    useDecks,
    useCreateFlashcard,
    useGenerateExamples,
} from "../hooks/useApi";
import { Button } from "./ui/button";
import { FuriganaText } from "./FuriganaText";
import { PitchAccentSVG } from "./PitchAccentSVG";
import type { WordResultDTO, ExampleResponse } from "../types/api";

interface Props {
    result: WordResultDTO | null;
    onClose: () => void;
}

// Style display config: colour + label for each context style
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
 * WordDetailDrawer — slide-in right panel with full word details and AI examples.
 *
 * Phase 3B: On drawer open, fires the non-persisting AI generation endpoint
 * immediately. Examples are shown inline. On "Add to Deck", examples are sent
 * in the flashcard request body and persisted atomically — no second AI call.
 */
export function WordDetailDrawer({ result, onClose }: Props) {
    const { data: deckList } = useDecks();
    const createFlashcard = useCreateFlashcard();
    const generateExamples = useGenerateExamples();

    const [selectedDeckId, setSelectedDeckId] = useState("");
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [examples, setExamples] = useState<ExampleResponse[]>([]);

    // Reset state every time a new word is opened
    useEffect(() => {
        if (!result) return;
        setSaved(false);
        setSaving(false);
        setError(null);
        setExamples([]);
        setSelectedDeckId("");

        // Trigger AI generation immediately on open (spec: only fires on detail view)
        const meanings = result.senses.flatMap((s) => s.glosses);
        generateExamples.mutate(
            { keyword: result.keyword ?? result.kana, meanings },
            {
                onSuccess: (data) => {
                    if (data) setExamples(data);
                },
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result?.kana]);

    if (!result) return null;

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
            const meanings = result.senses.flatMap((s) => s.glosses);
            const partOfSpeech = [
                ...new Set(result.senses.flatMap((s) => s.pos)),
            ];

            await createFlashcard.mutateAsync({
                deckId: selectedDeckId,
                cardType: "WORD",
                keyword: result.keyword ?? result.kana,
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
                // Pass pre-generated examples → backend saves inline, no second AI call
                preGeneratedExamples:
                    examples.length > 0 ? examples : undefined,
            });
            setSaved(true);
        } catch (e: unknown) {
            setError((e as { message?: string })?.message ?? "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const displayKeyword = result.keyword ?? result.kana;
    const isGenerating = generateExamples.isPending;

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
                        {result.keyword && (
                            <p className="text-gray-400 mt-0.5">
                                {result.kana}
                            </p>
                        )}
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
                    {/* Common badge */}
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

                    {/* ── Senses ── */}
                    <section>
                        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> Meanings
                        </h3>
                        <ol className="space-y-3">
                            {result.senses.map((sense, i) => (
                                <li key={i} className="flex gap-3">
                                    <span className="text-gray-300 font-mono text-sm min-w-[1.2rem] pt-0.5">
                                        {i + 1}.
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-800">
                                            {sense.glosses.join(", ")}
                                        </p>
                                        {sense.misc.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {sense.misc.map((m) => (
                                                    <span
                                                        key={m}
                                                        className="px-1.5 py-0.5 text-[11px] bg-amber-50 text-amber-700 border border-amber-200 rounded"
                                                    >
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {sense.pos.length > 0 && (
                                        <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded shrink-0 text-right leading-snug">
                                            {sense.pos[0]}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* ── Pitch accent ── */}
                    {result.pitch.length > 0 && (
                        <section>
                            <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">
                                Pitch Accent
                            </h3>
                            <PitchAccentSVG pitch={result.pitch} />
                        </section>
                    )}

                    {/* ── Kanji components ── */}
                    {result.kanjiComponents.length > 0 && (
                        <section>
                            <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">
                                Kanji Components
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {result.kanjiComponents.map((c) => (
                                    <span
                                        key={c}
                                        className="px-3 py-1.5 text-xl font-bold bg-gray-50 border border-gray-200 rounded-lg"
                                    >
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── AI Examples (Phase 3B) ── */}
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
                                    This takes 5–30 s with a local LLM
                                </p>
                            </div>
                        )}

                        {!isGenerating && examples.length === 0 && (
                            <div className="border border-dashed border-gray-200 rounded-xl px-4 py-6 text-center text-gray-400 text-sm">
                                {generateExamples.isError
                                    ? "⚠ LM Studio is not reachable. Start LM Studio to generate examples."
                                    : "No examples returned. Check that LM Studio is running."}
                            </div>
                        )}

                        <div className="space-y-3">
                            {examples.map((ex) => {
                                const cfg =
                                    STYLE_CONFIG[ex.contextStyle] ??
                                    STYLE_CONFIG.Daily;
                                return (
                                    <div
                                        key={ex.contextStyle}
                                        className={`rounded-xl border px-4 py-3 ${cfg.accent}`}
                                    >
                                        {/* Style label */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span
                                                className={`w-2 h-2 rounded-full ${cfg.dot}`}
                                            />
                                            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                                                {cfg.label}
                                            </span>
                                        </div>
                                        {/* Japanese sentence */}
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
                                        {/* Vietnamese translation */}
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
