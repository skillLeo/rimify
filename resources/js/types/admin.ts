/**
 * The admin shell's shared props, as `HandleInertiaRequests::admin()` sends them on `admin.*`
 * routes. The contract is docs/admin/shell-build-plan.md; the server is the one source of every
 * value here, so the client never filters, never guesses and never fetches the rail after the fact.
 */

import type { AdminIconName } from '../icons/admin'

export interface AdminNavPage {
    label: string
    href: string
    icon: AdminIconName
    /** A queue of work waiting; null at zero or when it could not be computed. */
    count: number | null
    /** `bad` only where the number means something broke; a large workload is not an alarm. */
    countTone: 'neutral' | 'bad'
}

export interface AdminNavGroup {
    key: string
    label: string
    icon: AdminIconName
    pages: AdminNavPage[]
}

export interface AdminAccount {
    name: string
    email: string
    /** The German role label; null means "show the address instead", never an invented role. */
    role: string | null
}

export interface AdminCrumb {
    label: string
    href: string | null
}

export interface AdminShared {
    /** View permission per module, for presentation only — the server refuses regardless (R-11). */
    can: Record<string, boolean>
    account: AdminAccount | null
    nav: AdminNavGroup[]
    /** `local` and `staging` are said out loud; production is null and shows nothing. */
    environment: 'local' | 'staging' | null
    preferences: { railCollapsed: boolean }
    breadcrumbs: AdminCrumb[]
    supportEmail: string | null
    /**
     * The bell's number — null when it could not be read, and then no number is shown — and whether
     * this role can receive any alert at all. A bell that can never ring is not drawn.
     */
    notifications: { unread: number | null; offered: boolean }
    /** The rail foot's line; `href` only for a role that may open System › Zustand. */
    health: AdminHealth | null
    /** „Neu“: what this role may create where the creating page exists. */
    quickActions: AdminQuickAction[]
}

export interface AdminHealth {
    state: 'ok' | 'warn' | 'bad'
    /** The whole sentence: the tooltip, the Übersicht's Systemzustand, System › Zustand. */
    sentence: string
    /** The rail's one line: `Warteschlange stockt`; empty when all is well. */
    label: string
    /** Beside it, where there is one: `12 Std`, `3`. */
    count: string | null
    href: string | null
    /** An urgent problem worth a banner above the page, unless this person snoozed it (8 hours). */
    banner: { key: 'maintenance' | 'queue'; sentence: string } | null
}

export interface AdminQuickAction {
    key: string
    label: string
    href: string
    icon: AdminIconName
}

/** One of the team's own alerts, as the bell and /admin/benachrichtigungen show it. */
export interface AdminAlertItem {
    id: string
    kind: string
    kindLabel: string
    title: string
    detail: string | null
    /** Null while the page it is about does not exist yet — never a link to a 404. */
    href: string | null
    read: boolean
    day: string
    dayLabel: string
    /** `14:22 Uhr` */
    time: string | null
    /** `21.11.2025, 14:22 Uhr` */
    at: string | null
    iso: string | null
}

/** One row of „Was du bekommst“. */
export interface AdminAlertKind {
    kind: string
    label: string
    description: string
    inApp: boolean
    email: boolean
}
