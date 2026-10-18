import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { NNBSP } from '../../format'
import type { ImageManifest } from '../../Components/Ui/Picture.vue'
import type { AmountPrice, ConfigVerdict, KomplettradOfferProp, ProduktConfig, ProduktProps } from '../../types/pages'

/*
 * The product page's own states (ACCURACY.md D4, finding #48/#59): a demo model shows
 * "Beispielbestand" and says it cannot be ordered yet, while its basket button stays usable; a
 * verified load rating adds a "Traglast" row; the main photograph opens large in a dialog that
 * Escape closes; and the selected size is offered as a Komplettrad — the tyres the server sent,
 * or one sentence with a route forward (docs/specs/komplettrad.md §9.3).
 */

const post = vi.fn()
let forms: Array<Record<string, unknown>> = []

// The way on to the papers form (lib/papersForm): what the page's button calls where the tyres wait for the car's papers.
const focusPapers = vi.hoisted(() => vi.fn())

vi.mock('../../lib/papersForm', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../lib/papersForm')>()),
    focusPapersForm: focusPapers,
}))

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    usePage: () => ({
        props: {
            vehicle: null,
            contact: { email: 'hallo@beispiel.de', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9–17 Uhr' },
        },
    }),
    useForm: <T extends object>(data: T) => {
        const form = reactive({
            ...data,
            errors: {} as Record<string, string>,
            processing: false,
            post: (...args: unknown[]) => post(...args),
            clearErrors: () => {
                form.errors = {}
            },
        })
        forms.push(form)

        return form
    },
}))

const { default: Produkt } = await import('./Index.vue')

type RatedConfig = ProduktConfig & { maxLoadKg?: number | null }

const photo: ImageManifest = {
    name: 'motec-mcr4-ultimate-light-grey-d5',
    base: '/storage/demo/wheels/motec-mcr4-ultimate-light-grey-d5',
    width: 1080,
    height: 1080,
    widths: [480, 1080],
    placeholder: 'data:image/png;base64,AAAA',
    fallback: 'png',
}

function config(overrides: Partial<RatedConfig> = {}): RatedConfig {
    return {
        id: 11,
        finishId: 1,
        sku: 'MO-MCR4-8519-45',
        diameterIn: 19,
        widthIn: 8.5,
        etMm: 45,
        sizeLabel: '8,5J × 19 · ET 45',
        // The rim's own bore: 66,5 mm, the figure Motec's catalogue and the Teilegutachten give.
        // What an ABE states for one particular car travels inside the verdict, never here.
        fullLabel: '8,5J × 19 · ET 45 · LK 5 × 112 · 66,5 mm',
        boltPattern: '5 × 112',
        centreBore: '66,5 mm',
        hump: 'H2',
        priceCents: 79_600,
        price: '796,00 €',
        stockQty: 8,
        inStock: true,
        kbaNumber: '53810',
        weightG: null,
        verdict: null,
        maxLoadKg: null,
        ...overrides,
    }
}

/** What the server ships for one rim at 229,00 € (LinePrice, D-102): the page only picks one of them. */
const AMOUNTS: AmountPrice[] = [
    { quantity: 1, cents: 22_900, text: `229,00${NNBSP}€` },
    { quantity: 2, cents: 45_800, text: `458,00${NNBSP}€` },
    { quantity: 3, cents: 68_700, text: `687,00${NNBSP}€` },
    { quantity: 4, cents: 91_600, text: `916,00${NNBSP}€` },
    { quantity: 5, cents: 114_500, text: `1.145,00${NNBSP}€` },
    { quantity: 6, cents: 137_400, text: `1.374,00${NNBSP}€` },
    { quantity: 7, cents: 160_300, text: `1.603,00${NNBSP}€` },
    { quantity: 8, cents: 183_200, text: `1.832,00${NNBSP}€` },
]

