import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { KomplettradOptionsProp, KomplettradTyreProp, ProduktConfig } from '../../types/pages'

/*
 * The Komplettrad's steps as a customer walks them (the Gutachten rework §9, the client's change of 05.11.2026): only the tyres the
 * server sent, nothing chosen for the customer, the sensors answered before the basket, and what goes into the basket is what was
 * chosen. The browser's own part stands in e2e/komplettrad.spec.ts.
 */

const post = vi.fn()
const pushed = vi.hoisted(() => [] as { url: string; props?: (c: Record<string, unknown>) => Record<string, unknown> }[])
const car = vi.hoisted(() => ({ id: 5 }))
let forms: Record<string, unknown>[] = []

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { push: (visit: never) => pushed.push(visit) },
    usePage: () => ({ url: '/komplettraeder?groesse=11', props: { vehicle: { id: car.id, short: 'BMW X3', label: 'BMW X3 2.0d' }, contact: { email: 'x', phone: null, phoneIntl: null, whatsapp: null, hours: '' } } }),
    useForm: <T extends object>(data: T) => {
        const form = reactive({ ...data, errors: {} as Record<string, string>, processing: false, post: (...args: unknown[]) => post(...args), clearErrors: () => { form.errors = {} } })

        forms.push(form)

        return form
    },
}))

const { default: Flow } = await import('./Index.vue')

function tyre(over: Partial<KomplettradTyreProp> = {}): KomplettradTyreProp {
    return {
        id: 7, brandName: 'Bridgestone', name: 'Potenza Sport', season: 'sommer', seasonLabel: 'Sommerreifen', sizeLabel: '245/45 R19 100Y', tyrePriceCents: 15_000, tyrePrice: '150,00 €',
        tyreSetCents: 60_000, tyreSet: '600,00 €', facts: 'Lastindex 100: bis 800 kg je Reifen · Y: bis 300 km/h', perWheelCents: 96_500, perWheel: '965,00 €', forFourCents: 386_000, forFour: '3.860,00 €',
        prices: [{ colourId: 1, perWheel: '965,00 €', forFourCents: 386_000, forFour: '3.860,00 €' }, { colourId: 2, perWheel: '970,00 €', forFourCents: 388_000, forFour: '3.880,00 €' }],
        label: { fuel: 'B', wetGrip: 'A', noiseDb: 71, noiseClass: 'B', snowGrip: false, iceGrip: false, eprelId: '381090' } as never,
        isDemo: false,
        ...over,
    }
}

function config(over: Partial<ProduktConfig> = {}): ProduktConfig {
    return {
        id: 11, finishId: 1, sku: 'X', diameterIn: 19, widthIn: 8.5, etMm: 45, sizeLabel: '8,5J × 19 · ET 45', versionLabel: 'Breite 8,5J · ET 45 · Lochkreis 5 × 112', fullLabel: '8,5J × 19 · ET 45 · 5 × 112 · 66,5 mm',
        boltPattern: '5 × 112', centreBore: '66,5 mm', priceCents: 80_000, price: '800,00 €', priceForFour: '3.200,00 €', inStock: true, kbaNumber: null, weightG: null,
        verdict: { status: 'PERMITTED', label: 'Freigegeben', sellable: true, requiresEntry: false, entryNoteDe: null, conditions: [], reason: null, reasonCode: null, document: null, tyreSizes: [] },
        komplettrad: { refusal: null, refusalCode: null, minSentence: 'Mindestens 100Y.', priceOpen: false, quantity: 4, tyres: [tyre()] },
        mischbereifung: null,
        ...over,
    } as unknown as ProduktConfig
}

const OPTIONS = {
    colours: [
        { id: 1, name: 'Silber', swatchHex: null, surchargeCents: 0, surcharge: '0,00 €', surchargeForFour: '0,00 €', isDefault: true },
        { id: 2, name: 'Schwarz', swatchHex: null, surchargeCents: 500, surcharge: '5,00 €', surchargeForFour: '20,00 €', isDefault: false },
    ],
    tpms: { applicable: true, quantity: 4, available: true, makeLabel: 'BMW', unitPriceCents: 4_900, unitPrice: '49,00 €', line: '4 × 49,00 €', choice: 'ja', totalCents: 0, total: '0,00 €', yesTotal: '196,00 €', yesTotalCents: 19_600, notice: null },
} as unknown as KomplettradOptionsProp

let wrappers: VueWrapper[] = []

function flow(over: Record<string, unknown> = {}): VueWrapper {
    const wrapper = mount(Flow, {
        props: {
            product: { slug: 'motec-mcr4', brandName: 'Motec', modelName: 'MCR4', finishId: 1, finishName: 'Grau', image: null, art: { finish: 'silver', spokes: 5 } },
            config: config(),
            options: OPTIONS,
            photos: {},
            mounting: { each: '25,00 €', total: '100,00 €' },
            schritt: 2,
            inBasket: { wheels: 0, keys: [] },
            ...over,
        } as never,
        attachTo: document.body,
    })

    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    post.mockReset()
    forms = []
    pushed.length = 0
    car.id = 5
    sessionStorage.clear()
    window.scrollTo = vi.fn() as never
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
})

const button = (wrapper: VueWrapper, name: RegExp) => wrapper.findAll('button').find((b) => name.test(b.text()))!

async function toExtras(wrapper: VueWrapper): Promise<void> {
    await flushPromises()
    await wrapper.find('[data-tyre-card] input').setValue()
    await button(wrapper, /Weiter: Extras/).trigger('click')
    await flushPromises()
}

