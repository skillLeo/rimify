/** Inhalte › FAQ — the shapes FragenController ships. */

export interface FaqEntryRow {
    id: number
    question: string
    answer: string
    published: boolean
    /** The entry as loaded (EditStamp): „Bearbeiten“ sends it, a save against an older state is refused. */
    stamp?: string
}

export interface FaqGroup {
    key: string
    entries: FaqEntryRow[]
}

export interface AdminFaqProps {
    groups: FaqGroup[]
    /** The order as loaded (EditStamp): a move sends it, a move from an older order is refused. */
    orderStamp?: string
    groupOptions: string[]
    /** The entries the homepage shows — the first five visible ones. */
    onHome: number[]
    limits: { question: number; answer: number }
    can: { create: boolean; edit: boolean; delete: boolean; publish: boolean }
}
