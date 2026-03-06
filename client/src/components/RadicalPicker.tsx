import { useState } from "react";
import { X, RotateCcw, Loader2 } from "lucide-react";
import { useRadicalSearch } from "../hooks/useApi";
import type { KanjiResultDTO } from "../types/api";

// ── 214 Kangxi radicals, grouped by stroke count ──────────────────────────────
// Source: JIS X 0208 / Unicode radical supplement. Ordered 1→17 strokes.
const RADICALS_BY_STROKE: Record<number, string[]> = {
    1:  ["一", "丨", "丶", "丿", "乙", "亅"],
    2:  ["二", "亠", "人", "儿", "入", "八", "冂", "冖", "冫", "几", "凵", "刀", "力", "勹", "匕", "匚", "匸", "十", "卜", "卩", "厂", "厶", "又"],
    3:  ["口", "囗", "土", "士", "夂", "夊", "夕", "大", "女", "子", "宀", "寸", "小", "尢", "尸", "屮", "山", "巛", "工", "己", "巾", "干", "幺", "广", "廴", "廾", "弋", "弓", "彐", "彡", "彳"],
    4:  ["心", "戈", "戸", "手", "支", "攴", "文", "斗", "斤", "方", "无", "日", "曰", "月", "木", "欠", "止", "歹", "殳", "毋", "比", "毛", "氏", "气", "水", "火", "爪", "父", "爻", "爿", "片", "牙", "牛", "犬"],
    5:  ["玄", "玉", "瓜", "瓦", "甘", "生", "用", "田", "疋", "疒", "癶", "白", "皮", "皿", "目", "矛", "矢", "石", "示", "禸", "禾", "穴", "立"],
    6:  ["竹", "米", "糸", "缶", "网", "羊", "羽", "老", "而", "耒", "耳", "聿", "肉", "臣", "自", "至", "臼", "舌", "舛", "舟", "艮", "色", "艸", "虍", "虫", "血", "行", "衣", "襾"],
    7:  ["見", "角", "言", "谷", "豆", "豕", "豸", "貝", "赤", "走", "足", "身", "車", "辛", "辰", "辵", "邑", "酉", "釆", "里"],
    8:  ["金", "長", "門", "阜", "隶", "隹", "雨", "青", "非"],
    9:  ["面", "革", "韋", "韭", "音", "頁", "風", "飛", "食", "首", "香"],
    10: ["馬", "骨", "高", "髟", "鬥", "鬯", "鬲", "鬼"],
    11: ["魚", "鳥", "鹵", "鹿", "麦", "麻"],
    12: ["黄", "黍", "黒", "黹"],
    13: ["黽", "鼎", "鼓", "鼠"],
    14: ["鼻", "齊"],
    15: ["歯"],
    16: ["龍", "亀"],
    17: ["龠"],
};

interface Props {
    language?: string;
    /** Called when user clicks a kanji result chip → inserts into search */
    onKanjiSelect: (kanji: string) => void;
    /**
     * When true the collapsible toggle is hidden and the panel is always visible.
     * Use this when the parent controls visibility (e.g. a modal/popover).
     */
    alwaysOpen?: boolean;
}

/**
 * RadicalPicker — collapsible panel for building kanji search from radicals.
 *
 * WHY: Standard method for looking up kanji in physical dictionaries.
 * Rather than typing a kanji you don't know, you identify its radicals and
 * filter down to matching characters. The Jotoba API's `possible_radicals`
 * response lets us grey-out dead-end selections in real-time.
 */
export function RadicalPicker({ language = "English", onKanjiSelect, alwaysOpen = false }: Props) {
    const [selected, setSelected]   = useState<string[]>([]);
    const [isOpen, setIsOpen]       = useState(false);

    const open = alwaysOpen || isOpen;

    const { data, isFetching } = useRadicalSearch(selected, language);
    const kanjiResults    = data?.kanji              ?? [];
    const possibleSet     = new Set(data?.possibleRadicals ?? []);

    const toggleRadical = (r: string) => {
        setSelected((prev) =>
            prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
        );
    };

    const reset = () => setSelected([]);

    return (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Toggle button — hidden in alwaysOpen mode */}
            {!alwaysOpen && (
                <button
                    type="button"
                    id="radical-picker-toggle"
                    onClick={() => setIsOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3
                        text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <span className="text-base font-bold text-gray-400">部</span>
                        Radical Picker
                        {selected.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-semibold">
                                {selected.length} selected
                            </span>
                        )}
                    </span>
                    <span className="text-gray-400 text-lg leading-none">{isOpen ? "▲" : "▼"}</span>
                </button>
            )}

            {open && (
                <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    {/* Selected badges + Reset */}
                    {selected.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1.5">
                            {selected.map((r) => (
                                <span key={r}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                        text-sm bg-blue-600 text-white font-bold">
                                    {r}
                                    <button onClick={() => toggleRadical(r)} className="hover:text-blue-200">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            <button
                                onClick={reset}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                                    bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                        </div>
                    )}

                    {/* Radical grid by stroke count */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {Object.entries(RADICALS_BY_STROKE).map(([strokes, radicals]) => (
                            <div key={strokes} className="flex gap-2 items-start">
                                {/* Stroke count label */}
                                <span className="text-[11px] text-gray-400 font-mono w-5 shrink-0 pt-1">
                                    {strokes}
                                </span>
                                {/* Radical buttons */}
                                <div className="flex flex-wrap gap-1">
                                    {radicals.map((r) => {
                                        const isSelected  = selected.includes(r);
                                        const isPossible  = possibleSet.size === 0 || possibleSet.has(r) || isSelected;
                                        return (
                                            <button
                                                key={r}
                                                type="button"
                                                disabled={!isPossible && !isSelected}
                                                onClick={() => isPossible && toggleRadical(r)}
                                                title={`Radical: ${r}`}
                                                className={[
                                                    "w-8 h-8 text-base rounded-md transition-all duration-100 font-medium",
                                                    isSelected
                                                        ? "bg-blue-600 text-white shadow-sm"
                                                        : isPossible
                                                        ? "bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100"
                                                        : "bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed",
                                                ].join(" ")}
                                            >
                                                {r}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Kanji results */}
                    {selected.length > 0 && (
                        <div className="border-t border-gray-100 pt-3">
                            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                                {isFetching && <Loader2 className="w-3 h-3 animate-spin" />}
                                {isFetching
                                    ? "Searching…"
                                    : `${kanjiResults.length} kanji found — click to search`}
                            </p>
                            {kanjiResults.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {kanjiResults.map((k: KanjiResultDTO) => (
                                        <button
                                            key={k.literal}
                                            type="button"
                                            id={`radical-result-${k.literal}`}
                                            onClick={() => {
                                                onKanjiSelect(k.literal);
                                                setIsOpen(false);
                                                reset();
                                            }}
                                            title={k.meanings.join(", ")}
                                            className="flex flex-col items-center justify-center w-12 h-12
                                                rounded-lg border border-gray-200 bg-white
                                                hover:border-blue-300 hover:bg-blue-50 transition-all duration-150
                                                group cursor-pointer"
                                        >
                                            <span className="text-xl font-bold text-gray-800 group-hover:text-blue-700">
                                                {k.literal}
                                            </span>
                                            <span className="text-[9px] text-gray-400 leading-none">
                                                {k.strokeCount}画
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!isFetching && kanjiResults.length === 0 && selected.length > 0 && (
                                <p className="text-sm text-gray-400 italic">
                                    No kanji found for this combination.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
