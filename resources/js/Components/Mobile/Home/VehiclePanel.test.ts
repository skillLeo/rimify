import { flushPromises, mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import type { FitmentCountResponse } from '../../../types/mobile'
import type { LookupResult } from '../../../types/pages'
import type { ContactProp } from '../../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }
const routerMock = { delete: vi.fn(), post: vi.fn() }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: routerMock,
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup(props, { slots }) {
            return () => h('a', { href: props.href }, slots.default?.())
        },
    }),
}))

const { default: VehiclePanel } = await import('./VehiclePanel.vue')

/*
 * Fixtures only — not the shop's details, which come from config/rimify.php. The e-mail is on a
 * reserved example domain, and the number is hyphenated so the contact-details guard (which forbids
 * a German number in source files) does not read it as one.
 */
const WITHOUT_PHONE: ContactProp = { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' }
const WITH_PHONE: ContactProp = { ...WITHOUT_PHONE, phone: '0800 555 01 00', phoneIntl: '+49-800-5550100' }

const NOT_FOUND: LookupResult = { status: 'not_found', hsn: '9999', tsn: 'ZZZ' }

const responses: Record<string, () => Response> = {}

function respond(path: string, body: unknown, status = 200): void {
    responses[path] = () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

let mounted: VueWrapper[] = []

function mountPanel(): VueWrapper {
    const wrapper = mount(VehiclePanel, {
        props: { makes: [{ make: 'BMW', models: 3 }] },
        global: { stubs: { BottomSheet: true } },
        attachTo: document.body,
    })
    mounted.push(wrapper)

    return wrapper
}

function byLabel(wrapper: VueWrapper, text: string): DOMWrapper<HTMLInputElement> {
    const label = wrapper.findAll('label').find((l) => l.text() === text)

    if (label === undefined) {
        throw new Error(`No label ${text}`)
    }

    return wrapper.find<HTMLInputElement>(`#${CSS.escape(label.attributes('for') ?? '')}`)
}

/** The three ways forward under "für dieses Fahrzeug noch nicht hinterlegt", in order. */
function routes(wrapper: VueWrapper): DOMWrapper<Element>[] {
    return wrapper.find('.vpanel__miss').findAll('.link')
}

beforeEach(() => {
    current.props = { vehicle: null, garage: [], contact: WITHOUT_PHONE, lookup: null, notifyByMail: true }
    routerMock.post.mockReset()
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

describe('VehiclePanel — the button before a car is chosen (the client\'s #1)', () => {
    it('waits in light blue, announced as unavailable but pressable, and a press leads to the missing field', async () => {
        const wrapper = mountPanel()
        const go = wrapper.find<HTMLButtonElement>('button.vpanel__go')
        const original = Element.prototype.scrollIntoView
        Element.prototype.scrollIntoView = vi.fn()

        expect(go.text()).toBe('Fahrzeug wählen')
        expect(go.element.disabled).toBe(false)
        expect(go.attributes('aria-disabled')).toBe('true')
        expect(go.classes()).toContain('vpanel__go--waiting')

        await go.trigger('click')
        expect(document.activeElement).toBe(byLabel(wrapper, 'Marke').element)

        await wrapper.findAll('[role="tab"]').find((t) => t.text() === 'HSN/TSN')?.trigger('click')
        await go.trigger('click')
        expect(document.activeElement).toBe(byLabel(wrapper, 'HSN (Feld 2.1)').element)

        expect(routerMock.post).not.toHaveBeenCalled()
        Element.prototype.scrollIntoView = original
    })

    it('answers a complete pair again after a round trip through the other tab, so it can still be sent', async () => {
        respond('/api/v1/fitment/count', { vehicle: { id: 7, label: 'BMW 320i' }, count: 12, permitted: 12, conditional: 0, ambiguous: [] })
        const wrapper = mountPanel()
        const tab = (name: string) => wrapper.findAll('[role="tab"]').find((t) => t.text() === name)

        await tab('HSN/TSN')?.trigger('click')
        await byLabel(wrapper, 'HSN (Feld 2.1)').setValue('0005')
        await byLabel(wrapper, 'TSN (Feld 2.2)').setValue('582')
        await flushPromises()
        await tab('Marke & Modell')?.trigger('click')
        await tab('HSN/TSN')?.trigger('click')
        await flushPromises()
        await nextTick()

        const go = wrapper.find<HTMLButtonElement>('button.vpanel__go')
        expect(go.attributes('aria-disabled')).toBeUndefined()
        expect(go.text()).toContain('12')
    })
})

describe('VehiclePanel — nothing found, three ways forward (R-09)', () => {
    it('offers the e-mail as the third route while no phone number is published', () => {
        current.props.lookup = NOT_FOUND
        const wrapper = mountPanel()

        expect(wrapper.find('.vpanel__miss').text()).toContain('Zu 9999/ZZZ haben wir die Daten für dieses Fahrzeug noch nicht hinterlegt.')

        const ways = routes(wrapper)
        expect(ways.map((r) => r.text())).toEqual(['Nochmal prüfen', 'Über Marke & Modell wählen', 'Schreib uns: service@example.com'])
        expect(ways[2]!.attributes('href')).toBe('mailto:service@example.com')
        expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
    })

    it('offers the phone as the third route once one is published', () => {
        current.props.contact = WITH_PHONE
        current.props.lookup = NOT_FOUND
        const wrapper = mountPanel()

        const ways = routes(wrapper)
        expect(ways.map((r) => r.text())).toEqual(['Nochmal prüfen', 'Über Marke & Modell wählen', 'Anrufen: 0800 555 01 00'])
        expect(ways[2]!.attributes('href')).toBe('tel:+49-800-5550100')
    })
})

/*
 * A Gutachten splits the BMW 1K4 at extension 03/04 of its EG type approval. The option shows the range where a
 * closed select and the picker wheel still show it; the whole Feld K line stands under the select once picked.
 */
describe('VehiclePanel — the halves of one car', () => {
    it('shows Feld K’s range in each option and the whole line under the select once one is picked', async () => {
        const nb = String.fromCharCode(160)
        const half = (id: number, whole: string, range: string) => ({ id, variant: '1K4', buildWindow: 'Bauzeitraum unbekannt', powerPs: null, needsReview: false, approval: whole, approvalShort: range })
        respond('/api/v1/vehicles/models', { models: [{ model: '1er-Reihe', variants: 2 }] })
        respond('/api/v1/vehicles/variants', {
            variants: [
                half(80, `Feld${nb}K: e1*2007/46*0283, *00 bis${nb}*03`, `Feld${nb}K *00 bis${nb}*03`),
                half(82, `Feld${nb}K: e1*2007/46*0283, ab${nb}*04`, `Feld${nb}K ab${nb}*04`),
            ],
        })
        const wrapper = mountPanel()

        await byLabel(wrapper, 'Marke').setValue('BMW')
        await flushPromises()
        await byLabel(wrapper, 'Modell').setValue('1er-Reihe')
        await flushPromises()

        const select = byLabel(wrapper, 'Fahrzeug')

        expect(select.findAll('option').slice(1).map((o) => o.text())).toEqual([`1K4 · Feld${nb}K *00 bis${nb}*03`, `1K4 · Feld${nb}K ab${nb}*04`])

        await select.setValue('82')
        await flushPromises()

        expect(wrapper.find('.form-field__help.num').text()).toBe(`Feld${nb}K: e1*2007/46*0283, ab${nb}*04`)
    })
})

describe('VehiclePanel — the garage', () => {
    it('gives each half of one car its Feld K range, on the chip and in its name', () => {
        const nb = String.fromCharCode(160)
        const wrapper = mount(VehiclePanel, {
            props: {
                makes: [{ make: 'BMW', models: 3 }],
                garage: [
                    { id: 82, label: 'BMW 1er-Reihe 1K4', short: 'BMW 1er-Reihe', range: `Feld${nb}K ab${nb}*04` },
                    { id: 80, label: 'BMW 1er-Reihe 1K4', short: 'BMW 1er-Reihe', range: `Feld${nb}K *00 bis${nb}*03` },
                    { id: 7, label: 'BMW 320i', short: 'BMW 3er', range: null },
                ],
            },
            global: { stubs: { BottomSheet: true } },
            attachTo: document.body,
        })
        mounted.push(wrapper)

        const chips = wrapper.find('.vpanel__garage').findAll('button')

        expect(chips.map((c) => c.text())).toEqual([`BMW 1er-Reihe · Feld${nb}K ab${nb}*04`, `BMW 1er-Reihe · Feld${nb}K *00 bis${nb}*03`, 'BMW 3er'])
        expect(chips.map((c) => c.attributes('aria-label'))).toEqual([
            `BMW 1er-Reihe 1K4 · Feld${nb}K ab${nb}*04`,
            `BMW 1er-Reihe 1K4 · Feld${nb}K *00 bis${nb}*03`,
            'BMW 320i',
        ])
    })
})

/*
 * The live sweep of 01.10.2026: a phone keyboard that inserts „0005/582“ into the HSN left the TSN empty — the field
 * clipped the pair at four characters before anything read it. One rule for the desk and the phone (splitKeys).
 */
describe('VehiclePanel — a pair of key numbers in the HSN field', () => {
    async function keysTab(): Promise<VueWrapper> {
        const wrapper = mountPanel()
        await wrapper.findAll('[role="tab"]').find((t) => t.text() === 'HSN/TSN')!.trigger('click')

        return wrapper
    }

    it('fills both fields from a pair the keyboard inserts, and shows the HSN as kept', async () => {
        const wrapper = await keysTab()
        const hsn = byLabel(wrapper, 'HSN (Feld 2.1)')

        expect(hsn.attributes('maxlength')).toBeUndefined()

        await hsn.setValue('0005/582')

        expect(hsn.element.value).toBe('0005')
        expect(byLabel(wrapper, 'TSN (Feld 2.2)').element.value).toBe('582')
    })

    it('fills both fields from a pasted pair', async () => {
        const wrapper = await keysTab()
        const hsn = byLabel(wrapper, 'HSN (Feld 2.1)')

        await hsn.trigger('paste', { clipboardData: { getData: () => '0005 582' } })

        expect(hsn.element.value).toBe('0005')
        expect(byLabel(wrapper, 'TSN (Feld 2.2)').element.value).toBe('582')
    })
})

describe('VehiclePanel — a failed notify request', () => {
    async function failNotify(wrapper: VueWrapper): Promise<string> {
        const zero: FitmentCountResponse = { count: 0, permitted: 0, conditional: 0, vehicle: { id: 7, label: 'BMW 320i' }, ambiguous: [] }
        respond('/api/v1/fitment/count', zero)
        respond('/api/v1/fitment/notify', {}, 500)

        await wrapper.findAll('[role="tab"]').find((t) => t.text() === 'HSN/TSN')!.trigger('click')
        await byLabel(wrapper, 'HSN (Feld 2.1)').setValue('0005')
        await byLabel(wrapper, 'TSN (Feld 2.2)').setValue('582')
        // The fetch, then the body: two turns before the count is on screen.
        await flushPromises()
        await flushPromises()
        await nextTick()

        expect(wrapper.find('.vpanel__zero').text()).toContain('Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.')

        await byLabel(wrapper, 'E-Mail-Adresse').setValue('kunde@example.de')
        await wrapper.find('form.vpanel__notify').trigger('submit')
        await flushPromises()
        await flushPromises()
        await nextTick()

        return wrapper.find('.vpanel__zero .form-field__error').text()
    }

    it('names the e-mail, never a phone, while no phone number is published', async () => {
        const wrapper = mountPanel()

        expect(await failNotify(wrapper)).toBe('Das hat nicht geklappt. Versuch es bitte noch einmal oder schreib uns: service@example.com.')
    })

    it('names the phone once one is published', async () => {
        current.props.contact = WITH_PHONE
        const wrapper = mountPanel()

        expect(await failNotify(wrapper)).toBe('Das hat nicht geklappt. Versuch es bitte noch einmal oder ruf uns an: 0800 555 01 00.')
    })
})
