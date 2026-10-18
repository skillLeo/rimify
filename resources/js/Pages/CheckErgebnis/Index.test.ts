import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { ABNAHME_REQUIRED, PAPERS_EXEMPT } from '../../fitment/papers'
import type { CheckResultView } from '../../types/pages'
import type { VerdictStatus } from '../../types/rimify'

const current: { props: Record<string, unknown>; url?: string } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, 'data-inertia': 'link', ...attrs }, slots.default?.()),
    }),
    router: { on: vi.fn(() => () => undefined), delete: vi.fn(), visit: vi.fn() },
}))

const { default: CheckErgebnis } = await import('./Index.vue')

let mounted: VueWrapper[] = []

function view(status: VerdictStatus, overrides: Partial<CheckResultView> = {}): CheckResultView {
    return {
        status,
        statusLabel: 'Freigegeben',
        vehicle: 'Audi RS 4 Avant Quattro (B9), 03/2018–11/2019',
        wheel: 'Borbet DB8GT2 8,5J × 19 ET 35',
        wheelLabel: 'Freigegeben',
        reason: null,
        requiresEntry: false,
        entryNote: null,
        conditions: [],
        front: ['265/35 R19'],
        rear: ['265/35 R19'],
        tyre: null,
        papers: null,
        document: { label: 'ABE 55255', issuer: 'Kraftfahrt-Bundesamt', revision: 1, page: 4 },
        documentToday: null,
        issuedAt: '29.09.2026, 10:00 Uhr',
        ...overrides,
    }
}

