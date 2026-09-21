import { flushPromises, mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { NNBSP } from '../../format'
import { COUNT_DEBOUNCE_MS } from '../../composables/useFitmentCount'
import type { LookupResult } from '../../types/pages'
import type { VehicleProp } from '../../types/rimify'

type Form = Record<string, unknown> & { post: ReturnType<typeof vi.fn>; processing: boolean; errors: Record<string, string> }

const current: { props: Record<string, unknown> } = { props: {} }
const forms: Form[] = []
const routerMock = { delete: vi.fn(), post: vi.fn() }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    useForm: (data: Record<string, unknown>) => {
        const form = reactive({ ...data, processing: false, errors: {}, post: vi.fn() }) as Form
        forms.push(form)

        return form
    },
    router: routerMock,
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup(props, { slots }) {
            return () => h('a', { href: props.href }, slots.default?.())
        },
    }),
}))

const { default: HeroSelector } = await import('./HeroSelector.vue')

const vehicle: VehicleProp = {
    id: 3,
    make: 'BMW',
    model: '3er',
    variant: 'Coupé',
    typeDesignation: null,
    label: 'BMW 3er Coupé',
    short: 'BMW 3er',
    hsn: '0005',
    tsn: '582',
    keyNumbers: 'HSN 0005 · TSN 582',
    buildWindow: '01/1995–12/1999',
}

const MAKES = [
    { make: 'Audi', models: 2 },
    { make: 'BMW', models: 3 },
]

function count(n: number, label = 'BMW 320i'): Record<string, unknown> {
    return { count: n, permitted: n, conditional: 0, vehicle: { id: 7, label, short: 'BMW 3er' }, ambiguous: [] }
}

const responses: Record<string, () => Response> = {}

