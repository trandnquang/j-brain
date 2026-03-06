import { useReducer, useCallback } from "react";

/**
 * useSearchHistory — manages a back/forward navigation stack for search keywords.
 *
 * WHY: Users frequently cross-reference words (e.g. click kanji → search → back).
 * A history stack makes "undo/redo search" feel like browser navigation, integrated
 * directly into the search bar, with zero reliance on React Router state.
 */

interface HistoryState {
    stack: string[];   // all submitted searches, oldest first
    index: number;     // pointer to the current position in the stack
}

type Action =
    | { type: "PUSH"; keyword: string }
    | { type: "BACK" }
    | { type: "FORWARD" };

const MAX_HISTORY = 50;

function historyReducer(state: HistoryState, action: Action): HistoryState {
    switch (action.type) {
        case "PUSH": {
            // Truncate forward history when a new search is submitted
            const base = state.stack.slice(0, state.index + 1);
            // Deduplicate consecutive identical searches
            if (base[base.length - 1] === action.keyword) return state;
            const newStack = [...base, action.keyword].slice(-MAX_HISTORY);
            return { stack: newStack, index: newStack.length - 1 };
        }
        case "BACK":
            if (state.index <= 0) return state;
            return { ...state, index: state.index - 1 };
        case "FORWARD":
            if (state.index >= state.stack.length - 1) return state;
            return { ...state, index: state.index + 1 };
        default:
            return state;
    }
}

export interface SearchHistoryAPI {
    /** Current active keyword from the history stack (undefined if empty) */
    current: string | undefined;
    /** Navigates back one step, returns false if already at beginning */
    canBack: boolean;
    /** Navigates forward one step, returns false if already at end */
    canForward: boolean;
    push: (keyword: string) => void;
    back: () => void;
    forward: () => void;
}

export function useSearchHistory(): SearchHistoryAPI {
    const [state, dispatch] = useReducer(historyReducer, { stack: [], index: -1 });

    const push     = useCallback((kw: string) => dispatch({ type: "PUSH",    keyword: kw }), []);
    const back     = useCallback(()           => dispatch({ type: "BACK" }),                  []);
    const forward  = useCallback(()           => dispatch({ type: "FORWARD" }),               []);

    return {
        current:    state.index >= 0 ? state.stack[state.index] : undefined,
        canBack:    state.index > 0,
        canForward: state.index < state.stack.length - 1,
        push,
        back,
        forward,
    };
}
