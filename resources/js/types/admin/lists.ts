/** Gespeicherte Ansichten and the Spaltenwahl of a list (ListViews on the server). */

export interface ListViewItem {
    id: number
    name: string
    /** The list with the view's filters, and the view named so the page marks it. */
    href: string
    /** The filters the view keeps: compared (normalizeViewState) with those on screen for „geändert“. */
    query: Record<string, string>
    /** Saved with „Spalten mitspeichern“: opening it shows its own columns, for everyone. */
    storesColumns: boolean
    /** Those columns, in the list's order; null when the view keeps none. */
    columns: string[] | null
    /** The person's own: they may rename, share and delete it. */
    mine: boolean
    /** The role it is shared with — for the owner. */
    sharedWith: string | null
    /** That role's id — the owner's alone, for changing it. */
    roleId: number | null
    /** Who shared it — for everybody else. */
    owner: string | null
}

export interface ListViewsProps {
    items: ListViewItem[]
    /** The view the URL names, if the person may see it. */
    active: number | null
    /** The URL names a view the person cannot see (any more): deleted, or no longer shared. */
    missing: boolean
    /** The roles a view of this list may be shared with: those that may open it. */
    shareOptions: { id: number; label: string }[]
    /** Below the limit of views per person and list. */
    canSave: boolean
    limit: number
}

export interface ListColumn {
    key: string
    label: string
    /** Names the row: it cannot be hidden. */
    required: boolean
}

/** The columns a list shows now, and whose they are — the person's own, or the open view's. */
export interface ColumnsInForce {
    /** The chosen keys, in the list's order. */
    keys: string[]
    /** The open view's own set („Spalten mitspeichern“), not the person's. */
    fromView: boolean
}

export interface ListColumnsProps {
    all: ListColumn[]
    /** The keys shown, in the list's order. */
    shown: string[]
    /** The list's own set, before anybody chose. */
    defaults: string[]
}
