// navigation.ts — Lifecycle, keydown router, scroll tracking
// ─────────────────────────────────────────────────────────────────────────────
// The only module that attaches DOM event listeners directly.
// All mode logic → modes.ts  |  commands → commands.ts  |  search → search.ts
//
// Layout.astro usage:
//
//   <script>
//     import { init as initSearch } from '../scripts/search.ts';
//     import { init } from '../scripts/navigation.ts';
//     initSearch();
//     init();
//   </script>
// ─────────────────────────────────────────────────────────────────────────────

import { set, reset } from './store.ts';
import { executeCommand } from './commands.ts';
import { cleanup as cleanupSearch, init as initSearch } from './search.ts';
import {
  getMode,
  setMode,
  resetMode,
  handleNormalModeKey,
  handleVisualModeKey,
  handleEscape,
} from './modes.ts';

// Re-export the public surface — consumers import from one place
export { on } from './events.ts';
export { registerCommand } from './commands.ts';
export { getMode, setMode } from './modes.ts';
export { store, subscribe } from './store.ts';

// ── State ─────────────────────────────────────────────────────────────────────

let commandBuffer = '';
let initialized = false;

// ── Position & File Info ──────────────────────────────────────────────────────

function updatePosition(): void {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const pct = scrollable > 0
    ? Math.round((window.scrollY / scrollable) * 100)
    : 100;
  set({ position: `${pct}%` });
}

function updateFileInfo(): void {
  const path = window.location.pathname;
  set({ fileInfo: path === '/' ? 'Landing Page' : path.slice(1) });
}

// ── Keydown Router ────────────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent): void {
  const mode = getMode();

  // INSERT: pass everything through except Escape
  if (mode === 'INSERT' && e.key !== 'Escape') return;

  // Bare modifier keys — never interact with them
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Dead'].includes(e.key)) return;

  // Don't hijack focused inputs or contenteditable — except Escape
  const target = e.target as HTMLElement;
  const isEditable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    || target.isContentEditable;
  if (e.key !== 'Escape' && isEditable) return;

  switch (e.key) {
    case ':':
      if (mode === 'NORMAL' || mode === 'VISUAL') {
        e.preventDefault();
        commandBuffer = ':';
        setMode('COMMAND');
        set({ commandLine: commandBuffer });
      }
      break;

    case '/':
      if (mode === 'NORMAL' || mode === 'VISUAL') {
        e.preventDefault();
        commandBuffer = '/';
        setMode('SEARCH');
        set({ commandLine: commandBuffer });
      }
      break;

    case 'Escape':
      commandBuffer = handleEscape(commandBuffer);
      break;

    case 'Enter':
      if (mode === 'COMMAND' || mode === 'SEARCH') {
        e.preventDefault();
        const buf = commandBuffer; // snapshot before escape clears it
        commandBuffer = handleEscape(commandBuffer);
        executeCommand(buf);
      }
      break;

    case 'Backspace':
      if (mode === 'COMMAND' || mode === 'SEARCH') {
        e.preventDefault();
        commandBuffer = commandBuffer.slice(0, -1);
        commandBuffer.length === 0
          ? (commandBuffer = handleEscape(commandBuffer))
          : set({ commandLine: commandBuffer });
      }
      break;

    default:
      if (mode === 'COMMAND' || mode === 'SEARCH') {
        if (e.key.length === 1) { // printable chars only
          e.preventDefault();
          commandBuffer += e.key;
          set({ commandLine: commandBuffer });
        }
      } else if (mode === 'NORMAL') {
        handleNormalModeKey(e.key);
      } else if (mode === 'VISUAL') {
        handleVisualModeKey(e.key);
      }
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

function cleanup(): void {
  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('scroll', updatePosition);
  cleanupSearch();   // search owns its own subscriptions — we just call its cleanup
  commandBuffer = '';
  resetMode();
  reset();           // store back to defaults
  initialized = false;
}

/** Initialize the navigation engine. Call once from a client-side <script>. */
export function init(): void {
  if (typeof document === 'undefined') return; // SSR guard
  if (initialized) return;                      // idempotent
  initialized = true;

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('scroll', updatePosition);

  // Defer initial state push by one frame — guarantees StatusBar's subscribe()
  // call (in its astro:page-load handler) has already run before we emit.
  requestAnimationFrame(() => {
    updatePosition();
    updateFileInfo();
    set({ mode: getMode(), commandLine: '' });
  });

  // Astro View Transitions — named refs so { once: true } removes the right fn
  document.addEventListener('astro:before-swap', cleanup, { once: true });
  document.addEventListener('astro:page-load', init, { once: true });
}
