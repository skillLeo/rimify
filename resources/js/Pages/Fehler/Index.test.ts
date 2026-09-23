/*
 * The failure states, one status at a time.
 *
 * The German heading and the three ways forward live in the component, so this is where they are
 * asserted; the Pest suite (tests/Feature/Storefront/FehlerseitenTest.php) holds everything the
 * server decides. What both suites are really guarding is R-09: a failure offers THREE routes
 * forward, and none of them is a dead end — not when no vehicle is chosen, not when the shop has
 * no contact details to render, and not for a status this page was never designed for.
 */

import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { ContactProp, VehicleProp } from '../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
    router: { get: vi.fn(), on: vi.fn(() => () => undefined), delete: vi.fn() },
    useForm: vi.fn(),
}))

const { default: Fehler } = await import('./Index.vue')

const CONTACT: ContactProp = {
    email: 'hilfe@example.test',
    phone: null,
    phoneIntl: null,
    whatsapp: null,
    hours: 'Mo–Fr 9:00–17:00 Uhr',
}

const VEHICLE: VehicleProp = {
    id: 7,
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

let mounted: VueWrapper[] = []

interface Context {
    vehicle?: VehicleProp | null
    contact?: ContactProp | null
    retryAfter?: number | null
}

function page(status: number, context: Context = {}): VueWrapper {
    current.props = {
        vehicle: context.vehicle ?? null,
        contact: context.contact === undefined ? CONTACT : context.contact,
    }

    const wrapper = mount(Fehler, {
        props: { status, retryAfter: context.retryAfter ?? null, failedPath: '/felgen/kaputt' },
    })

    mounted.push(wrapper)

    return wrapper
}

const routes = (wrapper: VueWrapper) => wrapper.findAll('.err__routes a')

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

/** Every status this page answers, and the last one — a status it was never designed for. */
const CASES: [number, string][] = [
    [404, 'Diese Seite haben wir nicht gefunden.'],
    [403, 'Dafür fehlt dir die Berechtigung.'],
    [419, 'Deine Sitzung ist abgelaufen.'],
    [429, 'Zu viele Anfragen in kurzer Zeit.'],
    [500, 'Da ist etwas schiefgelaufen.'],
    [418, 'Diese Seite können wir gerade nicht anzeigen.'],
]

it.each(CASES)('names what happened on %i and offers three ways forward', (status, title) => {
    const wrapper = page(status)

    expect(wrapper.find('h1').text()).toBe(title)
    expect(routes(wrapper)).toHaveLength(3)

    for (const route of routes(wrapper)) {
        expect(route.text().trim(), `a route on ${status} has no label`).not.toBe('')
    }
})

it.each(CASES)('leads somewhere distinct with each of the three routes on %i', (status) => {
    const hrefs = routes(page(status)).map((route) => route.attributes('href'))

    expect(hrefs).toHaveLength(3)
    expect(hrefs.filter((href) => href === undefined)).toEqual([])
    // Three ways forward, not the same way three times.
    expect(new Set(hrefs).size).toBe(3)
})

it.each(CASES)('says what the failure means for the customer on %i', (status) => {
    // A heading alone is a shrug. Every state carries at least one sentence under it.
    expect(page(status).find('.err__lead').text().length).toBeGreaterThan(40)
})

it('sends the customer to the wheels for the vehicle they already chose', () => {
    const wrapper = page(404, { vehicle: VEHICLE })

    expect(routes(wrapper)[0]?.attributes('href')).toBe('/felgen')
    expect(routes(wrapper)[0]?.text()).toBe('Passende Felgen anzeigen')
    expect(wrapper.text()).toContain('BMW 3er Coupé')
})

it('asks for the vehicle instead when none has been chosen', () => {
    const wrapper = page(404)

    expect(routes(wrapper)[0]?.attributes('href')).toBe('/felgen-suchen')
    expect(wrapper.text()).not.toContain('Dein Fahrzeug bleibt gewählt')
})

it('prepares an e-mail to the configured address, with the status and the page in it', () => {
    const mail = routes(page(500))[2]
    const href = mail?.attributes('href') ?? ''

    expect(href).toContain('mailto:hilfe@example.test')
    expect(href).toContain(encodeURIComponent('Fehler: 500'))
    expect(href).toContain(encodeURIComponent('/felgen/kaputt'))
})

it('falls back to the Kontakt page rather than dropping the third route', () => {
    // Never a dead end: the route degrades, it does not disappear (VehicleSelector's pattern).
    const wrapper = page(500, { contact: null })

    expect(routes(wrapper)).toHaveLength(3)
    expect(routes(wrapper)[2]?.attributes('href')).toBe('/kontakt')
    expect(routes(wrapper)[2]?.text()).toBe('Zur Kontaktseite')
    expect(wrapper.find('.err__note').exists()).toBe(false)
})

it('declines the wait, so the commonest 429 of all reads as German', () => {
    // `throttle:60,1` — the shop's own vehicle-lookup limit — answers with `Retry-After: 60`, and
    // the page said "In etwa 1 Minuten kannst du es noch einmal versuchen."
    expect(page(429, { retryAfter: 60 }).text()).toContain('einer Minute')
    expect(page(429, { retryAfter: 60 }).text()).not.toContain('1 Minuten')
    expect(page(429, { retryAfter: 1 }).text()).toContain('einer Sekunde')
    expect(page(429, { retryAfter: 1 }).text()).not.toContain('1 Sekunden')
    // And everything above one keeps its numeral.
    expect(page(429, { retryAfter: 120 }).text()).toContain('2 Minuten')
})

it('names the wait the server named, and otherwise names none at all', () => {
    expect(page(429, { retryAfter: 45 }).text()).toContain('45 Sekunden')
    expect(page(429, { retryAfter: 90 }).text()).toContain('2 Minuten')

    const silent = page(429).text()

    expect(silent).toContain('Warte einen Moment und versuche es dann noch einmal.')
    expect(silent).not.toContain('Sekunden')
})

it('never tells an expired session that the page does not exist', () => {
    // The old page had no 419 branch at all: someone whose session lapsed mid-basket was told the
    // page was gone, which is a confident wrong answer (CLAUDE.md §2).
    const text = page(419).text()

    expect(text).toContain('Deine Sitzung ist abgelaufen.')
    expect(text).toContain('Gespeichert wurde nichts, bestellt hast du nichts.')
    expect(text).not.toContain('Diese Seite haben wir nicht gefunden')
})

it('does not claim that anybody is already looking at the error', () => {
    // Nothing in this application notifies a human of a 500. The page says what is true.
    const text = page(500).text()

    expect(text).toContain('Der Fehler steht in unserem Protokoll.')
    expect(text).not.toContain('wird angesehen')
    expect(text).not.toContain('wird untersucht')
})

it("admits it does not know, rather than borrowing another failure's reassurance", () => {
    const text = page(418).text()

    expect(text).toContain('raten wollen wir lieber nicht')
    expect(text).not.toContain('Der Fehler steht in unserem Protokoll.')
})

it('keeps a browser translator off the code, the vehicle and the contact details', () => {
    const marked = page(404, { vehicle: VEHICLE })
        .findAll('[translate="no"]')
        .map((element) => element.text())

    expect(marked).toContain('404')
    expect(marked).toContain('BMW 3er Coupé')
    expect(marked).toContain(CONTACT.email)
    expect(marked).toContain(CONTACT.hours)
})

it('offers the reload as a plain link, so it works before the bundle has hydrated', () => {
    const reload = routes(page(500))[0]

    expect(reload?.text()).toBe('Diese Seite neu laden')
    expect(reload?.attributes('href')).toBe('')
})
