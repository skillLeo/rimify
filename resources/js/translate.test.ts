/*
 * The translation guard.
 *
 * Chrome's page translation reads a figure as a word: "5,5 J" became "5.5 years" and "Zoll"
 * becomes "Customs". A wheel that says 8,5J × 19 · ET 45 on our page and something else in a
 * translated tab is the kind of confidently wrong answer CLAUDE.md §2 forbids, so every element
 * that prints a technical value, a unit, a token (ET · LK · MLB · KBA), a tyre size with its load
 * index and speed symbol, or a brand, model or finish name carries `translate="no"`.
 *
 * The German prose around those values does not: a sentence, a heading, a label, an Auflage and
 * the note behind a greyed size stay translatable. `Components/Ui/ValueText.vue` is the one place
 * that carries the attribute wherever a value sits inside a line of prose.
 *
 * The roster at the foot lists every component that must keep the guard, so a new one cannot
 * quietly drop it.
 */

import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { euro, felgen, NNBSP } from './format'
import type { Brand } from './Components/Home/brandWall'
import type { ProductCardProp, VehicleProp } from './types/rimify'

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const { default: ValueText } = await import('./Components/Ui/ValueText.vue')
const { default: SpecCallout } = await import('./Components/Ui/SpecCallout.vue')
const { default: RimCode } = await import('./Components/Home/RimCode.vue')
const { default: RimCodePhoto } = await import('./Components/Home/RimCodePhoto.vue')
const { default: ProductTile } = await import('./Components/Ui/ProductTile.vue')
const { default: BrandWall } = await import('./Components/Home/BrandWall.vue')
const { photoFrame, photoShape, rimTokens } = await import('./Components/Home/rimCode')
const { FACTS, MANIFEST, PRODUCT } = await import('./Components/Home/rimCode.fixtures')

/* ── Reading the attribute the way a browser does ───────────────────────────────── */

/**
 * What the translator is told about this element: `no`, `yes`, or nothing at all. The attribute is
 * inherited, so the nearest ancestor that states one decides — which is how a marked wrapper
 * protects its children and how `translate="yes"` hands one back.
 */
function translateOf(element: Element | null | undefined): string | null {
    for (let node: Element | null = element ?? null; node !== null; node = node.parentElement) {
        const stated = node.getAttribute('translate')

        if (stated !== null) {
            return stated
        }
    }

    return null
}

const guardOn = (wrapper: VueWrapper, selector: string): string | null => translateOf(wrapper.find(selector).element)

/**
 * The text as a reader sees it. `text()` trims every text node before joining them, so a marked
 * figure would appear glued to the word before it; the DOM's own `textContent` is the line itself.
 */
const textOf = (wrapper: VueWrapper, selector = ''): string =>
    ((selector === '' ? wrapper.element : wrapper.find(selector).element).textContent ?? '').trim()

/** The texts the translator is told to leave alone, in document order. */
const untranslated = (wrapper: VueWrapper, selector = ''): string[] =>
    (selector === '' ? wrapper : wrapper.find(selector)).findAll('[translate="no"]').map((el) => el.text())

let wrappers: VueWrapper[] = []

function keep(wrapper: VueWrapper): VueWrapper {
    wrappers.push(wrapper)

    return wrapper
}

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
})

/* ── The wrapper itself ─────────────────────────────────────────────────────────── */

describe('ValueText', () => {
    const SENTENCE = 'Die Mittenlochbohrung – hier 66,6 mm – ist die Öffnung in der Radmitte.'

    it('marks the figure in a sentence and leaves the German words to the translator', () => {
        const wrapper = keep(mount(ValueText, { props: { text: SENTENCE } }))

        expect(untranslated(wrapper)).toEqual(['66,6 mm'])
        expect(textOf(wrapper)).toBe(SENTENCE)
    })

    it('marks a bare value or a name whole, so a price and a model are never rewritten', () => {
        for (const value of ['MOTEC MCR4 Ultimate', `189,00${NNBSP}€`, '245/45 R18 92Y']) {
            const wrapper = keep(mount(ValueText, { props: { text: value, whole: true } }))

            expect(untranslated(wrapper)).toEqual([value])
            expect(textOf(wrapper)).toBe(value)
        }
    })

    it('leaves a line without a figure entirely translatable', () => {
        const wrapper = keep(mount(ValueText, { props: { text: 'Auf dem Foto nicht markiert.' } }))

        expect(wrapper.findAll('[translate]')).toHaveLength(0)
        expect(textOf(wrapper)).toBe('Auf dem Foto nicht markiert.')
    })

    it('keeps every marked figure on one line', () => {
        const wrapper = keep(mount(ValueText, { props: { text: SENTENCE } }))

        expect(wrapper.find('[translate="no"]').classes()).toContain('value')
    })
})

/* ── The hero callouts ──────────────────────────────────────────────────────────── */

