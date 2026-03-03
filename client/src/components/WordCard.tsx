import { useState } from "react";
import { Volume2 } from "lucide-react";
import { FuriganaText } from "./FuriganaText";
import { PitchAccentSVG } from "./PitchAccentSVG";
import { Badge } from "./ui/badge";
import type { WordResultDTO } from "../types/api";

interface Props {
    word: WordResultDTO;
    isActive: boolean;
    onClick: () => void;
    onKanjiClick: (char: string) => void;
}

/**
 * WordCard — displays one Jotoba word result with:
 * - Furigana ruby above kanji
 * - Common badge (green "C")
 * - Numbered senses with POS on right, misc tags below
 * - Kanji component buttons (→ dispatch kanji tab search)
 * - Pitch accent SVG (bottom-right)
 * - Audio playback button
 */
export function WordCard({ word, isActive, onClick, onKanjiClick }: Props) {
    const [audioPlaying, setAudioPlaying] = useState(false);

    const playAudio = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!word.audioUrl || audioPlaying) return;
        const audio = new Audio(`https://jotoba.de${word.audioUrl}`);
        setAudioPlaying(true);
        audio
            .play()
            .catch(() => null)
            .finally(() => setAudioPlaying(false));
    };

    const displayKeyword = word.keyword ?? word.kana;
    const hasFurigana = !!word.furigana;

    return (
        <article
            id={`word-card-${displayKeyword}`}
            onClick={onClick}
            className={`rounded-2xl border bg-white cursor-pointer transition-all duration-200
        hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5
        ${isActive ? "border-blue-400 shadow-lg ring-1 ring-blue-200" : "border-gray-200"}`}
        >
            {/* ── Header row ── */}
            <div className="px-5 pt-5 pb-3 flex items-start gap-3">
                {/* Word + furigana */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {hasFurigana ? (
                            <FuriganaText
                                furigana={word.furigana!}
                                className="text-3xl font-black tracking-tight leading-relaxed"
                            />
                        ) : (
                            <span className="text-3xl font-black tracking-tight">
                                {displayKeyword}
                            </span>
                        )}
                        {/* Kana reading below if there's a separate kanji form */}
                        {word.keyword && (
                            <span className="text-base text-gray-400 font-normal leading-loose">
                                ({word.kana})
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: audio + common badge */}
                <div className="flex items-center gap-2 shrink-0 pt-1">
                    {word.common && (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-black">
                            C
                        </span>
                    )}
                    {word.audioUrl && (
                        <button
                            aria-label="Play pronunciation"
                            onClick={playAudio}
                            className={`p-1.5 rounded-full transition-colors
                ${audioPlaying ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}`}
                        >
                            <Volume2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Senses ── */}
            <div className="px-5 pb-3 space-y-2">
                {word.senses.map((sense, i) => (
                    <div key={i} className="flex items-start gap-2">
                        {/* Sense number */}
                        <span className="text-gray-300 font-mono text-xs mt-1 min-w-[1.2rem]">
                            {i + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                            {/* Glosses */}
                            <span className="text-gray-800 text-sm leading-relaxed">
                                {sense.glosses.join(", ")}
                            </span>
                            {/* Misc tags */}
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
                        {/* POS on right */}
                        {sense.pos.length > 0 && (
                            <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded shrink-0 max-w-[120px] text-right leading-snug">
                                {sense.pos[0]}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* ── Footer: kanji buttons + pitch accent ── */}
            <div className="px-5 pb-4 flex items-end justify-between gap-3">
                {/* Kanji component buttons */}
                <div className="flex flex-wrap gap-1.5">
                    {word.kanjiComponents.map((char) => (
                        <button
                            key={char}
                            id={`kanji-btn-${char}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onKanjiClick(char);
                            }}
                            className="px-2 py-1 text-lg font-bold bg-gray-50 border border-gray-200 rounded-lg
                hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-150"
                            title={`Search kanji: ${char}`}
                        >
                            {char}
                        </button>
                    ))}
                </div>
                {/* Pitch accent */}
                {word.pitch.length > 0 && <PitchAccentSVG pitch={word.pitch} />}
            </div>
        </article>
    );
}
