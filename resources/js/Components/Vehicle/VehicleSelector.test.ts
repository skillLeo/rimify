import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { LookupResult } from '../../types/pages'
import type { ContactProp } from '../../types/rimify'

const current: { props: Record<string, unknown>; url?: string } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    useForm: (data: Record<string, unknown>) => reactive({ ...data, processing: false, errors: {}, post: vi.fn() }),
    router: { get: vi.fn() },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: VehicleSelector } = await import('./VehicleSelector.vue')

// Fixtures only — the shop's address lives in config/rimify.php; this is a reserved example domain.
const CONTACT: ContactProp = { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' }
const MISS: LookupResult = { status: 'not_found', hsn: '9999', tsn: 'ZZZ' }

let mounted: VueWrapper[] = []

function mountSelector(props: Record<string, unknown>): VueWrapper {
    current.props = props
    const wrapper = mount(VehicleSelector, {
        props: { makes: [{ make: 'BMW', models: 3 }], models: [], variants: [], selectedMake: null, selectedModel: null },
        global: { stubs: { DocFacsimile: true } },
    })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('VehicleSelector — a key-number miss (R-09)', () => {
    it('offers three ways forward, the third the contact form with the key numbers already in its subject (#26)', () => {
        current.url = '/felgen-suchen?hsn=9999&tsn=ZZZ'
        const wrapper = mountSelector({ lookup: MISS, contact: CONTACT })
        const routes = wrapper.find('.vsel__miss-actions').findAll('a, button')

        expect(routes.map((r) => r.text())).toEqual(['Schlüsselnummern prüfen', 'Stattdessen Marke wählen', 'Bei uns nachfragen'])

        const href = routes[2]!.attributes('href') ?? ''
        const query = new URLSearchParams(href.split('?')[1] ?? '')

        expect(href.startsWith('/kontakt?')).toBe(true)
        expect(query.get('betreff')).toBe('Fahrzeug nicht gefunden: HSN 9999 · TSN ZZZ')
        expect(query.get('von')).toBe('/felgen-suchen?hsn=9999&tsn=ZZZ')
        expect(wrapper.find('.vsel__miss-note').text()).toBe('Deine HSN und TSN stehen dann schon im Betreff.')
        expect(wrapper.html()).not.toContain('mailto:')
    })

    it('still offers three ways forward if the contact details were ever missing', () => {
        const wrapper = mountSelector({ lookup: MISS })
        const routes = wrapper.find('.vsel__miss-actions').findAll('a, button')

        expect(routes).toHaveLength(3)
        expect(routes[2]!.attributes('href')).toMatch(/^\/kontakt\?/)
    })

    it('shows no miss panel without a miss', () => {
        const wrapper = mountSelector({ contact: CONTACT })

        expect(wrapper.find('.vsel__miss').exists()).toBe(false)
    })
})

// The live sweep of 01.10.2026: „0005/582“ pasted into the HSN left „/58“ in the TSN. One rule everywhere (splitKeys).
describe('VehicleSelector — a pair of key numbers in the HSN field', () => {
    const field = (wrapper: VueWrapper, placeholder: string) => wrapper.find<HTMLInputElement>(`input[placeholder="${placeholder}"]`)

    it('fills both fields from a pasted pair, with a slash or a space between them', async () => {
        const wrapper = mountSelector({ contact: CONTACT })

        for (const pair of ['0005/582', '0005 582']) {
            await field(wrapper, '0005').trigger('paste', { clipboardData: { getData: () => pair } })

            expect(field(wrapper, '0005').element.value, pair).toBe('0005')
            expect(field(wrapper, '582').element.value, pair).toBe('582')
        }
    })

    it('fills both fields from a pair the keyboard inserts, and shows the HSN as kept', async () => {
        const wrapper = mountSelector({ contact: CONTACT })

        expect(field(wrapper, '0005').attributes('maxlength')).toBeUndefined()

        await field(wrapper, '0005').setValue('0005-582')

        expect(field(wrapper, '0005').element.value).toBe('0005')
        expect(field(wrapper, '582').element.value).toBe('582')
    })
})

/*
 * A Gutachten splits the BMW 1K4 at extension 03/04 of its EG type approval; the halves carry different bolt
 * sets. Without key numbers and a build window both read „1K4“ — Feld K tells them apart.
 */
describe('VehicleSelector — the halves of one car', () => {
    it('names Feld K under a variant that has no key numbers, never squeezed beside an unknown build window', () => {
        const nb = String.fromCharCode(160)
        const row = (id: number, approval: string) => ({
            id, variant: '1K4', typeDesignation: '1K4', keyNumbers: 'HSN/TSN noch nicht hinterlegt', hsn: '', tsn: '', vsn: null,
            buildWindow: 'Bauzeitraum unbekannt', buildKnown: false, powerPs: null, bodyForm: null, needsReview: false, approval,
        })
        current.props = {}
        const wrapper = mount(VehicleSelector, {
            props: {
                makes: [], models: [], selectedMake: 'BMW', selectedModel: '1er-Reihe',
                variants: [row(80, `Feld${nb}K: e1*2007/46*0283, *00 bis${nb}*03`), row(82, `Feld${nb}K: e1*2007/46*0283, ab${nb}*04`)],
            },
            global: { stubs: { DocFacsimile: true } },
        })
        mounted.push(wrapper)

        // Its own line under the name — never squeezed beside it, where the name gave way to „…“.
        expect(wrapper.findAll('.vsel__main .vsel__sub').map((n) => n.text())).toEqual([
            `Feld${nb}K: e1*2007/46*0283, *00 bis${nb}*03`,
            `Feld${nb}K: e1*2007/46*0283, ab${nb}*04`,
        ])
        // Beside Feld K an unknown build window says nothing: left out, so the number has the row's width.
        expect(wrapper.findAll('.vsel__note')).toHaveLength(0)
    })
})