describe('SpecCallout', () => {
    const CALLOUT = { label: 'Mittenlochbohrung', value: `66,6${NNBSP}mm`, note: 'hinter der Nabenkappe', x: 6, y: 47, tx: 50, ty: 47 }

    it('marks the measured value and neither the term beside it nor the note under it', () => {
        const wrapper = keep(mount(SpecCallout, { props: CALLOUT }))

        expect(guardOn(wrapper, '.callout__value')).toBe('no')
        expect(untranslated(wrapper)).toEqual([CALLOUT.value])
        expect(guardOn(wrapper, '.callout__label')).toBeNull()
        expect(guardOn(wrapper, '.callout__note')).toBeNull()
    })
})

/* ── The explainer, #h8 ─────────────────────────────────────────────────────────── */

describe('RimCode · the explainer chips', () => {
    const TOKENS = rimTokens(FACTS)

    it('marks every chip value — the six read off the wheel — and nothing else in the row', () => {
        const wrapper = keep(mount(RimCode, { props: { product: PRODUCT } }))
        const chips = wrapper.findAll('.rc-token__value')

        expect(chips.map((c) => c.text())).toEqual(TOKENS.map((t) => t.text))
        expect(chips).toHaveLength(6)

        for (const chip of chips) {
            expect(translateOf(chip.element), chip.text()).toBe('no')
        }

        // The term read out before the value is German and stays translatable.
        expect(guardOn(wrapper, '.rc-token .visually-hidden')).toBeNull()
    })

    it('marks the figure inside the definition, never the sentence or the term above it', () => {
        const wrapper = keep(mount(RimCode, { props: { product: PRODUCT } }))
        expect(textOf(wrapper, '[data-role="definition"]')).toBe(TOKENS[0]?.sentence)
        expect(untranslated(wrapper, '[data-role="definition"]')).toEqual([FACTS.width])
        expect(guardOn(wrapper, '[data-role="definition"]')).toBeNull()
        expect(guardOn(wrapper, '.rc__term')).toBeNull()
    })
})

describe('RimCodePhoto · the marker label', () => {
    const FRAME = photoFrame(MANIFEST)

    it('has a frame to draw on', () => {
        expect(FRAME).not.toBeNull()
    })

    it('marks the number on the KBA marker and leaves the caption under the photograph alone', () => {
        const wrapper = keep(mount(RimCodePhoto, { props: { frame: FRAME!, active: 'kba', kba: '53810', alt: '' } }))

        expect(textOf(wrapper, '.rc-photo__label')).toBe(photoShape('kba', FRAME, '53810')?.label)
        expect(untranslated(wrapper, '.rc-photo__label')).toEqual(['53810'])
        expect(guardOn(wrapper, '.rc-photo__hint')).toBeNull()
    })

    it('leaves a label that is only a German term to the translator', () => {
        const wrapper = keep(mount(RimCodePhoto, { props: { frame: FRAME!, active: 'mlb', alt: '' } }))

        expect(textOf(wrapper, '.rc-photo__label')).toBe('hinter der Nabenkappe')
        expect(wrapper.find('.rc-photo__label').findAll('[translate]')).toHaveLength(0)
    })
})

/* ── The listing card ───────────────────────────────────────────────────────────── */

describe('ProductTile', () => {
    function card(overrides: Partial<ProductCardProp> = {}): ProductCardProp {
        return {
            modelId: 1,
            modelName: 'MCR4 Ultimate',
            slug: 'motec-mcr4-ultimate',
            brandName: 'MOTEC',
            finishId: 2,
            finishName: 'Light Grey D5',
            art: { finish: 'silver', spokes: 5 },
            image: null,
            rating: null,
            ratingCount: 0,
            ratingLabel: null,
            fromPriceCents: 75600,
            fromPrice: '',
            inStock: true,
            stockQty: 8,
            diameters: ['18', '19', '20'],
            fitment: null,
            ...overrides,
        }
    }

    const VEHICLE: VehicleProp = {
        id: 3,
        make: 'BMW',
        model: '3er',
        variant: '3er Coupé (E46) 320Ci',
        label: 'BMW 3er Coupé (E46) 320Ci',
        short: 'BMW 3er',
        hsn: '0005',
        tsn: '582',
        keyNumbers: 'HSN 0005 · TSN 582',
        buildWindow: '1999–2006',
    }

    const tile = (props: Partial<{ card: ProductCardProp; vehicle: VehicleProp | null }> = {}): VueWrapper =>
        keep(mount(ProductTile, { props: { card: props.card ?? card(), vehicle: props.vehicle ?? null }, attachTo: document.body }))

    it('marks the brand, the model, the finish, the sizes with their Zoll and the price', () => {
        const wrapper = tile()

        for (const selector of ['.tile__brand', '.tile__name', '.tile__finish', '.tile__sizes']) {
            expect(guardOn(wrapper, selector), selector).toBe('no')
        }

        expect(wrapper.find('.tile__sizes').text()).toContain('Zoll')
        expect(untranslated(wrapper, '.tile__price')).toEqual([euro(18900)])
    })

    it('leaves the words around the price and the legal line to the translator', () => {
        const wrapper = tile()

        expect(wrapper.find('.tile__price').text()).toContain('pro Felge')
        expect(guardOn(wrapper, '.tile__price small')).toBeNull()
        expect(guardOn(wrapper, '.tile__legal')).toBeNull()
    })

    it('hands the sentence behind a greyed size back to the translator', () => {
        const wrapper = tile({ card: card({ diametersFitting: ['19'] }), vehicle: VEHICLE })
        const sentence = wrapper.find('.tile__sizes .visually-hidden')

        expect(sentence.text()).toBe('(keine Freigabe für dein Fahrzeug)')
        expect(translateOf(sentence.element)).toBe('yes')
    })
})

