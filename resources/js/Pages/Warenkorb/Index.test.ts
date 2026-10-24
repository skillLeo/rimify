import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { BasketLine, BasketTotals } from '../../types/rimify'

/*
 * The basket (ACCURACY.md D4, D7; findings #38, #39): no carrier, shipping named and left out of
 * the total while no price is configured, a demo line marked, and the way to the Kasse left open
 * so the flow can be reviewed.
 */

vi.mock('@inertiajs/vue3', () => ({
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    usePage: () => ({ props: { vehicle: null } }),
    router: { patch: () => undefined, delete: () => undefined },
}))

const { default: Warenkorb } = await import('./Index.vue')

type Line = BasketLine & { demo?: boolean }
type Totals = BasketTotals & { shippingConfigured?: boolean }

function line(overrides: Partial<Line> = {}): Line {
    return {
        key: 'wheel:11',
        kind: 'WHEEL',
        title: 'MCR4 Ultimate',
        subtitle: 'Light Grey D5',
        brandName: 'MOTEC',
        sizeLabel: '8,5J × 19 · ET 45',
        art: { kind: 'wheel', finish: 'silver', spokes: 5 },
        quantity: 4,
        unitPrice: '199,00 €',
        lineTotal: '796,00 €',
        lineTotalCents: 79_600,
        inStock: true,
        slug: 'motec-mcr4-ultimate',
        demo: true,
        verdict: null,
        ...overrides,
    }
}

function totals(overrides: Partial<Totals> = {}): Totals {
    return {
        subtotal: '796,00 €',
        shipping: 'wird noch festgelegt',
        shippingCents: 0,
        freeShipping: false,
        tax: '127,09 €',
        total: '796,00 €',
        totalCents: 79_600,
        count: 4,
        shippingConfigured: false,
        ...overrides,
    }
}

let wrappers: VueWrapper[] = []

function mountBasket(props: { lines?: Line[]; totals?: Totals } = {}): VueWrapper {
    const wrapper = mount(Warenkorb, { props: { lines: props.lines ?? [line()], totals: props.totals ?? totals() } })
    wrappers.push(wrapper)

    return wrapper
}

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
})

