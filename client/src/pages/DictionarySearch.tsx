import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, Loader2, ChevronDown, Globe, Inbox } from "lucide-react";
import {
    useWordSearch,
    useKanjiSearch,
    useSentenceSearch,
    useNameSearch,
    useSuggestions,
} from "../hooks/useApi";
import { WordCard } from "../components/WordCard";
import { KanjiCard } from "../components/KanjiCard";
import { SentenceCard } from "../components/SentenceCard";
import { NameCard } from "../components/NameCard";
import { WordDetailDrawer } from "../components/WordDetailDrawer";
import { RadicalPicker } from "../components/RadicalPicker";
import type { WordResultDTO } from "../types/api";

// ── Types ──────────────────────────────────────────────────────────────────────
type SearchMode = "words" | "kanji" | "sentences" | "names";
type Language = "English" | "Vietnamese" | "German" | "French" | "Spanish";

const MODES: { value: SearchMode; label: string }[] = [
    { value: "words", label: "Words" },
    { value: "kanji", label: "Kanji" },
    { value: "sentences", label: "Sentences" },
    { value: "names", label: "Names" },
];

const LANGUAGES: { value: Language; label: string }[] = [
    { value: "English", label: "JP ↔ EN" },
    { value: "Vietnamese", label: "JP ↔ VI" },
    { value: "German", label: "JP ↔ DE" },
    { value: "French", label: "JP ↔ FR" },
    { value: "Spanish", label: "JP ↔ ES" },
];

/** WHY: Jotoba suggestion API uses numeric search_type per search category. */
const MODE_TO_SEARCH_TYPE: Record<SearchMode, number> = {
    words: 0,
    kanji: 1,
    sentences: 2,
    names: 3,
};

const SUGGESTION_DEBOUNCE_MS = 250;

/**
 * DictionarySearch — overhauled:
 * - State lives in URL query params so browser Back/Forward natively work
 * - Language supports EN / VI / DE / FR / ES (Jotoba native)
 * - RadicalPicker rendered as a floating modal triggered by a toolbar button
 * - Autocomplete dropdown (250ms debounce, max 10 Jotoba suggestions)
 * - Clear (×) button resets input and results
 */