describe('step 1, the rim', () => {
    it('names the whole version, leads back to choose another, and goes on to the tyres', async () => {
        const wrapper = flow({ schritt: null })

        await flushPromises()

        expect(wrapper.find('.kf-wheel__spec').text()).toBe('8,5J × 19 · ET 45 · 5 × 112 · 66,5 mm')
        expect(wrapper.find('.kf-link').attributes('href')).toBe('/felgen/motec-mcr4?ausfuehrung=1&groesse=11')

        await button(wrapper, /Weiter: Reifen/).trigger('click')
        await flushPromises()

        expect(wrapper.find('#kf-tyres-h').exists()).toBe(true)
        expect(pushed.at(-1)!.url).toContain('schritt=2')
    })

    it('says why there is no Komplettrad, with a way on, and goes no further @kunde-25', async () => {
        const wrapper = flow({ schritt: 3, config: config({ komplettrad: { refusal: 'Zuerst dein Fahrzeug.', refusalCode: 'NO_VEHICLE', minSentence: null, priceOpen: false, quantity: 4, tyres: [] } }) })

        await flushPromises()

        expect(wrapper.find('#kf-wheel-h').exists()).toBe(true)
        expect(wrapper.find('.kr-refusal').text()).toContain('Zuerst dein Fahrzeug.')
        expect(wrapper.find('.kr-refusal a[href="/felgen-suchen"]').text()).toBe('Fahrzeug wählen')
        expect(button(wrapper, /Weiter: Reifen/).attributes('disabled')).toBeDefined()
    })
})

