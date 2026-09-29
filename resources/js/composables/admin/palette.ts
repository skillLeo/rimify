/**
 * What the admin palette can find, and how it finds it — kept apart from the component so the rules
 * can be tested without a dialog.
 *
 * Today that is the viewer's pages and a handful of actions, drawn from the tree the server already
 * sent. Record groups (Bestellungen, Kunden, Felgen …) arrive with the pages that open a record:
 * a result that leads nowhere is the dead link the brief forbids, only slower (shell-build-plan.md).
 */

import { SECTION_TABS } from '../../Components/Admin/sectionTabs'
import type { AdminIconName } from '../../icons/admin'
import type { AdminNavGroup } from '../../types/admin'

export type PaletteGroup = 'recent' | 'goto' | 'actions'

export interface PaletteEntry {
    id: string
    group: PaletteGroup
    label: string
    /** Where the entry lives, or what it does — one quiet line; null when the label says it all. */
    sub: string | null
    /** The keys that do the same without the palette, right-aligned; null where there are none. */
    keys: string[] | null
    icon: AdminIconName
    /** Exactly one of these: a place to go, or a thing to do. */
    href?: string
    run?: () => void
    /** Extra words the entry answers to, beyond its label and sub line. */
    keywords?: string
}

export const GROUP_LABEL: Record<PaletteGroup, string> = {
    recent: 'Zuletzt geöffnet',
    goto: 'Gehe zu',
    actions: 'Aktionen',
}

/** Pages that are not in the rail but are the viewer's own, so they can be found and remembered. */
export const OWN_PAGES: ReadonlyArray<{ label: string; href: string; icon: AdminIconName; keywords: string }> = [
    { label: 'Profil', href: '/admin/profil', icon: 'users', keywords: 'konto account' },
    { label: 'Benachrichtigungen', href: '/admin/benachrichtigungen', icon: 'bell', keywords: 'glocke hinweise meldungen ungelesen' },
]

/** Lowercase, accents dropped, ß as ss — what a query is reduced to. */
export function normalise(value: string): string {
    return value.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/\p{M}/gu, '')
}

/**
 * Both ways a German word gets typed without its umlaut: `Übersicht` answers to `übersicht`,
 * `ubersicht` and `uebersicht` alike, because a text is searched in both spellings.
 */
function spellings(value: string): [string, string] {
    const spelled = value.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')

    return [normalise(value), normalise(spelled)]
}

/**
 * Every page the viewer may open, with the group it sits in as its sub line. `shortcuts` maps an
 * href to the second key of its `g` sequence, so a page that has one says so.
 */
export function pageEntries(nav: AdminNavGroup[], shortcuts: Record<string, string> = {}): PaletteEntry[] {
    const entries: PaletteEntry[] = []

    for (const group of nav) {
        for (const page of group.pages) {
            const key = shortcuts[page.href]

            entries.push({
                id: `goto:${page.href}`,
                group: 'goto',
                label: page.label,
                sub: page.label === group.label ? null : group.label,
                keys: key ? ['G', key.toUpperCase()] : null,
                icon: page.icon,
                href: page.href,
            })

            // A rail item made of tabs: each tab is a page of its own, found by its own name.
            for (const tab of SECTION_TABS[page.href] ?? []) {
                entries.push({
                    id: `goto:${tab.href}`,
                    group: 'goto',
                    label: tab.label,
                    sub: `${group.label} › ${page.label}`,
                    keys: null,
                    icon: page.icon,
                    href: tab.href,
                    keywords: page.label,
                })
            }
        }
    }

    for (const page of OWN_PAGES) {
        entries.push({ id: `goto:${page.href}`, group: 'goto', label: page.label, sub: null, keys: null, icon: page.icon, href: page.href, keywords: page.keywords })
    }

    return entries
}

/**
 * The entries matching a query, best first. Every word typed must appear somewhere in the entry;
 * a label that starts with the query outranks one that merely contains it.
 */
export function search(entries: PaletteEntry[], query: string): PaletteEntry[] {
    const words = normalise(query).split(/\s+/).filter(Boolean)

    if (words.length === 0) {
        return entries
    }

    const scored: Array<{ entry: PaletteEntry; score: number; index: number }> = []

    entries.forEach((entry, index) => {
        const labels = spellings(entry.label)
        const haystack = spellings(`${entry.label} ${entry.sub ?? ''} ${entry.keywords ?? ''}`).join(' ')

        if (!words.every((word) => haystack.includes(word))) {
            return
        }

        const first = words[0] ?? ''
        const score = labels.some((l) => l.startsWith(first))
            ? 0
            : labels.some((l) => l.split(/[\s-]+/).some((part) => part.startsWith(first)))
              ? 1
              : 2

        scored.push({ entry, score, index })
    })

    return scored.sort((a, b) => a.score - b.score || a.index - b.index).map((s) => s.entry)
}

/* ── Zuletzt geöffnet ─────────────────────────────────────────────────────────────
 * Per viewer and per browser, in localStorage — a convenience, never state the panel depends on.
 * Read and written only after mount (the server has no storage), and every access is guarded: a
 * private window or blocked site data simply means nothing recent.                              */

export const RECENT_KEY = 'rmf_admin_recent'
export const RECENT_MAX = 5

export interface RecentPage {
    href: string
    label: string
}

/**
 * The storage key for one person's recent pages. Keyed by account, so two people who share a browser
 * never see where the other has been; without an account the shared key is used.
 */
export function recentKey(account: string | null): string {
    return account ? `${RECENT_KEY}:${account.toLowerCase()}` : RECENT_KEY
}

export function readRecent(key: string = RECENT_KEY): RecentPage[] {
    try {
        const raw: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]')

        if (!Array.isArray(raw)) {
            return []
        }

        return raw
            .filter((r): r is RecentPage => typeof r === 'object' && r !== null && typeof r.href === 'string' && typeof r.label === 'string')
            .slice(0, RECENT_MAX)
    } catch {
        return []
    }
}

/** Puts a page at the front, once. */
export function rememberRecent(page: RecentPage, key: string = RECENT_KEY): void {
    const next = [page, ...readRecent(key).filter((r) => r.href !== page.href)].slice(0, RECENT_MAX)

    try {
        window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
        // Nothing to do: remembering is a courtesy.
    }
}

/**
 * The recent pages as entries — only those the viewer can still open (a page a role lost, or one
 * removed, is dropped silently), and never the page they are on.
 */
export function recentEntries(recent: RecentPage[], pages: PaletteEntry[], currentHref: string): PaletteEntry[] {
    const byHref = new Map(pages.map((p) => [p.href, p]))
    const entries: PaletteEntry[] = []

    for (const item of recent) {
        const page = byHref.get(item.href)

        if (!page || item.href === currentHref) {
            continue
        }

        entries.push({ ...page, id: `recent:${item.href}`, group: 'recent', keys: null })
    }

    return entries
}