function respond(path: string, body: unknown, status = 200): void {
    responses[path] = () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

let mounted: VueWrapper[] = []

function mountSelector(): VueWrapper {
    const wrapper = mount(HeroSelector, {
        props: { selector: { makes: MAKES } },
        global: { stubs: { DocumentScan: true } },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

function button(wrapper: VueWrapper): DOMWrapper<HTMLButtonElement> {
    return wrapper.find<HTMLButtonElement>('button[type="submit"]')
}

function byLabel(wrapper: VueWrapper, text: string): DOMWrapper<HTMLInputElement> {
    const label = wrapper.findAll('label').find((l) => l.text() === text)

    if (label === undefined) {
        throw new Error(`No label ${text}`)
    }

    return wrapper.find<HTMLInputElement>(`#${CSS.escape(label.attributes('for') ?? '')}`)
}

async function openTab(wrapper: VueWrapper, text: string): Promise<void> {
    const trigger = wrapper.findAll('[role="tab"]').find((t) => t.text() === text)

    if (trigger === undefined) {
        throw new Error(`No tab ${text}`)
    }

    await trigger.trigger('mousedown', { button: 0 })
    await nextTick()
}

async function typeKeys(wrapper: VueWrapper, hsn: string, tsn: string): Promise<void> {
    await byLabel(wrapper, 'HSN (Feld 2.1)').setValue(hsn)
    await byLabel(wrapper, 'TSN (Feld 2.2)').setValue(tsn)
    await nextTick()
}

async function settle(): Promise<void> {
    await wait(COUNT_DEBOUNCE_MS + 20)
    await flushPromises()
    await nextTick()
}

beforeEach(() => {
    current.props = {
        vehicle: null,
        garage: [],
        contact: { phone: '0800 123 45 67', phoneIntl: '+49 800 1234567' },
        lookup: null,
    }
    forms.length = 0
    routerMock.delete.mockReset()

    for (const key of Object.keys(responses)) {
        delete responses[key]
    }

    vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string | URL) => {
            const url = String(input)
            const key = Object.keys(responses).find((k) => url.startsWith(k))

            return key === undefined ? new Response('', { status: 404 }) : responses[key]!()
        })
    )
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
})

describe('HeroSelector — the button and the count', () => {
    it('starts on Marke & Modell with nothing focused and a disabled button', () => {
        const wrapper = mountSelector()

        expect(wrapper.find('[role="tab"][data-state="active"]').text()).toBe('Marke & Modell')
        expect(document.activeElement).toBe(document.body)
        expect(button(wrapper).text()).toBe('Fahrzeug wählen')
        expect(button(wrapper).element.disabled).toBe(true)
        expect(wrapper.find('.sel__count').text()).toBe('')
    })

    it('shows the skeleton, then the count sentence, and carries the number into the button', async () => {
        respond('/api/v1/fitment/count?hsn=0005&tsn=582', count(147))
        const wrapper = mountSelector()
        await openTab(wrapper, 'HSN/TSN')
        await typeKeys(wrapper, '0005', '582')

        expect(wrapper.find('.sel__count .skeleton').exists()).toBe(true)
        expect(button(wrapper).text()).toBe('Passende Felgen anzeigen')
        expect(button(wrapper).element.disabled).toBe(false)

        await settle()

        expect(wrapper.find('.sel__count').text()).toBe('147 Felgen mit Gutachten für BMW 320i')
        expect(wrapper.find('.sel__count .sel__n').text()).toBe('147')
        expect(button(wrapper).text()).toBe('147 passende Felgen anzeigen')
    })

    it('keeps the button usable when the count cannot be loaded', async () => {
        respond('/api/v1/fitment/count', {}, 500)
        const wrapper = mountSelector()
        await openTab(wrapper, 'HSN/TSN')
        await typeKeys(wrapper, '0005', '582')
        await settle()

        expect(wrapper.find('.sel__count').text()).toBe('Die Anzahl lässt sich gerade nicht laden.')
        expect(button(wrapper).text()).toBe('Passende Felgen anzeigen')
        expect(button(wrapper).element.disabled).toBe(false)
    })

    it('submits the key numbers to the resolver', async () => {
        respond('/api/v1/fitment/count', count(147))
        const wrapper = mountSelector()
        await openTab(wrapper, 'HSN/TSN')
        await typeKeys(wrapper, '0005', '582')
        await wrapper.find('form').trigger('submit')

        const keys = forms.find((f) => 'hsn' in f)!
        expect(keys.hsn).toBe('0005')
        expect(keys.tsn).toBe('582')
        expect(keys.post).toHaveBeenCalledWith('/fahrzeug/schluesselnummern', expect.objectContaining({ preserveScroll: true }))
    })

    it('with zero wheels disables the button and offers to tell the customer', async () => {
        respond('/api/v1/fitment/count', count(0))
        respond('/api/v1/fitment/notify', {}, 202)
        const wrapper = mountSelector()
        await openTab(wrapper, 'HSN/TSN')
        await typeKeys(wrapper, '0005', '582')
        await settle()

        expect(button(wrapper).text()).toBe('Keine Felgen für dieses Fahrzeug')
        expect(button(wrapper).element.disabled).toBe(true)
        const notice = wrapper.find('.sel__zero')
        expect(notice.text()).toContain('Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.')
        expect(notice.text()).toContain('Du bekommst zuerst eine Bestätigungsmail. Abmelden geht jederzeit mit einem Klick.')

        await byLabel(wrapper, 'E-Mail-Adresse').setValue('kunde@example.de')
        await wrapper.findAll('button').find((b) => b.text() === 'Bescheid geben')!.trigger('click')
        await flushPromises()
        await nextTick()

        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>
        const notify = fetchMock.mock.calls.find((c) => String(c[0]).includes('/fitment/notify'))!
        expect(JSON.parse((notify[1] as RequestInit).body as string)).toEqual({ email: 'kunde@example.de', fahrzeug: 7 })
        expect(wrapper.find('.sel__zero').text()).toContain('Danke. Bestätige bitte den Link in der E-Mail, die wir dir gerade geschickt haben.')
        expect(byLabel.bind(null, wrapper, 'E-Mail-Adresse')).toThrow()
    })

    it('shows a validation message under the field and the phone number on a server failure', async () => {
        respond('/api/v1/fitment/count', count(0))
        respond('/api/v1/fitment/notify', { errors: { email: ['Das sieht nicht nach einer E-Mail-Adresse aus.'] } }, 422)
        const wrapper = mountSelector()
        await openTab(wrapper, 'HSN/TSN')
        await typeKeys(wrapper, '0005', '582')
        await settle()

        await byLabel(wrapper, 'E-Mail-Adresse').setValue('kunde')
        await wrapper.findAll('button').find((b) => b.text() === 'Bescheid geben')!.trigger('click')
        await flushPromises()
        await nextTick()
        expect(wrapper.find('.sel__zero .form-field__error').text()).toBe('Das sieht nicht nach einer E-Mail-Adresse aus.')
        expect(byLabel(wrapper, 'E-Mail-Adresse').attributes('aria-invalid')).toBe('true')

        respond('/api/v1/fitment/notify', {}, 500)
        await wrapper.findAll('button').find((b) => b.text() === 'Bescheid geben')!.trigger('click')
        await flushPromises()
        await nextTick()
        expect(wrapper.find('.sel__zero .form-field__error').text()).toBe(
            'Das hat nicht geklappt. Versuch es bitte noch einmal oder ruf uns an: 0800 123 45 67.'
        )
    })
})

describe('HeroSelector — Marke → Modell → Fahrzeug', () => {
    it('drills through the tree, names an incomplete row and counts for the chosen car', async () => {
        respond('/api/v1/vehicles/models?marke=BMW', { models: [{ model: '3er Coupé', variants: 2 }] })
        respond('/api/v1/vehicles/variants?marke=BMW&modell=3er+Coup%C3%A9', {
            variants: [
                { id: 7, variant: '320i', typeDesignation: null, keyNumbers: '', hsn: '0005', tsn: '582', vsn: null, buildWindow: '09/2001–02/2005', powerPs: 170, bodyForm: null, needsReview: false },
                { id: 8, variant: '330i', typeDesignation: null, keyNumbers: '', hsn: '0005', tsn: '583', vsn: null, buildWindow: '09/2001–02/2005', powerPs: 231, bodyForm: null, needsReview: true },
            ],
        })
        respond('/api/v1/fitment/count?fahrzeug=7', count(147))
        const wrapper = mountSelector()

        const modell = byLabel(wrapper, 'Modell')
        expect(modell.element.disabled).toBe(true)

        await byLabel(wrapper, 'Marke').setValue('bm')
        await nextTick()
        const makeOptions = wrapper.findAll('[role="option"]')
        expect(makeOptions.map((o) => o.text())).toEqual(['BMW 3 Modelle'])
        await makeOptions[0]!.trigger('click')
        await flushPromises()
        await nextTick()

        expect(byLabel(wrapper, 'Marke').element.value).toBe('BMW')
        expect(modell.element.disabled).toBe(false)
        // The next list opens by itself once the make is chosen.
        expect(wrapper.findAll('[role="option"]').map((o) => o.text())).toEqual(['3er Coupé 2 Varianten'])
        await wrapper.find('[role="option"]').trigger('click')
        await flushPromises()
        await nextTick()

        const fahrzeug = byLabel(wrapper, 'Fahrzeug')
        expect(fahrzeug.element.disabled).toBe(false)
        await fahrzeug.setValue('3')
        await nextTick()
        const rows = wrapper.findAll('[role="option"]')
        expect(rows.map((r) => r.text())).toEqual([
            `320i · 125${NNBSP}kW · 09/2001–02/2005`,
            `330i · 170${NNBSP}kW · 09/2001–02/2005 (unvollständige Daten)`,
        ])
        expect(rows[1]!.attributes('aria-disabled')).toBe('true')

        await rows[0]!.trigger('click')
        await nextTick()
        expect(fahrzeug.element.value).toBe(`320i · 125${NNBSP}kW · 09/2001–02/2005`)
        expect(button(wrapper).text()).toBe('Passende Felgen anzeigen')

        await settle()
        expect(button(wrapper).text()).toBe('147 passende Felgen anzeigen')

        await wrapper.find('form').trigger('submit')
        const choice = forms.find((f) => 'fahrzeug' in f)!
        expect(choice.fahrzeug).toBe(7)
        expect(choice.post).toHaveBeenCalledWith('/fahrzeug', expect.objectContaining({ preserveScroll: true }))
    })
})

describe('HeroSelector — HSN/TSN', () => {
    it('explains the two shapes under the fields on blur', async () => {
        const wrapper = mountSelector()
        await openTab(wrapper, 'HSN/TSN')

        const hsn = byLabel(wrapper, 'HSN (Feld 2.1)')
        await hsn.setValue('12')
        await hsn.trigger('blur')
        expect(hsn.attributes('aria-invalid')).toBe('true')
        expect(wrapper.find(`#${CSS.escape(hsn.attributes('aria-describedby') ?? '')}`).text()).toBe('Die HSN hat vier Ziffern.')

        const tsn = byLabel(wrapper, 'TSN (Feld 2.2)')
        await tsn.setValue('a')
        await tsn.trigger('blur')
        expect(tsn.element.value).toBe('A')
        expect(wrapper.find(`#${CSS.escape(tsn.attributes('aria-describedby') ?? '')}`).text()).toBe('Die TSN hat drei Zeichen.')

        expect(hsn.attributes('inputmode')).toBe('numeric')
        expect(hsn.attributes('maxlength')).toBe('4')
        expect(tsn.attributes('autocapitalize')).toBe('characters')
        expect(tsn.attributes('maxlength')).toBe('3')
    })

    it('strips spaces from a pasted pair and fills both fields', async () => {
        const wrapper = mountSelector()
        await openTab(wrapper, 'HSN/TSN')

        const hsn = byLabel(wrapper, 'HSN (Feld 2.1)')
        await hsn.trigger('paste', { clipboardData: { getData: () => ' 0005 582 ' } })
        expect(hsn.element.value).toBe('0005')
        expect(byLabel(wrapper, 'TSN (Feld 2.2)').element.value).toBe('582')
    })

    it('renders the chooser for an ambiguous pair and sets nothing until one is picked (R-01)', async () => {
        const lookup: LookupResult = {
            status: 'ambiguous',
            hsn: '1860',
            tsn: 'AAS',
            distinction: {
                required: true,
                indistinguishable: false,
                attributes: ['vmax'],
                labels: { vmax: 'Höchstgeschwindigkeit' },
                rows: [
                    { id: 11, label: 'Audi RS 4 Avant Quattro', vsn: null, values: { vmax: `280${NNBSP}km/h` } },
                    { id: 12, label: 'Audi RS 4 Avant Quattro', vsn: '00123', values: { vmax: `290${NNBSP}km/h` } },
                ],
            },
        }
        current.props.lookup = lookup
        const wrapper = mountSelector()
        await nextTick()

        expect(wrapper.find('[role="tab"][data-state="active"]').text()).toBe('HSN/TSN')
        expect(wrapper.find('.sel__chooser .h4').text()).toBe('2 Fahrzeuge passen zu 1860/AAS – welches ist deins?')
        const radios = wrapper.findAll<HTMLInputElement>('input[type="radio"]')
        expect(radios).toHaveLength(2)
        expect(wrapper.findAll('.sel__candidate-text .small')[1]!.text()).toBe(`Höchstgeschwindigkeit 290${NNBSP}km/h · VSN 00123`)
        expect(wrapper.find('.sel__chooser').text()).toContain(`Höchstgeschwindigkeit 290${NNBSP}km/h`)
        expect(byLabel.bind(null, wrapper, 'HSN (Feld 2.1)')).toThrow()
        // The chooser's own button is the one action; the primary would only repeat the lookup.
        expect(wrapper.find('button[type="submit"]').exists()).toBe(false)

        const pick = wrapper.findAll('button').find((b) => b.text() === 'Dieses Fahrzeug wählen')!
        expect(pick.element.disabled).toBe(true)
        const choice = forms.find((f) => 'fahrzeug' in f)!
        expect(choice.post).not.toHaveBeenCalled()

        await radios[1]!.setValue(true)
        expect(pick.element.disabled).toBe(false)
        await pick.trigger('click')
        expect(choice.fahrzeug).toBe(12)
        expect(choice.post).toHaveBeenCalledWith('/fahrzeug', expect.objectContaining({ preserveScroll: true }))

        await wrapper.findAll('button').find((b) => b.text() === 'Andere Nummern eingeben')!.trigger('click')
        await nextTick()
        expect(byLabel(wrapper, 'HSN (Feld 2.1)').element.value).toBe('1860')
        expect(byLabel(wrapper, 'TSN (Feld 2.2)').element.value).toBe('AAS')
    })

    it('keeps the typed pair and offers three routes when nothing was found (R-09)', async () => {
        current.props.lookup = { status: 'not_found', hsn: '9999', tsn: 'ZZZ' } satisfies LookupResult
        const wrapper = mountSelector()
        await nextTick()

        expect(byLabel(wrapper, 'HSN (Feld 2.1)').element.value).toBe('9999')
        expect(byLabel(wrapper, 'TSN (Feld 2.2)').element.value).toBe('ZZZ')
        const notice = wrapper.find('.sel__notfound')
        expect(notice.text()).toContain('Zu 9999/ZZZ haben wir kein Fahrzeug gefunden.')

        const routes = notice.findAll('.link')
        expect(routes.map((r) => r.text())).toEqual(['Nochmal prüfen', 'Über Marke & Modell wählen', 'Anrufen: 0800 123 45 67'])
        expect(routes[2]!.attributes('href')).toBe('tel:+498001234567')

        // The routes are the actions: the primary would only repeat the lookup, so it is disabled.
        expect(button(wrapper).element.disabled).toBe(true)
        await wrapper.find('form').trigger('submit')
        expect(forms.find((f) => 'hsn' in f)!.post).not.toHaveBeenCalled()

        await routes[0]!.trigger('click')
        await nextTick()
        expect(document.activeElement).toBe(byLabel(wrapper, 'HSN (Feld 2.1)').element)
        expect(wrapper.find('.sel__notfound').exists()).toBe(false)
        expect(button(wrapper).element.disabled).toBe(true)

        // A different pair is a new question, and the button is back.
        await byLabel(wrapper, 'HSN (Feld 2.1)').setValue('9998')
        await nextTick()
        expect(button(wrapper).element.disabled).toBe(false)

        await byLabel(wrapper, 'HSN (Feld 2.1)').setValue('9999')
        await nextTick()
        expect(button(wrapper).element.disabled).toBe(true)

        await routes[1]!.trigger('click')
        await nextTick()
        expect(wrapper.find('[role="tab"][data-state="active"]').text()).toBe('Marke & Modell')
    })
})

describe('HeroSelector — with a vehicle, and the garage', () => {
    it('names the car, counts for it and leads to the listing', async () => {
        current.props.vehicle = vehicle
        respond('/api/v1/fitment/count?fahrzeug=3', count(147, 'BMW 3er Coupé'))
        const wrapper = mountSelector()

        expect(wrapper.text()).toContain('Dein Fahrzeug')
        expect(wrapper.find('.sel__vehicle').text()).toBe('BMW 3er Coupé')
        expect(wrapper.text()).toContain('HSN 0005 · TSN 582 · 01/1995–12/1999')
        expect(wrapper.find('input').exists()).toBe(false)

        await settle()
        const go = wrapper.find('a.btn')
        expect(go.attributes('href')).toBe('/felgen')
        expect(go.text()).toBe('147 passende Felgen anzeigen')
        expect(wrapper.find('.sel__count').text()).toBe('147 Felgen mit Gutachten für BMW 3er Coupé')

        const change = wrapper.findAll('a').find((a) => a.text() === 'Fahrzeug ändern')!
        expect(change.attributes('href')).toBe('/felgen-suchen')

        await wrapper.findAll('button').find((b) => b.text() === 'Fahrzeug entfernen')!.trigger('click')
        expect(routerMock.delete).toHaveBeenCalledWith('/fahrzeug', expect.objectContaining({ preserveScroll: true }))
    })

    it('offers the garage as chips that choose a car in one tap', async () => {
        current.props.garage = [
            { id: 21, label: 'VW Golf VII 2.0 TDI', short: 'VW Golf' },
            { id: 22, label: 'Audi A4 Avant', short: 'Audi A4' },
        ]
        const wrapper = mountSelector()

        expect(wrapper.find('.sel__garage .label').text()).toBe('Zuletzt gewählt:')
        const chips = wrapper.findAll('.chip')
        expect(chips.map((c) => c.text())).toEqual(['VW Golf', 'Audi A4'])

        await chips[1]!.trigger('click')
        const choice = forms.find((f) => 'fahrzeug' in f)!
        expect(choice.fahrzeug).toBe(22)
        expect(choice.post).toHaveBeenCalledWith('/fahrzeug', expect.objectContaining({ preserveScroll: true }))
    })
})