describe('Warenkorb', () => {
    it('names no carrier and leaves unconfigured shipping out of the total', () => {
        const wrapper = mountBasket()

        expect(wrapper.text()).not.toContain('DHL')
        expect(wrapper.find('.sum__open').text()).toBe('wird noch festgelegt')
        expect(wrapper.text()).toContain('Versandkosten werden noch festgelegt')
        expect(wrapper.text()).not.toContain('MwSt. und Versand')
    })

    it('prices shipping once a price is configured', () => {
        const wrapper = mountBasket({
            lines: [line({ demo: false })],
            totals: totals({ shippingConfigured: true, shipping: '9,90 €', shippingCents: 990, total: '805,90 €' }),
        })

        expect(wrapper.find('.sum__open').exists()).toBe(false)
        expect(wrapper.find('.sum').text()).toContain('9,90 €')
        expect(wrapper.text()).toContain('MwSt. und Versand')
        expect(wrapper.find('.cart__demo').exists()).toBe(false)
    })

    it('marks a demo line, says it cannot be ordered yet, and keeps the way to the Kasse open', () => {
        const wrapper = mountBasket()

        expect(wrapper.find('.bl__flags').text()).toContain('Beispielsortiment')
        expect(wrapper.find('.cart__demo').text()).toContain('bestellen kannst du sie noch nicht')

        const go = wrapper.find('a.cart__go')
        expect(go.exists()).toBe(true)
        expect(go.attributes('href')).toBe('/kasse')
    })

    // D-289 and R-17: a rim sold alone says the sizes it may only be fitted with in the open, in our words — never folded
    // away, never counted among the Auflagen from the document.
    it('says the rim-alone sentence in the open, apart from the Auflagen from the document', () => {
        const note = 'Die Felge ist für dein Fahrzeug nur mit Reifen der Größe 235/45 R19 zulässig. Welche Reifen dein Fahrzeug genau braucht, konnten wir nicht bestätigen: Bei der Prüfung fehlte uns Feld T deiner Zulassungsbescheinigung Teil I.'
        const wrapper = mountBasket({
            lines: [line({
                demo: false,
                verdict: {
                    status: 'CONDITIONAL', label: 'Freigegeben mit Auflagen', sellable: true, requiresEntry: false,
                    conditions: ['Nur mit den angegebenen Radschrauben zulässig.'],
                    sentence: 'Für dein Fahrzeug freigegeben, nur mit einer der zulässigen Reifengrößen und mit 1 Auflage.',
                    rimAloneNote: note,
                },
            })],
        })

        expect(wrapper.find('[data-rim-alone]').text()).toBe(note)
        expect(wrapper.find('[data-auflagen]').text()).not.toContain('Die Felge ist für dein Fahrzeug nur')
        expect(wrapper.find('[data-auflagen]').text()).toContain('Nur mit den angegebenen Radschrauben zulässig.')
    })

    // D-335: a set per axle is 2 + 2 — its amount said, never stepped — and a combination of the Gutachten says so.
    it('says a combination\'s amount as fixed, with no stepper, and names the combination @admin-208', () => {
        const mixed = {
            setKey: 'wheel:11:tyre:7:rear:8', axle: 'FRONT' as const, axleLabel: 'Vorderachse', size: '225/40 R18', partnerSize: '245/35 R18',
            pairing: 2, listed: true, combinationId: 702, fixed: true, frontTyreId: 7, rearTyreId: 8, sourcePage: 5, rulesDe: null,
            minLoadIndex: 84, minSpeedSymbol: 'W', axleLoadKg: 880, bindingAxle: 'REAR' as const, minimumSentence: null,
        }
        const wrapper = mountBasket({
            lines: [
                line({ key: 'wheel:11:tyre:7:rear:8:axle:FRONT', demo: false, quantity: 2, isSet: true, mixed }),
                line({ key: 'wheel:11:tyre:7:rear:8:axle:REAR', demo: false, quantity: 2, isSet: true, mixed: { ...mixed, axle: 'REAR', axleLabel: 'Hinterachse', size: '245/35 R18', partnerSize: '225/40 R18' } }),
            ],
        })

        expect(wrapper.find('.bl__stepper').exists()).toBe(false)
        expect(wrapper.findAll('[data-fixed]').map((f) => f.text())).toEqual(['2 Stück', '2 Stück'])

        // Each line names its partner; what holds for the whole set is said once, under its second line — one block.
        const [front, rear] = wrapper.findAll('.bl__mixed')
        expect(front!.text()).toContain('Kombination Nr. 2 aus dem Gutachten – zusammen mit 245/35 R18 auf der Hinterachse.')
        expect(front!.text()).not.toContain('Zwei Kompletträder je Achse')
        expect(rear!.text()).toContain('zusammen mit 225/40 R18 auf der Vorderachse.')
        expect(rear!.text()).toContain('Zwei Kompletträder je Achse, die Anzahl ist fest. Mit „Entfernen“ nimmst du alle vier Räder aus dem Warenkorb.')
        expect(wrapper.findAll('.bl__line')[1]!.classes()).toContain('bl__line--set-rear')
    })

    // D-335: a set per axle is removed, loses its tyres and takes its Wuchtgewichte colour as one — so each is asked once,
    // under its second line beside the sentence that says so, and the tyres' removal names both axles.
    it('asks a set\'s Wuchtgewichte and offers its removals once, under its second line @admin-208', () => {
        const mixed = {
            setKey: 'wheel:11:tyre:7:rear:8', axle: 'FRONT' as const, axleLabel: 'Vorderachse', size: '225/40 R18', partnerSize: '245/35 R18',
            pairing: 2, listed: true, combinationId: 702, fixed: true, frontTyreId: 7, rearTyreId: 8, sourcePage: 5, rulesDe: null,
            minLoadIndex: 84, minSpeedSymbol: 'W', axleLoadKg: 880, bindingAxle: 'REAR' as const, minimumSentence: null,
        }
        const parts = {
            components: [
                { key: 'rim', label: 'Felge', quantity: 2, unitPrice: '379,00 €', lineTotal: '758,00 €', open: false },
                { key: 'tyre', label: 'Reifen', quantity: 2, unitPrice: '129,90 €', lineTotal: '259,80 €', open: false },
            ],
            weightOptions: [
                { id: 1, name: 'Silber', swatchHex: '#c0c0c0', surcharge: '0,00 €', surchargeCents: 0 },
                { id: 2, name: 'Schwarz', swatchHex: '#111111', surcharge: '0,00 €', surchargeCents: 0 },
            ],
            weights: { colourId: 1 },
        } as unknown as Partial<Line>
        const wrapper = mountBasket({
            lines: [
                line({ key: 'wheel:11:tyre:7:rear:8:axle:FRONT', demo: false, quantity: 2, isSet: true, mixed, ...parts }),
                line({ key: 'wheel:11:tyre:7:rear:8:axle:REAR', demo: false, quantity: 2, isSet: true, mixed: { ...mixed, axle: 'REAR', axleLabel: 'Hinterachse', size: '245/35 R18', partnerSize: '225/40 R18' }, ...parts }),
                // A Komplettrad of four keeps its own.
                line({ key: 'wheel:12:tyre:9', demo: false, quantity: 4, isSet: true, ...parts }),
            ],
        })
        const [front, rear, four] = wrapper.findAll('.bl__line')

        // Both lines still itemise their own parts; the choice and the actions stand once, on the second.
        expect(front!.find('.bl__parts').exists()).toBe(true)
        expect(front!.find('.bl__weights').exists()).toBe(false)
        expect(front!.find('.bl__actions').exists()).toBe(false)
        expect(rear!.find('.bl__weights').exists()).toBe(true)
        expect(rear!.find('.bl__remove').text()).toBe('Entfernen')
        expect(rear!.find('.bl__remove-tyre').text()).toBe('Reifen beider Achsen entfernen')
        expect(four!.find('.bl__weights').exists()).toBe(true)
        expect(four!.find('.bl__remove-tyre').text()).toBe('Reifen entfernen')
        expect(wrapper.findAll('.bl__weights')).toHaveLength(2)
    })
})
