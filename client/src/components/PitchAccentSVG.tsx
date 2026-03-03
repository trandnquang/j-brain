import type { PitchDTO } from "../types/api";

interface Props {
    pitch: PitchDTO[];
    className?: string;
}

const DOT_RADIUS = 6;
const DOT_CY_HIGH = 12;
const DOT_CY_LOW = 32;
const MORA_WIDTH = 36;
const SVG_HEIGHT = 52; // text sits below the dots

/**
 * PitchAccentSVG — renders a connected-dot pitch accent diagram.
 *
 * Spec constraints:
 * - Text below the line MUST be kana only (guaranteed by backend PitchDTO.part)
 * - Dots connect with lines showing high→low drops and low→high rises
 * - High dots: filled blue circle at top rail
 * - Low dots: filled gray circle at bottom rail
 * - Drop line: dashed vertical segment between last high mora and first low mora
 */
export function PitchAccentSVG({ pitch, className }: Props) {
    if (!pitch || pitch.length === 0) return null;

    const svgWidth = pitch.length * MORA_WIDTH + 16;

    // Build coordinate list
    const coords = pitch.map((p, i) => ({
        cx: 16 + i * MORA_WIDTH,
        cy: p.high ? DOT_CY_HIGH : DOT_CY_LOW,
        high: p.high,
        part: p.part,
    }));

    return (
        <svg
            width={svgWidth}
            height={SVG_HEIGHT}
            className={className}
            aria-label="Pitch accent diagram"
        >
            {/* Connection lines */}
            {coords.slice(0, -1).map((c, i) => {
                const next = coords[i + 1];
                const isDrop = c.high && !next.high;
                return (
                    <line
                        key={`line-${i}`}
                        x1={c.cx}
                        y1={c.cy}
                        x2={next.cx}
                        y2={next.cy}
                        stroke={isDrop ? "#3b82f6" : "#9ca3af"}
                        strokeWidth={isDrop ? 2.5 : 2}
                        strokeDasharray={isDrop ? "4 2" : undefined}
                    />
                );
            })}

            {/* Dots */}
            {coords.map((c, i) => (
                <circle
                    key={`dot-${i}`}
                    cx={c.cx}
                    cy={c.cy}
                    r={DOT_RADIUS}
                    fill={c.high ? "#3b82f6" : "#d1d5db"}
                    stroke={c.high ? "#2563eb" : "#9ca3af"}
                    strokeWidth={1.5}
                />
            ))}

            {/* Kana labels below dots */}
            {coords.map((c, i) => (
                <text
                    key={`label-${i}`}
                    x={c.cx}
                    y={SVG_HEIGHT - 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="inherit"
                    fill="#6b7280"
                >
                    {c.part}
                </text>
            ))}
        </svg>
    );
}
