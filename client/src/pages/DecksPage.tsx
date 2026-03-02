import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, Loader2, ChevronRight } from "lucide-react";
import { useDecks, useCreateDeck } from "../hooks/useApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import type { ApiError } from "../types/api";

export default function DecksPage() {
    const navigate = useNavigate();
    const { data: deckList, isLoading } = useDecks();
    const createDeck = useCreateDeck();

    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await createDeck.mutateAsync({
                name: name.trim(),
                description: description.trim() || undefined,
            });
            setName("");
            setDescription("");
            setShowForm(false);
        } catch (err) {
            setError((err as ApiError)?.message ?? "Failed to create deck.");
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        My Decks
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {deckList?.length ?? 0} deck
                        {deckList?.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm((s) => !s)}
                    className="bg-black hover:bg-gray-800 text-white"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    New Deck
                </Button>
            </div>

            {/* Create form */}
            {showForm && (
                <Card className="border-2 border-dashed border-gray-200">
                    <CardContent className="pt-6">
                        <form onSubmit={handleCreate} className="space-y-3">
                            <Input
                                placeholder="Deck name (e.g. Kanji N3)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-11"
                            />
                            <Input
                                placeholder="Description (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-11"
                            />
                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
                                    {error}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={
                                        createDeck.isPending || !name.trim()
                                    }
                                    className="bg-black hover:bg-gray-800 text-white"
                                >
                                    {createDeck.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        "Create"
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Deck list */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                </div>
            ) : deckList && deckList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deckList.map((deck) => (
                        <Card
                            key={deck.id}
                            className="group cursor-pointer hover:shadow-md transition-shadow border hover:border-gray-300"
                            onClick={() => navigate(`/study/${deck.id}`)}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-start justify-between text-base font-semibold">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                                        {deck.name}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 line-clamp-2">
                                    {deck.description ?? "No description"}
                                </p>
                                <p className="text-xs text-gray-400 mt-3">
                                    Created{" "}
                                    {new Date(
                                        deck.createdAt,
                                    ).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-medium">No decks yet</p>
                    <p className="text-sm mt-1">
                        Create your first deck to start learning.
                    </p>
                </div>
            )}
        </div>
    );
}
