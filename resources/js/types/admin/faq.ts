/** Inhalte › FAQ — the shapes FragenController ships. */

export interface FaqEntryRow {
    id: number
    question: string
    answer: string
    published: boolean
}

export interface FaqGroup {
    key: string
    entries: FaqEntryRow[]
}

export interface AdminFaqProps {
    groups: FaqGroup[]
    groupOptions: string[]
    /** The entries the homepage shows — the first five visible ones. */
    onHome: number[]
    limits: { question: number; answer: number }
    can: { create: boolean; edit: boolean; delete: boolean; publish: boolean }
}
