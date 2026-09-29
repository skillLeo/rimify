import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { FelgenProps } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

/*
 * QA „Letzte Runde (G)", G-01 (S2) — docs/qa/BUGS.md.
 *
 * On /felgen the body style and drive the whole grid is answered for are shown only while one of them is still
 * missing (`v-if="… missing?.length"`). A value read from the car's name („Touring" → Kombi) or given by the owner
 * decides every „Passend" on the page, but once nothing is missing the listing never says so: no „Stimmt das?",
 * no „Ändern" — a mis-tapped answer can be neither seen nor corrected here. BuildForm's own contract: a derived
 * value „stands as a filled answer with „stimmt das?" and one click to change it".
 */

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { get: vi.fn(), post: vi.fn(), on: vi.fn(() => () => undefined), delete: vi.fn() },
}))

const { default: Felgen } = await import('./Index.vue')

/* A car typed from a Gutachten: no body style in the data, „Touring" in its name; the owner gave the drive. */
const TOURING: VehicleProp = {
    id: 94,
    make: 'BMW',
    model: '3er-Touring (VI)',
    variant: '3K',
    typeDesignation: '3K',
    label: 'BMW 3er-Touring (VI) 3K',
    short: 'BMW 3er-Touring (VI)',
    hsn: null,
    tsn: null,
    keyNumbers: 'HSN/TSN noch nicht hinterlegt',
    buildWindow: 'Bauzeitraum unbekannt',
    build: { bodyForm: 'Kombi', bodySource: 'name', bodyWord: 'Touring', driveAxle: 'Hinterachse', driveSource: 'customer', driveWord: null },
}

const CARD = { modelId: 1, finishId: 1 } as unknown as FelgenProps['cards'][number]

let mounted: VueWrapper[] = []

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('G-01 · /felgen says what the grid rests on, after the question is answered too', () => {
    it('shows the derived body style with „Stimmt das?" and the owner\'s drive as theirs, each with „Ändern"', () => {
        current.props = { vehicle: TOURING, notifyByMail: true, contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' } }
        const wrapper = mount(Felgen, {
            // Nothing is missing any more: every answer on the page rests on „Kombi" (from the name) and „Hinterachse" (the owner's).
            props: { hasVehicle: true, cards: [CARD], total: 1, facets: {}, filters: {}, page: 1, demo: false, missing: [] },
            global: { stubs: { FilterBar: true, ProductTile: true } },
            attachTo: document.body,
        })
        mounted.push(wrapper)

        expect(wrapper.text()).toContain('aus „Touring“ im Fahrzeugnamen')
        expect(wrapper.text()).toContain('Heckantrieb – nach deiner Angabe')
        expect(wrapper.find('button[aria-label="Karosserieform ändern"]').exists()).toBe(true)
        expect(wrapper.find('button[aria-label="Antrieb ändern"]').exists()).toBe(true)
    })
})