/** A permitted verdict, as the server ships it; `centreBore` is what the document states for the car. */
function verdict(overrides: Partial<ConfigVerdict> = {}): ConfigVerdict {
    return {
        status: 'PERMITTED',
        label: 'Für dein Fahrzeug freigegeben',
        sellable: true,
        requiresEntry: false,
        entryNoteDe: null,
        conditions: [],
        centreBore: null,
        centreBoreSource: 'UNSTATED',
        reason: null,
        reasonCode: null,
        document: null,
        tyreSizes: [],
        ...overrides,
    }
}

/** The Felgendetails list as a reader sees it: the German term against the value beside it. */
function specs(wrapper: VueWrapper): Record<string, string> {
    return Object.fromEntries(
        wrapper.findAll('.spec__row').map((row) => {
            const term = row.find('dt')
            const hint = row.find('dt .spec__hint')

            return [
                hint.exists() ? term.text().replace(hint.text(), '').trim() : term.text(),
                row.find('dd').text(),
            ]
        })
    )
}

const MIN_SENTENCE =
    'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y. Diese Mindestwerte stehen so im Gutachten.'

function komplettrad(overrides: Partial<KomplettradOfferProp> = {}): KomplettradOfferProp {
    return {
        refusal: null,
        refusalCode: null,
        minSentence: MIN_SENTENCE,
        priceOpen: false,
        quantity: 4,
        tyres: [
            {
                id: 7,
                brandName: 'Bridgestone',
                name: 'Potenza Sport',
                season: 'sommer',
                seasonLabel: 'Sommerreifen',
                sizeLabel: '245/45 R19 100Y',
                stockQty: 8,
                tyrePriceCents: 15_000,
                tyrePrice: '150,00 €',
                perWheelCents: 96_500,
                perWheel: '965,00 €',
                forFourCents: 386_000,
                forFour: '3.860,00 €',
                label: null,
                isDemo: false,
            },
        ],
        ...overrides,
    }
}

function props(overrides: Partial<ProduktProps & { demo: boolean }> = {}): ProduktProps & { demo: boolean } {
    return {
        product: {
            modelId: 1,
            slug: 'motec-mcr4-ultimate',
            modelName: 'MCR4 Ultimate',
            brandName: 'MOTEC',
            typeDesignation: null,
            descriptionDe: null,
            spokes: 5,
            rating: null,
            ratingCount: 0,
            ratingLabel: null,
        },
        finishes: [{ id: 1, name: 'Light Grey D5', hex: null, artFinish: 'silver', image: photo }],
        configs: [config()],
        hasVehicle: false,
        demo: false,
        ...overrides,
    }
}

let wrappers: VueWrapper[] = []

function mountPage(overrides: Partial<ProduktProps & { demo: boolean }> = {}): VueWrapper {
    const wrapper = mount(Produkt, { props: props(overrides), attachTo: document.body })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    post.mockReset()
    forms = []
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
})

