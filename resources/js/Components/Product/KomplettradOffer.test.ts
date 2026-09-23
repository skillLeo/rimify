import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import type { KomplettradOfferProp, KomplettradTyreProp } from '../../types/pages'

/*
 * docs/specs/komplettrad.md §4.11 and §9.3: the offer prints what the server decided — the tyres,
 * the minimum sentence, the prices — and posts an id with the set quantity. A refusal is one
 * sentence with a route forward, never an empty panel and never a dead end. Nothing here
 * multiplies cents or judges a tyre.
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

const { default: KomplettradOffer } = await import('./KomplettradOffer.vue')

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
    return {
        refusal: null,
        refusalCode: null,
        minSentence: MIN_SENTENCE,
        priceOpen: false,
        quantity: 4,
        tyres: [tyre()],
        ...overrides,
    }
}

function refused(code: KomplettradOfferProp['refusalCode'], sentence: string): KomplettradOfferProp {
    return offer({ refusal: sentence, refusalCode: code, minSentence: null, tyres: [] })
}

let wrappers: VueWrapper[] = []

function mountOffer(
    props: Partial<{ offer: KomplettradOfferProp | null; wheelConfigId: number | null; contactEmail: string }> = {}
): VueWrapper {
    const wrapper = mount(KomplettradOffer, {
        props: { offer: offer(), wheelConfigId: 11, contactEmail: 'hallo@beispiel.de', ...props },
    })
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
})

describe('KomplettradOffer', () => {
    it('prints each permitted tyre with the figures the server sent and posts it as a set of four', async () => {
        const wrapper = mountOffer({ offer: offer({ tyres: [tyre(), tyre({ id: 8, name: 'PremiumContact 7', brandName: 'Continental' })] }) })
        const text = wrapper.text()

        expect(text).toContain('Komplettrad – Felge mit Reifen, montiert und gewuchtet')
        expect(text).toContain('Die Farbe der Wuchtgewichte wählst du im Warenkorb.')
        expect(text).toContain(MIN_SENTENCE)
        expect(text).toContain('Bridgestone')
        expect(text).toContain('Potenza Sport')
        expect(text).toContain('Sommerreifen')
        expect(text).toContain('245/45 R18 100Y')
        expect(text).toContain('965,00 €')
        expect(text).toContain('Preis je Rad, inklusive Reifen, Montage und Wuchtgewichten.')
        expect(text).toContain('inkl. MwSt., zzgl. Versand')
        expect(text).toContain('3.860,00 €')
        expect(text).not.toContain('steht noch nicht fest')

        const buttons = wrapper.findAll('button.kr-card__add')
        expect(buttons).toHaveLength(2)
        expect(buttons[0]?.text()).toBe('Als Komplettrad in den Warenkorb')

        await buttons[1]?.trigger('click')

        expect(post).toHaveBeenCalledTimes(1)
        expect(post.mock.calls[0]?.[0]).toBe('/warenkorb')
        expect(forms[0]).toMatchObject({ kind: 'WHEEL', wheelConfigId: 11, tyreVariantId: 8, quantity: 4 })
    })

    it('never posts without a configuration to attach the tyre to', async () => {
        const wrapper = mountOffer({ wheelConfigId: null })
        const button = wrapper.find('button.kr-card__add')

        expect(button.attributes('disabled')).toBeDefined()

        await button.trigger('click')

        expect(post).not.toHaveBeenCalled()
    })

    it('answers a missing vehicle with the sentence and the selector, never an empty panel', () => {
        const sentence =
            'Für ein Komplettrad brauchen wir zuerst dein Fahrzeug – erst dann wissen wir, welche Reifengrößen für dich freigegeben sind.'
        const wrapper = mountOffer({ offer: refused('NO_VEHICLE', sentence) })

        expect(wrapper.find('.kr__refusal').text()).toContain(sentence)
        expect(wrapper.find('.kr__refusal a[href="/felgen-suchen"]').text()).toBe('Fahrzeug wählen')
        expect(wrapper.find('.kr__wheels-only').exists()).toBe(true)
        expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
        expect(wrapper.find('button.kr-card__add').exists()).toBe(false)
        expect(wrapper.find('.kr-card').exists()).toBe(false)
    })

    it('offers the shop e-mail from the shared contact when a person has to look at it', () => {
        const sentence =
            'Zu dieser Felge liegt uns für dein Fahrzeug kein Gutachten vor. Ein Komplettrad können wir dir deshalb nicht anbieten – schreib uns, dann prüfen wir das für dich.'
        const wrapper = mountOffer({ offer: refused('VERDICT_UNKNOWN', sentence) })

        expect(wrapper.find('.kr__refusal').text()).toContain(sentence)
        expect(wrapper.find('.kr__refusal a[href="mailto:hallo@beispiel.de"]').text()).toBe('Schreib uns')
        expect(wrapper.find('a[href="/felgen-suchen"]').exists()).toBe(false)
        expect(wrapper.find('.kr__wheels-only').exists()).toBe(true)
    })

    it('does not offer the rim alone when the document forbids the wheel itself', () => {
        const sentence = 'Diese Felge ist für dein Fahrzeug nicht freigegeben. Ein Komplettrad können wir dir dazu deshalb nicht anbieten.'
        const wrapper = mountOffer({ offer: refused('VERDICT_NOT_PERMITTED', sentence) })

        expect(wrapper.find('.kr__refusal').text()).toContain(sentence)
        expect(wrapper.find('.kr__wheels-only').exists()).toBe(false)
        expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(true)
    })

    it('keeps the minimum sentence beside a refusal that still knows it', () => {
        const wrapper = mountOffer({
            offer: offer({
                refusal: 'Passende Reifen für diese Größe haben wir gerade nicht vorrätig. Die Felge allein kannst du bestellen.',
                refusalCode: 'NO_TYRE_AVAILABLE',
                tyres: [],
            }),
        })

        expect(wrapper.find('.kr__min').text()).toBe(MIN_SENTENCE)
        expect(wrapper.find('.kr__wheels-only').exists()).toBe(true)
    })

    it('says so when the mounting fee is still open, and only then', () => {
        expect(mountOffer({ offer: offer({ priceOpen: true }) }).text()).toContain(
            'Der Preis für Montage und Auswuchten steht noch nicht fest.'
        )
        expect(mountOffer().text()).not.toContain('Der Preis für Montage und Auswuchten steht noch nicht fest.')
    })

    it('shows the EU label only for a tyre that carries a complete, valid one', () => {
        const withLabel = mountOffer({
            offer: offer({
                tyres: [tyre({ label: { fuel: 'B', wetGrip: 'A', noiseDb: 71, noiseClass: 'B', eprelId: '123456' } })],
            }),
        })
        expect(withLabel.text()).toContain('Kraftstoffeffizienz')
        expect(withLabel.find('a[href="https://eprel.ec.europa.eu/qr/123456"]').exists()).toBe(true)

        const broken = mountOffer({
            offer: offer({
                tyres: [tyre({ label: { fuel: 'Z', wetGrip: 'A', noiseDb: 71, noiseClass: 'B', eprelId: '123456' } })],
            }),
        })
        expect(broken.text()).not.toContain('Kraftstoffeffizienz')

        expect(mountOffer().text()).not.toContain('Kraftstoffeffizienz')
    })

    it('prints the server\'s refusal of an add as an alert', async () => {
        const wrapper = mountOffer()
        const form = forms[0]

        expect(wrapper.find('[role="alert"]').exists()).toBe(false)

        ;(form?.errors as Record<string, string>).tyreVariantId = 'Diesen Reifen haben wir gerade nicht in der benötigten Menge auf Lager.'
        await nextTick()

        expect(wrapper.find('[role="alert"]').text()).toBe('Diesen Reifen haben wir gerade nicht in der benötigten Menge auf Lager.')
    })

    it('still says something and offers the Felgen if the server sent neither tyres nor a sentence', () => {
        const wrapper = mountOffer({ offer: offer({ tyres: [] }) })

        expect(wrapper.find('.kr__refusal').text()).toContain('Passende Reifen für diese Größe haben wir gerade nicht vorrätig.')
        expect(wrapper.find('.kr__wheels-only').exists()).toBe(true)
    })

    it('renders nothing at all without an offer', () => {
        expect(mountOffer({ offer: null }).find('.kr').exists()).toBe(false)
    })
})
