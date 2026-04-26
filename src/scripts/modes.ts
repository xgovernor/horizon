// modes.ts — Mode FSM: NORMAL, INSERT, VISUAL, COMMAND, SEARCH
// ─────────────────────────────────────────────────────────────────────────────
// Owns:
//   - currentMode (single source of truth)
//   - chord engine (gg, etc.)
//   - per-mode key handlers
//   - escape logic
//
// Scroll side-effects: modes call window.scrollBy/scrollTo directly.
// navigation.ts's scroll listener picks up the resulting scroll events
// and updates position in the store — no internal event needed.
// ─────────────────────────────────────────────────────────────────────────────

import type { EmptyDetail, VimMode } from '../types';
import { emit } from './events.ts';
import { set } from './store.ts';

// ── Mode State ────────────────────────────────────────────────────────────────

let currentMode: VimMode = 'NORMAL';

export function getMode(): VimMode { return currentMode; }

export function setMode(mode: VimMode): void {
    currentMode = mode;
    set({ mode });
}

export function resetMode(): void {
    currentMode = 'NORMAL';
    clearPending();
}

// ── Chord Engine ──────────────────────────────────────────────────────────────

const CHORD_TIMEOUT_MS = 500;
let pendingKey = '';
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

export function clearPending(): void {
    pendingKey = '';
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
}

function setPending(key: string): void {
    pendingKey = key;
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = setTimeout(clearPending, CHORD_TIMEOUT_MS);
}

// ── Normal Mode ───────────────────────────────────────────────────────────────

export function handleNormalModeKey(key: string): void {
    // Chord: gg → scroll to top
    if (key === 'g') {
        if (pendingKey === 'g') {
            clearPending();
            window.scrollTo(0, 0);
            // scroll event fires → navigation.ts scroll listener → updatePosition()
        } else {
            setPending('g');
        }
        return;
    }

    clearPending();

    switch (key) {
        case 'j': window.scrollBy(0, 30); break;
        case 'k': window.scrollBy(0, -30); break;

        case 'G':
            window.scrollTo(0, document.documentElement.scrollHeight);
            break;

        // '-' = navigate up a directory (netrw idiom — 'u' = undo in real Vim)
        case '-': navigateUp(); break;

        case 'i': setMode('INSERT'); break;
        case 'v': enterVisualMode(); break;
        case 'o': emit('vim:openNewPage', {} as EmptyDetail); break;
    }
}

// ── Visual Mode ───────────────────────────────────────────────────────────────

function enterVisualMode(): void {
    setMode('VISUAL');
    emit('vim:visualEnter', { startY: window.scrollY });
}

export function exitVisualMode(): void {
    window.getSelection()?.removeAllRanges();
    emit('vim:visualExit', {} as EmptyDetail);
}

export function handleVisualModeKey(key: string): void {
    switch (key) {
        case 'j': window.scrollBy(0, 30); break;
        case 'k': window.scrollBy(0, -30); break;

        case 'y': {
            const text = window.getSelection()?.toString() ?? '';
            if (text) {
                navigator.clipboard.writeText(text)
                    .then(() => { set({ yankStatus: 'success' }); emit('vim:yankSuccess', {} as EmptyDetail); })
                    .catch(() => { set({ yankStatus: 'fail' }); emit('vim:yankFail', {} as EmptyDetail); });
            }
            setMode('NORMAL');
            exitVisualMode();
            break;
        }

        case 'd':
        case 'c':
            setMode('NORMAL');
            exitVisualMode();
            break;
    }
}

// ── Escape ────────────────────────────────────────────────────────────────────

/**
 * Handle Escape from any mode.
 * Returns the cleared commandBuffer value so navigation.ts can update its own state.
 */
export function handleEscape(commandBuffer: string): string {
    const wasSearch = currentMode === 'SEARCH';
    if (currentMode === 'VISUAL') exitVisualMode();
    clearPending();
    currentMode = 'NORMAL';
    set({ mode: 'NORMAL', commandLine: '' });
    if (wasSearch) {
        set({ searchTerm: '' });
        emit('vim:clearSearch', {} as EmptyDetail);
    }
    return ''; // cleared commandBuffer back to caller
}

// ── Navigate Up ('-' key) ─────────────────────────────────────────────────────

function navigateUp(): void {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return;
    window.location.href =
        parts.length === 1 ? '/' : '/' + parts.slice(0, -1).join('/');
}
