/**
 * The admin shell's shared props, as `HandleInertiaRequests::admin()` sends them on `admin.*`
 * routes. The contract is docs/admin/shell-build-plan.md; the server is the one source of every
 * value here, so the client never filters, never guesses and never fetches the rail after the fact.
 */

import type { IconName } from '../icons'

export interface AdminNavPage {
    label: string
    href: string
    icon: IconName
    /** A queue of work waiting; null at zero or when it could not be computed. */
    count: number | null
    /** `bad` only where the number means something broke; a large workload is not an alarm. */
    countTone: 'neutral' | 'bad'
}

export interface AdminNavGroup {
    key: string
    label: string
    icon: IconName
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
}
