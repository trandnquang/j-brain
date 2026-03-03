/** Frontend representation of one AI-generated example. Matches backend ExampleResponse. */
export interface ExampleResponse {
    id: string | null; // null before persisted
    contextStyle: "Keigo" | "Daily" | "Anime";
    japaneseSentence: string;
    furiganaSentence: string | null;
    vietnameseTranslation: string;
}