/* ── The brand wall ─────────────────────────────────────────────────────────────── */

describe('BrandWall', () => {
    const brands: Brand[] = [
        { name: 'MOTEC', slug: 'motec', logo: null, logoAspect: null, count: 18, href: '/felgen?marke=motec' },
        { name: 'Rial', slug: 'rial', logo: null, logoAspect: null, count: 1, href: '/felgen?marke=rial' },
    ]

    it('marks the wordmark and the count, and leaves the note under the wall translatable', () => {
        const wrapper = keep(mount(BrandWall, { props: { brands, vehicle: null } }))

        expect(untranslated(wrapper)).toEqual(['MOTEC', felgen(18), 'Rial', felgen(1)])
        expect(guardOn(wrapper, '.brand-wall__note')).toBeNull()
        expect(wrapper.find('.brand-wall__note').text()).not.toBe('')
    })
})

/* ── The roster ─────────────────────────────────────────────────────────────────── */

/**
 * Every storefront component that prints a value, a unit, a token or a name, and why it is here.
 * A component joins this list the moment it starts printing one; the test then fails until it
 * carries `translate="no"` itself or hands the value to ValueText.
 */
const ROSTER: Record<string, string> = {
    './Components/Ui/ValueText.vue': 'the one wrapper that carries the attribute',
    './Components/Ui/SpecCallout.vue': 'the hero callouts: Lochkreis, Mittenlochbohrung, KBA-Nummer',
    './Components/Home/HomeHero.vue': 'the desktop hero: the spec line, the name, the price',
    './Components/Mobile/Home/HeroFrame.vue': 'the phone hero: the spec line, the name, the price',
    './Components/Home/RimCode.vue': 'the explainer chips and the figure in the definition',
    './Components/Home/RimCodePhoto.vue': 'the marker label on the photograph',
    './Components/Ui/ProductTile.vue': 'the listing card: names, sizes, Zoll, price',
    './Components/Compare/CompareTable.vue': 'the comparison: the head, and the rows that are data',
    './Components/Home/BrandWall.vue': 'the brand wall: the wordmarks and the counts',
    './Pages/Produkt/Index.vue': 'the product page: the size chips and the Felgendetails rows',
    './Pages/Fehler/Index.vue': 'the failure states: the status code, the vehicle, the address and the service hours',
    './Components/Home/FitmentCalculator.vue': "the calculator's inputs and their units",
    './Components/Home/FitmentResults.vue': "the calculator's sentences",
    './Components/Ui/ClearanceDrawing.vue': "the calculator's drawing labels",
    './Pages/Felgenrechner/Desktop.vue': 'the calculator page: the summary and the value rows',
    './Pages/Felgenrechner/Mobile.vue': 'the calculator page on a phone',
}

const sources = import.meta.glob<string>('./**/*.vue', { query: '?raw', import: 'default', eager: true })

/** Everything outside the scoped stylesheet: where an attribute or a ValueText can stand. */
const markup = (source: string): string => source.replace(/<style[\s\S]*?<\/style>/g, '')

/** Does this component keep the guard — by the attribute itself, or by handing values to ValueText? */
const guards = (source: string): boolean => /translate="no"/.test(markup(source)) || /<ValueText\b/.test(markup(source))

describe('the translation guard', () => {
    it('names a file that is really in the tree', () => {
        expect(Object.keys(ROSTER).filter((path) => sources[path] === undefined)).toEqual([])
    })

    it('holds on every component on the roster', () => {
        const dropped = Object.entries(ROSTER)
            .filter(([path]) => !guards(sources[path] ?? ''))
            .map(([path, why]) => `${path} (${why})`)

        expect(dropped).toEqual([])
    })

    it('recognises the mistake it guards against', () => {
        expect(guards('<template><span class="num">{{ facts.centreBore }}</span></template>')).toBe(false)
        expect(guards('<template><span class="num" translate="no">{{ facts.centreBore }}</span></template>')).toBe(true)
        expect(guards('<template><p>hier <ValueText :text="bore" whole /></p></template>')).toBe(true)
        // A `translate="no"` that only ever stood in a comment in the stylesheet does not count.
        expect(guards('<template><span>{{ x }}</span></template><style>/* translate="no" */</style>')).toBe(false)
    })
})
