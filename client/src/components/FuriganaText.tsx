/**
 * FuriganaText — renders Jotoba bracket-format furigana as proper HTML ruby text.
 *
 * Input format: "[走|はし]る" → <ruby>走<rt>はし</rt></ruby>る
 * Falls back to plain text stripping when ruby is not needed.
 */

interface Props {
    furigana: string;
    className?: string;
}

// Segment: either a [kanji|kana] pair or a plain kana/text chunk
type Segment = { kanji: string; kana: string } | { plain: string };

function parseFurigana(input: string): Segment[] {
    const segments: Segment[] = [];
    // Matches [kanji|reading] brackets
    const regex = /\[([^\|]+)\|([^\]]+)\]/g;
    let last = 0,
        match: RegExpExecArray | null;

    while ((match = regex.exec(input)) !== null) {
        if (match.index > last) {
            segments.push({ plain: input.slice(last, match.index) });
        }
        segments.push({ kanji: match[1], kana: match[2] });
        last = match.index + match[0].length;
    }
    if (last < input.length) {
        segments.push({ plain: input.slice(last) });
    }
    return segments;
}

export function FuriganaText({ furigana, className }: Props) {
    const segments = parseFurigana(furigana);
    return (
        <span className={className}>
            {segments.map((seg, i) =>
                "kanji" in seg ? (
                    <ruby key={i}>
                        {seg.kanji}
                        <rt className="text-[0.55em] text-gray-400 font-normal">
                            {seg.kana}
                        </rt>
                    </ruby>
                ) : (
                    <span key={i}>{seg.plain}</span>
                ),
            )}
        </span>
    );
}

/** Strip furigana brackets, returning kanji form only: "[走|はし]る" → "走る" */
export function stripToKanji(furigana: string): string {
    return furigana.replace(/\[([^\|]+)\|[^\]]+\]/g, "$1");
}

/** Extract kana reading only: "[走|はし]る" → "はしる" */
export function stripToKana(furigana: string): string {
    return furigana.replace(/\[([^\|]*)\|([^\]]*)\]/g, "$2");
}
