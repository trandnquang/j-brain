import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useWordSearch } from "../hooks/useApi";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { WordDetailDrawer } from "../components/WordDetailDrawer";
import type { SearchResultDTO } from "../types/api";

export default function DictionarySearch() {
    const [input, setInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [selected, setSelected] = useState<SearchResultDTO | null>(null);

    const { data: results, isFetching } = useWordSearch(keyword);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) setKeyword(input.trim());
    };

    return (
        <>
            <div className="max-w-3xl mx-auto space-y-8">
                {/* ── Header ── */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Dictionary Search
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Search Jotoba for Kanji, Kana, Romaji, or English
                    </p>
                </div>

                {/* ── Search bar ── */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        id="search-input"
                        className="flex-1 h-12 text-base"
                        placeholder="e.g. 食べる, taberu, or to eat..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <Button
                        id="search-btn"
                        type="submit"
                        size="lg"
                        className="h-12 px-8 bg-black hover:bg-gray-800 text-white"
                    >
                        {isFetching ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5" />
                        )}
                    </Button>
                </form>

                {/* ── Results ── */}
                {results && results.length > 0 ? (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
                            {results.length} result
                            {results.length !== 1 ? "s" : ""} — click a card for
                            details
                        </p>
                        {results.map((result) => (
                            <WordResultCard
                                key={result.keyword}
                                result={result}
                                isSelected={
                                    selected?.keyword === result.keyword
                                }
                                onClick={() => setSelected(result)}
                            />
                        ))}
                    </div>
                ) : keyword && !isFetching ? (
                    <div className="text-center py-16 text-gray-400">
                        <p className="font-medium">
                            No results for "{keyword}"
                        </p>
                        <p className="text-sm mt-1">
                            Try a different spelling or switch to
                            English/Romaji.
                        </p>
                    </div>
                ) : null}
            </div>

            {/* ── Slide-in detail drawer ── */}
            <WordDetailDrawer
                result={selected}
                onClose={() => setSelected(null)}
            />
        </>
    );
}

// ── Compact result card (click → opens drawer) ─────────────────────────────
interface WordResultCardProps {
    result: SearchResultDTO;
    isSelected: boolean;
    onClick: () => void;
}

function WordResultCard({ result, isSelected, onClick }: WordResultCardProps) {
    const stripFurigana = (f: string) =>
        f.replace(/\[([^|]+)\|[^\]]+\]/g, "$1");

    return (
        <Card
            id={`word-card-${result.keyword}`}
            onClick={onClick}
            className={`border cursor-pointer transition-all hover:shadow-md hover:border-gray-300 ${
                isSelected ? "border-blue-400 shadow-md bg-blue-50/30" : ""
            }`}
        >
            <CardHeader className="pb-2">
                <CardTitle className="flex items-start justify-between">
                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-bold">
                            {result.keyword}
                        </span>
                        {result.furigana && (
                            <span className="text-gray-400 text-base font-normal">
                                {stripFurigana(result.furigana)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {result.partOfSpeech?.[0] && (
                            <Badge
                                variant="outline"
                                className="border-blue-200 text-blue-700 bg-blue-50 text-xs"
                            >
                                {result.partOfSpeech[0]}
                            </Badge>
                        )}
                        {result.jlptLevel && (
                            <Badge
                                variant="outline"
                                className="border-red-200 text-red-700 bg-red-50 text-xs"
                            >
                                N{result.jlptLevel}
                            </Badge>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent>
                {/* Show first 3 meanings inline; drawer reveals all */}
                <ol className="list-decimal list-inside space-y-0.5 text-gray-700 text-sm">
                    {result.meanings.slice(0, 3).map((m, i) => (
                        <li key={i}>{m}</li>
                    ))}
                    {result.meanings.length > 3 && (
                        <li className="text-gray-400 list-none ml-4">
                            +{result.meanings.length - 3} more — click to see
                            all
                        </li>
                    )}
                </ol>
            </CardContent>
        </Card>
    );
}
