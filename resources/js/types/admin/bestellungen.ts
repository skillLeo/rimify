/** Verkauf › Bestellungen — BestellungenController::index and OrderList::row. */

import type { ListColumnsProps, ListViewsProps } from './lists'

export interface OrderState {
    label: string
    /** Only the exception is tagged; `plain` is written as text. */
    tone: 'plain' | 'warn' | 'bad' | 'neutral'
}

export interface OrderRow {
    id: number
    number: string
    /** False for a draft: its date is when it was begun, not when it was placed. */
    placed: boolean
    /** `21.11.2025` */
    date: string | null
    /** `21.11.2025, 14:22 Uhr` */
    at: string | null
    iso: string | null
    customer: string | null
    email: string | null
    vehicle: string | null
    /** Minor units (cents); written by num.ts formatMoney: `1.425,00 €`. */
    total: number
    currency: string
    status: string
    statusLabel: string
    payment: OrderState
    fulfilment: OrderState
    paymentMethod: string | null
    shippingMethod: string | null
    /** A line was sold under a Gutachten with Auflagen. */
    conditions: boolean
    /** Seeded demonstration data, never a real sale. */
    demo: boolean
}

export type OrderSort = 'datum' | 'summe' | 'status'

export interface OrderFilters {
    q: string
    status: string
    /** A preset counted back from today (`heute`, `7`, `30`) — kept as that in a link or a view. */
    zeitraum: string
    /** `YYYY-MM-DD`, Berlin days — an own range. */
    von: string
    bis: string
    zahlart: string
    versandart: string
    /** As typed, the German way: `1.425,50`. */
    min: string
    max: string
    auflagen: boolean
    sort: OrderSort
    richtung: 'auf' | 'ab'
}

export interface OrderOption {
    value: string
    label: string
}

export interface AdminBestellungenProps {
    orders: OrderRow[]
    filters: OrderFilters
    options: {
        statuses: (OrderOption & { count: number })[]
        /** Only the methods some order carries; empty hides the filter. */
        payment: OrderOption[]
        shipping: OrderOption[]
    }
    filtered: boolean
    totalAll: number
    pagination: { current: number; last: number; total: number; prev: string | null; next: string | null }
    /** The query string in force, as the server reads it. */
    query: Record<string, string>
    exportUrls: { csv: string; xlsx: string } | null
    can: { export: boolean }
    views: ListViewsProps
    columns: ListColumnsProps
}
