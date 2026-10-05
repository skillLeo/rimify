/** System › Zustand — SystemController and SystemHealth::report(). */

export type HealthState = 'ok' | 'warn' | 'bad'

export interface HealthCheck {
    key: string
    label: string
    state: HealthState
    sentence: string
}

export interface HealthReport {
    state: HealthState
    /** „Alles in Ordnung“, or the worst check's sentence. */
    sentence: string
    checks: HealthCheck[]
    checkedAt: string
}

export interface AdminSystemProps {
    report: HealthReport
    /** `26.09.2026, 20:10 Uhr` */
    checkedAt: string
}

/** System › Was fehlt — WasFehltController and GoLiveChecks. */

export type GoLiveOwner = 'kunde' | 'wir' | 'host'

export type GoLiveState = 'ok' | 'fehlt' | 'nicht prüfbar'

export interface GoLiveCheck {
    id: string
    group: string
    title: string
    owner: GoLiveOwner
    state: GoLiveState
    /** One German sentence on the state found. */
    sentence: string
    /** Where it is closed: an admin path (`/admin/…`), an environment variable or a file. */
    place: string
}

export interface AdminWasFehltProps {
    /** `14 von 30 erfüllt · 4 bei uns · 8 beim Kunden · 1 beim Host · 3 nicht prüfbar` */
    summary: string
    groups: string[]
    /** Who closes a check, as the page names them: `beim Kunden`, `bei uns (RIMIFY)`, `beim Host`. */
    owners: Record<GoLiveOwner, string>
    /** Whose items the page shows: the client's by default, or `alle`. */
    owner: GoLiveOwner | 'alle'
    checks: GoLiveCheck[]
    checkedAt: string
}
