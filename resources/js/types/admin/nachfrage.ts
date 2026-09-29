import type { DashboardPeriod, DemandList } from './uebersicht'

/** Übersicht › Nachfrage — NachfrageController. */
export type DemandState = 'offen' | 'beobachtet' | 'angefordert' | 'alle'

export interface SearchMiss {
    query: string
    /** Every miss of this query so far: the table keeps no days. */
    misses: number
    lastAgo: string | null
}

export interface AdminNachfrageProps {
    period: DashboardPeriod
    state: DemandState
    demand: DemandList
    searches: SearchMiss[]
    /** How the order is made, for the sentence that says so. */
    weighting: { halfLife: number; waiting: number }
    /** Wheel brands a Gutachten can be asked of; empty for a role that may not mark. */
    brands: { id: number; name: string }[]
    can: { mark: boolean }
}
