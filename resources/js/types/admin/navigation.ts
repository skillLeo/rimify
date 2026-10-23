/** Inhalte › Navigation — the shapes NavigationController ships. */

export interface NavEntry {
    id: number
    label: string
    /** `route:felgen.index` or `page:/rechtliches/agb` — a key from `targets`. */
    target: string
    targetLabel: string
    icon: string | null
    visible: boolean
    /** Impressum and Datenschutz: reachable from every page, so only their place can change. */
    locked: boolean
    /** The entry as loaded (EditStamp): „Bearbeiten“ sends it, a save against an older state is refused. */
    stamp?: string
}

export interface NavMenu {
    key: string
    label: string
    max: number
    maxVisible: number | null
    icon: boolean
    items: NavEntry[]
    /** The menu's order as loaded (EditStamp): a move sends it, a move from an older order is refused. */
    orderStamp?: string
}

export interface AdminNavigationProps {
    menus: NavMenu[]
    targets: { value: string; label: string }[]
    icons: { value: string; label: string }[]
    can: { create: boolean; edit: boolean; delete: boolean }
}
