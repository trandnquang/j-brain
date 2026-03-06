import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    BookOpen,
    Loader2,
    ChevronRight,
    Pencil,
    Trash2,
    Check,
    X,
    AlertTriangle,
    Play,
} from "lucide-react";
import { useDecks, useCreateDeck, useRenameDeck, useDeleteDeck } from "../hooks/useApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type { ApiError, DeckResponse } from "../types/api";

// ── Helper ────────────────────────────────────────────────────────────────────
function relative(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

/**
 * DecksPage — Phase 4 upgrade:
 * - Card count + due count per deck from enriched DeckResponse
 * - Inline rename (click pencil → editable input, Esc/✓ to confirm)
 * - Delete with confirmation modal
 * - "Study" shortcut per card that navigates to /study/:deckId
 */
export default function DecksPage() {
    const navigate = useNavigate();
    const { data: deckList, isLoading } = useDecks();
    const createDeck  = useCreateDeck();
    const renameDeck  = useRenameDeck();
    const deleteDeck  = useDeleteDeck();

    // Create form state
    const [showForm, setShowForm] = useState(false);
    const [name, setName]           = useState("");
    const [description, setDesc]    = useState("");
    const [createError, setCreateError] = useState<string | null>(null);

    // Rename inline state
    const [renamingId, setRenamingId]     = useState<string | null>(null);
    const [renameValue, setRenameValue]   = useState("");
    const [renameDesc, setRenameDesc]     = useState("");

    // Delete confirm state
    const [deleteTarget, setDeleteTarget] = useState<DeckResponse | null>(null);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        try {
            await createDeck.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
            setName(""); setDesc(""); setShowForm(false);
        } catch (err) {
            setCreateError((err as ApiError)?.message ?? "Failed to create deck.");
        }
    };

    const startRename = (deck: DeckResponse) => {
        setRenamingId(deck.id);
        setRenameValue(deck.name);
        setRenameDesc(deck.description ?? "");
    };

    const confirmRename = async () => {
        if (!renamingId || !renameValue.trim()) return;
        await renameDeck.mutateAsync({ deckId: renamingId, name: renameValue.trim(), description: renameDesc.trim() || undefined });
        setRenamingId(null);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        await deleteDeck.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    return (
        <div className="space-y-8">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Decks</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {deckList?.length ?? 0} deck{deckList?.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button
                    id="new-deck-btn"
                    onClick={() => setShowForm((s) => !s)}
                    className="bg-gray-900 hover:bg-gray-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    New Deck
                </Button>
            </div>

            {/* ── Create form ── */}
            {showForm && (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-5">
                    <form onSubmit={handleCreate} className="space-y-3">
                        <Input
                            id="deck-name-input"
                            placeholder="Deck name (e.g. Kanji N3)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="h-11"
                        />
                        <Input
                            id="deck-desc-input"
                            placeholder="Description (optional)"
                            value={description}
                            onChange={(e) => setDesc(e.target.value)}
                            className="h-11"
                        />
                        {createError && (
                            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                                {createError}
                            </p>
                        )}
                        <div className="flex gap-2">
                            <Button
                                id="create-deck-btn"
                                type="submit"
                                disabled={createDeck.isPending || !name.trim()}
                                className="bg-gray-900 hover:bg-gray-700 text-white"
                            >
                                {createDeck.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Deck list ── */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                </div>
            ) : deckList && deckList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deckList.map((deck) => (
                        <div
                            key={deck.id}
                            className="group relative flex flex-col rounded-2xl border border-gray-200
                                bg-white shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
                        >
                            {/* Card body — click to study */}
                            <button
                                id={`deck-card-${deck.id}`}
                                type="button"
                                className="flex-1 text-left p-5"
                                onClick={() => {
                                    if (renamingId !== deck.id) navigate(`/study/${deck.id}`);
                                }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-0.5" />
                                </div>

                                {/* Name — normal or inline rename */}
                                {renamingId === deck.id ? (
                                    <div
                                        className="mt-2 space-y-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Input
                                            id={`rename-input-${deck.id}`}
                                            value={renameValue}
                                            autoFocus
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") confirmRename();
                                                if (e.key === "Escape") setRenamingId(null);
                                            }}
                                            className="h-8 text-sm font-semibold"
                                        />
                                        <Input
                                            value={renameDesc}
                                            onChange={(e) => setRenameDesc(e.target.value)}
                                            placeholder="Description (optional)"
                                            className="h-8 text-xs"
                                        />
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={confirmRename}
                                                disabled={renameDeck.isPending || !renameValue.trim()}
                                                className="p-1.5 rounded bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40"
                                            >
                                                {renameDeck.isPending
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <Check className="w-3 h-3" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRenamingId(null)}
                                                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-2">
                                        <p className="font-semibold text-gray-900 leading-tight">{deck.name}</p>
                                        {deck.description && (
                                            <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                                                {deck.description}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </button>

                            {/* Footer — counts + actions */}
                            <div className="flex items-center justify-between px-5 pb-4 gap-2">
                                {/* Card + due counts */}
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span>{deck.cardCount} cards</span>
                                    {deck.dueCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-semibold border border-orange-100">
                                            {deck.dueCount} due
                                        </span>
                                    )}
                                    <span className="ml-auto">{relative(deck.createdAt)}</span>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        id={`study-btn-${deck.id}`}
                                        type="button"
                                        title="Start study session"
                                        onClick={() => navigate(`/study/${deck.id}`)}
                                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        id={`rename-btn-${deck.id}`}
                                        type="button"
                                        title="Rename deck"
                                        onClick={(e) => { e.stopPropagation(); startRename(deck); }}
                                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        id={`delete-btn-${deck.id}`}
                                        type="button"
                                        title="Delete deck"
                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(deck); }}
                                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No decks yet</p>
                    <p className="text-sm mt-1">Create your first deck to start learning.</p>
                </div>
            )}

            {/* ── Delete confirm modal ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl p-7 max-w-sm w-full mx-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-gray-900">Delete "{deleteTarget.name}"?</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    This will permanently delete {deleteTarget.cardCount} flashcard
                                    {deleteTarget.cardCount !== 1 ? "s" : ""} and all review history. This cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteTarget(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                id="confirm-delete-btn"
                                onClick={confirmDelete}
                                disabled={deleteDeck.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {deleteDeck.isPending
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : "Delete Deck"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