describe('step 2, the tyres', () => {
    it('lists only the tyres the server sent, with what a card owes: size, label, set and tyre price, availability @kunde-18', async () => {
        const wrapper = flow({ config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: 'Mindestens 100Y.', priceOpen: false, quantity: 4, tyres: [tyre(), tyre({ id: 8, name: 'Turanza', tyreSetCents: 50_000, tyreSet: '500,00 €' })] } }) })

        await flushPromises()

        const cards = wrapper.findAll('[data-tyre-card]')

        expect(cards).toHaveLength(2)
        expect(wrapper.text()).toContain('Mindestens 100Y.')
        // The cheapest first.
        expect(cards[0]!.text()).toContain('Turanza')

        const potenza = cards[1]!.text()

        expect(potenza).toContain('Bridgestone')
        expect(potenza).toContain('Sommer')
        expect(potenza).toContain('245/45 R19 100Y')
        expect(potenza).toContain('Kraftstoff B')
        expect(potenza).toContain('Nässe A')
        expect(potenza).toContain('600,00 €')
        expect(potenza).toContain('150,00 € je Reifen')
        expect(potenza).toContain('Verfügbar')
        expect(potenza).toContain('Auswählen')
    })

    // „Mit Abnahme und Eintragung“ would be false beside a paper that frees the papers: the card says the verdict's own line.
    it('says what a size asks in the papers’ own words: the Eintragung, or the Abnahme alone where the document frees the papers', async () => {
        const answer = { combination: [], sizes: [], chosen: '245/45 R19', entry: true }
        const strict = config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [tyre({ answer }), tyre({ id: 8, answer: { ...answer, entry: false } })] } })
        const entry = flow({ config: strict })

        await flushPromises()

        expect(entry.find('[data-tyre-card="t7"] .tc__entry').text()).toBe('Eintragung in die Fahrzeugpapiere erforderlich.')
        expect(entry.find('[data-tyre-card="t8"] .tc__entry').exists()).toBe(false)

        const exempt = flow({ config: { ...strict, verdict: { ...strict.verdict!, papersExempt: true } } })

        await flushPromises()

        expect(exempt.find('[data-tyre-card="t7"] .tc__entry').text()).toContain('Abnahme durch einen Prüfer erforderlich')
        expect(exempt.find('[data-tyre-card="t7"] .tc__entry').text()).not.toContain('Eintragung')
    })

    it('chooses nothing for the customer, and the next step waits for a tyre', async () => {
        const wrapper = flow()

        await flushPromises()

        expect(wrapper.find('.tc--on').exists()).toBe(false)
        expect(button(wrapper, /Weiter: Extras/).attributes('disabled')).toBeDefined()

        await wrapper.find('[data-tyre-card] input').setValue()

        expect(wrapper.find('.tc--on').exists()).toBe(true)
        expect(button(wrapper, /Weiter: Extras/).attributes('disabled')).toBeUndefined()
        expect(wrapper.find('.kf-pick').text()).toContain('Bridgestone Potenza Sport')
    })

    it('draws a neutral outline without a photograph, and the model’s photo with one: never another tyre’s', async () => {
        const without = flow()

        await flushPromises()

        expect(without.find('.tc__picture .tyre-silhouette').exists()).toBe(true)
        expect(without.find('.tc__picture picture, .tc__picture img').exists()).toBe(false)

        const manifest = { name: 'eins', base: '/x/eins', width: 800, height: 800, widths: [800], placeholder: '', fallback: 'jpg', formats: [], alt: 'Potenza, Seite' }
        const withPhoto = flow({ photos: { 7: [manifest] } })

        await flushPromises()

        expect(withPhoto.find('.tc__picture .tyre-silhouette').exists()).toBe(false)
        expect(withPhoto.find('.tc__picture img').exists()).toBe(true)
    })

    it('filters by season and brand, sorts, and shows more on request', async () => {
        const tyres = Array.from({ length: 8 }, (_, i) => tyre({ id: 100 + i, name: `Modell ${i}`, brandName: i % 2 ? 'Apollo' : 'Bridgestone', season: i < 2 ? 'winter' : 'sommer', seasonLabel: i < 2 ? 'Winterreifen' : 'Sommerreifen', tyreSetCents: 40_000 + i * 10_000, tyreSet: `${400 + i * 100},00 €` }))
        const wrapper = flow({ config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres } }) })

        await flushPromises()

        expect(wrapper.findAll('[data-tyre-card]')).toHaveLength(6)
        expect(wrapper.find('.kf-count').text()).toBe('8 Reifen passen')

        await button(wrapper, /Mehr anzeigen/).trigger('click')
        expect(wrapper.findAll('[data-tyre-card]')).toHaveLength(8)

        await button(wrapper, /^Winterreifen$/).trigger('click')
        expect(wrapper.findAll('[data-tyre-card]')).toHaveLength(2)
        expect(wrapper.find('.kf-count').text()).toBe('2 Reifen passen')

        await button(wrapper, /^Winterreifen$/).trigger('click')
        await button(wrapper, /^Apollo$/).trigger('click')
        expect(wrapper.find('.kf-count').text()).toBe('4 Reifen passen')

        await wrapper.find('.kf-sort__select').setValue('preis-ab')
        expect(wrapper.findAll('[data-tyre-card]')[0]!.text()).toContain('Modell 7')
    })

    it('shows both sizes and the combined price where front and rear differ, and offers the two ways where the paper allows both @kunde-20', async () => {
        const set = { key: '7-8', frontTyreId: 7, rearTyreId: 8, brandName: 'Bridgestone', name: 'Potenza', season: 'sommer' as const, seasonLabel: 'Sommerreifen', frontTyrePrice: '140,00 €', rearTyrePrice: '160,00 €', tyreSetCents: 60_000, tyreSet: '600,00 €', frontFacts: '', rearFacts: '', frontLabel: '225/35 R19 88Y', rearLabel: '255/30 R19 92Y', perWheelFront: '950,00 €', perWheelRear: '990,00 €', forFourCents: 388_000, forFour: '3.880,00 €', isDemo: false }
        const mischbereifung = { refusal: null, refusalCode: null, perAxle: 2, rules: 'Nur ein Hersteller je Achse.', sourcePage: 12, rulesPage: 13, priceOpen: false, pairs: [{ key: '1', number: 1, front: '225/35 R19', rear: '255/30 R19', minSentence: 'Vorne 88Y, hinten 92Y.', sets: [set] }] }
        const wrapper = flow({ config: config({ mischbereifung }) })

        await flushPromises()

        expect(wrapper.find('input[name="kf-mode"][value="same"]').exists()).toBe(true)
        expect((wrapper.find('input[name="kf-mode"][value="same"]').element as HTMLInputElement).checked).toBe(true)

        await wrapper.find('input[name="kf-mode"][value="mixed"]').setValue()

        const card = wrapper.find('[data-tyre-card]').text()

        // With the space a reader needs: „vorne225/35“ is what Vue's whitespace rule left of it (the design review of Phase 4).
        expect(card).toContain('vorne 225/35 R19 88Y')
        expect(card).toContain('hinten 255/30 R19 92Y')
        expect(card).toContain('600,00 €')
        expect(card).toContain('für 2 vorne und 2 hinten')
        expect(wrapper.text()).toContain('Vorne 88Y, hinten 92Y.')
        expect(wrapper.find('.kf-rules').text()).toContain('Nur ein Hersteller je Achse.')
        expect(wrapper.find('.kf-rules').text()).toContain('Seite 13')
    })

    // ABE 55255's V19 names 27 pairings in one sentence: printed above the list, the tyres stood 4.000 px down a phone (D-197).
    it('puts the tyres first where front and rear differ, and folds the Auflagen behind their count where they run long', async () => {
        const set = { key: '7-8', frontTyreId: 7, rearTyreId: 8, brandName: 'B', name: 'P', season: 'sommer' as const, seasonLabel: 'Sommerreifen', frontTyrePrice: '140,00 €', rearTyrePrice: '160,00 €', tyreSetCents: 60_000, tyreSet: '600,00 €', frontFacts: '', rearFacts: '', frontLabel: '225/35 R19 88Y', rearLabel: '255/30 R19 92Y', perWheelFront: '950,00 €', perWheelRear: '990,00 €', forFourCents: 388_000, forFour: '3.880,00 €', isDemo: false }
        const pairWith = (combination: string[]) => [{ key: '1', number: 1, front: '225/35 R19', rear: '255/30 R19', minSentence: 'x', sets: [set], answer: { combination, sizes: [], chosen: null, entry: false, perAxle: true } }]
        const page = (combination: string[]) => flow({ config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [], combinations: pairWith(combination), perAxle: 2 } }) })
        const long = page(Array.from({ length: 9 }, (_, i) => `Auflage ${i} ${'lang '.repeat(30)}`))

        await flushPromises()

        const folded = long.find('details[data-set-answer]')

        expect(folded.find('summary').text()).toBe('9 Auflagen und Hinweise aus dem Gutachten anzeigen')
        // After the tyres, in the page's order.
        expect(long.find('.kf-grid').element.compareDocumentPosition(folded.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

        const short = page(['Nur mit den Radschrauben der Felge.'])

        await flushPromises()

        expect(short.find('details[data-set-answer]').exists()).toBe(false)
        expect(short.find('div[data-set-answer]').text()).toContain('Nur mit den Radschrauben der Felge.')
    })

    it('keeps the filters out of the way of a reset: the focus lands on the count', async () => {
        const tyres = Array.from({ length: 4 }, (_, i) => tyre({ id: 300 + i, name: `M ${i}`, brandName: i % 2 ? 'Apollo' : 'Bridgestone' }))
        const wrapper = flow({ config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres } }) })

        await flushPromises()
        await button(wrapper, /^Apollo$/).trigger('click')
        await button(wrapper, /^Bridgestone$/).trigger('click')
        ;(wrapper.vm as unknown as { filter: { brands: string[] } }).filter.brands = ['Keine']
        await flushPromises()
        await button(wrapper, /Filter zurücksetzen/).trigger('click')
        await flushPromises()

        expect(document.activeElement?.classList.contains('kf-count')).toBe(true)
    })

    it('offers a price range as a press that a second press takes back, with no chip that does nothing', async () => {
        const tyres = Array.from({ length: 6 }, (_, i) => tyre({ id: 200 + i, name: `Modell ${i}`, tyreSetCents: 40_000 + i * 20_000, tyreSet: `${400 + i * 200},00 €` }))
        const wrapper = flow({ config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres } }) })

        await flushPromises()

        expect(wrapper.text()).not.toContain('Alle Preise')

        const range = wrapper.find('[aria-label="Preis für die Reifen"] .chip')

        await range.trigger('click')

        expect(range.attributes('aria-pressed')).toBe('true')
        expect(wrapper.findAll('[data-tyre-card]').length).toBeLessThan(6)

        await range.trigger('click')

        expect(range.attributes('aria-pressed')).toBe('false')
        expect(wrapper.findAll('[data-tyre-card]')).toHaveLength(6)
    })

    it('keeps the filters one press away on a phone, says how many are on, and offers no such press where there is nothing to filter', async () => {
        const two = [tyre(), tyre({ id: 8, name: 'Winter', brandName: 'Apollo', season: 'winter', seasonLabel: 'Winterreifen' })]
        const wrapper = flow({ config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: two } }) })

        await flushPromises()

        const toggle = wrapper.find('.kf-filters__toggle')

        expect(toggle.attributes('aria-expanded')).toBe('false')
        expect(wrapper.find('#kf-filters').classes()).not.toContain('kf-filters--open')

        await toggle.trigger('click')

        expect(toggle.attributes('aria-expanded')).toBe('true')
        expect(wrapper.find('#kf-filters').classes()).toContain('kf-filters--open')

        await button(wrapper, /^Apollo$/).trigger('click')

        expect(toggle.text()).toBe('Filter (1)')

        const one = flow()

        await flushPromises()

        expect(one.find('.kf-filters__toggle').exists()).toBe(false)
    })

    it('offers the Gutachten’s combinations as tiles, and as a list where there are too many for tiles to stay short of the tyres', async () => {
        const set = { key: 'x', frontTyreId: 7, rearTyreId: 8, brandName: 'B', name: 'P', season: 'sommer' as const, seasonLabel: 'Sommerreifen', frontTyrePrice: '140,00 €', rearTyrePrice: '160,00 €', tyreSetCents: 60_000, tyreSet: '600,00 €', frontFacts: '', rearFacts: '', frontLabel: '225/35 R19 88Y', rearLabel: '255/30 R19 92Y', perWheelFront: '950,00 €', perWheelRear: '990,00 €', forFourCents: 388_000, forFour: '3.880,00 €', isDemo: false }
        const pairsOf = (n: number) => Array.from({ length: n }, (_, i) => ({ key: String(i + 1), number: i + 1, front: `22${i}/35 R19`, rear: `25${i}/30 R19`, minSentence: `Mindestens für Nr. ${i + 1}.`, sets: [{ ...set, key: `s${i}` }] }))
        const page = (n: number) => flow({ config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [], combinations: pairsOf(n), perAxle: 2 } }) })
        const tiles = page(3)

        await flushPromises()

        const radios = tiles.findAll('input[name="kf-pair"]')

        expect(radios).toHaveLength(3)
        // The sizes tell two tiles apart: one front with two rears carries one number twice.
        expect(tiles.find('.kf-pair .kf-opt__name').text()).toBe('vorne 220/35 R19 · hinten 250/30 R19')
        expect(tiles.find('.kf-pair .kf-opt__sub').text()).toBe('Kombination Nr.\u00A01')

        await radios[1]!.setValue()

        expect(tiles.find('.kf-measure').text()).toBe('Mindestens für Nr. 2.')

        const many = page(9)

        await flushPromises()

        expect(many.findAll('input[name="kf-pair"]')).toHaveLength(0)

        const list = many.find('select#kf-pair')

        expect(list.findAll('option')).toHaveLength(9)

        await list.setValue('7')

        expect(many.find('.kf-measure').text()).toBe('Mindestens für Nr. 7.')
    })

    it('opens everything about a tyre without choosing it, and chooses it from there', async () => {
        const wrapper = flow()

        await flushPromises()
        await wrapper.find('.tc__details').trigger('click')
        await flushPromises()

        const dialog = document.querySelector('[role="dialog"]')!

        expect(dialog.textContent).toContain('Lastindex 100: bis 800 kg je Reifen · Y: bis 300 km/h')
        expect(dialog.textContent).toContain('600,00 €')
        expect(wrapper.find('.tc--on').exists()).toBe(false)

        ;[...dialog.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Auswählen')!.click()
        await flushPromises()

        expect(wrapper.find('.tc--on').exists()).toBe(true)

        // Chosen: nothing left to press but the way out, never a primary „Ausgewählt“ that only closes.
        await wrapper.find('.tc__details').trigger('click')
        await flushPromises()

        const again = [...document.querySelectorAll('[role="dialog"] .dialog__actions button')].map((b) => b.textContent?.trim())

        expect(again).toEqual(['Schließen'])
    })
})

