// search.ts — Wiki search: fetches posts, subscribes to vim:search / vim:clearSearch
// ─────────────────────────────────────────────────────────────────────────────
// Usage in Layout.astro (alongside navigation init):
//
//   <script>
//     import { init as initSearch } from '../scripts/search.ts';
//     import { init } from '../scripts/navigation.ts';
//     initSearch();
//     init();
//   </script>
//
// Callers own cleanup — navigation.ts calls cleanup() on astro:before-swap.
// ─────────────────────────────────────────────────────────────────────────────

import { on } from './events.ts';
import { set } from './store.ts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlogPost {
  title: string;
  content: string;
  path: string;
}

// ── State ─────────────────────────────────────────────────────────────────────

let posts: BlogPost[] = [];
let unsubSearch: (() => void) | null = null;
let unsubClear: (() => void) | null = null;
let initialized = false;

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchPosts(): Promise<void> {
  try {
    const res = await fetch('/api/blog-posts');
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    posts = await res.json();
  } catch (err) {
    // Non-fatal — search will just return empty until next init
    console.warn('[search] Failed to fetch posts:', err);
    posts = [];
  }
}

// ── Search & Render ───────────────────────────────────────────────────────────

function performSearch(term: string): void {
  const q = term.toLowerCase();
  const results = posts.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.content.toLowerCase().includes(q),
  );

  const el = document.getElementById('search-results');
  if (!el) return;

  if (results.length === 0) {
    el.innerHTML = `<div class="p-2 text-nvim-gray">No results for "${term}"</div>`;
  } else {
    el.innerHTML = results.map(p => `
      <a href="${p.path}" class="block p-2 hover:bg-nvim-gray">
        <div class="font-bold">${highlight(p.title, term)}</div>
        <div class="text-sm">${highlight(p.content.slice(0, 120), term)}…</div>
      </a>
    `).join('');
  }

  el.classList.remove('hidden');

  // Sync search term into store so other subscribers can read it
  set({ searchTerm: term });
}

function clearResults(): void {
  const el = document.getElementById('search-results');
  if (!el) return;
  el.innerHTML = '';
  el.classList.add('hidden');
  set({ searchTerm: '' });
}

// Simple substring highlight — wraps match in a <mark> span
function highlight(text: string, term: string): string {
  if (!term) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark class="bg-nvim-yellow text-nvim-bg">$1</mark>',
  );
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

export function cleanup(): void {
  unsubSearch?.();
  unsubClear?.();
  unsubSearch = null;
  unsubClear = null;
  clearResults();
  initialized = false;
}

export function init(): void {
  if (typeof document === 'undefined') return; // SSR guard
  if (initialized) return;                      // idempotent
  initialized = true;

  fetchPosts(); // non-blocking — results arrive before user can type a query

  unsubSearch = on('vim:search', ({ term }) => performSearch(term));
  unsubClear = on('vim:clearSearch', () => clearResults());
}