export default function DictionarySearch() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    // ── Derive state from URL (enables native browser back/forward) ──────────
    // ?q=食べる&mode=words&lang=English
    const urlKeyword = params.get("q") ?? "";
    const urlMode = (params.get("mode") ?? "words") as SearchMode;
    const urlLang = (params.get("lang") ?? "English") as Language;

    // Local controlled state for the input (typed but not yet submitted)
    const [input, setInput] = useState(urlKeyword);
    const [suggInput, setSuggInput] = useState("");
    const [showSuggestions, setShowSugg] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showRadicalPicker, setShowRadicalPicker] = useState(false);
    const [selectedWord, setSelectedWord] = useState<WordResultDTO | null>(
        null,
    );

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggContainerRef = useRef<HTMLDivElement>(null);
    const radicalBtnRef = useRef<HTMLButtonElement>(null);

    // ── Sync input when URL changes (browser back/forward) ───────────────────
    useEffect(() => {
        setInput(urlKeyword);
    }, [urlKeyword]);

    // ── Suggestion debounce ───────────────────────────────────────────────────
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!input.trim()) {
            setSuggInput("");
            return;
        }
        debounceRef.current = setTimeout(
            () => setSuggInput(input.trim()),
            SUGGESTION_DEBOUNCE_MS,
        );
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [input]);

    // ── Close dropdowns on outside click ─────────────────────────────────────
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!suggContainerRef.current?.contains(e.target as Node))
                setShowSugg(false);
            // Close lang menu or radical picker on click outside
            const target = e.target as HTMLElement;
            if (!target.closest("#lang-menu-root")) setShowLangMenu(false);
            if (
                !target.closest("#radical-modal") &&
                !radicalBtnRef.current?.contains(target)
            ) {
                setShowRadicalPicker(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Submit: push a new URL entry — browser handles history ───────────────
    /**
     * WHY: Using navigate() with replace=false creates a real browser history
     * entry. The browser's Back/Forward buttons then navigate between searches
     * without any custom stack management (useSearchHistory removed).
     */
    const submitSearch = useCallback(
        (kw: string, overrideMode?: SearchMode, overrideLang?: Language) => {
            const q = kw.trim();
            const mode = overrideMode ?? urlMode;
            const lang = overrideLang ?? urlLang;
            if (!q) return;
            setInput(q);
            setShowSugg(false);
            navigate(
                `/?q=${encodeURIComponent(q)}&mode=${mode}&lang=${encodeURIComponent(lang)}`,
            );
        },
        [navigate, urlMode, urlLang],
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        submitSearch(input);
    };

    const handleSuggestionClick = (s: string) => {
        // Format is "secondary (primary)" or just "primary"
        const match = s.match(/^(.+?)\s*\(/);
        submitSearch(match ? match[1] : s);
        inputRef.current?.focus();
    };

    const handleClear = () => {
        setInput("");
        setSuggInput("");
        setShowSugg(false);
        navigate(
            "/?q=&mode=" + urlMode + "&lang=" + encodeURIComponent(urlLang),
            { replace: true },
        );
        inputRef.current?.focus();
    };

    const handleModeChange = (mode: SearchMode) => {
        navigate(
            `/?q=${encodeURIComponent(urlKeyword)}&mode=${mode}&lang=${encodeURIComponent(urlLang)}`,
        );
    };

    const handleLangChange = (lang: Language) => {
        setShowLangMenu(false);
        navigate(
            `/?q=${encodeURIComponent(urlKeyword)}&mode=${urlMode}&lang=${encodeURIComponent(lang)}`,
        );
    };

    const handleKanjiClick = (char: string) => {
        submitSearch(char, "kanji");
    };

    // ── Queries (driven by URL params only) ───────────────────────────────────
    const searchType = MODE_TO_SEARCH_TYPE[urlMode];
    const { data: suggestions = [] } = useSuggestions(suggInput, searchType);
    const wordQuery = useWordSearch(
        urlMode === "words" ? urlKeyword : "",
        urlLang,
    );
    const kanjiQuery = useKanjiSearch(
        urlMode === "kanji" ? urlKeyword : "",
        urlLang,
    );
    const sentenceQuery = useSentenceSearch(
        urlMode === "sentences" ? urlKeyword : "",
        urlLang,
    );
    const nameQuery = useNameSearch(
        urlMode === "names" ? urlKeyword : "",
        urlLang,
    );

    const activeQuery = {
        words: wordQuery,
        kanji: kanjiQuery,
        sentences: sentenceQuery,
        names: nameQuery,
    }[urlMode];
    const isFetching = activeQuery.isFetching;

    const currentLang = LANGUAGES.find((l) => l.value === urlLang)!;

    return (
        <>
            <div className="max-w-3xl mx-auto space-y-5">
                {/* ── Page title ── */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dictionary
                    </h1>
                </div>

                {/* ── Search bar ── */}
                <div className="space-y-3">
                    {/* Row 1: language | input | clear | radical-btn | search-btn */}
                    <form
                        onSubmit={handleSearch}
                        className="flex gap-2 items-stretch"
                    >
                        {/* Language dropdown */}
                        <div className="relative" id="lang-menu-root">
                            <button
                                type="button"
                                id="lang-dropdown-btn"
                                onClick={() => setShowLangMenu((v) => !v)}
                                className="h-12 px-3 flex items-center gap-1.5 bg-white border border-gray-200
                                    rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50
                                    transition-colors whitespace-nowrap"
                            >
                                <Globe className="w-3.5 h-3.5 text-gray-400" />
                                {currentLang?.label ?? "JP ↔ EN"}
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            </button>
                            {showLangMenu && (
                                <ul
                                    className="absolute top-full mt-1 left-0 z-30 bg-white border border-gray-200
                                    rounded-xl shadow-lg overflow-hidden min-w-[130px]"
                                >
                                    {LANGUAGES.map((l) => (
                                        <li key={l.value}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleLangChange(l.value)
                                                }
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                                                    ${
                                                        urlLang === l.value
                                                            ? "bg-gray-900 text-white font-semibold"
                                                            : "hover:bg-gray-50 text-gray-700"
                                                    }`}
                                            >
                                                {l.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Input + autocomplete */}
                        <div className="flex-1 relative" ref={suggContainerRef}>
                            <input
                                id="search-input"
                                ref={inputRef}
                                className="w-full h-12 px-4 pr-9 rounded-xl border border-gray-200 bg-white
                                    text-base focus:outline-none focus:ring-2 focus:ring-gray-300
                                    placeholder:text-gray-400 transition-shadow"
                                placeholder={
                                    urlMode === "words"
                                        ? "e.g. 食べる, taberu, to eat…"
                                        : urlMode === "kanji"
                                          ? "e.g. 走, 人, 食…"
                                          : urlMode === "sentences"
                                            ? "e.g. 日本語を勉強する…"
                                            : "e.g. 田中, Tanaka…"
                                }
                                value={input}
                                onFocus={() =>
                                    input.trim() && setShowSugg(true)
                                }
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    if (e.target.value.trim())
                                        setShowSugg(true);
                                }}
                                autoComplete="off"
                            />
                            {/* Clear button */}
                            {input.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full
                                        text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                    aria-label="Clear"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            {/* Autocomplete */}
                            {showSuggestions && suggestions.length > 0 && (
                                <ul
                                    className="absolute top-full mt-1.5 left-0 right-0 z-20
                                    bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                                >
                                    {suggestions.map((s, i) => (
                                        <li key={i}>
                                            <button
                                                type="button"
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                }
                                                onClick={() =>
                                                    handleSuggestionClick(s)
                                                }
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-800
                                                    hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                            >
                                                <Search className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                                {s}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Radical picker button (shown always, opens modal) */}
                        <button
                            ref={radicalBtnRef}
                            type="button"
                            id="radical-picker-btn"
                            title="Search kanji by radical"
                            onClick={() => setShowRadicalPicker((v) => !v)}
                            className={`h-12 px-3.5 rounded-xl border font-bold text-lg transition-colors
                                ${
                                    showRadicalPicker
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            部
                        </button>

                        {/* Search button */}
                        <button
                            id="search-btn"
                            type="submit"
                            className="h-12 px-5 bg-gray-900 text-white rounded-xl hover:bg-gray-700
                                transition-colors flex items-center gap-2 font-medium whitespace-nowrap"
                        >
                            {isFetching ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                            Search
                        </button>
                    </form>

                    {/* Radical picker modal (floating panel below bar) */}
                    {showRadicalPicker && (
                        <div id="radical-modal" className="relative z-10">
                            <RadicalPicker
                                language={urlLang}
                                onKanjiSelect={(kanji) => {
                                    setShowRadicalPicker(false);
                                    submitSearch(kanji, "kanji");
                                }}
                                alwaysOpen
                            />
                        </div>
                    )}

                    {/* Row 2: Mode tabs */}
                    <div className="flex gap-1 overflow-x-auto">
                        {MODES.map((m) => (
                            <button
                                key={m.value}
                                id={`mode-tab-${m.value}`}
                                type="button"
                                onClick={() => handleModeChange(m.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                                    whitespace-nowrap transition-colors
                                    ${
                                        urlMode === m.value
                                            ? "bg-gray-900 text-white"
                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Results ── */}
                <div className="space-y-4">
                    {/* WORDS */}
                    {urlMode === "words" && (
                        <>
                            {!urlKeyword && <EmptyHint mode="words" />}
                            {urlKeyword &&
                                !wordQuery.isFetching &&
                                wordQuery.data?.length === 0 && (
                                    <EmptyState keyword={urlKeyword} />
                                )}
                            {wordQuery.data?.map((word) => (
                                <WordCard
                                    key={word.keyword ?? word.kana}
                                    word={word}
                                    isActive={selectedWord?.kana === word.kana}
                                    onClick={() => setSelectedWord(word)}
                                    onKanjiClick={handleKanjiClick}
                                    onXrefClick={(xref) =>
                                        submitSearch(xref, "words")
                                    }
                                />
                            ))}
                        </>
                    )}

                    {/* KANJI */}
                    {urlMode === "kanji" && (
                        <>
                            {!urlKeyword && <EmptyHint mode="kanji" />}
                            {urlKeyword &&
                                !kanjiQuery.isFetching &&
                                kanjiQuery.data?.length === 0 && (
                                    <EmptyState keyword={urlKeyword} />
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
                    {urlMode === "sentences" && (
                        <>
                            {!urlKeyword && <EmptyHint mode="sentences" />}
                            {urlKeyword &&
                                !sentenceQuery.isFetching &&
                                sentenceQuery.data?.length === 0 && (
                                    <EmptyState keyword={urlKeyword} />
                                )}
                            {sentenceQuery.data?.map((s, i) => (
                                <SentenceCard key={i} sentence={s} />
                            ))}
                        </>
                    )}

                    {/* NAMES */}
                    {urlMode === "names" && (
                        <>
                            {!urlKeyword && <EmptyHint mode="names" />}
                            {urlKeyword &&
                                !nameQuery.isFetching &&
                                nameQuery.data?.length === 0 && (
                                    <EmptyState keyword={urlKeyword} />
                                )}
                            {nameQuery.data?.map((n, i) => (
                                <NameCard key={i} name={n} />
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* ── Word detail drawer ── */}
            <WordDetailDrawer
                result={selectedWord as never}
                onClose={() => setSelectedWord(null)}
                onNavigate={(kw, navMode) => {
                    submitSearch(kw, navMode ?? "words");
                    setSelectedWord(null);
                }}
            />
        </>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
const MODE_HINTS: Record<
    SearchMode,
    { icon: string; text: string; sub: string }
> = {
    words: {
        icon: "辞",
        text: "Search for a Japanese word",
        sub: "Enter a word or phrase and press Search",
    },
    kanji: {
        icon: "漢",
        text: "Search for a kanji character",
        sub: "Enter a kanji, click 部 to pick by radical",
    },
    sentences: {
        icon: "文",
        text: "Search for example sentences",
        sub: "Enter a keyword to find example sentences",
    },
    names: {
        icon: "名",
        text: "Search for Japanese names",
        sub: "Enter a name in kanji, kana, or romaji",
    },
};

function EmptyHint({ mode }: { mode: SearchMode }) {
    const hint = MODE_HINTS[mode];
    return (
        <div className="text-center py-20 text-gray-400">
            <p className="text-6xl mb-4 opacity-30">{hint.icon}</p>
            <p className="font-medium">{hint.text}</p>
            <p className="text-sm mt-1">{hint.sub}</p>
        </div>
    );
}

function EmptyState({ keyword }: { keyword: string }) {
    return (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
            <Inbox className="w-10 h-10 opacity-30" />
            <p className="font-medium">No results for "{keyword}"</p>
            <p className="text-sm">
                Try a different spelling or switch search mode.
            </p>
        </div>
    );
}
