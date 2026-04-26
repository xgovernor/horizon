// types.ts — Shared types for the Vim navigation engine
// ─────────────────────────────────────────────────────────────────────────────

export type VimMode = 'NORMAL' | 'INSERT' | 'VISUAL' | 'COMMAND' | 'SEARCH';

export interface StatusUpdateDetail {
    mode?: VimMode;
    commandLine?: string;
    fileInfo?: string;
    position?: string;
}

export interface SearchDetail { term: string; }
export interface JumpDetail { line: number; }
export interface VisualDetail { startY?: number; }
export interface EmptyDetail { [key: string]: never }

export interface VimEventMap {
    'vim:statusUpdate': StatusUpdateDetail;
    'vim:search': SearchDetail;
    'vim:clearSearch': EmptyDetail;
    'vim:jumpToLine': JumpDetail;
    'vim:visualEnter': VisualDetail;
    'vim:visualExit': EmptyDetail;
    'vim:openNewPage': EmptyDetail;
    'vim:yankSuccess': EmptyDetail;
    'vim:yankFail': EmptyDetail;
}
