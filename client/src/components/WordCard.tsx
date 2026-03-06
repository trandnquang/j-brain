import { useState } from "react";
import { Volume2, ArrowRight } from "lucide-react";
import { FuriganaText } from "./FuriganaText";
import { PitchAccentSVG } from "./PitchAccentSVG";
import type { WordResultDTO } from "../types/api";

interface Props {
    word: WordResultDTO;
    isActive: boolean;
    onClick: () => void;
    onKanjiClick: (char: string) => void;
    /** Called when user clicks a "See also" xref link on the card */
    onXrefClick?: (keyword: string) => void;
}

/**
 * WordCard — full inline display of one Jotoba word result.
 *
 * Phase 1 changes:
 * - Renders ALL sense contextual tags inline: pos, misc, field, xref, information
 * - Furigana container uses min-w-0 + break-words to prevent layout overflow
 * - Kanji component buttons + pitch accent in footer
 */
export function WordCard({ word, isActive, onClick, onKanjiClick, onXrefClick }: Props) {
    const [audioPlaying, setAudioPlaying] = useState(false);

    const playAudio = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!word.audioUrl || audioPlaying) return;
        const audio = new Audio(`https://jotoba.de${word.audioUrl}`);
        setAudioPlaying(true);
        audio.play().catch(() => null).finally(() => setAudioPlaying(false));
    };

    const displayKeyword = word.keyword ?? word.kana;

    return (
        <article
            id={`word-card-${displayKeyword}`}
            onClick={onClick}
            className={`rounded-2xl border bg-white cursor-pointer transition-all duration-200
                hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5
                ${isActive ? "border-blue-400 shadow-lg ring-1 ring-blue-200" : "border-gray-200"}`}
        >
            {/* ── Header: furigana + badges ── */}
            <div className="px-5 pt-5 pb-3 flex items-start gap-3">
                {/* Word — min-w-0 prevents ruby overflow from stretching the card */}
                <div className="flex-1 min-w-0 overflow-hidden">
                    {word.furigana ? (
                        <FuriganaText
                            furigana={word.furigana}
                            className="text-3xl font-black tracking-tight leading-relaxed break-words"
                        />
                    ) : (
                        <span className="text-3xl font-black tracking-tight break-words">
                            {displayKeyword}
                        </span>
                    )}
                    {/* Kana reading below — only shown when there is a kanji form */}
                    {word.keyword && (
                        <p className="text-sm text-gray-400 mt-0.5 font-normal">{word.kana}</p>
                    )}
                </div>

                {/* Right: common badge + audio */}
                <div className="flex items-center gap-2 shrink-0 pt-1">
                    {word.common && (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full
                            bg-emerald-500 text-white text-[11px] font-black"
                            title="Common word">
                            C
                        </span>
                    )}
                    {word.audioUrl && (
                        <button
                            aria-label="Play pronunciation"
                            onClick={playAudio}
                            className={`p-1.5 rounded-full transition-colors
                            ${audioPlaying
                                ? "bg-blue-100 text-blue-600"
                                : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}`}
                        >
                            <Volume2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Senses — all contextual tags inline ── */}
            <div className="px-5 pb-3 space-y-2.5">
                {word.senses.map((sense, i) => (
                    <div key={i} className="flex items-start gap-2">
                        {/* Sense number */}
                        <span className="text-gray-300 font-mono text-xs mt-[3px] min-w-[1.2rem] shrink-0">
                            {i + 1}.
                        </span>

                        <div className="flex-1 min-w-0">
                            {/* Glosses */}
                            <span className="text-gray-800 text-sm leading-relaxed">
                                {sense.glosses.join(", ")}
                            </span>

                            {/* Contextual tag row (information, misc[], field, xref) */}
                            {(sense.information || sense.misc.length > 0 || sense.field || sense.xref) && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {sense.information && (
                                        <span className="px-1.5 py-0.5 text-[11px] bg-gray-50 text-gray-500 border border-gray-200 rounded">
                                            {sense.information}
                                        </span>
                                    )}
                                    {sense.misc.map((m) => (
                                        <span key={m} className="px-1.5 py-0.5 text-[11px] bg-amber-50 text-amber-700 border border-amber-200 rounded capitalize">
                                            {m}
                                        </span>
                                    ))}
                                    {sense.field && (
                                        <span className="px-1.5 py-0.5 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                            {sense.field} term
                                        </span>
                                    )}
                                    {sense.xref && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onXrefClick?.(sense.xref!);
                                            }}
                                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px]
                                                bg-blue-50 text-blue-600 border border-blue-200 rounded
                                                hover:bg-blue-100 transition-colors"
                                        >
                                            <ArrowRight className="w-2.5 h-2.5" />
                                            {sense.xref}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* POS badge — self-start prevents vertical stretch */}
                        {sense.pos.length > 0 && (
                            <div className="flex flex-col gap-0.5 items-end self-start shrink-0">
                                {sense.pos.map((p) => (
                                    <span key={p}
                                        className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100
                                            px-1.5 py-0.5 rounded whitespace-nowrap leading-tight">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Footer: kanji buttons + pitch accent ── */}
            <div className="px-5 pb-4 flex items-end justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                    {word.kanjiComponents.map((char) => (
                        <button
                            key={char}
                            id={`kanji-btn-${char}`}
                            onClick={(e) => { e.stopPropagation(); onKanjiClick(char); }}
                            className="px-2 py-1 text-lg font-bold bg-gray-50 border border-gray-200 rounded-lg
                                hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-150"
                            title={`Search kanji: ${char}`}
                        >
                            {char}
                        </button>
                    ))}
                </div>
                {word.pitch.length > 0 && <PitchAccentSVG pitch={word.pitch} />}
            </div>
        </article>
    );
}
