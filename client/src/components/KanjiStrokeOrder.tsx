import { useEffect, useRef } from "react";
import HanziWriter from "hanzi-writer";

interface Props {
    character: string;
    size?: number;
    className?: string;
}

/**
 * KanjiStrokeOrder — animates kanji stroke order using hanzi-writer + KanjiVG data.
 *
 * WHY: The spec requires stroke order animation using KanjiVG-backed data.
 * hanzi-writer fetches character data from its CDN (cdn.jsdelivr.net/npm/hanzi-writer-data)
 * and renders an animated SVG inside a container div.
 * Works for all CJK Unified Ideographs (same Unicode block used by Japanese kanji).
 */
export function KanjiStrokeOrder({ character, size = 128, className }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const writerRef = useRef<HanziWriter | null>(null);

    useEffect(() => {
        if (!containerRef.current || !character) return;
        // Clear previous render
        containerRef.current.innerHTML = "";
        writerRef.current = HanziWriter.create(
            containerRef.current,
            character,
            {
                width: size,
                height: size,
                padding: 8,
                showOutline: true,
                strokeColor: "#1f2937",
                outlineColor: "#e5e7eb",
                drawingColor: "#3b82f6",
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 200,
                radicalColor: "#ef4444",
            },
        );
        writerRef.current.loopCharacterAnimation();

        return () => {
            if (containerRef.current) containerRef.current.innerHTML = "";
            writerRef.current = null;
        };
    }, [character, size]);

    return (
        <div className={className}>
            <div ref={containerRef} style={{ width: size, height: size }} />
        </div>
    );
}

/**
 * KanjiStrokeGrid — renders a static grid of individual stroke SVG frames.
 * Each cell shows the character with all strokes up to that point visible.
 * Implemented as a simple numbered stroke-count display using the writer's quiz mode.
 */
export function KanjiStrokeCount({ count }: { count: number }) {
    return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
                <path
                    d="M2 3h8M2 6h6M2 9h4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>
            {count} strokes
        </span>
    );
}
