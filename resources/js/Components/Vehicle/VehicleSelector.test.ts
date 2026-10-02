import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { LookupResult } from '../../types/pages'
import type { ContactProp } from '../../types/rimify'

const current: { props: Record<string, unknown>; url?: string } = { props: {} }
const forms: Array<Record<string, unknown> & { post: ReturnType<typeof vi.fn> }> = []
const get = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    useForm: (data: Record<string, unknown>) => {
        const form = reactive({ ...data, processing: false, errors: {}, post: vi.fn() })
        forms.push(form)

        return form
    },
    router: { get: (...args: unknown[]) => get(...args) },
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
 * On the RIMIFY-Check (#28) the selector keeps the page's wheel in every drill step's address, and sends the visitor back
 * to the question once the car is chosen — by the drill and by key numbers alike.
 */
describe('VehicleSelector — on a page that wants the visitor back', () => {
    const QUESTION = '/rimify-check?hersteller=borbet&felge=borbet-db8gt2&groesse=110'

    function mountOnCheck(props: Record<string, unknown> = {}, page: Record<string, unknown> = {}): VueWrapper {
        current.props = { contact: CONTACT, ...page }
        forms.length = 0
        get.mockReset()
        const wrapper = mount(VehicleSelector, {
            props: {
                makes: [{ make: 'BMW', models: 3 }], models: [], variants: [], selectedMake: null, selectedModel: null,
                basePath: '/rimify-check', baseQuery: { hersteller: 'borbet', felge: 'borbet-db8gt2', groesse: 110 }, returnTo: QUESTION,
                ...props,
            },
            global: { stubs: { DocFacsimile: true } },
        })
        mounted.push(wrapper)

        return wrapper
    }

    it('keeps the wheel in the address of every drill step', async () => {
        const wrapper = mountOnCheck()

        await wrapper.find('.row-item').trigger('click')

        expect(get).toHaveBeenCalledWith('/rimify-check', { hersteller: 'borbet', felge: 'borbet-db8gt2', groesse: 110, marke: 'BMW' }, { preserveScroll: true })
    })

    it('sends the return address with a variant picked and with key numbers', async () => {
        const variant = {
            id: 127, variant: 'xDrive30d', typeDesignation: 'G01', keyNumbers: '0005 / CKT', hsn: '0005', tsn: 'CKT', vsn: null,
            buildWindow: '2017–2021', buildKnown: true, powerPs: 265, bodyForm: null, needsReview: false, approval: null,
        }
        const wrapper = mountOnCheck({ selectedMake: 'BMW', selectedModel: 'X3', variants: [variant] })
        const [keys, choice] = forms

        await wrapper.find('.row-item').trigger('click')
        expect(choice).toMatchObject({ fahrzeug: 127, zurueck: QUESTION })
        expect(choice?.post).toHaveBeenCalledWith('/fahrzeug', { preserveScroll: true })

        await wrapper.find('form').trigger('submit')
        expect(keys).toMatchObject({ zurueck: QUESTION })
        expect(keys?.post).toHaveBeenCalledWith('/fahrzeug/schluesselnummern', { preserveScroll: true })
    })

    it('starts the make step again after a key-number miss without losing the wheel', () => {
        current.url = QUESTION
        const wrapper = mountOnCheck({}, { lookup: MISS })
        const restart = wrapper.findAll('.vsel__miss-actions a').find((a) => a.text() === 'Stattdessen Marke wählen')

        expect(restart?.attributes('href')).toBe(QUESTION)
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
