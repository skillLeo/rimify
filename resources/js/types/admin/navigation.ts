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
}

export interface NavMenu {
    key: string
    label: string
    max: number
    maxVisible: number | null
    icon: boolean
    items: NavEntry[]
}

export interface AdminNavigationProps {
    menus: NavMenu[]
    targets: { value: string; label: string }[]
    icons: { value: string; label: string }[]
    can: { create: boolean; edit: boolean; delete: boolean }
}
