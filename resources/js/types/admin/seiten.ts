/**
 * Inhalte › Seiten — the shapes SeitenController ships (docs/admin/inhalte-build-plan.md).
 * The schema is PageSchema's, field for field: the counters here and the server's check read the
 * same numbers.
 */

export type FieldKind = 'text' | 'textarea' | 'number' | 'icon' | 'choice'

export interface SchemaField {
    key: string
    label: string
    kind: FieldKind
    required: boolean
    max: number | null
    min?: number
    help?: string
    options?: { value: string; label: string }[]
    /** A `choice`'s value where nothing was chosen yet (content written before the field existed). */
    default?: string
}

export interface SchemaList {
    key: string
    label: string
    itemLabel: string
    one: string
    min: number
    max: number
    fields: SchemaField[]
}

export interface SchemaBlock {
    type: string
    label: string
    repeat: boolean
    min: number
    max: number
    fields: SchemaField[]
    list?: SchemaList
}

export interface PageSchema {
    page: SchemaField[]
    blocks: SchemaBlock[]
}

export type BlockData = Record<string, string | number | null | Record<string, string | number | null>[]>

/* Type aliases, not interfaces: Inertia's form accepts a shape only with an index signature, and
   TypeScript gives aliases one implicitly. */
export type ContentBlock = {
    type: string
    data: BlockData
}

export type PageContent = {
    title: string
    metaDescription: string
    blocks: ContentBlock[]
}

export interface SeitenRow {
    id: number
    title: string
    href: string
    published: boolean
    publishedAt: string | null
    draft: { at: string | null; by: string | null } | null
    lawyerReviewed: boolean | null
    placeholder: boolean
}

export interface SeitenGroup {
    key: string
    label: string
    pages: SeitenRow[]
}

export interface AdminSeitenProps {
    groups: SeitenGroup[]
    can: { create: boolean }
}

export interface SeitenRevision {
    id: number
    at: string | null
    by: string | null
    note: string | null
}

export interface AdminSeiteProps {
    page: {
        id: number
        /** Sent back with every write; a write against an older version is refused. */
        version: number
        slug: string
        kind: 'marketing' | 'guide' | 'legal'
        group: string
        title: string
        href: string
        published: boolean
        publishedAt: string | null
        lawyerReviewed: boolean | null
        placeholder: boolean
    }
    schema: PageSchema
    content: PageContent
    live: PageContent
    draft: { at: string | null; by: string | null } | null
    revisions: SeitenRevision[]
    preview: { desktop: string; handy: string; days: number }
    can: { edit: boolean; publish: boolean; withdraw: boolean }
}
