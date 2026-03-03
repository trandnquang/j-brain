import { parseFurigana } from "../lib/parseFurigana";

interface Props {
    /** Raw Jotoba bracket-format furigana string, e.g. "[食|た]べる" */
    furigana: string | null | undefined;
    /** Applied to the wrapping <span> — use for font-size control */
    className?: string;
}

/**
 * FuriganaText — renders Jotoba bracket-format furigana as semantic HTML ruby.
 *
 * WHY: Jotoba's bracket format (e.g. [異世界|い|せ|かい]) cannot be rendered
 * safely by splitting on "|". parseFurigana() correctly zips individual kanji
 * characters with their kana readings before building <ruby> elements.
 */
export function FuriganaText({ furigana, className }: Props) {
    const tokens = parseFurigana(furigana);

    if (tokens.length === 0) return null;

    return (
        <span className={className}>
            {tokens.map((token, i) =>
                token.type === "ruby" ? (
                    <ruby key={i} className="ruby-text">
                        {token.kanji}
                        <rt className="text-[0.45em] text-gray-500 font-normal">
                            {token.kana}
                        </rt>
                    </ruby>
                ) : (
                    <span key={i}>{token.text}</span>
                ),
            )}
        </span>
    );
}
