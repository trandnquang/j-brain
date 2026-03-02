import { X, Volume2, Plus, Loader2 } from "lucide-react";
import { useDecks, useCreateFlashcard } from "../hooks/useApi";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { SearchResultDTO, ApiError, ExampleResponse } from "../types/api";
import { useState } from "react";

interface Props {
    result: SearchResultDTO | null;
    onClose: () => void;
}

/**
 * Slide-in right drawer that shows the full detail of a Jotoba search result.
 * Houses the "Add to Deck" action so the user can save from within the detail view.
 */
export function WordDetailDrawer({ result, onClose }: Props) {
    const { data: deckList } = useDecks();
    const createFlashcard = useCreateFlashcard();

    const [selectedDeckId, setSelectedDeckId] = useState("");
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            await createFlashcard.mutateAsync({
                deckId: selectedDeckId,
                cardType: result.cardType,
                keyword: result.keyword,
                furigana: result.furigana ?? undefined,
                meanings: result.meanings,
                partOfSpeech: result.partOfSpeech ?? undefined,
                pitchAccentData: result.pitchAccentData ?? undefined,
                audioUrl: result.audioUrl ?? undefined,
                strokeCount: result.strokeCount ?? undefined,
                jlptLevel: result.jlptLevel ?? undefined,
                onyomi: result.onyomi ?? undefined,
                kunyomi: result.kunyomi ?? undefined,
            });
            setSaved(true);
        } catch (err) {
            setError((err as ApiError)?.message ?? "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    // Strip Jotoba bracket furigana  [走|はし]る  →  走る
    const stripFurigana = (f: string) =>
        f.replace(/\[([^|]+)\|[^\]]+\]/g, "$1");
    // Extract only the reading (kana)  [走|はし]る  →  はしる
    const extractReading = (f: string) =>
        f.replace(/\[([^|]*)\|([^\]]*)\]/g, "$2");

    return (
        <>
            {/* ── Backdrop ── */}
            <div
                className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* ── Drawer panel ── */}
            <aside className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">
                            {result.keyword}
                        </h2>
                        {result.furigana && (
                            <p className="text-gray-400 mt-0.5">
                                {extractReading(result.furigana)}
                                <span className="text-gray-300 mx-2">·</span>
                                {stripFurigana(result.furigana)}
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

                {/* Body */}
                <div className="flex-1 px-6 py-6 space-y-7">
                    {/* Tags */}
                    {result.partOfSpeech && result.partOfSpeech.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {result.partOfSpeech.map((pos) => (
                                <Badge
                                    key={pos}
                                    variant="outline"
                                    className="border-blue-200 text-blue-700 bg-blue-50 text-xs"
                                >
                                    {pos}
                                </Badge>
                            ))}
                            {result.jlptLevel && (
                                <Badge
                                    variant="outline"
                                    className="border-red-200 text-red-700 bg-red-50 text-xs"
                                >
                                    JLPT N{result.jlptLevel}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Meanings */}
                    <section>
                        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">
                            Meanings
                        </h3>
                        <ol className="space-y-2">
                            {result.meanings.map((m, i) => (
                                <li key={i} className="flex gap-3">
                                    <span className="text-gray-300 font-mono text-sm min-w-[1.2rem] pt-0.5">
                                        {i + 1}.
                                    </span>
                                    <span className="text-gray-800">{m}</span>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* Kanji-only: readings */}
                    {result.cardType === "KANJI" &&
                        (result.onyomi || result.kunyomi) && (
                            <section className="grid grid-cols-2 gap-4">
                                {result.onyomi && result.onyomi.length > 0 && (
                                    <div>
                                        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">
                                            On'yomi
                                        </h3>
                                        <div className="flex flex-wrap gap-1">
                                            {result.onyomi.map((r) => (
                                                <span
                                                    key={r}
                                                    className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono"
                                                >
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {result.kunyomi &&
                                    result.kunyomi.length > 0 && (
                                        <div>
                                            <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-2">
                                                Kun'yomi
                                            </h3>
                                            <div className="flex flex-wrap gap-1">
                                                {result.kunyomi.map((r) => (
                                                    <span
                                                        key={r}
                                                        className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono"
                                                    >
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                {result.strokeCount && (
                                    <div>
                                        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1">
                                            Strokes
                                        </h3>
                                        <span className="text-lg font-bold">
                                            {result.strokeCount}
                                        </span>
                                    </div>
                                )}
                            </section>
                        )}

                    {/* Pitch accent */}
                    {result.pitchAccentData &&
                        result.pitchAccentData.length > 0 && (
                            <section>
                                <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">
                                    Pitch Accent
                                </h3>
                                <div className="flex items-end gap-0.5">
                                    {result.pitchAccentData.map((p, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <div
                                                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold border ${
                                                    p.high
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "bg-white text-gray-700 border-gray-300"
                                                }`}
                                            >
                                                {p.part}
                                            </div>
                                            <span className="text-[10px] text-gray-400">
                                                {p.high ? "H" : "L"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                    {/* AI Examples placeholder */}
                    <section>
                        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-3">
                            AI Examples
                        </h3>
                        {saved ? (
                            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
                                ✓ Card saved! AI examples are being generated —
                                go to the deck to review when ready.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg px-4 py-3 text-center">
                                Add this word to a deck to generate 3 AI example
                                sentences (Keigo · Daily · Anime).
                            </p>
                        )}
                    </section>
                </div>

                {/* Footer — Add to Deck */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3">
                    {deckList && deckList.length > 0 ? (
                        <>
                            <select
                                className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
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
                                style={{
                                    backgroundColor: saved
                                        ? "#16a34a"
                                        : undefined,
                                    color: saved ? "white" : undefined,
                                }}
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : saved ? (
                                    "Saved to Deck ✓"
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add to Deck
                                    </>
                                )}
                            </Button>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 text-center">
                            Create a deck first to save this word.
                        </p>
                    )}
                </div>
            </aside>
        </>
    );
}
