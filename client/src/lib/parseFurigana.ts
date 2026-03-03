/**
 * parseFurigana — converts Jotoba bracket-format furigana strings into
 * structured token arrays suitable for <ruby> rendering.
 *
 * WHY: Jotoba returns furigana as e.g. "[異世界|い|せ|かい]" where kanji
 * characters are listed first then kana readings are separated by "|".
 * A naive split on "|" produces broken output. This parser zips individual
 * kanji characters with their corresponding kana readings.
 *
 * Supported formats:
 *   [刺身|さし|み]         → [{k:"刺",r:"さし"},{k:"身",r:"み"}]
 *   [差|さ]し[身|み]       → [{k:"差",r:"さ"}, plain:"し", {k:"身",r:"み"}]
 *   さしみ                 → [plain:"さしみ"]
 *   null / ""              → []
 */

export type FuriganaToken =
    | { type: "ruby"; kanji: string; kana: string }
    | { type: "plain"; text: string };

/**
 * Parses a Jotoba furigana string into an array of typed tokens.
 * Each token is either a ruby pair (kanji + kana) or plain text.
 */
export function parseFurigana(raw: string | null | undefined): FuriganaToken[] {
    if (!raw) return [];

    const tokens: FuriganaToken[] = [];

    // Matches either:
    //   [kanjiBlock|kana|kana|...] — a ruby block
    //   anything else              — plain text between ruby blocks
    const bracketRe = /\[([^\]|]+)(\|[^\]]+)?\]|([^\[]+)/g;

    let match: RegExpExecArray | null;
    while ((match = bracketRe.exec(raw)) !== null) {
        const [, kanjiBlock, kanaPart, plainText] = match;

        if (plainText !== undefined) {
            // Plain kana/latin between brackets
            tokens.push({ type: "plain", text: plainText });
            continue;
        }

        if (!kanaPart) {
            // Bracket with no readings — treat as plain
            tokens.push({ type: "plain", text: kanjiBlock });
            continue;
        }

        // Strip leading "|" then split remaining on "|"
        const kanaSegments = kanaPart.slice(1).split("|");

        // Split kanji block into individual characters (code-point safe)
        const kanjiChars = [...kanjiBlock];

        if (kanaSegments.length === 1) {
            // Single reading covers the whole kanji block: [刺身|さしみ]
            tokens.push({
                type: "ruby",
                kanji: kanjiBlock,
                kana: kanaSegments[0],
            });
        } else if (kanaSegments.length === kanjiChars.length) {
            // One reading per kanji character: [異世界|い|せ|かい]
            for (let i = 0; i < kanjiChars.length; i++) {
                tokens.push({
                    type: "ruby",
                    kanji: kanjiChars[i],
                    kana: kanaSegments[i],
                });
            }
        } else {
            // Mismatch — best‑effort: attach all kana to the whole block
            tokens.push({
                type: "ruby",
                kanji: kanjiBlock,
                kana: kanaSegments.join(""),
            });
        }
    }

    return tokens;
}

/**
 * Strips all bracket syntax and returns plain readable text.
 * Used for aria-label, alt text, and plain-text fallbacks.
 */
export function furiganaToPlainText(raw: string | null | undefined): string {
    if (!raw) return "";
    return raw.replace(/\[([^\]|]+)(?:\|[^\]]+)?\]/g, "$1");
}
