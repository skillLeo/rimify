import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { NNBSP } from '../../format'
import type { ImageManifest } from '../../Components/Ui/Picture.vue'
import type { KomplettradOfferProp, ProduktConfig, ProduktProps } from '../../types/pages'

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
        fullLabel: '8,5J × 19 · ET 45 · LK 5 × 112 · 66,6 mm',
        boltPattern: '5 × 112',
        centreBore: '66,6 mm',
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
