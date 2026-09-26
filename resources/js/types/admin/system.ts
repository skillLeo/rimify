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
