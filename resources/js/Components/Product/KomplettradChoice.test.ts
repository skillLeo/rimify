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
        const tiles = wrapper.findAll('.kc-row')

        expect(wrapper.find('.kc__min').text()).toBe(MIN_SENTENCE)
        expect(tiles).toHaveLength(2)
        expect(tiles[0]!.text()).toContain('Bridgestone Potenza Sport')
        expect(tiles[0]!.text()).toContain('Sommerreifen · 245/45 R18 100Y')
        expect(tiles[0]!.find('.kc-row__amount').text()).toBe('965,00 €')
        expect(tiles[0]!.classes()).toContain('kc-row--on')
        expect(tiles[1]!.classes()).not.toContain('kc-row--on')
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

        expect(wrapper.findAll('.kc-row')).toHaveLength(4)
        expect(wrapper.find('.kc-row--on').text()).toContain('Reifen 6')

        await wrapper.find('.kc__more').trigger('click')
        expect(wrapper.findAll('.kc-row')).toHaveLength(6)
        expect(wrapper.find('.kc__more').exists()).toBe(false)
    })

    it('stands the EU label\'s classes beside each price and the full label for the tyre chosen', () => {
        const label = { fuel: 'B', wetGrip: 'A', noiseDb: 71, noiseClass: 'B', snowGrip: false, iceGrip: false, eprelId: '123456' }
        const wrapper = mountChoice(offer({ tyres: [tyre({ label })] }))

        expect(wrapper.find('.kc-row__eu').text()).toBe('Kraftstoffeffizienz B · Nasshaftung A · 71 dB\u00A0(B)')
        expect(wrapper.find('a[href="https://eprel.ec.europa.eu/qr/123456"]').exists()).toBe(true)

        // A class the regulation does not know is never shown, nor "corrected".
        const broken = mountChoice(offer({ tyres: [tyre({ label: { ...label, fuel: 'Z' } })] }))
        expect(broken.find('.kc-row__eu').exists()).toBe(false)
        expect(broken.text()).not.toContain('Kraftstoffeffizienz')
    })

    it('answers a missing vehicle with the sentence and the selector, never an empty panel', () => {
        const sentence =
            'Für ein Komplettrad brauchen wir zuerst dein Fahrzeug – erst dann wissen wir, welche Reifengrößen für dich freigegeben sind.'
        const wrapper = mountChoice(refused('NO_VEHICLE', sentence), null)

        expect(wrapper.find('.kc__refusal').text()).toContain(sentence)
        expect(wrapper.find('.kc__refusal a[href="/felgen-suchen"]').text()).toBe('Fahrzeug wählen')
        expect(wrapper.find('a[href^="/kontakt"]').exists()).toBe(false)
        expect(wrapper.find('.kc-row').exists()).toBe(false)
    })

    it('offers the contact form, with this page as the way back, when a person has to look at it (#26)', () => {
        const wrapper = mountChoice(refused('VERDICT_UNKNOWN', 'Zu dieser Felge liegt uns für dein Fahrzeug kein Gutachten vor.'), null)

        expect(wrapper.find('.kc__refusal a.kc__mail').attributes('href')).toBe('/kontakt?betreff=Frage+zum+Komplettrad&von=%2Ffelgen%2Fborbet-db8gt2')
        expect(wrapper.find('a[href="/felgen-suchen"]').exists()).toBe(false)
    })

    // D-286: the tyres wait for the car's own figures — the way on is the papers form in the panel, not a message to us.
    it('points a refusal that waits for the car\'s papers at the papers form, not at the contact form', () => {
        const wrapper = mountChoice(refused('TYRES_AWAIT_PAPERS', 'Die Felge ist für dein Fahrzeug freigegeben. Für die Reifen fehlen uns noch Werte aus deiner Zulassungsbescheinigung Teil I – sobald du sie eingetragen hast, zeigen wir dir die Reifen, die du fahren darfst.'), null)

        expect(wrapper.find('.kc__routes button').text()).toBe('Werte eintragen')
        expect(wrapper.find('a[href^="/kontakt"]').exists()).toBe(false)
        expect(wrapper.find('a[href="/felgen-suchen"]').exists()).toBe(false)
    })

    it('carries no link that only points at the page\'s own button (#25), whatever the refusal @kunde-25', () => {
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
        const colours = wrapper.findAll('.kc-swatch')

        expect(colours.map((c) => c.find('.kc-swatch__name').text())).toEqual(['Silber', 'Schwarz'])
        expect(colours[0]!.find('.kc-swatch__price').text()).toBe('ohne Aufpreis')
        expect(colours[1]!.find('.kc-swatch__price').text()).toBe('+ 5,00 € pro Rad')
        expect(colours[0]!.classes()).toContain('kc-swatch--on')

        await colours[1]!.find('input').setValue()
        expect(wrapper.emitted('update:colourId')?.[0]).toEqual([2])

        await wrapper.setProps({ colourId: 2 })
        expect(wrapper.find('.kc-row__amount').text()).toBe('970,00 €')
    })

    it('asks about RDKS sensors, unanswered until the visitor answers, and claims nothing about valves', async () => {
        const wrapper = mountChoice(offer(), 7, { options: options(), colourId: 1 })
        const rdks = wrapper.findAll('.kc-opt').filter((o) => o.find('input[name="kc-rdks"]').exists())

        expect(rdks.map((r) => r.find('.kc-opt__name').text())).toEqual(['Mit RDKS-Sensoren', 'Ohne RDKS-Sensoren'])
        expect(rdks[0]!.find('.kc-opt__price').text()).toBe('+ 196,00 € (4 × 49,00 €)')
        expect(rdks[1]!.find('.kc-opt__price').text()).toBe('ohne Aufpreis')
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
        const asked = (wrapper: VueWrapper): boolean => wrapper.find('input[name="kc-weights"], input[name="kc-rdks"]').exists()

        expect(asked(mountChoice(refused('NO_TYRE_AVAILABLE', 'Ein Satz.'), null, { options: options() }))).toBe(false)
        expect(asked(mountChoice(offer(), 7, { options: null }))).toBe(false)
    })

    it('still says something if the server sent neither tyres nor a sentence', () => {
        const wrapper = mountChoice(offer({ tyres: [] }), null)

        expect(wrapper.find('.kc__refusal').text()).toContain('Passende Reifen für diese Größe können wir dir gerade nicht anbieten.')
    })
})

