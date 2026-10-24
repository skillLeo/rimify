import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { MischbereifungPairProp, MischbereifungProp } from '../../types/pages'

/*
 * #20 Mischbereifung (D-105): the component prints what the server decided — the pairs the document's table lists,
 * the per-axle minimum, the sets and their prices, the document's own conditions — and posts the front and the rear
 * tyre with the wheels per axle. Nothing here pairs sizes, judges a tyre or multiplies cents.
 */

const post = vi.fn()
let forms: Array<Record<string, unknown>> = []

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
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

const { default: MischbereifungOffer } = await import('./MischbereifungOffer.vue')

const RULES =
    'Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig, für die der Reifen- oder Fahrzeughersteller die Eignung für das jeweilige Fahrzeug bestätigt. Diese Bestätigung ist vom Führer des Fahrzeugs mitzuführen.'

function pair(overrides: Partial<MischbereifungPairProp> = {}): MischbereifungPairProp {
    return {
        key: '235/45/19|255/40/19',
        number: 8,
        front: '235/45 R19',
        rear: '255/40 R19',
        minSentence: 'Bei Mischbereifung prüfen wir jede Achse mit ihrer eigenen Achslast: vorne mindestens Tragfähigkeitsindex 95, hinten mindestens 99. Mehr verlangt die Hinterachse.',
        sets: [
            {
                key: '11-12',
                frontTyreId: 11,
                rearTyreId: 12,
                brandName: 'Bridgestone',
                name: 'Potenza Sport',
                seasonLabel: 'Sommerreifen',
                frontLabel: '235/45 R19 95Y',
                rearLabel: '255/40 R19 99Y',
                perWheelFront: '465,00 €',
                perWheelRear: '495,00 €',
                forFourCents: 192_000,
                forFour: '1.920,00 €',
                isDemo: false,
            },
        ],
        ...overrides,
    }
}

function offer(overrides: Partial<MischbereifungProp> = {}): MischbereifungProp {
    return { refusal: null, refusalCode: null, perAxle: 2, rules: RULES, sourcePage: 12, priceOpen: false, pairs: [pair()], ...overrides }
}

let wrappers: VueWrapper[] = []

function mountOffer(props: Partial<{ offer: MischbereifungProp; wheelConfigId: number | null }> = {}): VueWrapper {
    const wrapper = mount(MischbereifungOffer, {
        props: { offer: offer(), wheelConfigId: 884, ...props },
        global: { stubs: { Icon: true } },
    })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    post.mockReset()
    forms = []
})

afterEach(() => {
    wrappers.forEach((wrapper) => wrapper.unmount())
    wrappers = []
})

describe('MischbereifungOffer', () => {
    it('prints the pair, its table entry and page, the per-axle minimum and the server’s price for 2 + 2', () => {
        const text = mountOffer().text()

        expect(text).toContain('vorne 235/45 R19')
        expect(text).toContain('hinten 255/40 R19')
        expect(text).toContain('Kombination Nr. 8 im Gutachten, Seite 12')
        expect(text).toContain('Mehr verlangt die Hinterachse.')
        expect(text).toContain('235/45 R19 95Y')
        expect(text).toContain('255/40 R19 99Y')
        expect(text).toContain('1.920,00 €')
        expect(text).toContain('für 2 + 2 Kompletträder')
    })

    it('quotes the document’s own conditions, never a paraphrase', () => {
        expect(mountOffer().find('.mix__quote').text()).toBe(RULES)
    })

    // D-336: V19 asks one profile type on each axle only, so a set may carry two lines of one maker — the card names both.
    it('names each axle’s tyre where the set carries two lines — never one name for two tyres', () => {
        const [set] = pair().sets
        const card = mountOffer({ offer: offer({ pairs: [pair({ sets: [{ ...set!, rearBrandName: 'Bridgestone', rearName: 'Turanza 6' }] })] }) }).find('.mix-card')

        expect(card.find('.micro').text()).toBe('Bridgestone')
        expect(card.find('.mix-card__name').text()).toBe('vorne Potenza Sport · hinten Turanza 6')

        // One line on both axles: its name, as before.
        expect(mountOffer().find('.mix-card__name').text()).toBe('Potenza Sport')
    })

    it('names each its own page where a recorded list stands beside an Auflage’s table (D-256): the pairs the list’s, the rules the Auflage’s', () => {
        const wrapper = mountOffer({ offer: offer({ sourcePage: 4, rulesPage: 12, pairs: [pair({ number: 2 })] }) })

        expect(wrapper.text()).toContain('Kombination Nr. 2 im Gutachten, Seite 4')
        expect(wrapper.find('.mix__rules figcaption').text()).toBe('Dazu verlangt das Gutachten (Seite 12)')
    })

    it('posts the front and the rear tyre with the wheels per axle', async () => {
        await mountOffer().find('.mix-card__add').trigger('click')

        expect(post).toHaveBeenCalledWith('/warenkorb', { preserveScroll: true })
        expect(forms[0]).toMatchObject({ kind: 'WHEEL', wheelConfigId: 884, tyreVariantId: 11, rearTyreVariantId: 12, quantity: 2 })
    })

    it('shows the set’s price in the Wuchtgewichte colour picked above it — what the basket charges (PDP-07)', () => {
        const coloured = pair({
            sets: [
                {
                    ...pair().sets[0]!,
                    prices: [
                        { colourId: 1, perWheelFront: '465,00 €', perWheelRear: '495,00 €', forFourCents: 192_000, forFour: '1.920,00 €' },
                        { colourId: 2, perWheelFront: '470,00 €', perWheelRear: '500,00 €', forFourCents: 194_000, forFour: '1.940,00 €' },
                    ],
                },
            ],
        })
        const wrapper = mount(MischbereifungOffer, {
            props: { offer: offer({ pairs: [coloured] }), wheelConfigId: 884, weightColourId: 2 },
            global: { stubs: { Icon: true } },
        })
        wrappers.push(wrapper)

        expect(wrapper.find('.mix-card__price .price').text()).toBe('1.940,00 €')
        expect(wrapper.text()).toContain('pro Rad vorne 470,00 €, hinten 500,00 €')
    })

    it('lets the customer choose between several pairs, and shows only the chosen pair’s sets', async () => {
        const second = pair({ key: '245/40/19|275/35/19', number: 13, front: '245/40 R19', rear: '275/35 R19', sets: [] })
        const wrapper = mountOffer({ offer: offer({ pairs: [pair(), second] }) })
        const chips = wrapper.findAll('.chip')

        expect(chips).toHaveLength(2)
        expect(chips[0]?.attributes('aria-pressed')).toBe('true')

        await chips[1]?.trigger('click')

        expect(wrapper.text()).toContain('Kombination Nr. 13')
        expect(wrapper.find('.mix-card').exists()).toBe(false)
        expect(wrapper.text()).toContain('Reifen für diese Kombination können wir dir gerade nicht anbieten.')
    })

    it('shows the server’s sentence instead of pairs when it refuses, and offers nothing to click', () => {
        const wrapper = mountOffer({
            offer: offer({
                refusal: 'Für dein Fahrzeug fehlen uns Achslast oder Höchstgeschwindigkeit.',
                refusalCode: 'NO_USABLE_MINIMUM',
                pairs: [],
            }),
        })

        expect(wrapper.text()).toContain('Für dein Fahrzeug fehlen uns Achslast oder Höchstgeschwindigkeit.')
        expect(wrapper.find('.mix-card__add').exists()).toBe(false)
    })
})
