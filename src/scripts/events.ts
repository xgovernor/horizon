// events.ts — Pure JS typed pub-sub event bus
// ─────────────────────────────────────────────────────────────────────────────
// SSR-safe: zero document/window references at module level.
// Callers own cleanup — call the returned unsub() in their cleanup().
//
// Usage:
//   import { emit, on } from './events.ts';
//
//   emit('vim:search', { term: 'foo' });
//
//   const unsub = on('vim:search', ({ term }) => console.log(term));
//   unsub(); // cleanup
// ─────────────────────────────────────────────────────────────────────────────

import type { VimEventMap } from '../types';

type Handler<T> = (detail: T) => void;

// Module-level singleton — survives page transitions intentionally.
// Subscriptions that should persist (StatusBar, search) never need to resubscribe.
// Only navigation.ts's internal subs are cleaned up per-page via unsub().
const listeners = new Map<string, Set<Handler<unknown>>>();

export function emit<K extends keyof VimEventMap>(
    event: K,
    detail: VimEventMap[K],
): void {
    listeners.get(event)?.forEach(h => h(detail as unknown));
}

/**
 * Subscribe to a vim event.
 * Returns an unsubscribe function — caller is responsible for calling it on cleanup.
 */
export function on<K extends keyof VimEventMap>(
    event: K,
    handler: Handler<VimEventMap[K]>,
): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler as Handler<unknown>);
    return () => listeners.get(event)?.delete(handler as Handler<unknown>);
}
