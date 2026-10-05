/** System › Testumgebung zurücksetzen — ZuruecksetzenController and TestReset. */

export type ResetLevelKey = 'demo' | 'shop' | 'all'

export interface ResetCount {
    /** Already in the right number: „Felge“ for one, „Felgen“ for more. */
    label: string
    count: number
}

export interface ResetLevelInfo {
    key: ResetLevelKey
    /** Demodaten · Shopdaten · Alles */
    label: string
    /** What goes, in one sentence. */
    removes: string
    /** What stays, in one sentence. */
    keeps: string
    /** What the level would take now, counted; only what there is. */
    counts: ResetCount[]
    /** Why the level cannot run now, or null. */
    blocked: string | null
}

export interface ResetLast {
    id: string
    level: ResetLevelKey
    label: string
    at: string
    /** `04.10.2026, 14:03 Uhr` */
    atText: string
    by: string
    /** Until when it can be undone, as `atText`. */
    until: string
    /** How long that is from the page's moment, said on the server: `noch 6 Tage und 23 Stunden`; null once it cannot. */
    remaining: string | null
    undone: boolean
    undoneText: string | null
    undoable: boolean
    /** Why it cannot be undone — once the window has closed, the one sentence that says so — or null. */
    reason: string | null
}

export interface AdminZuruecksetzenProps {
    levels: ResetLevelInfo[]
    last: ResetLast | null
    /** ZURÜCKSETZEN */
    word: string
    keepDays: number
}