describe('step 3, the extras', () => {
    it('preselects nothing, even where this visitor answered for the make before, and the basket waits for the answer @kunde-15', async () => {
        const wrapper = flow()

        await toExtras(wrapper)

        expect(wrapper.find('#kf-extras-h').exists()).toBe(true)
        expect(wrapper.findAll('input[name="kf-rdks"]').map((i) => (i.element as HTMLInputElement).checked)).toEqual([false, false])
        expect(wrapper.findAll('input[name="kf-weights"]').map((i) => (i.element as HTMLInputElement).checked)).toEqual([false, false])
        expect(button(wrapper, /Weiter: Warenkorb/).attributes('disabled')).toBeDefined()
        expect(wrapper.find('#kf-rdks-hint').text()).toBe('Sag uns zuerst, ob du RDKS-Sensoren brauchst.')
        // Deferred to the checkout no more: the client's change of 05.11.2026.
        expect(wrapper.text()).not.toContain('Noch nicht beantwortet')
        expect(wrapper.text()).not.toContain('an der Kasse')

        await wrapper.find('input[name="kf-rdks"][value="nein"]').setValue()

        expect(button(wrapper, /Weiter: Warenkorb/).attributes('disabled')).toBeUndefined()
        expect(wrapper.find('#kf-rdks-hint').exists()).toBe(false)
    })

    it('marks the colour chosen as every tile of the shop is: with its check, the row not moving', async () => {
        const wrapper = flow()

        await toExtras(wrapper)
        await wrapper.find('input[name="kf-weights"][value="2"]').setValue()

        expect(wrapper.findAll('.kf-swatch__check')).toHaveLength(2)
        expect(wrapper.findAll('.kf-swatch--on .kf-swatch__check')).toHaveLength(1)
    })

    it('says which colour comes where none is chosen, and the sensors’ price on a line of its own', async () => {
        const wrapper = flow()

        await toExtras(wrapper)

        expect(wrapper.find('[data-weights]').text()).toContain('Ohne Wahl setzen wir Silber ein.')
        expect(wrapper.find('.kf-opt__price').text()).toContain('+ 196,00 €')
        expect(wrapper.find('.kf-opt__price').text()).toContain('4 × 49,00 €')
    })

    it('asks for an answer also where no sensor can be priced: Ohne is the answer there, with the way to ask', async () => {
        const options = { ...OPTIONS, tpms: { ...OPTIONS.tpms, available: false, yesTotal: null, yesTotalCents: null, notice: 'Für BMW haben wir noch keinen Preis.' } }
        const wrapper = flow({ options })

        await toExtras(wrapper)

        expect(wrapper.findAll('input[name="kf-rdks"]').map((i) => (i.element as HTMLInputElement).value)).toEqual(['nein'])
        expect(wrapper.find('[data-rdks]').text()).toContain('Für BMW haben wir noch keinen Preis.')
        expect(button(wrapper, /Weiter: Warenkorb/).attributes('disabled')).toBeDefined()
    })
})

