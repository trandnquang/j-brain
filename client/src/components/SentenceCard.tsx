import { FuriganaText } from "./FuriganaText";
import type { SentenceDTO } from "../types/api";

interface Props {
    sentence: SentenceDTO;
}

/**
 * SentenceCard — one Tatoeba example sentence.
 * Shows furigana ruby above Japanese (if available), English translation below.
 */
export function SentenceCard({ sentence }: Props) {
    return (
        <article className="rounded-2xl border border-gray-200 bg-white px-5 py-4 space-y-2 hover:shadow-md hover:border-gray-300 transition-all">
            <div className="text-xl leading-relaxed font-medium">
                {sentence.furigana ? (
                    <FuriganaText furigana={sentence.furigana} />
                ) : (
                    sentence.japanese
                )}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
                {sentence.english}
            </p>
            <div className="flex justify-end">
                <span className="text-[11px] text-gray-300">
                    Tatoeba #{sentence.id}
                </span>
            </div>
        </article>
    );
}
