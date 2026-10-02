import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { KomplettradOfferProp, KomplettradOptionsProp, KomplettradTyreProp } from '../../types/pages'

/*
 * The Komplettrad in the purchase panel (#18; docs/specs/komplettrad.md §4.11, §9.3): it prints the tyres the server
 * permitted, one of them chosen, and hands the id to the page — it never posts. A refusal is one sentence with a route
 * forward, never an empty panel and never a dead end. Nothing here multiplies cents or judges a tyre.
 */

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: {}, url: '/felgen/borbet-db8gt2' }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: KomplettradChoice } = await import('./KomplettradChoice.vue')

const MIN_SENTENCE =
    'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y. Diese Mindestwerte ergeben sich aus Achslast und Höchstgeschwindigkeit deines Fahrzeugs.'

function tyre(overrides: Partial<KomplettradTyreProp> = {}): KomplettradTyreProp {
    return {
        id: 7,
        brandName: 'Bridgestone',
        name: 'Potenza Sport',
        season: 'sommer',
        seasonLabel: 'Sommerreifen',
        sizeLabel: '245/45 R18 100Y',
        stockQty: 8,
        tyrePriceCents: 15_000,
        tyrePrice: '150,00 €',
        perWheelCents: 96_500,
        perWheel: '965,00 €',
        forFourCents: 386_000,
        forFour: '3.860,00 €',
        label: null,
        isDemo: false,
        ...overrides,
    }
}

function offer(overrides: Partial<KomplettradOfferProp> = {}): KomplettradOfferProp {
    return { refusal: null, refusalCode: null, minSentence: MIN_SENTENCE, priceOpen: false, quantity: 4, tyres: [tyre()], ...overrides }
}

function refused(code: KomplettradOfferProp['refusalCode'], sentence: string): KomplettradOfferProp {
    return offer({ refusal: sentence, refusalCode: code, minSentence: null, tyres: [] })
}

let wrappers: VueWrapper[] = []

function mountChoice(
    value: KomplettradOfferProp = offer(),
    chosen: number | null = 7,
    extra: { options?: KomplettradOptionsProp | null; colourId?: number | null; rdks?: 'ja' | 'nein' | null } = {}
): VueWrapper {
    const wrapper = mount(KomplettradChoice, { props: { offer: value, modelValue: chosen, ...extra } })
    wrappers.push(wrapper)

    return wrapper
}

function tpms(overrides: Partial<KomplettradOptionsProp['tpms']> = {}): KomplettradOptionsProp['tpms'] {
    return {
        applicable: true,
        quantity: 4,
        available: true,
        makeLabel: 'BMW',
        unitPriceCents: 4_900,
        unitPrice: '49,00 €',
        line: '4 × 49,00 €',
        choice: null,
        totalCents: 0,
        total: '0,00 €',
        yesTotal: '196,00 €',
        notice: null,
        ...overrides,
    }
}

function options(overrides: Partial<KomplettradOptionsProp> = {}): KomplettradOptionsProp {
    return {
        colours: [
            { id: 1, name: 'Silber', swatchHex: '#c0c0c0', surchargeCents: 0, surcharge: '0,00 €', isDefault: true },
            { id: 2, name: 'Schwarz', swatchHex: '#111111', surchargeCents: 500, surcharge: '5,00 €', isDefault: false },
        ],
        tpms: tpms(),
        ...overrides,
    }
}

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
})