/* The interaction review of Phase 4: what moves under a step, and what a set in the basket means for the next. */
describe('what moves under a step', () => {
    const reached = async (over: Record<string, unknown> = {}): Promise<VueWrapper> => {
        const wrapper = flow(over)

        await toExtras(wrapper)
        await wrapper.find('input[name="kf-rdks"][value="ja"]').setValue()

        return wrapper
    }

    it('binds what was chosen to the car: another car starts clean, and nothing paid stands chosen for it', async () => {
        const first = await reached()

        first.unmount()
        wrappers = []
        car.id = 6

        const other = flow({ schritt: 3 })

        await flushPromises()

        expect(other.find('#kf-tyres-h').exists()).toBe(true)
        expect(other.find('.tc--on').exists()).toBe(false)
        expect((other.vm as unknown as { rdks: string | null }).rdks).toBeNull()
        other.unmount()
        wrappers = []

        // The first car's answer is still its own.
        car.id = 5

        const again = flow({ schritt: 3 })

        await flushPromises()

        expect((again.find('input[name="kf-rdks"][value="ja"]').element as HTMLInputElement).checked).toBe(true)
    })

    it('starts afresh once the set is in the basket: nothing paid carries over to the next pass', async () => {
        const wrapper = await reached()

        await button(wrapper, /Weiter: Warenkorb/).trigger('click')
        await flushPromises()
        await wrapper.find('.kf-add').trigger('click')
        ;(post.mock.calls[0]?.[1] as { onSuccess: () => void }).onSuccess()
        wrapper.unmount()
        wrappers = []

        const next = flow({ schritt: 3 })

        await flushPromises()

        expect(next.find('#kf-tyres-h').exists()).toBe(true)
        expect(next.find('.tc--on').exists()).toBe(false)
    })

    it('falls back to the reason where the car goes, whichever step is on screen', async () => {
        const wrapper = await reached()

        await wrapper.setProps({ config: config({ komplettrad: { refusal: 'Zuerst dein Fahrzeug.', refusalCode: 'NO_VEHICLE', minSentence: null, priceOpen: false, quantity: 4, tyres: [] } }) })
        await flushPromises()

        expect(wrapper.find('#kf-wheel-h').exists()).toBe(true)
        expect(wrapper.find('.kr-refusal').text()).toContain('Zuerst dein Fahrzeug.')
    })

    it('says a tyre has gone from the shelf, and asks for another: never a bare „Noch kein Reifen gewählt“', async () => {
        const wrapper = await reached()

        await button(wrapper, /Weiter: Warenkorb/).trigger('click')
        await flushPromises()
        await wrapper.setProps({ config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [tyre({ id: 8, name: 'Turanza' })] } }) })
        await flushPromises()

        expect(wrapper.find('#kf-tyres-h').exists()).toBe(true)
        expect(wrapper.find('[data-tyre-gone]').text()).toBe('Der gewählte Reifen ist gerade nicht mehr verfügbar. Wähl bitte einen anderen.')

        await wrapper.find('[data-tyre-card] input').setValue()

        expect(wrapper.find('[data-tyre-gone]').exists()).toBe(false)
    })

    it('shows a refusal of the add wherever the step falls back to', async () => {
        const wrapper = await reached()

        await button(wrapper, /Weiter: Warenkorb/).trigger('click')
        await flushPromises()
        ;(forms[0]!.errors as Record<string, string>).wheelConfigId = 'Diese Felge ist zurzeit nicht verfügbar.'
        await wrapper.setProps({ config: config({ inStock: false }) })
        await flushPromises()

        expect(wrapper.find('#kf-wheel-h').exists()).toBe(true)
        expect(wrapper.find('[role="alert"]').text()).toContain('Diese Felge ist zurzeit nicht verfügbar.')
    })

    it('asks again where the price of the sensors or the colour has gone: the answer does not stay chosen unseen', async () => {
        const wrapper = await reached()

        await wrapper.find('input[name="kf-weights"][value="2"]').setValue()
        await wrapper.setProps({ options: { colours: [OPTIONS.colours[0]], tpms: { ...OPTIONS.tpms, available: false, yesTotal: null, yesTotalCents: null, notice: 'Kein Preis.' } } })
        await flushPromises()

        expect(wrapper.find('input[name="kf-rdks"][value="ja"]').exists()).toBe(false)
        expect(button(wrapper, /Weiter: Warenkorb/).attributes('disabled')).toBeDefined()
        expect(wrapper.find('#kf-rdks-hint').text()).toBe('Sag uns zuerst, ob du RDKS-Sensoren brauchst.')
    })

    it('takes the tyre back where another combination or Bereifung is pressed: the card chosen is no longer on the page', async () => {
        const set = { key: '7-8', frontTyreId: 7, rearTyreId: 8, brandName: 'B', name: 'P', season: 'sommer' as const, seasonLabel: 'Sommerreifen', frontTyrePrice: '140,00 €', rearTyrePrice: '160,00 €', tyreSetCents: 60_000, tyreSet: '600,00 €', frontFacts: '', rearFacts: '', frontLabel: '225/35 R19 88Y', rearLabel: '255/30 R19 92Y', perWheelFront: '950,00 €', perWheelRear: '990,00 €', forFourCents: 388_000, forFour: '3.880,00 €', isDemo: false }
        const pairs = [
            { key: '1', number: 1, front: '225/35 R19', rear: '255/30 R19', minSentence: 'x', sets: [set] },
            { key: '2', number: 2, front: '225/35 R19', rear: '245/30 R19', minSentence: 'y', sets: [{ ...set, key: '7-9', rearTyreId: 9 }] },
        ]
        const wrapper = flow({ config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [], combinations: pairs, perAxle: 2 } }) })

        await flushPromises()
        await wrapper.find('[data-tyre-card] input').setValue()

        expect(button(wrapper, /Weiter: Extras/).attributes('disabled')).toBeUndefined()

        await wrapper.findAll('input[name="kf-pair"]')[1]!.setValue()

        expect(wrapper.find('.tc--on').exists()).toBe(false)
        expect(wrapper.find('.kf-pick').text()).toBe('Wähl zuerst einen Reifen.')
        expect(button(wrapper, /Weiter: Extras/).attributes('disabled')).toBeDefined()
    })

    it('says so where the set is in the basket already, and leads there: never a second set under one Summe', async () => {
        const wrapper = flow({ schritt: 4, inBasket: { wheels: 4, keys: ['wheel:11:tyre:7'] } })

        await toExtras(wrapper).catch(() => undefined)
        await flushPromises()

        // Choosing it says so already, and the way on is the basket.
        expect(wrapper.find('.kf-pick').text()).toContain('liegt schon im Warenkorb')
        expect(wrapper.findAll('a').some((a) => a.attributes('href') === '/warenkorb')).toBe(true)
    })

    it('replaces the add with the way to the basket once the set is there', async () => {
        const wrapper = await reached()

        await button(wrapper, /Weiter: Warenkorb/).trigger('click')
        await flushPromises()
        await wrapper.setProps({ inBasket: { wheels: 4, keys: ['wheel:11:tyre:7'] } })
        await flushPromises()

        expect(wrapper.find('.kf-add').exists()).toBe(false)
        expect(wrapper.find('.kf-basket').exists()).toBe(false)
        expect(wrapper.find('[data-held]').text()).toBe('Dieses Komplettrad liegt in deinem Warenkorb.')
        expect(wrapper.findAll('a').some((a) => a.attributes('href') === '/warenkorb')).toBe(true)

        await button(wrapper, /Anderen Reifen wählen/).trigger('click')
        await flushPromises()

        expect(wrapper.find('#kf-tyres-h').exists()).toBe(true)
        expect(wrapper.find('.tc--on').exists()).toBe(false)
    })

    it('says the answer on the sensors holds for every wheel in the basket, and prices them all', async () => {
        const tpms = { ...OPTIONS.tpms, quantity: 8, line: '8 × 49,00 €', yesTotal: '392,00 €', yesTotalCents: 39_200, choice: 'nein' }
        const wrapper = flow({ inBasket: { wheels: 4, keys: ['wheel:12:tyre:9'] }, options: { ...OPTIONS, tpms } })

        await toExtras(wrapper)

        expect(wrapper.find('[data-rdks-shared]').text()).toBe('Für die 4 Räder in deinem Warenkorb steht „Ohne RDKS-Sensoren“. Deine Antwort hier gilt für alle Räder im Warenkorb.')
        // Still nothing chosen for the customer.
        expect(wrapper.find('input[name="kf-rdks"]:checked').exists()).toBe(false)
        expect(wrapper.find('.kf-opt__price').text()).toContain('392,00 €')

        await wrapper.find('input[name="kf-rdks"][value="ja"]').setValue()
        await button(wrapper, /Weiter: Warenkorb/).trigger('click')
        await flushPromises()

        const row = wrapper.findAll('.kf-basket tbody tr').find((tr) => tr.text().includes('RDKS-Sensoren'))!

        expect(row.text()).toContain('392,00 €')
        expect(row.text()).toContain('für alle Räder im Warenkorb')
        expect(wrapper.find('.kf-sum').text()).toContain('Die Sensoren für die 4 Räder, die schon im Warenkorb liegen, sind in der Summe enthalten.')
    })

    it('says that Ohne takes the sensors off the wheels in the basket too', async () => {
        const tpms = { ...OPTIONS.tpms, quantity: 8, line: '8 × 49,00 €', yesTotal: '392,00 €', yesTotalCents: 39_200, choice: 'ja' }
        const wrapper = flow({ inBasket: { wheels: 4, keys: ['wheel:12:tyre:9'] }, options: { ...OPTIONS, tpms } })

        await toExtras(wrapper)
        await wrapper.find('input[name="kf-rdks"][value="nein"]').setValue()
        await button(wrapper, /Weiter: Warenkorb/).trigger('click')
        await flushPromises()

        expect(wrapper.find('.kf-sum').text()).toContain('Ohne RDKS-Sensoren gilt auch für die 4 Räder, die schon im Warenkorb liegen.')
    })

    it('says a lost connection at the add, and tries again on the next press', async () => {
        const wrapper = await reached()

        await button(wrapper, /Weiter: Warenkorb/).trigger('click')
        await flushPromises()
        await wrapper.find('.kf-add').trigger('click')

        expect(forms[0]).toMatchObject({ vehicleId: 5 })

        const keep = (post.mock.calls[0]?.[1] as { onNetworkError: () => boolean }).onNetworkError()

        await flushPromises()

        expect(keep).toBe(false)
        expect(wrapper.find('[role="alert"]').text()).toBe('Keine Verbindung – es wurde nichts in den Warenkorb gelegt. Versuch es gleich noch einmal.')

        await wrapper.find('.kf-add').trigger('click')
        await flushPromises()

        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
        expect(post).toHaveBeenCalledTimes(2)
    })

    it('keeps the way back shut while the add is on its way: its answer would bring the step back', async () => {
        const wrapper = await reached()

        await button(wrapper, /Weiter: Warenkorb/).trigger('click')
        await flushPromises()
        ;(forms[0] as { processing: boolean }).processing = true
        await flushPromises()

        expect(button(wrapper, /Zurück/).attributes('disabled')).toBeDefined()
    })

    it('draws the outline where a photograph does not load, never a broken image', async () => {
        const manifest = { name: 'eins', base: '/x/eins', width: 800, height: 800, widths: [800], placeholder: '', fallback: 'jpg', formats: [], alt: 'Potenza' }
        const wrapper = flow({ photos: { 7: [manifest] } })

        await flushPromises()
        await wrapper.find('.tc__picture img').trigger('error')

        expect(wrapper.find('.tc__picture img').exists()).toBe(false)
        expect(wrapper.find('.tc__picture .tyre-silhouette').exists()).toBe(true)

        await wrapper.find('.tc__details').trigger('click')
        await flushPromises()

        document.querySelector('.td__picture img')?.dispatchEvent(new Event('error', { bubbles: false }))
        await flushPromises()

        expect(document.querySelector('.td__picture img')).toBeNull()
        expect(document.querySelector('.td__picture .tyre-silhouette')).not.toBeNull()
    })

    it('finds the filters and the order again after Back, and puts the focus on the count when they are reset', async () => {
        const tyres = Array.from({ length: 8 }, (_, i) => tyre({ id: 100 + i, name: `Modell ${i}`, brandName: i % 2 ? 'Apollo' : 'Bridgestone' }))
        const page = { config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres } }) }
        const first = flow(page)

        await flushPromises()
        await button(first, /^Apollo$/).trigger('click')
        await first.find('.kf-sort__select').setValue('marke')
        await flushPromises()
        first.unmount()
        wrappers = []

        const back = flow(page)

        await flushPromises()

        expect(back.find('.kf-count').text()).toBe('4 Reifen passen')
        expect((back.find('.kf-sort__select').element as HTMLSelectElement).value).toBe('marke')
    })

    it('holds a later step back on the first frame until the session is read: no jump from another step', async () => {
        const { createSSRApp } = await import('vue')
        const { renderToString } = await import('vue/server-renderer')
        const html = await renderToString(createSSRApp(Flow, {
            product: { slug: 'x', brandName: 'M', modelName: 'X', finishId: 1, finishName: 'G', image: null, art: { finish: 'silver', spokes: 5 } },
            config: config(),
            options: OPTIONS,
            photos: {},
            mounting: null,
            schritt: 4,
            inBasket: { wheels: 0, keys: [] },
        }))

        expect(html).toContain('Wird geladen')
        expect(html).not.toContain('kf-tyres-h')
    })
})

