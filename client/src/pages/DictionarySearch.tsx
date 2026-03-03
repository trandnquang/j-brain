import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Mic, Loader2, ChevronDown } from "lucide-react";
import {
    useWordSearch,
    useKanjiSearch,
    useSentenceSearch,
    useNameSearch,
} from "../hooks/useApi";
import { WordCard } from "../components/WordCard";
import { KanjiCard } from "../components/KanjiCard";
import { SentenceCard } from "../components/SentenceCard";
import { NameCard } from "../components/NameCard";
import { WordDetailDrawer } from "../components/WordDetailDrawer";
import type { WordResultDTO } from "../types/api";

// ── Search mode types ──────────────────────────────────────────────────────────
type SearchMode = "words" | "kanji" | "sentences" | "names";

const MODES: { value: SearchMode; label: string }[] = [
    { value: "words", label: "Words" },
    { value: "kanji", label: "Kanji" },
    { value: "sentences", label: "Sentences" },
    { value: "names", label: "Names" },
];

export default function DictionarySearch() {
    const [mode, setMode] = useState<SearchMode>("words");
    const [input, setInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const [selectedWord, setSelectedWord] = useState<WordResultDTO | null>(
        null,
    );
    const [kanjiKeyword, setKanjiKeyword] = useState("");

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Debounced live suggestions (300 ms) ───────────────────────────────────
    const handleInputChange = useCallback((value: string) => {
        setInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value.trim()) {
            setKeyword("");
            return;
        }
        debounceRef.current = setTimeout(() => {
            setKeyword(value.trim());
        }, 300);
    }, []);

    // Flush immediately on Enter
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!input.trim()) {
            setKeyword("");
            return;
        }
        setKeyword(input.trim());
    };

    // When a kanji component button is clicked → switch to kanji tab + search
    const handleKanjiClick = (char: string) => {
        setMode("kanji");
        setInput(char);
        setKeyword(char);
        setKanjiKeyword(char);
    };

    useEffect(() => {
        // Sync kanjiKeyword when mode switches and keyword is set
        if (mode === "kanji") setKanjiKeyword(keyword);
    }, [keyword, mode]);

    // ── Queries (all run in background, rendered by active tab) ───────────────
    const wordQuery = useWordSearch(mode === "words" ? keyword : "");
    const kanjiQuery = useKanjiSearch(
        mode === "kanji" ? keyword : kanjiKeyword || keyword,
    );
    const sentenceQuery = useSentenceSearch(
        mode === "sentences" ? keyword : "",
    );
    const nameQuery = useNameSearch(mode === "names" ? keyword : "");

    const activeQuery = {
        words: wordQuery,
        kanji: kanjiQuery,
        sentences: sentenceQuery,
        names: nameQuery,
    }[mode];
    const isFetching = activeQuery.isFetching;

    const currentMode = MODES.find((m) => m.value === mode)!;

    return (
        <>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* ── Page title ── */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dictionary
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Search in Japanese (Kana/Kanji/Romaji) or English
                    </p>
                </div>

                {/* ── Search bar ── */}
                <form
                    onSubmit={handleSearch}
                    className="flex gap-2 items-stretch"
                >
                    {/* Mode dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            id="mode-dropdown-btn"
                            onClick={() => setShowModeDropdown((v) => !v)}
                            className="h-12 px-4 flex items-center gap-1.5 bg-white border border-gray-200
                rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50
                transition-colors whitespace-nowrap"
                        >
                            {currentMode.label}
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        {showModeDropdown && (
                            <div
                                className="absolute top-full mt-1 left-0 z-30 bg-white border border-gray-200
                rounded-xl shadow-lg overflow-hidden min-w-[120px]"
                            >
                                {MODES.map((m) => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        id={`mode-${m.value}`}
                                        onClick={() => {
                                            setMode(m.value);
                                            setShowModeDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${
                          mode === m.value
                              ? "bg-gray-900 text-white font-semibold"
                              : "hover:bg-gray-50 text-gray-700"
                      }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Text input */}
                    <div className="flex-1 relative">
                        <input
                            id="search-input"
                            className="w-full h-12 px-4 pr-10 rounded-xl border border-gray-200 bg-white
                text-base focus:outline-none focus:ring-2 focus:ring-gray-300
                placeholder:text-gray-400 transition-shadow"
                            placeholder={
                                mode === "words"
                                    ? "e.g. 食べる, taberu, to eat…"
                                    : mode === "kanji"
                                      ? "e.g. 走, 人, 食…"
                                      : mode === "sentences"
                                        ? "e.g. 日本語を話す…"
                                        : "e.g. 田中, Tanaka…"
                            }
                            value={input}
                            onChange={(e) => handleInputChange(e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    {/* Mic icon placeholder — UI only, no audio logic (Phase N+1) */}
                    <button
                        type="button"
                        id="mic-btn"
                        aria-label="Voice search (coming soon)"
                        className="h-12 w-12 flex items-center justify-center rounded-xl border border-gray-200
              bg-white text-gray-400 cursor-not-allowed opacity-60"
                        title="Voice search — coming soon"
                    >
                        <Mic className="w-5 h-5" />
                    </button>

                    {/* Search submit */}
                    <button
                        id="search-btn"
                        type="submit"
                        className="h-12 px-6 bg-gray-900 hover:bg-gray-700 text-white rounded-xl
              font-medium transition-colors flex items-center gap-2"
                    >
                        {isFetching ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5" />
                        )}
                    </button>
                </form>

                {/* ── Tab strip ── */}
                <div className="flex gap-1 border-b border-gray-200 pb-0">
                    {MODES.map((m) => (
                        <button
                            key={m.value}
                            id={`tab-${m.value}`}
                            onClick={() => setMode(m.value)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2
                ${
                    mode === m.value
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* ── Results ── */}
                <div className="space-y-3">
                    {/* WORDS */}
                    {mode === "words" && (
                        <>
                            {!keyword && (
                                <div className="text-center py-20 text-gray-400">
                                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-medium text-base">
                                        Search for a word to get started
                                    </p>
                                    <p className="text-sm mt-1">
                                        Japanese: 食べる、はな | Romaji: taberu
                                        | English: to eat
                                    </p>
                                </div>
                            )}
                            {keyword &&
                                !isFetching &&
                                (!wordQuery.data ||
                                    wordQuery.data.length === 0) && (
                                    <EmptyState keyword={keyword} />
                                )}
                            {wordQuery.data?.map((word) => (
                                <WordCard
                                    key={word.keyword ?? word.kana}
                                    word={word}
                                    isActive={selectedWord?.kana === word.kana}
                                    onClick={() => setSelectedWord(word)}
                                    onKanjiClick={handleKanjiClick}
                                />
                            ))}
                        </>
                    )}

                    {/* KANJI */}
                    {mode === "kanji" && (
                        <>
                            {!keyword && (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="text-6xl mb-4 opacity-30">
                                        漢
                                    </p>
                                    <p className="font-medium text-base">
                                        Enter a kanji character to see full
                                        details
                                    </p>
                                </div>
                            )}
                            {keyword &&
                                !isFetching &&
                                (!kanjiQuery.data ||
                                    kanjiQuery.data.length === 0) && (
                                    <EmptyState keyword={keyword} />
                                )}
                            {kanjiQuery.data?.map((k) => (
                                <KanjiCard
                                    key={k.literal}
                                    kanji={k}
                                    onPartClick={handleKanjiClick}
                                />
                            ))}
                        </>
                    )}

                    {/* SENTENCES */}
                    {mode === "sentences" && (
                        <>
                            {!keyword && (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="font-medium text-base">
                                        Search for example sentences from
                                        Tatoeba
                                    </p>
                                </div>
                            )}
                            {keyword &&
                                !isFetching &&
                                (!sentenceQuery.data ||
                                    sentenceQuery.data.length === 0) && (
                                    <EmptyState keyword={keyword} />
                                )}
                            {sentenceQuery.data?.map((s) => (
                                <SentenceCard key={s.id} sentence={s} />
                            ))}
                        </>
                    )}

                    {/* NAMES */}
                    {mode === "names" && (
                        <>
                            {!keyword && (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="font-medium text-base">
                                        Search person names, place names,
                                        surnames
                                    </p>
                                </div>
                            )}
                            {keyword &&
                                !isFetching &&
                                (!nameQuery.data ||
                                    nameQuery.data.length === 0) && (
                                    <EmptyState keyword={keyword} />
                                )}
                            {nameQuery.data?.map((n, i) => (
                                <NameCard key={`${n.kana}-${i}`} name={n} />
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* ── Word detail drawer (AI examples triggered from here) ── */}
            <WordDetailDrawer
                result={selectedWord as never}
                onClose={() => setSelectedWord(null)}
            />
        </>
    );
}

function EmptyState({ keyword }: { keyword: string }) {
    return (
        <div className="text-center py-16 text-gray-400">
            <p className="font-medium">No results for "{keyword}"</p>
            <p className="text-sm mt-1">
                Try a different spelling, or switch search mode.
            </p>
        </div>
    );
}
