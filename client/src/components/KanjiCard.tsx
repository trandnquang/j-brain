import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { KanjiStrokeOrder, KanjiStrokeCount } from "./KanjiStrokeOrder";
import type { KanjiResultDTO } from "../types/api";

interface Props {
    kanji: KanjiResultDTO;
    onPartClick: (char: string) => void;
}

/**
 * KanjiCard — full detail kanji card per the spec.
 * Shows: literal (massive), meanings, readings, radical, grade, JLPT,
 * Chinese/Korean readings, parts as clickable buttons, stroke count,
 * and an animated stroke order widget (hanzi-writer).
 */
export function KanjiCard({ kanji, onPartClick }: Props) {
    const [showAnimation, setShowAnimation] = useState(false);

    return (
        <article className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex gap-0">
                {/* ── Left panel: big literal + stroke animation ── */}
                <div className="flex flex-col items-center justify-start pt-6 px-6 bg-gray-50 border-r border-gray-100 min-w-[140px] gap-3">
                    <span className="text-7xl font-black leading-none">
                        {kanji.literal}
                    </span>
                    <KanjiStrokeCount count={kanji.strokeCount} />

                    <button
                        onClick={() => setShowAnimation((v) => !v)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        {showAnimation ? (
                            <ChevronUp className="w-3 h-3" />
                        ) : (
                            <ChevronDown className="w-3 h-3" />
                        )}
                        {showAnimation ? "Hide" : "Stroke order"}
                    </button>

                    {showAnimation && (
                        <KanjiStrokeOrder
                            character={kanji.literal}
                            size={112}
                        />
                    )}

                    {/* Meta badges */}
                    <div className="flex flex-col items-center gap-1 text-center">
                        {kanji.jlptLevel && (
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 rounded-full">
                                JLPT N{kanji.jlptLevel}
                            </span>
                        )}
                        {kanji.grade && (
                            <span className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                                Grade {kanji.grade}
                            </span>
                        )}
                        {kanji.radical && (
                            <div className="text-xs text-gray-400 mt-1">
                                Radical:{" "}
                                <span className="text-gray-700 font-medium text-base">
                                    {kanji.radical}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right panel: meanings + readings ── */}
                <div className="flex-1 px-5 py-5 space-y-4">
                    {/* Meanings */}
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1">
                            Meanings
                        </p>
                        <p className="text-gray-800 font-medium">
                            {kanji.meanings.join(", ")}
                        </p>
                    </div>

                    {/* Readings grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {kanji.onyomi.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1.5">
                                    On'yomi
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {kanji.onyomi.map((r) => (
                                        <span
                                            key={r}
                                            className="px-2 py-0.5 bg-gray-100 rounded-md text-sm font-mono text-gray-800"
                                        >
                                            {r}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {kanji.kunyomi.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1.5">
                                    Kun'yomi
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {kanji.kunyomi.map((r) => (
                                        <span
                                            key={r}
                                            className="px-2 py-0.5 bg-gray-100 rounded-md text-sm font-mono text-gray-800"
                                        >
                                            {r}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Parts (clickable) */}
                    {kanji.parts.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1.5">
                                Parts
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {kanji.parts.map((p) => (
                                    <button
                                        key={p}
                                        id={`part-btn-${p}`}
                                        onClick={() => onPartClick(p)}
                                        disabled={p === kanji.literal}
                                        className={`px-2 py-1 text-lg font-bold rounded-lg border transition-all duration-150
                      ${
                          p === kanji.literal
                              ? "bg-gray-50 border-gray-200 text-gray-400 cursor-default"
                              : "bg-white border-gray-200 hover:bg-gray-900 hover:text-white hover:border-gray-900 cursor-pointer"
                      }`}
                                        title={`Search kanji: ${p}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Similar kanji */}
                    {kanji.similar.length > 0 && (
                        <div>
                            <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1.5">
                                Similar
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {kanji.similar.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => onPartClick(s)}
                                        className="px-2 py-1 text-base font-bold bg-white border border-dashed border-gray-300
                      rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-150"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chinese/Korean readings */}
                    {(kanji.chinese.length > 0 ||
                        kanji.koreanRomaji.length > 0) && (
                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                            {kanji.chinese.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">
                                        Chinese (Pinyin)
                                    </p>
                                    <p className="text-sm text-gray-700 font-mono">
                                        {kanji.chinese.join(", ")}
                                    </p>
                                </div>
                            )}
                            {kanji.koreanRomaji.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 font-medium mb-1">
                                        Korean
                                        {kanji.koreanHangul.length > 0 &&
                                            ` (${kanji.koreanHangul.join(", ")})`}
                                    </p>
                                    <p className="text-sm text-gray-700 font-mono">
                                        {kanji.koreanRomaji.join(", ")}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