describe('Produkt page', () => {
    it('names the manufacturer, the product and the safety information as the brand carries them (GPSR)', () => {
        const base = props().product
        const wrapper = mountPage({
            product: {
                ...base,
                typeDesignation: 'MCR4',
                manufacturer: {
                    name: 'Beispiel Räder GmbH',
                    address: 'Werkstraße 1\n12345 Musterstadt',
                    contact: 'info@beispiel-raeder.test',
                    euResponsible: null,
                    safetyNote: 'Montage nur durch eine Fachwerkstatt.',
                },
            },
        })
        const block = wrapper.find('.pdp__gpsr')

        expect(block.find('h2').text()).toBe('Hersteller und Produktsicherheit')
        expect(block.text()).toContain('Beispiel Räder GmbH')
        expect(block.text()).toContain('info@beispiel-raeder.test')
        expect(block.text()).toContain('MOTEC MCR4 Ultimate · Typ MCR4')
        expect(block.text()).toContain('Montage nur durch eine Fachwerkstatt.')
        expect(block.text()).not.toContain('Verantwortliche Person in der EU')
    })

    it('says the manufacturer’s details are still to come rather than invent them', () => {
        const block = mountPage().find('.pdp__gpsr')

        expect(block.find('dl').exists()).toBe(false)
        expect(block.text()).toContain('Die Angaben des Herstellers zu dieser Felge liegen uns noch nicht vor.')
    })

    it('says "Auf Lager" for a real model in stock, and nothing about a demo range', () => {
        const wrapper = mountPage()

        expect(wrapper.find('.pdp__stock').text()).toBe('Auf Lager')
        expect(wrapper.find('.pdp__stock').classes()).toContain('tag--ok')
        expect(wrapper.find('.pdp__demo').exists()).toBe(false)
    })

    // D-286, the look review: where the tyres wait for the car's papers the page's button is the way on — never a disabled
    // „In den Warenkorb“ with no reason beside it. Nothing is added until the figures are in.
    it('turns the button into „Werte eintragen“ where the tyres wait for the car’s papers, and adds nothing', async () => {
        focusPapers.mockClear()
        const owed = verdict({
            status: 'UNKNOWN', label: 'Noch nicht bestätigt', sellable: false, wheelStatus: 'CONDITIONAL', wheelLabel: 'Freigegeben mit Auflagen',
            tyre: { status: 'UNKNOWN', label: 'Noch nicht bestätigt', lines: [], thresholds: [], fromVehicleData: false, owed: ['8.1', '8.2', 'T'] },
        })
        const wrapper = mountPage({ hasVehicle: true, configs: [config({ verdict: owed })] })
        const button = wrapper.find('button.pdp__add')

        expect(button.text()).toBe('Werte eintragen')
        expect(button.attributes('disabled')).toBeUndefined()

        await button.trigger('click')

        expect(focusPapers).toHaveBeenCalledTimes(1)
        expect(post).not.toHaveBeenCalled()

        // Sold out stays sold out: the figures would not change that.
        const gone = mountPage({ hasVehicle: true, configs: [config({ verdict: owed, inStock: false, stockQty: 0 })] }).find('button.pdp__add')

        expect(gone.text()).toBe('Ausverkauft')
        expect(gone.attributes('disabled')).toBeDefined()
    })

    // D-289: where the document does not itself limit the axle load, the rim alone sells while the tyres wait for the
    // papers — „In den Warenkorb“ adds it; only the Komplettrad waits for them.
    it('adds the rim alone where it sells while the tyres wait for the papers', async () => {
        focusPapers.mockClear()
        post.mockClear()
        const rim = verdict({
            status: 'UNKNOWN', label: 'Noch nicht bestätigt', sellable: false, rimSellable: true, wheelStatus: 'PERMITTED', wheelLabel: 'Freigegeben',
            tyre: { status: 'UNKNOWN', label: 'Noch nicht bestätigt', lines: [], thresholds: [], fromVehicleData: false, owed: ['8.1', '8.2', 'T'] },
        })
        const button = mountPage({ hasVehicle: true, configs: [config({ verdict: rim })] }).find('button.pdp__add')

        expect(button.text()).toBe('In den Warenkorb')
        expect(button.attributes('disabled')).toBeUndefined()

        await button.trigger('click')

        expect(post).toHaveBeenCalledTimes(1)
        expect(focusPapers).not.toHaveBeenCalled()
    })

    it('shows a demo model as Beispielbestand, says it cannot be ordered yet, and keeps the basket usable', async () => {
        const wrapper = mountPage({ demo: true })

        expect(wrapper.find('.pdp__stock').text()).toBe('Beispielbestand')
        expect(wrapper.find('.pdp__stock').classes()).not.toContain('tag--ok')
        expect(wrapper.text()).not.toContain('Auf Lager')
        expect(wrapper.find('.pdp__demo').text()).toContain('Beispielsortiment')
        expect(wrapper.find('.pdp__demo').text()).toContain('bestellen kannst du sie noch nicht')

        const button = wrapper.find('button.pdp__add')
        expect(button.text()).toBe('In den Warenkorb')
        expect(button.attributes('disabled')).toBeUndefined()

        await button.trigger('click')

        expect(post).toHaveBeenCalledTimes(1)
        expect(post.mock.calls[0]?.[0]).toBe('/warenkorb')
    })

    it('preselects four, prices the four beside the stepper as „4 × 229,00 € = 916,00 €“, and adds exactly the amount on screen @kunde-17 @kunde-14', async () => {
        const wrapper = mountPage({ configs: [config({ priceCents: 22_900, price: `229,00${NNBSP}€`, stockQty: 5, amounts: AMOUNTS })] })
        const less = wrapper.find('button[aria-label="Anzahl verringern"]')
        const more = wrapper.find('button[aria-label="Anzahl erhöhen"]')

        expect(wrapper.find('.amt output').text()).toBe('4')
        expect(wrapper.find('.pdp__total').text()).toBe(`916,00${NNBSP}€`)
        expect(wrapper.find('.pdp__each').text()).toBe(`4 × 229,00${NNBSP}€ = 916,00${NNBSP}€, inkl. MwSt., zzgl. Versandkosten`)

        for (let i = 0; i < 3; i++) {
            await less.trigger('click')
        }

        expect(wrapper.find('.pdp__total').text()).toBe(`229,00${NNBSP}€`)
        expect(wrapper.find('.pdp__each').text()).toBe(`1 × 229,00${NNBSP}€ = 229,00${NNBSP}€, inkl. MwSt., zzgl. Versandkosten`)
        expect(less.attributes('disabled')).toBeDefined()

        await wrapper.find('button.pdp__add').trigger('click')

        expect(post).toHaveBeenCalledTimes(1)
        expect(forms.find((f) => f.kind === 'WHEEL')?.quantity).toBe(1)

        // Up to what is on the shelf, and no further.
        for (let i = 0; i < 6; i++) {
            await more.trigger('click')
        }

        expect(wrapper.find('.amt output').text()).toBe('5')
        expect(wrapper.find('.pdp__total').text()).toBe(`1.145,00${NNBSP}€`)
        expect(more.attributes('disabled')).toBeDefined()
    })

    it('brings the amount down to what is on the shelf @kunde-17', () => {
        const wrapper = mountPage({ configs: [config({ priceCents: 22_900, price: `229,00${NNBSP}€`, stockQty: 2, amounts: AMOUNTS })] })

        expect(wrapper.find('.amt output').text()).toBe('2')
        expect(wrapper.find('.pdp__total').text()).toBe(`458,00${NNBSP}€`)
    })

    it('never shows demo stock as sold-out stock in the positive colour', () => {
        const wrapper = mountPage({ demo: true, configs: [config({ inStock: false, stockQty: 0 })] })

        expect(wrapper.find('.pdp__stock').text()).toBe('Beispielbestand · ausverkauft')
        expect(wrapper.find('.pdp__stock').classes()).toContain('tag--unknown')
    })

    it('adds a Traglast row only for a verified load rating', () => {
        const without = mountPage()
        const labels = without.findAll('.spec__row dt').map((dt) => dt.text())
        expect(labels).not.toContain('Traglast')

        const withLoad = mountPage({ configs: [config({ maxLoadKg: 620 })] })
        const row = withLoad.findAll('.spec__row').find((r) => r.find('dt').text() === 'Traglast')

        expect(row).toBeDefined()
        expect(row?.find('dd').text()).toBe(`620${NNBSP}kg`)
    })

    it('names the bore plainly until a car is chosen, and as the rim\'s own once one is', () => {
        const alone = specs(mountPage())

        expect(alone['Mittenlochbohrung']).toBe('66,5 mm')
        expect(alone['Mittenlochbohrung der Felge']).toBeUndefined()
        expect(alone['Mittenlochbohrung für dein Fahrzeug']).toBeUndefined()

        // A verdict that states no bore leaves the rim's figure as the only one — and renames it,
        // so it can never be read as something the document said about this car.
        const chosen = specs(mountPage({ hasVehicle: true, configs: [config({ verdict: verdict() })] }))

        expect(chosen['Mittenlochbohrung der Felge']).toBe('66,5 mm')
        expect(chosen['Mittenlochbohrung']).toBeUndefined()
        expect(chosen['Mittenlochbohrung für dein Fahrzeug']).toBeUndefined()
    })

    it('shows the bore the document states for the chosen car above the rim\'s own, and says which is which', () => {
        const wrapper = mountPage({
            hasVehicle: true,
            configs: [config({ verdict: verdict({ centreBore: '66,6 mm', centreBoreSource: 'DOCUMENT' }) })],
        })
        const rows = specs(wrapper)

        expect(rows['Mittenlochbohrung für dein Fahrzeug']).toBe('66,6 mm')
        expect(rows['Mittenlochbohrung der Felge']).toBe('66,5 mm')

        // The document's figure comes first, is credited to the document, and is marked so a
        // page translator cannot rewrite it.
        const doc = wrapper.find('.spec__row--doc')
        expect(doc.find('.spec__hint').text()).toBe('laut Gutachten')
        expect(doc.find('dd').attributes('translate')).toBe('no')
        expect(wrapper.findAll('.spec__row').indexOf(doc)).toBeLessThan(
            wrapper.findAll('.spec__row').findIndex((r) => r.find('dt').text() === 'Mittenlochbohrung der Felge')
        )
    })

    it('names no bore for the car where the documents disagree, and says so', () => {
        const wrapper = mountPage({
            hasVehicle: true,
            configs: [config({ verdict: verdict({ centreBore: null, centreBoreSource: 'CONFLICTING' }) })],
        })

        expect(wrapper.find('.spec__row--doc').exists()).toBe(false)
        expect(specs(wrapper)['Mittenlochbohrung der Felge']).toBe('66,5 mm')
        expect(wrapper.find('.pdp__specs-note').text()).toContain(
            'Für dein Fahrzeug nennen die Gutachten unterschiedliche Mittenlochbohrungen.'
        )
    })

    it('adds a Hump row only for a record that holds a designation', () => {
        expect(specs(mountPage())['Hump']).toBe('H2')
        expect(specs(mountPage({ configs: [config({ hump: null })] }))['Hump']).toBeUndefined()
        expect(specs(mountPage({ configs: [config({ hump: undefined })] }))['Hump']).toBeUndefined()
    })

    it('fills the details with the rest of what the record holds, and nothing it does not', () => {
        const rows = specs(mountPage({ configs: [config({ weightG: 8_600, maxLoadKg: 620 })] }))

        expect(rows).toMatchObject({
            'Größe': '8,5J × 19 · ET 45',
            'Lochkreis': '5 × 112',
            'Einpresstiefe (ET)': '45\u202fmm',
            'Hump': 'H2',
            'Farbe': 'Light Grey D5',
            'Speichen': '5',
            'Gewicht pro Felge': '8,6\u202fkg',
            'Traglast': `620${NNBSP}kg`,
            'KBA-Nummer': '53810',
            'Artikelnummer': 'MO-MCR4-8519-45',
        })

        // A record that holds no weight, no load rating and no KBA number shows none of the three.
        const bare = specs(mountPage({ configs: [config({ weightG: null, maxLoadKg: null, kbaNumber: null })] }))

        expect(bare['Gewicht pro Felge']).toBeUndefined()
        expect(bare['Traglast']).toBeUndefined()
        expect(bare['KBA-Nummer']).toBeUndefined()
    })

    it('opens the main photograph large in a dialog, and Escape closes it', async () => {
        const wrapper = mountPage()

        const trigger = wrapper.find('button.pdp__zoom')
        expect(trigger.exists()).toBe(true)
        expect(trigger.attributes('aria-haspopup')).toBe('dialog')
        expect(trigger.attributes('aria-label')).toContain('Foto vergrößern')
        expect(document.querySelector('[role="dialog"]')).toBeNull()

        await trigger.trigger('click')
        await flushPromises()

        const dialog = document.querySelector('[role="dialog"]')
        expect(dialog).not.toBeNull()
        expect(dialog?.textContent).toContain('MOTEC MCR4 Ultimate in Light Grey D5')
        expect(dialog?.querySelector('img')?.getAttribute('alt')).toBe('MOTEC MCR4 Ultimate in Light Grey D5, Ansicht von vorn')
        expect(dialog?.querySelector('button[aria-label="Schließen"]')).not.toBeNull()

        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        await nextTick()
        await flushPromises()

        expect(document.querySelector('[role="dialog"]')).toBeNull()
    })

    it('says which size the photograph is of when the size on screen carries another approval', async () => {
        // The Borbet DB8GT2's photographs show KBA 53841 on the wheel: the 18-inch. The 19-inch is ABE 55255.
        const wrapper = mountPage({
            finishes: [{ id: 1, name: 'Schwarz matt', hex: null, artFinish: 'black', image: { ...photo, stamp: '53841' } }],
            configs: [
                config({ id: 12, diameterIn: 19, sizeLabel: '8,5J × 19 · ET 35', kbaNumber: '55255' }),
                config({ id: 11, diameterIn: 18, sizeLabel: '8,5J × 18 · ET 35', kbaNumber: '53841', sku: 'BOR-18' }),
            ],
        })

        const note = () => wrapper.find('.pdp__photo-note')

        await wrapper.findAll('button[aria-pressed]').find((b) => b.text().includes('18'))?.trigger('click')
        expect(note().exists()).toBe(false)

        await wrapper.findAll('button[aria-pressed]').find((b) => b.text().includes('19'))?.trigger('click')
        expect(note().text()).toBe('Abbildung zeigt die 18-Zoll-Ausführung.')
    })

    it('says a struck-through size is not approved only where a document says so (R-07)', () => {
        const note = (status: 'NOT_PERMITTED' | 'UNKNOWN'): string =>
            mountPage({
                hasVehicle: true,
                configs: [config({ id: 12, diameterIn: 19, verdict: verdict({ status, label: status, sellable: false }) }), config({ id: 11, diameterIn: 18, sizeLabel: '8,5J × 18 · ET 45', sku: 'X-18', verdict: verdict() })],
            }).find('.pdp__note').text()

        expect(note('NOT_PERMITTED')).toBe('Durchgestrichene Größen sind für dein Fahrzeug nicht freigegeben.')
        expect(note('UNKNOWN')).toBe('Für durchgestrichene Größen liegt uns für dein Fahrzeug keine Freigabe vor.')
    })

    it('draws the wheel without a zoom when there is no photograph', () => {
        const wrapper = mountPage({ finishes: [{ id: 1, name: 'Silber', hex: null, artFinish: 'silver', image: null }] })

        expect(wrapper.find('button.pdp__zoom').exists()).toBe(false)
    })

    /* ── Nur Felgen | Komplettrad (#18) ──────────────────────────────────────────────── */

    async function chooseSet(wrapper: VueWrapper): Promise<void> {
        await wrapper.find('input[name="pdp-mode"][value="komplettrad"]').setValue()
    }

    it('asks Nur Felgen or Komplettrad, and starts with the rims alone @kunde-18', () => {
        const wrapper = mountPage({ hasVehicle: true, configs: [config({ komplettrad: komplettrad() })] })
        const modes = wrapper.findAll('.bmc-tile')

        expect(wrapper.find('.pdp__mode legend').text()).toBe('Was möchtest du bestellen?')
        expect(modes.map((m) => m.find('.bmc-tile__name').text())).toEqual(['Nur Felgen', 'Kompletträder'])
        expect(modes[1]!.find('.bmc-tile__sub').text()).toMatch(/^Mit Reifen, fertig montiert\s+ab 965,00 € pro Rad$/)
        expect(modes[1]!.find('.bmc-tile__price').text()).toBe('ab 965,00 € pro Rad')
        expect((wrapper.find('input[value="felgen"]').element as HTMLInputElement).checked).toBe(true)
        // No tyre on screen while the rims alone are chosen.
        expect(wrapper.find('.kc').exists()).toBe(false)
        expect(wrapper.find('button.pdp__add').text()).toBe('In den Warenkorb')
    })

    it('shows the permitted tyres with Komplettrad chosen, prices the set and adds the tyre as a set of four @kunde-18', async () => {
        const wrapper = mountPage({ hasVehicle: true, configs: [config({ komplettrad: komplettrad(), amounts: AMOUNTS })] })
        await chooseSet(wrapper)

        const choice = wrapper.find('.kc')
        expect(choice.text()).toContain(MIN_SENTENCE)
        expect(choice.text()).toContain('Potenza Sport')
        expect(choice.find('.kc-row--on').exists()).toBe(true)
        expect(wrapper.find('.pdp__total').text()).toBe('3.860,00 €')
        expect(wrapper.find('.pdp__each').text()).toBe('für 4 Kompletträder, pro Rad 965,00 €, inkl. MwSt., zzgl. Versandkosten')
        // A set is four: no amount stepper beside it.
        expect(wrapper.find('.amt').exists()).toBe(false)

        await wrapper.find('button.pdp__add').trigger('click')

        expect(post).toHaveBeenCalledTimes(1)
        expect(post.mock.calls[0]?.[0]).toBe('/warenkorb')
        expect(forms.find((form) => form.kind === 'WHEEL')).toMatchObject({ wheelConfigId: 11, tyreVariantId: 7, quantity: 4 })
        expect(wrapper.find('button.pdp__add').text()).toBe('Als Komplettrad in den Warenkorb')
    })

    it('keeps the amount of rims when switching to Komplettrad and back, and adds rims without a tyre @kunde-18', async () => {
        const wrapper = mountPage({ hasVehicle: true, configs: [config({ priceCents: 22_900, price: `229,00${NNBSP}€`, komplettrad: komplettrad(), amounts: AMOUNTS })] })

        await wrapper.find('button[aria-label="Anzahl verringern"]').trigger('click')
        await wrapper.find('button[aria-label="Anzahl verringern"]').trigger('click')
        await chooseSet(wrapper)
        await wrapper.find('input[name="pdp-mode"][value="felgen"]').setValue()

        expect(wrapper.find('.amt output').text()).toBe('2')
        expect(wrapper.find('.pdp__total').text()).toBe(`458,00${NNBSP}€`)

        await wrapper.find('button.pdp__add').trigger('click')
        expect(forms.find((form) => form.kind === 'WHEEL')).toMatchObject({ tyreVariantId: null, quantity: 2 })
    })

    it('shows a refusal with a route forward instead of an empty Komplettrad choice, and adds nothing @kunde-25 @kunde-18', async () => {
        const sentence =
            'Für ein Komplettrad brauchen wir zuerst dein Fahrzeug – erst dann wissen wir, welche Reifengrößen für dich freigegeben sind.'
        const wrapper = mountPage({
            configs: [config({ komplettrad: komplettrad({ refusal: sentence, refusalCode: 'NO_VEHICLE', minSentence: null, tyres: [] }) })],
        })
        await chooseSet(wrapper)

        expect(wrapper.find('.kc__refusal').text()).toContain(sentence)
        expect(wrapper.find('.kc__refusal a[href="/felgen-suchen"]').text()).toBe('Fahrzeug wählen')
        expect(wrapper.find('button.pdp__add').text()).toBe('Komplettrad gerade nicht möglich')
        expect(wrapper.find('button.pdp__add').attributes('disabled')).toBeDefined()
        // No link that only pointed at the page's own button (#25).
        expect(wrapper.text()).not.toContain('Nur die Felgen bestellen')
    })

    it('sends the colour and the RDKS answer with a Komplettrad, prices the colour picked, and sends neither with rims (#15) @kunde-15', async () => {
        const priced = komplettrad({
            tyres: [
                {
                    ...komplettrad().tyres[0]!,
                    prices: [
                        { colourId: 1, perWheel: '965,00 €', forFourCents: 386_000, forFour: '3.860,00 €' },
                        { colourId: 2, perWheel: '970,00 €', forFourCents: 388_000, forFour: '3.880,00 €' },
                    ],
                },
            ],
        })
        const wrapper = mountPage({
            hasVehicle: true,
            configs: [config({ komplettrad: priced, amounts: AMOUNTS })],
            komplettradOptions: {
                colours: [
                    { id: 1, name: 'Silber', swatchHex: null, surchargeCents: 0, surcharge: '0,00 €', isDefault: true },
                    { id: 2, name: 'Schwarz', swatchHex: null, surchargeCents: 500, surcharge: '5,00 €', isDefault: false },
                ],
                tpms: {
                    applicable: true, quantity: 4, available: true, makeLabel: 'BMW', unitPriceCents: 4_900, unitPrice: '49,00 €',
                    line: '4 × 49,00 €', choice: null, totalCents: 0, total: '0,00 €', yesTotal: '196,00 €', notice: null,
                },
            },
        })

        // Under „Nur Felgen“ nothing of it is on screen, and nothing of it is sent.
        expect(wrapper.find('.kc__group').exists()).toBe(false)
        await wrapper.find('button.pdp__add').trigger('click')
        expect(forms.find((f) => f.kind === 'WHEEL')).toMatchObject({ tyreVariantId: null, weightColourId: null, rdks: null })

        await chooseSet(wrapper)
        await wrapper.find('input[name="kc-weights"][value="2"]').setValue()
        await wrapper.find('input[name="kc-rdks"][value="ja"]').setValue()

        expect(wrapper.find('.pdp__total').text()).toBe('3.880,00 €')
        expect(wrapper.find('.pdp__each').text()).toContain('pro Rad 970,00 €')
        expect(wrapper.find('.pdp__sensors').text()).toBe('+ 196,00 € für 4 RDKS-Sensoren')

        await wrapper.find('button.pdp__add').trigger('click')
        expect(forms.find((f) => f.kind === 'WHEEL')).toMatchObject({ tyreVariantId: 7, weightColourId: 2, rdks: 'ja', quantity: 4 })
    })

    it('starts another choice clean: a refusal of the last add goes with the mode it was made under', async () => {
        const wrapper = mountPage({ hasVehicle: true, configs: [config({ komplettrad: komplettrad() })] })
        const form = forms.find((f) => f.kind === 'WHEEL')

        ;(form?.errors as Record<string, string>).tyreVariantId = 'Diesen Reifen haben wir gerade nicht in der benötigten Menge auf Lager.'
        await nextTick()
        expect(wrapper.find('.pdp__add-error').exists()).toBe(true)

        await chooseSet(wrapper)
        expect(wrapper.find('.pdp__add-error').exists()).toBe(false)
    })

    it('starts another amount clean too: a refusal about the shelf was about the amount it was made with (PDP-09)', async () => {
        const wrapper = mountPage({ configs: [config({ stockQty: 12, amounts: AMOUNTS })] })
        const form = forms.find((f) => f.kind === 'WHEEL')

        ;(form?.errors as Record<string, string>).wheelConfigId = 'Von dieser Felge haben wir 12 Stück auf Lager, davon hast du schon 12 im Warenkorb.'
        await nextTick()
        expect(wrapper.find('.pdp__add-error').exists()).toBe(true)

        await wrapper.find('button[aria-label="Anzahl verringern"]').trigger('click')
        expect(wrapper.find('.pdp__add-error').exists()).toBe(false)
    })

    it('keeps the stock line where a Komplettrad has no price to show', async () => {
        const wrapper = mountPage({
            configs: [config({ komplettrad: komplettrad({ refusal: 'Ein Satz.', refusalCode: 'NO_TYRE_AVAILABLE', tyres: [] }) })],
        })
        await chooseSet(wrapper)

        expect(wrapper.find('.pdp__total').exists()).toBe(false)
        expect(wrapper.find('.pdp__stock').text()).toBe('Auf Lager')
    })

    it('prints the server\'s refusal of an add under the button', async () => {
        const wrapper = mountPage()
        const form = forms.find((f) => f.kind === 'WHEEL')

        ;(form?.errors as Record<string, string>).tyreVariantId = 'Diesen Reifen haben wir gerade nicht in der benötigten Menge auf Lager.'
        await nextTick()

        expect(wrapper.find('.pdp__add-error').attributes('role')).toBe('alert')
        expect(wrapper.find('.pdp__add-error').text()).toBe('Diesen Reifen haben wir gerade nicht in der benötigten Menge auf Lager.')
    })
})
