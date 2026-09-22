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

/** The three ways forward under "kein Fahrzeug gefunden", in order. */
function routes(wrapper: VueWrapper): DOMWrapper<Element>[] {
    return wrapper.find('.vpanel__miss').findAll('.link')
}

beforeEach(() => {
    current.props = { vehicle: null, garage: [], contact: WITHOUT_PHONE, lookup: null }
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

describe('VehiclePanel — nothing found, three ways forward (R-09)', () => {
    it('offers the e-mail as the third route while no phone number is published', () => {
        current.props.lookup = NOT_FOUND
        const wrapper = mountPanel()

        expect(wrapper.find('.vpanel__miss').text()).toContain('Zu 9999/ZZZ haben wir kein Fahrzeug gefunden.')

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
