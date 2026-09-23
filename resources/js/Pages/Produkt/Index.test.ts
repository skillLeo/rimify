import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { NNBSP } from '../../format'
import type { ImageManifest } from '../../Components/Ui/Picture.vue'
import type { ConfigVerdict, KomplettradOfferProp, ProduktConfig, ProduktProps } from '../../types/pages'

/*
 * The product page's own states (ACCURACY.md D4, finding #48/#59): a demo model shows
 * "Beispielbestand" and says it cannot be ordered yet, while its basket button stays usable; a
 * verified load rating adds a "Traglast" row; the main photograph opens large in a dialog that
 * Escape closes; and the selected size is offered as a Komplettrad — the tyres the server sent,
 * or one sentence with a route forward (docs/specs/komplettrad.md §9.3).
 */

const post = vi.fn()
let forms: Array<Record<string, unknown>> = []

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
    it('says "Auf Lager" for a real model in stock, and nothing about a demo range', () => {
        const wrapper = mountPage()

        expect(wrapper.find('.pdp__stock').text()).toBe('Auf Lager')
        expect(wrapper.find('.pdp__stock').classes()).toContain('tag--ok')
        expect(wrapper.find('.pdp__demo').exists()).toBe(false)
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
            'Einpresstiefe (ET)': '45 mm',
            'Hump': 'H2',
            'Farbe': 'Light Grey D5',
            'Speichen': '5',
            'Gewicht pro Felge': '8,6 kg',
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

    it('draws the wheel without a zoom when there is no photograph', () => {
        const wrapper = mountPage({ finishes: [{ id: 1, name: 'Silber', hex: null, artFinish: 'silver', image: null }] })

        expect(wrapper.find('button.pdp__zoom').exists()).toBe(false)
    })

    it('shows no Komplettrad section for a fixture that carries no offer', () => {
        expect(mountPage().find('.kr').exists()).toBe(false)
    })

    it('offers the selected size as a Komplettrad and posts the tyre with the configuration as a set of four', async () => {
        const wrapper = mountPage({ hasVehicle: true, configs: [config({ komplettrad: komplettrad() })] })
        const section = wrapper.find('.kr')

        expect(section.exists()).toBe(true)
        expect(section.text()).toContain('Komplettrad – Felge mit Reifen, montiert und gewuchtet')
        expect(section.text()).toContain(MIN_SENTENCE)
        expect(section.text()).toContain('Potenza Sport')
        expect(section.text()).toContain('965,00 €')
        expect(section.text()).toContain('3.860,00 €')

        await section.find('button.kr-card__add').trigger('click')

        expect(post).toHaveBeenCalledTimes(1)
        expect(post.mock.calls[0]?.[0]).toBe('/warenkorb')
        expect(forms.find((form) => 'tyreVariantId' in form)).toMatchObject({
            kind: 'WHEEL',
            wheelConfigId: 11,
            tyreVariantId: 7,
            quantity: 4,
        })
    })

    it('shows a refusal with a route forward instead of an empty Komplettrad panel', () => {
        const sentence =
            'Für ein Komplettrad brauchen wir zuerst dein Fahrzeug – erst dann wissen wir, welche Reifengrößen für dich freigegeben sind.'
        const wrapper = mountPage({
            configs: [config({ komplettrad: komplettrad({ refusal: sentence, refusalCode: 'NO_VEHICLE', minSentence: null, tyres: [] }) })],
        })

        expect(wrapper.find('.kr__refusal').text()).toContain(sentence)
        expect(wrapper.find('.kr__refusal a[href="/felgen-suchen"]').text()).toBe('Fahrzeug wählen')
        expect(wrapper.find('.kr a[href="#felgen-kaufen"]').exists()).toBe(true)
        expect(wrapper.find('#felgen-kaufen button.pdp__add').exists()).toBe(true)
        expect(wrapper.find('button.kr-card__add').exists()).toBe(false)
    })
})
