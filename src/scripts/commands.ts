// commands.ts — Command registry and built-in :commands
// ─────────────────────────────────────────────────────────────────────────────
// Usage:
//   import { registerCommand, executeCommand } from './commands.ts';
//
//   registerCommand('notes', () => navigate('/notes'));
//   executeCommand(':notes');  // navigates to /notes
// ─────────────────────────────────────────────────────────────────────────────

import { emit } from './events.ts';
import { set } from './store.ts';

// ── Registry ──────────────────────────────────────────────────────────────────

type CommandHandler = () => void;
const registry = new Map<string, CommandHandler>();

/** Register a `:command` handler. Safe to call before init(). */
export function registerCommand(cmd: string, handler: CommandHandler): void {
    registry.set(cmd.toLowerCase().trim(), handler);
}

function navigate(path: string): void {
    window.location.href = path;
}

// ── Built-ins ─────────────────────────────────────────────────────────────────

registerCommand('blog', () => navigate('/blog'));
registerCommand('about', () => navigate('/about'));
registerCommand('contact', () => navigate('/contact'));
registerCommand('help', () => navigate('/help'));
registerCommand('h', () => navigate('/help'));
registerCommand('q', () => navigate('/exited'));
registerCommand('wq', () => navigate('/exited'));
registerCommand('w', () => { /* no-op — read-only wiki */ });

// ── Execution ─────────────────────────────────────────────────────────────────

/**
 * Execute a raw command or search string.
 *   ':blog'  → registered command
 *   ':42'    → jump to line
 *   '/foo'   → search
 */
export function executeCommand(raw: string): void {
    if (raw.startsWith(':')) {
        const cmd = raw.slice(1).trim().toLowerCase();

        if (/^\d+$/.test(cmd)) {
            emit('vim:jumpToLine', { line: parseInt(cmd, 10) });
            return;
        }

        const handler = registry.get(cmd);
        if (handler) {
            handler();
        } else {
            set({ commandLine: `E492: Not an editor command: ${cmd}` });
        }

    } else if (raw.startsWith('/')) {
        const term = raw.slice(1).trim();
        if (term) {
            set({ searchTerm: term });
            emit('vim:search', { term });
        }
    }
}