/* ── D-335: the Gutachten's combinations, 2 + 2 ─────────────────────────────────────────────────────────────────── */

type Combination = NonNullable<KomplettradOfferProp['combinations']>[number]
type CombinationSet = Combination['sets'][number]

const EU = { fuel: 'B', wetGrip: 'A', noiseDb: 71, noiseClass: 'B', snowGrip: false, iceGrip: false, eprelId: '700001' }

function combinationSet(overrides: Partial<CombinationSet> = {}): CombinationSet {
    return {
        key: '11-12',
        frontTyreId: 11,
        rearTyreId: 12,
        brandName: 'Bridgestone',
        name: 'Potenza Sport',
        seasonLabel: 'Sommerreifen',
        frontLabel: '225/40 R18 92Y',
        rearLabel: '245/35 R18 92Y',
        perWheelFront: '480,00 €',
        perWheelRear: '510,00 €',
        forFourCents: 198_000,
        forFour: '1.980,00 €',
        frontEu: EU,
        rearEu: { ...EU, eprelId: '700002', noiseDb: 72 },
        isDemo: false,
        ...overrides,
    }
}

function combination(overrides: Partial<Combination> = {}): Combination {
    return {
        key: '225/40/18|245/35/18',
        number: 2,
        front: '225/40 R18',
        rear: '245/35 R18',
        sameSize: false,
        minSentence: 'Wir prüfen jede Achse mit ihrer eigenen Achslast: vorne (880 kg) mindestens Tragfähigkeitsindex 84 und Geschwindigkeitsindex W, hinten (1.020 kg) mindestens Tragfähigkeitsindex 88 und Geschwindigkeitsindex W. Mehr verlangt die Hinterachse.',
        noSet: null,
        sets: [combinationSet()],
        ...overrides,
    }
}

function combinations(list: Combination[]): KomplettradOfferProp {
    return offer({ tyres: [], minSentence: null, combinations: list, perAxle: 2, sourcePage: 5 })
}

function mountSets(value: KomplettradOfferProp, setKey: string | null = null, extra: { options?: KomplettradOptionsProp | null; colourId?: number | null } = {}): VueWrapper {
    const wrapper = mount(KomplettradChoice, { props: { offer: value, modelValue: null, setKey, ...extra } })
    wrappers.push(wrapper)

    return wrapper
}