function mountResult(status: VerdictStatus | null, overrides: Partial<CheckResultView> = {}): VueWrapper {
    // Fixture only — the shop's address lives in config/rimify.php; a reserved example domain.
    current.props = { contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' } }
    const wrapper = mount(CheckErgebnis, { props: { token: 'abc123', result: status === null ? null : view(status, overrides), keepMonths: 12 } })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('CheckErgebnis — "no document" leads to the contact form (#26)', () => {
    it('asks through the contact form on UNKNOWN, the result number in its subject and this result as its path', () => {
        current.url = '/rimify-check/ergebnis/abc123'
        const wrapper = mountResult('UNKNOWN')
        const primary = wrapper.find('.res__actions a.btn--primary')
        const href = primary.attributes('href') ?? ''
        const query = new URLSearchParams(href.split('?')[1] ?? '')

        expect(primary.text()).toBe('Bei uns nachfragen')
        expect(href.startsWith('/kontakt?')).toBe(true)
        expect(primary.attributes('data-inertia')).toBe('link')
        expect(query.get('betreff')).toBe('Anfrage zu meinem RIMIFY-Check (Ergebnis abc123)')
        expect(query.get('von')).toBe('/rimify-check/ergebnis/abc123')
        expect(wrapper.html()).not.toContain('mailto:')
    })

    it('prints the whole sum unfolded, the answer, its document and the customer’s own figures', () => {
        const lines = ['Vorderachse: 1.210 kg ÷ 2 = 605 kg je Rad.', 'Hinterachse: 1.235 kg ÷ 2 = 617,5 kg je Rad.']
        const wrapper = mountResult('PERMITTED', {
            tyre: {
                statusLabel: 'Freigegeben',
                summary: 'Hinterachse mit 1.235 kg: mindestens Tragfähigkeitsindex 93, Geschwindigkeitsindex Y.',
                basis: 'Grundlage: Tabelle auf Seite 6 im Gutachten 55255.',
                lines,
                stricterByPapers: true,
            },
            papers: { axleFrontKg: 1210, axleRearKg: 1235, topSpeedKmh: 280 },
            build: [
                { fact: 'Karosserieform', value: 'Schrägheck', source: 'nach deiner Angabe' },
                { fact: 'Antriebsart', value: 'Allradantrieb', source: 'erkannt am Fahrzeugnamen' },
            ],
        })

        // What the answer assumed about the car is printed with where it came from (G-02).
        const facts = wrapper.findAll('.res__facts > div').map((row) => [row.find('dt').text(), row.find('dd').text()])
        expect(facts).toContainEqual(['Karosserieform', 'Schrägheck – nach deiner Angabe'])
        expect(facts).toContainEqual(['Antriebsart', 'Allradantrieb – erkannt am Fahrzeugnamen'])

        expect(wrapper.find('.res__summary').text()).toBe('Hinterachse mit 1.235 kg: mindestens Tragfähigkeitsindex 93, Geschwindigkeitsindex Y.')
        expect(wrapper.findAll('.res__sum li').map((li) => li.text())).toEqual(lines)
        // No disclosure on paper: nothing is folded.
        expect(wrapper.find('details').exists()).toBe(false)
        expect(wrapper.text()).toContain('8.1 1.210 kg · 8.2 1.235 kg · T 280 km/h')
        expect(wrapper.text()).toContain('Deine Angaben aus den Fahrzeugpapieren haben die Antwort strenger gemacht.')
        expect(wrapper.find('.res__actions button').text()).toBe('Drucken')
    })

    it('never says „kein Gutachten“ when the wheel is approved and only the tyres are open', () => {
        const wrapper = mountResult('UNKNOWN', { wheelLabel: 'Freigegeben' })

        expect(wrapper.find('.res__body').text()).toContain('Die Felge ist freigegeben, die Reifen dazu können wir aber nicht bestätigen.')
        expect(wrapper.find('.res__body').text()).not.toContain('kein Gutachten')
    })

    // ABE 53841, points 10 and 11: the printed check says both answers about the papers, each on its own line.
    it('prints the Abnahme and „keine Berichtigung der Fahrzeugpapiere“ as two lines where the document frees the papers', () => {
        const exempt = mountResult('CONDITIONAL', { requiresEntry: true, papersExempt: true })

        const notes = (w: VueWrapper): string[] => w.findAll('[aria-labelledby="res-cond-h"] .res__note').map((p) => p.text())

        expect(notes(exempt)).toEqual([ABNAHME_REQUIRED, PAPERS_EXEMPT])

        const plain = mountResult('CONDITIONAL', { requiresEntry: true })

        expect(notes(plain)).toEqual(['Eintragung in die Fahrzeugpapiere erforderlich.'])
    })

    // D-291: asked only for what the answer was missing, the customer may have given T alone.
    it('prints only the figures the customer gave', () => {
        const wrapper = mountResult('PERMITTED', { papers: { axleFrontKg: null, axleRearKg: null, topSpeedKmh: 250 } })
        const facts = wrapper.findAll('.res__facts > div').map((row) => [row.find('dt').text(), row.find('dd').text()])

        expect(facts).toContainEqual(['Deine Angaben', 'T 250 km/h'])
        expect(wrapper.text()).not.toContain('8.1')
    })

    // D-292: a result is kept twelve months, then deleted with the figures in it — the page says until when, and an
    // expired link says why it no longer opens.
    it('says until when the link works, and why an expired one no longer opens', () => {
        const kept = mountResult('PERMITTED', { keptUntil: '18.10.2027' })
        const meta = kept.findAll('.res__meta > div').map((row) => [row.find('dt').text(), row.find('dd').text()])

        expect(meta).toContainEqual(['Link gültig bis', '18.10.2027'])

        const gone = mountResult(null)

        expect(gone.find('h1').text()).toBe('Dieses Ergebnis können wir nicht anzeigen.')
        expect(gone.find('.res__body').text()).toBe('Ein Ergebnis-Link gilt zwölf Monate, danach löschen wir das Ergebnis mit deinen Angaben. Prüf, ob der Link vollständig ist, oder starte eine neue Prüfung – sie zeigt dir den aktuellen Stand.')
    })

    it('keeps the other states on their Inertia links', () => {
        const wrapper = mountResult('PERMITTED')
        const primary = wrapper.find('.res__actions a.btn--primary')

        expect(primary.attributes('href')).toBe('/felgen')
        expect(primary.attributes('data-inertia')).toBe('link')
    })
})
