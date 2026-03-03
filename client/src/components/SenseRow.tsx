import type { SenseDTO } from "../types/api";

interface Props {
    sense: SenseDTO;
    index: number;
    /** Called when user clicks a "See also" xref link */
    onXrefClick?: (keyword: string) => void;
}

/**
 * SenseRow — renders one Jotoba sense with all its contextual tags.
 *
 * WHY: Extracted as a separate component so WordDetailDrawer stays lean, and
 * so the POS column uses `self-start` (fixing the vertical-stretch bug where
 * the POS badge was being stretched to the full height of the glosses column).
 */
export function SenseRow({ sense, index, onXrefClick }: Props) {
    return (
        <li className="flex gap-3 items-start">
            {/* Index num */}
            <span className="text-gray-300 font-mono text-sm min-w-[1.4rem] pt-0.5 shrink-0">
                {index + 1}.
            </span>

            {/* Left: glosses + contextual tags */}
            <div className="flex-1 min-w-0">
                <p className="text-gray-800 leading-relaxed">
                    {sense.glosses.join("、")}
                </p>

                {/* Contextual tag row */}
                {(sense.misc.length > 0 ||
                    sense.field ||
                    sense.xref ||
                    sense.information) && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {sense.information && (
                            <span
                                className="inline-flex items-center px-1.5 py-0.5 text-[11px] rounded
                bg-gray-50 text-gray-500 border border-gray-200"
                            >
                                {sense.information}
                            </span>
                        )}
                        {sense.misc.map((m) => (
                            <span
                                key={m}
                                className="inline-flex items-center px-1.5 py-0.5 text-[11px] rounded
                bg-amber-50 text-amber-700 border border-amber-200 capitalize"
                            >
                                {m}
                            </span>
                        ))}
                        {sense.field && (
                            <span
                                className="inline-flex items-center px-1.5 py-0.5 text-[11px] rounded
                bg-emerald-50 text-emerald-700 border border-emerald-200"
                            >
                                {sense.field} term
                            </span>
                        )}
                        {sense.xref && (
                            <button
                                onClick={() => onXrefClick?.(sense.xref!)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] rounded
                  bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
                                title={`Search for ${sense.xref}`}
                            >
                                See also{" "}
                                <span className="font-bold">{sense.xref}</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Right: POS badges — self-start prevents vertical stretch (bug fix #8) */}
            {sense.pos.length > 0 && (
                <div className="flex flex-col gap-0.5 items-end self-start shrink-0">
                    {sense.pos.map((p) => (
                        <span
                            key={p}
                            className="text-[10px] leading-tight text-blue-600 bg-blue-50 border border-blue-100
                px-1.5 py-0.5 rounded whitespace-nowrap"
                        >
                            {p}
                        </span>
                    ))}
                </div>
            )}
        </li>
    );
}