describe('KomplettradChoice', () => {
    it('prints each permitted tyre with the server\'s figures, the chosen one marked, and the minimum as a sentence', () => {
        const wrapper = mountChoice(offer({ tyres: [tyre(), tyre({ id: 8, name: 'PremiumContact 7', brandName: 'Continental', perWheel: '990,00 €' })] }))
        const tiles = wrapper.findAll('.kc-tile')

        expect(wrapper.find('.kc__min').text()).toBe(MIN_SENTENCE)
        expect(tiles).toHaveLength(2)
        expect(tiles[0]!.text()).toContain('Bridgestone Potenza Sport')
        expect(tiles[0]!.text()).toContain('Sommerreifen · 245/45 R18 100Y')
        expect(tiles[0]!.find('.kc-tile__amount').text()).toBe('965,00 €')
        expect(tiles[0]!.classes()).toContain('kc-tile--on')
        expect(tiles[1]!.classes()).not.toContain('kc-tile--on')
        // Nothing here posts: the page's one button adds the set.
        expect(wrapper.find('button[type="submit"]').exists()).toBe(false)
    })

    it('hands the tyre picked to the page', async () => {
        const wrapper = mountChoice(offer({ tyres: [tyre(), tyre({ id: 8, name: 'PremiumContact 7' })] }))

        await wrapper.findAll('input[type="radio"]')[1]!.setValue()

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([8])
    })

    it('shows four tyres and the rest on request, keeping the chosen one in sight', async () => {
        const many = Array.from({ length: 6 }, (_, i) => tyre({ id: 10 + i, name: `Reifen ${i + 1}` }))
        const wrapper = mountChoice(offer({ tyres: many }), 15)

        expect(wrapper.findAll('.kc-tile')).toHaveLength(4)
        expect(wrapper.find('.kc-tile--on').text()).toContain('Reifen 6')

        await wrapper.find('.kc__more').trigger('click')
        expect(wrapper.findAll('.kc-tile')).toHaveLength(6)
        expect(wrapper.find('.kc__more').exists()).toBe(false)
    })

    it('stands the EU label\'s classes beside each price and the full label for the tyre chosen', () => {
        const label = { fuel: 'B', wetGrip: 'A', noiseDb: 71, noiseClass: 'B', eprelId: '123456' }
        const wrapper = mountChoice(offer({ tyres: [tyre({ label })] }))

        expect(wrapper.find('.kc-tile__eu').text()).toBe('Kraftstoffeffizienz B · Nasshaftung A · 71 dB (B)')
        expect(wrapper.find('a[href="https://eprel.ec.europa.eu/qr/123456"]').exists()).toBe(true)

        // A class the regulation does not know is never shown, nor "corrected".
        const broken = mountChoice(offer({ tyres: [tyre({ label: { ...label, fuel: 'Z' } })] }))
        expect(broken.find('.kc-tile__eu').exists()).toBe(false)
        expect(broken.text()).not.toContain('Kraftstoffeffizienz')
    })

    it('answers a missing vehicle with the sentence and the selector, never an empty panel', () => {
        const sentence =
            'Für ein Komplettrad brauchen wir zuerst dein Fahrzeug – erst dann wissen wir, welche Reifengrößen für dich freigegeben sind.'
        const wrapper = mountChoice(refused('NO_VEHICLE', sentence), null)

        expect(wrapper.find('.kc__refusal').text()).toContain(sentence)
        expect(wrapper.find('.kc__refusal a[href="/felgen-suchen"]').text()).toBe('Fahrzeug wählen')
        expect(wrapper.find('a[href^="/kontakt"]').exists()).toBe(false)
        expect(wrapper.find('.kc-tile').exists()).toBe(false)
    })

    it('offers the contact form, with this page as the way back, when a person has to look at it (#26)', () => {
        const wrapper = mountChoice(refused('VERDICT_UNKNOWN', 'Zu dieser Felge liegt uns für dein Fahrzeug kein Gutachten vor.'), null)

        expect(wrapper.find('.kc__refusal a.kc__mail').attributes('href')).toBe('/kontakt?betreff=Frage+zum+Komplettrad&von=%2Ffelgen%2Fborbet-db8gt2')
        expect(wrapper.find('a[href="/felgen-suchen"]').exists()).toBe(false)
    })

    it('carries no link that only points at the page\'s own button (#25), whatever the refusal', () => {
        for (const code of ['NO_VEHICLE', 'NO_TYRE_AVAILABLE', 'VERDICT_NOT_PERMITTED', 'TYRES_UNKNOWN'] as const) {
            const wrapper = mountChoice(refused(code, 'Ein Satz.'), null)

            expect(wrapper.text()).not.toContain('Nur die Felgen bestellen')
            expect(wrapper.find('a[href^="#"]').exists()).toBe(false)
        }
    })

    /* ── #15: Wuchtgewichte, RDKS and valves ─────────────────────────────────────────── */

    it('offers the Wuchtgewichte colours, the chosen one marked, and prices each tyre with it as the server did', async () => {
        const priced = tyre({
            prices: [
                { colourId: 1, perWheel: '965,00 €', forFourCents: 386_000, forFour: '3.860,00 €' },
                { colourId: 2, perWheel: '970,00 €', forFourCents: 388_000, forFour: '3.880,00 €' },
            ],
        })
        const wrapper = mountChoice(offer({ tyres: [priced] }), 7, { options: options(), colourId: 1 })
        const colours = wrapper.findAll('.kc-opt').filter((o) => o.find('input[name="kc-weights"]').exists())

        expect(colours.map((c) => c.find('.kc-opt__name').text())).toEqual(['Silber', 'Schwarz'])
        expect(colours[0]!.find('.kc-opt__price').text()).toBe('ohne Aufpreis')
        expect(colours[1]!.find('.kc-opt__price').text()).toBe('+ 5,00 € je Rad')
        expect(colours[0]!.classes()).toContain('kc-opt--on')

        await colours[1]!.find('input').setValue()
        expect(wrapper.emitted('update:colourId')?.[0]).toEqual([2])

        await wrapper.setProps({ colourId: 2 })
        expect(wrapper.find('.kc-tile__amount').text()).toBe('970,00 €')
    })

    it('asks about RDKS sensors, unanswered until the visitor answers, and claims nothing about valves', async () => {
        const wrapper = mountChoice(offer(), 7, { options: options(), colourId: 1 })
        const rdks = wrapper.findAll('.kc-opt').filter((o) => o.find('input[name="kc-rdks"]').exists())

        expect(rdks.map((r) => r.find('.kc-opt__name').text())).toEqual(['Mit RDKS-Sensoren', 'Ohne Sensoren'])
        expect(rdks[0]!.find('.kc-opt__price').text()).toBe('196,00 € · 4 × 49,00 €')
        expect(rdks[0]!.find('.kc-opt__sub').text()).toBe('Wir setzen die Sensoren gleich mit ein.')
        // Which valves a wheel may take is the Gutachten's to say, in its conditions: never a sentence of ours.
        expect(wrapper.text()).not.toMatch(/Ventil/)
        // Nothing answered for the visitor: a guess either way could be wrong for their car.
        expect(wrapper.findAll('.kc-opt--on').filter((o) => o.find('input[name="kc-rdks"]').exists())).toHaveLength(0)

        await rdks[1]!.find('input').setValue()
        expect(wrapper.emitted('update:rdks')?.[0]).toEqual(['nein'])
    })

    it('offers no sensors where no price is entered for the make, says so and leads to the contact form', () => {
        const notice = 'Für BMW haben wir den Preis für RDKS-Sensoren noch nicht hinterlegt. Schreib uns kurz – wir melden uns mit dem Preis. Ohne Sensoren kannst du sofort bestellen.'
        const wrapper = mountChoice(offer(), 7, { options: options({ tpms: tpms({ available: false, unitPriceCents: null, unitPrice: null, line: null, yesTotal: null, notice }) }) })

        expect(wrapper.find('input[name="kc-rdks"][value="ja"]').exists()).toBe(false)
        expect(wrapper.find('input[name="kc-rdks"][value="nein"]').exists()).toBe(true)
        expect(wrapper.find('.kc__tpms-notice').text()).toContain(notice)
        expect(wrapper.find('.kc__tpms-notice a').attributes('href')).toContain('/kontakt?betreff=Preis+f%C3%BCr+RDKS-Sensoren')
    })

    it('asks nothing about weights or sensors beside a refusal, or without the options', () => {
        expect(mountChoice(refused('NO_TYRE_AVAILABLE', 'Ein Satz.'), null, { options: options() }).find('.kc__group').exists()).toBe(false)
        expect(mountChoice(offer(), 7, { options: null }).find('.kc__group').exists()).toBe(false)
    })

    it('still says something if the server sent neither tyres nor a sentence', () => {
        const wrapper = mountChoice(offer({ tyres: [] }), null)

        expect(wrapper.find('.kc__refusal').text()).toContain('Passende Reifen für diese Größe haben wir gerade nicht vorrätig.')
    })
})
