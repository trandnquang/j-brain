import type { PitchDTO } from "../types/api";

interface Props {
    pitch: PitchDTO[];
    className?: string;
}

/**
 * PitchAccentSVG — renders a step-line pitch accent diagram using CSS borders.
 *
 * WHY: A CSS border approach is more accessible and less fragile than SVG paths.
 * Each mora maps to a <span> whose top/bottom border represents its pitch height.
 * A right border is added at pitch transition points (high→low drop, or low→high rise).
 *
 * Pattern: Japanese pitch accent always starts LOW at mora 0 unless noted otherwise.
 *
 * Standard patterns:
 *   [↓さ][↑し↑み↑]     = Heiban (flat, no drop)
 *   [↓さ]↓[↑し]↑[みず] = LHL rise at mora 1
 */
export function PitchAccentSVG({ pitch, className = "" }: Props) {
    if (!pitch || pitch.length === 0) return null;

    return (
        <div
            className={`flex items-stretch gap-0 ${className}`}
            aria-label="Pitch accent"
        >
            {pitch.map((mora, i) => {
                if (!mora.part) return null; // empty trailing marker
                const next = pitch[i + 1];
                const isHigh = mora.high;
                // Add right connector when there is a pitch transition to the next mora
                const hasDropRight =
                    isHigh && next && !next.high && !!next.part;
                const hasRiseRight =
                    !isHigh && next && next.high && !!next.part;

                return (
                    <span
                        key={i}
                        className={[
                            "inline-flex items-center px-[3px] text-sm font-medium text-gray-700",
                            // TOP or BOTTOM border indicates pitch height
                            isHigh
                                ? "border-t-2 border-gray-700"
                                : "border-b-2 border-gray-400",
                            // RIGHT border = transition connector
                            hasDropRight
                                ? "border-r-2 border-r-gray-700"
                                : hasRiseRight
                                  ? "border-r-2 border-r-gray-400"
                                  : "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        {mora.part}
                    </span>
                );
            })}
        </div>
    );
}
