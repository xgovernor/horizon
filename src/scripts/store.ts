// store.ts — Global state store for the Vim wiki
// ─────────────────────────────────────────────────────────────────────────────
// Usage:
//   import { store, subscribe } from '../scripts/store.ts';
//
//   // Read
//   const mode = store.mode;
//
//   // Write (triggers all subscribers)
//   store.set({ mode: 'INSERT', fileInfo: 'blog/post-1' });
//
//   // Subscribe to changes
//   const unsub = subscribe((state, changed) => {
//     if (changed.has('mode')) console.log('mode changed to', state.mode);
//   });
//   unsub(); // cleanup
// ─────────────────────────────────────────────────────────────────────────────

import type { VimMode } from "../types";


// ── Shape ─────────────────────────────────────────────────────────────────────

export interface StoreState {
    mode: VimMode;
    commandLine: string;
    fileInfo: string;
    position: string;
    // Extend here freely — sidebar tree state, search results, etc.
    searchTerm: string;
    yankStatus: 'idle' | 'success' | 'fail';
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaults: StoreState = {
    mode: 'NORMAL',
    commandLine: '',
    fileInfo: '',
    position: '0%',
    searchTerm: '',
    yankStatus: 'idle',
};

// ── Internals ─────────────────────────────────────────────────────────────────

type Subscriber = (state: Readonly<StoreState>, changed: ReadonlySet<keyof StoreState>) => void;

const subscribers = new Set<Subscriber>();
let state: StoreState = { ...defaults };

// ── Public API ────────────────────────────────────────────────────────────────

/** Read-only proxy over current state. */
export const store: Readonly<StoreState> = new Proxy({} as StoreState, {
    get: (_, key: string) => state[key as keyof StoreState],
});

/**
 * Partially update state. Only changed keys trigger subscribers.
 * Subscribers receive the full updated state and the set of changed keys.
 */
export function set(patch: Partial<StoreState>): void {
    const changed = new Set<keyof StoreState>();

    for (const key in patch) {
        const k = key as keyof StoreState;
        if (patch[k] !== state[k]) {
            changed.add(k);
        }
    }

    if (changed.size === 0) return; // no-op if nothing actually changed

    state = { ...state, ...patch };

    for (const sub of subscribers) {
        sub(state, changed);
    }
}

/**
 * Subscribe to state changes. Handler is called only when something changes.
 * Returns an unsubscribe function.
 */
export function subscribe(handler: Subscriber): () => void {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
}

/** Reset to defaults — called by navigation.ts on cleanup before page swap. */
export function reset(): void {
    set(defaults);
}