describe('KomplettradChoice — the Gutachten\'s combinations (D-335)', () => {
    const same = combination({ key: '225/40/18|225/40/18', number: 1, rear: '225/40 R18', sameSize: true, sets: [combinationSet({ key: '11-11', rearTyreId: 11, rearLabel: '225/40 R18 92Y', rearEu: null, forFour: '1.920,00 €' })] })

    it('offers the combinations in place of the tyres — never four of one size — each set 2 + 2 in the sizes it names @admin-208', () => {
        const wrapper = mountSets(combinations([same, combination()]), '11-12')

        expect(wrapper.find('[data-combinations] legend').text()).toBe('Reifenkombination aus dem Gutachten')
        expect(wrapper.find('[data-combinations] .kc__min').text()).toBe('Das Gutachten nennt die Reifengrößen je Achse (Seite\u00A05). Du bekommst zwei Kompletträder für die Vorderachse und zwei für die Hinterachse.')
        expect(wrapper.findAll('.kc__combos .chip').map((c) => c.text())).toEqual(['Nr.\u00A01 · vorne und hinten 225/40 R18', 'Nr.\u00A02 · vorne 225/40 R18 · hinten 245/35 R18'])
        expect(wrapper.find('.kc__combos .chip[aria-pressed="true"]').text()).toContain('Nr.\u00A02')
        // The chip says the combination's sizes: no pair line repeats them beside several chips.
        expect(wrapper.find('.kc__pair').exists()).toBe(false)

        const row = wrapper.find('.kc-row')
        expect(row.classes()).toContain('kc-row--on')
        expect(row.find('.kc-row__meta').text()).toBe('Sommerreifen')
        expect(row.find('.kc-row__amount').text()).toBe('1.980,00 €')
        expect(row.find('.kc-row__per').text()).toBe('für 2 + 2')
        // One row per axle: its word, its size never broken, and that tyre's label classes near the price.
        expect(row.findAll('.kc-set__axle').map((a) => a.text())).toEqual(['vorne', 'hinten'])
        expect(row.findAll('.kc-set__size').map((s) => s.text())).toEqual(['225/40 R18 92Y', '245/35 R18 92Y'])
        expect(row.findAll('.kc-row__eu').map((e) => e.text())).toEqual([
            'Kraftstoffeffizienz B · Nasshaftung A · 71\u202FdB\u00A0(B)',
            'Kraftstoffeffizienz B · Nasshaftung A · 72\u202FdB\u00A0(B)',
        ])
        // No four-of-a-kind tyre list beside it.
        expect(wrapper.find('input[name="kc-tyre"]').exists()).toBe(false)
    })

    it('hands the set picked to the page, and another combination\'s first set when the combination changes', async () => {
        const two = combination({ sets: [combinationSet(), combinationSet({ key: '13-14', frontTyreId: 13, rearTyreId: 14, name: 'Turanza' })] })
        const wrapper = mountSets(combinations([same, two]), '11-12')

        await wrapper.findAll('input[name="kc-set"]')[1]!.setValue()
        expect(wrapper.emitted('update:setKey')?.at(-1)).toEqual(['13-14'])

        await wrapper.findAll('.kc__combos .chip')[0]!.trigger('click')
        expect(wrapper.emitted('update:setKey')?.at(-1)).toEqual(['11-11'])
    })

    it('shows four sets and the rest on request, as four tyres — the chosen one always in sight', async () => {
        const many = Array.from({ length: 6 }, (_, i) => combinationSet({ key: `${20 + i}-${30 + i}`, frontTyreId: 20 + i, rearTyreId: 30 + i, name: `Linie ${i + 1}` }))
        const wrapper = mountSets(combinations([combination({ sets: many })]), '25-35')

        expect(wrapper.findAll('input[name="kc-set"]')).toHaveLength(4)
        expect(wrapper.find('.kc-row--on').text()).toContain('Linie 6')

        await wrapper.find('.kc__more').trigger('click')
        expect(wrapper.findAll('input[name="kc-set"]')).toHaveLength(6)
        expect(wrapper.find('.kc__more').exists()).toBe(false)
    })

    it('moves the focus to the first set the press revealed — the fourth where the chosen one stood in its place', async () => {
        const many = Array.from({ length: 6 }, (_, i) => combinationSet({ key: `${20 + i}-${30 + i}`, frontTyreId: 20 + i, rearTyreId: 30 + i, name: `Linie ${i + 1}` }))
        const wrapper = mount(KomplettradChoice, { props: { offer: combinations([combination({ sets: many })]), modelValue: null, setKey: '25-35' }, attachTo: document.body })
        wrappers.push(wrapper)

        // Linie 1–3 and the chosen Linie 6 are in sight; the press reveals Linie 4 and 5.
        await wrapper.find('.kc__more').trigger('click')
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(document.activeElement).toBe(wrapper.findAll('input[name="kc-set"]')[3]!.element)

        // Chosen among the first four: the fifth is the first revealed.
        const first = mount(KomplettradChoice, { props: { offer: combinations([combination({ sets: many })]), modelValue: null, setKey: '20-30' }, attachTo: document.body })
        wrappers.push(first)

        await first.find('.kc__more').trigger('click')
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(document.activeElement).toBe(first.findAll('input[name="kc-set"]')[4]!.element)
    })

    it('says one tyre on both axles once, with its one label — and a single combination\'s sizes in its pair line', () => {
        const wrapper = mountSets(combinations([same]), '11-11')

        expect(wrapper.find('.kc__combos').exists()).toBe(false)
        expect(wrapper.find('.kc__pair').text()).toContain('Vorder- und Hinterachse je 2 × 225/40 R18')
        expect(wrapper.findAll('.kc-set__axle').map((a) => a.text())).toEqual(['vorne und hinten'])
        expect(wrapper.findAll('.kc-row__eu').map((e) => e.text())).toEqual(['Kraftstoffeffizienz B · Nasshaftung A · 71\u202FdB\u00A0(B)'])

        // One combination of two sizes: each axle with its size in the pair line.
        const single = mountSets(combinations([combination()]), '11-12')
        expect(single.find('.kc__pair').text()).toMatch(/^Vorderachse 2 × 225\/40 R18 · Hinterachse 2 × 245\/35 R18 Kombination Nr.\s2$/)
    })

    // D-336: where the document lets the axles differ, each axle names its own tyre — the maker too where there are two.
    it('names each axle’s tyre where the document lets the lines differ — never one name for two tyres', () => {
        const twoLines = mountSets(combinations([combination({ sets: [combinationSet({ rearBrandName: 'Bridgestone', rearName: 'Turanza 6' })] })]), '11-12')

        expect(twoLines.find('.kc-row__name').text()).toBe('Bridgestone')
        expect(twoLines.findAll('.kc-set__line').map((l) => l.text())).toEqual(['Potenza Sport', 'Turanza 6'])

        const twoMakers = mountSets(combinations([combination({ sets: [combinationSet({ rearBrandName: 'Michelin', rearName: 'Pilot Sport 4' })] })]), '11-12')

        expect(twoMakers.find('.kc-row__name').text()).toBe('Bridgestone · Michelin')
        expect(twoMakers.findAll('.kc-set__line').map((l) => l.text())).toEqual(['Bridgestone Potenza Sport', 'Michelin Pilot Sport 4'])

        // One line on both axles: one name, no line per axle.
        const one = mountSets(combinations([combination()]), '11-12')

        expect(one.find('.kc-row__name').text()).toBe('Bridgestone Potenza Sport')
        expect(one.find('.kc-set__line').exists()).toBe(false)
    })

    it('names the axle the shop has no tyre for and offers no set there — the rim alone, never another size @admin-208', () => {
        const noSet = 'Für die Hinterachse (245/35 R18) können wir dir gerade keinen passenden Reifen anbieten – ein Komplettrad gibt es in dieser Kombination deshalb nicht. Die Felge allein kannst du bestellen.'
        const wrapper = mountSets(combinations([combination({ sets: [], noSet })]), null)

        expect(wrapper.find('.kc__noset').text()).toBe(noSet)
        expect(wrapper.find('.kc-row').exists()).toBe(false)
        expect(wrapper.find('.kc__refusal').exists()).toBe(false)
    })

    it('still asks for the Wuchtgewichte and the sensors, and prices the set in the colour chosen', async () => {
        const priced = combinationSet({ prices: [
            { colourId: 1, perWheelFront: '480,00 €', perWheelRear: '510,00 €', forFourCents: 198_000, forFour: '1.980,00 €' },
            { colourId: 2, perWheelFront: '485,00 €', perWheelRear: '515,00 €', forFourCents: 200_000, forFour: '2.000,00 €' },
        ] })
        const wrapper = mountSets(combinations([combination({ sets: [priced] })]), '11-12', { options: options(), colourId: 1 })

        expect(wrapper.find('input[name="kc-weights"]').exists()).toBe(true)
        expect(wrapper.find('input[name="kc-rdks"]').exists()).toBe(true)

        await wrapper.setProps({ colourId: 2 })
        expect(wrapper.find('.kc-row__amount').text()).toBe('2.000,00 €')
    })
})
