interface Props {
    /** Single kanji character to display */
    char: string;
    /** Called when this pill is clicked */
    onSelect: (char: string) => void;
    className?: string;
}

/**
 * KanjiPill — a clickable badge for a single kanji character.
 *
 * WHY: Lets users navigate from a word's kanji component directly to a
 * kanji detail search without leaving the current view. Bubbles up via
 * onSelect → DictionarySearch sets mode=Kanji, submittedKeyword=char.
 */
export function KanjiPill({ char, onSelect, className = "" }: Props) {
    return (
        <button
            onClick={() => onSelect(char)}
            title={`Look up kanji: ${char}`}
            className={`text-xl font-bold px-3 py-1.5
        bg-gray-50 border border-gray-200 rounded-lg
        hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800
        active:scale-95 transition-all duration-100 ${className}`}
        >
            {char}
        </button>
    );
}
