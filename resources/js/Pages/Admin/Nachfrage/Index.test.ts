import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { AdminNachfrageProps } from '../../../types/admin/nachfrage'
import type { DemandGap } from '../../../types/admin/uebersicht'

/*
 * Nachfrage-Lücken: each gap says its place in the whole ranking, on the second page too (the admin audit's F-41), and
 * a search says what it found — once, or not at all where the state below says it (F-31, as Anfragen after F-39).
 */

const current = reactive<{ props: Record<string, unknown> }>({ props: {} })
const get = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { get: (...a: unknown[]) => get(...a), post: vi.fn(), delete: vi.fn(), on: vi.fn(() => () => undefined) },
}))

const { default: Page } = await import('./Index.vue')

function gap(rank: number): DemandGap {
    return {
        key: `k:7${String(rank).padStart(3, '0')}-ABC`,
        kind: 'keys',
        title: `HSN 7${String(rank).padStart(3, '0')} · TSN ABC`,
        detail: 'Nicht im Fahrzeugkatalog',
        asked: 3,
        waiting: 0,
        lastAgo: 'vor 2 Tagen',
        lastIso: null,
        score: 3,
        weight: 50,
        mark: null,
        mail: { subject: 'Anfrage', body: 'Guten Tag' },
        rank,
    }
}

let mounted: VueWrapper[] = []

function mountPage(props: Partial<AdminNachfrageProps> = {}): VueWrapper {
    const wrapper = mount(Page, {
        props: {
            period: { key: '30', von: '2026-08-28', bis: '2026-09-26', label: 'Letzte 30 Tage', range: '28.08.–26.09.2026', previousRange: '', days: 30, compare: false },
            state: 'offen',
            search: '',
            demand: { rows: [gap(51), gap(52)], counts: { offen: 60, beobachtet: 0, angefordert: 0, alle: 60 }, asks: 180, waiting: 0 },
            searches: [],
            weighting: { halfLife: 14, waiting: 3 },
            brands: [],
            pagination: { current: 2, last: 2, total: 60, prev: '/admin/nachfrage?zeitraum=30', next: null },
            can: { mark: false },
            ...props,
        },
        global: { stubs: { PeriodSwitcher: true, RequestDialog: true } },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    get.mockReset()
})

describe('Nachfrage-Lücken', () => {
    it('numbers each gap by its place in the whole ranking, not on its page (the admin audit’s F-41)', () => {
        expect(mountPage().findAll('.nf__rank').map((r) => r.text())).toEqual(['51', '52'])
    })

    it('searches on the server with the Zeitraum and the Stand, and says what it found (F-31)', async () => {
        const wrapper = mountPage({ state: 'beobachtet' })

        await wrapper.find('#nf-q').setValue('Größe')
        await wrapper.find('form[role="search"]').trigger('submit')

        expect(get).toHaveBeenCalledWith('/admin/nachfrage', { zeitraum: '30', stand: 'beobachtet', q: 'Größe' }, expect.objectContaining({ preserveState: true }))

        const found = mountPage({ search: 'Größe', pagination: { current: 1, last: 1, total: 2, prev: null, next: null } })
        expect(found.find('.nf__found').text()).toBe('2 Lücken gefunden.')
    })

    it('says a search without a hit once, by the state below, and offers the way back', () => {
        const none = mountPage({ search: 'qqqzzz', demand: { rows: [], counts: { offen: 60, beobachtet: 0, angefordert: 0, alle: 60 }, asks: 180, waiting: 0 }, pagination: { current: 1, last: 1, total: 0, prev: null, next: null } })

        expect(none.find('.nf__found').exists()).toBe(false)
        expect(none.find('.adm-state__heading').text()).toBe('Kein Treffer für diese Filter.')
        expect(none.text()).toContain('Filter zurücksetzen')
    })
})