describe('step 4, the basket', () => {
    async function toBasket(wrapper: VueWrapper, answer: 'ja' | 'nein' = 'ja'): Promise<void> {
        await toExtras(wrapper)
        await wrapper.find(`input[name="kf-rdks"][value="${answer}"]`).setValue()
        await button(wrapper, /Weiter: Warenkorb/).trigger('click')
        await flushPromises()
    }

    it('names every line and the sum, and adds exactly what was chosen @kunde-15 @kunde-18', async () => {
        const wrapper = flow()

        await toExtras(wrapper)
        await wrapper.find('input[name="kf-weights"][value="2"]').setValue()
        await wrapper.find('input[name="kf-rdks"][value="ja"]').setValue()
        await button(wrapper, /Weiter: Warenkorb/).trigger('click')
        await flushPromises()

        const rows = wrapper.findAll('.kf-basket tbody tr').map((row) => row.find('.kf-basket__label').text())

        expect(rows).toEqual(['4 Felgen', '4 Reifen Bridgestone Potenza Sport', 'Montage und Auswuchten', 'Wuchtgewichte Schwarz', 'RDKS-Sensoren'])
        expect(wrapper.find('.kf-sum').text()).toContain('inkl. MwSt.')
        expect(wrapper.find('.kf-basket tfoot td').text().replace(/\s/g, '')).toBe('4.076,00€')

        await wrapper.find('.kf-add').trigger('click')

        expect(post).toHaveBeenCalledTimes(1)
        expect(post.mock.calls[0]?.[0]).toBe('/warenkorb')
        expect(forms[0]).toMatchObject({ kind: 'WHEEL', wheelConfigId: 11, tyreVariantId: 7, rearTyreVariantId: null, weightColourId: 2, rdks: 'ja', quantity: 4 })
    })

    it('adds a set per axle two and two, with its rear tyre', async () => {
        const set = { key: '7-8', frontTyreId: 7, rearTyreId: 8, brandName: 'B', name: 'P', season: 'sommer' as const, seasonLabel: 'Sommerreifen', frontTyrePrice: '140,00 €', rearTyrePrice: '160,00 €', tyreSetCents: 60_000, tyreSet: '600,00 €', frontFacts: '', rearFacts: '', frontLabel: '225/35 R19 88Y', rearLabel: '255/30 R19 92Y', perWheelFront: '950,00 €', perWheelRear: '990,00 €', forFourCents: 388_000, forFour: '3.880,00 €', isDemo: false }
        const combinations = [{ key: '1', number: 1, front: '225/35 R19', rear: '255/30 R19', minSentence: 'x', sets: [set] }]
        const wrapper = flow({ config: config({ komplettrad: { refusal: null, refusalCode: null, minSentence: null, priceOpen: false, quantity: 4, tyres: [], combinations, perAxle: 2 } }) })

        await toBasket(wrapper, 'nein')
        await wrapper.find('.kf-add').trigger('click')

        expect(forms[0]).toMatchObject({ tyreVariantId: 7, rearTyreVariantId: 8, rdks: 'nein', quantity: 2 })
    })

    it('adds one set however often the button is pressed, and prints the server’s refusal', async () => {
        const wrapper = flow()

        await toBasket(wrapper)
        ;(forms[0] as { processing: boolean }).processing = true
        await wrapper.find('.kf-add').trigger('click')
        expect(post).not.toHaveBeenCalled()

        ;(forms[0] as { processing: boolean }).processing = false
        ;(forms[0]!.errors as Record<string, string>).tyreVariantId = 'Dieser Reifen ist zurzeit nicht verfügbar.'
        await flushPromises()

        expect(wrapper.find('[role="alert"]').text()).toContain('Dieser Reifen ist zurzeit nicht verfügbar.')
    })

    it('never opens on a step whose choice is missing: the address asks for more than there is', async () => {
        const wrapper = flow({ schritt: 4 })

        await flushPromises()

        expect(wrapper.find('#kf-tyres-h').exists()).toBe(true)
    })

    it('comes back with what was chosen, for this version only', async () => {
        const first = flow()

        await toExtras(first)
        await first.find('input[name="kf-rdks"][value="nein"]').setValue()
        await flushPromises()
        first.unmount()
        wrappers = []

        const again = flow({ schritt: 4 })

        await flushPromises()

        expect(again.find('#kf-basket-h').exists()).toBe(true)
        expect(again.find('.kf-basket').text()).toContain('Bridgestone Potenza Sport')

        const other = flow({ schritt: 4, config: config({ id: 12 }) })

        await flushPromises()

        expect(other.find('#kf-tyres-h').exists()).toBe(true)
    })
})
