import type { NameResultDTO } from "../types/api";

interface Props {
    name: NameResultDTO;
}

/**
 * NameCard — one Jotoba name entry.
 * Shows kanji/kana form, romaji transcription, and name type origin tags.
 */
export function NameCard({ name }: Props) {
    const displayName = name.kanji ?? name.kana;

    return (
        <article
            className="rounded-2xl border border-gray-200 bg-white px-5 py-4
      hover:shadow-md hover:border-gray-300 transition-all flex items-center gap-4"
        >
            {/* Main name */}
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-black">{displayName}</span>
                    {name.kanji && (
                        <span className="text-gray-400 text-base">
                            ({name.kana})
                        </span>
                    )}
                </div>
                <p className="text-gray-600 text-sm mt-0.5 font-medium tracking-wide">
                    {name.transcription}
                </p>
            </div>
            {/* Type tags */}
            <div className="flex flex-col items-end gap-1 shrink-0">
                {name.nameType.map((t) => (
                    <span
                        key={t}
                        className="px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-700
              border border-purple-100 rounded-full whitespace-nowrap"
                    >
                        {t}
                    </span>
                ))}
            </div>
        </article>
    );
}
