import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { DashboardCharts, DemandGap } from '../../../types/admin/uebersicht'

/*
 * The Übersicht's coverage pair: the Nachfrage-Lücken keep, once loaded, the box their skeleton stood in — a lead line
 * and five rows — so a list of fewer gaps leaves room at its foot and nothing under the card moves when the charts land
 * (UEB-02, 24.10.2026: four gaps shrank the card by a row).
 */

vi.mock('@inertiajs/vue3', () => ({
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}))

const { default: CoverageRow } = await import('./CoverageRow.vue')

const BOX = 'calc(28px + 5 * var(--dg-row-h))'

function gap(i: number): DemandGap {
    return {
        key: `k:000${i}-ABC`,
        kind: 'keys',
        title: `HSN 000${i} · TSN ABC`,
        detail: 'Nicht im Fahrzeugkatalog',
        asked: 6 - i,
        waiting: 0,
        lastAgo: 'vor 2 Tagen',
        lastIso: null,
        score: 6 - i,
        weight: 50,
        mark: null,
        mail: { subject: 'Anfrage', body: 'Guten Tag' },
    }
}

function charts(rows: DemandGap[]): DashboardCharts {
    return {
        revenue: false,
        verdicts: false,
        coverage: false,
        demand: { rows, counts: { offen: rows.length, beobachtet: 0, angefordert: 0, alle: rows.length }, asks: 11, waiting: 0 },
        failed: [],
    }
}

function mountRow(value?: DashboardCharts) {
    return mount(CoverageRow, { props: { charts: value, keys: ['demand'], rows: 0, failed: false, periodQuery: '' } })
}

describe('CoverageRow — Nachfrage-Lücken', () => {
    it('keeps the skeleton\'s box once loaded, with four gaps as with five — nothing under the card moves', () => {
        const skeleton = mountRow(undefined).find('.widget__skeleton')

        expect(skeleton.attributes('style')).toContain(`min-height: ${BOX}`)

        for (const count of [4, 5]) {
            const loaded = mountRow(charts(Array.from({ length: count }, (_, i) => gap(i + 1))))
            const body = loaded.find('[data-demand-body]')

            expect(loaded.findAll('.dg__row')).toHaveLength(count)
            expect(body.attributes('style')).toContain(`min-height: ${BOX}`)
        }
    })

    it('lets the empty sentence take its own height, as every empty card does (M1-20)', () => {
        const empty = mountRow(charts([]))

        expect(empty.find('[data-demand-body]').exists()).toBe(false)
        expect(empty.find('.widget__state').text()).toContain('Im Zeitraum hat niemand nach einem Auto gefragt')
    })
})
