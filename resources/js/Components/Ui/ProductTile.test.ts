import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { NNBSP } from '../../format'
import { formatMoney } from '../../lib/num'
import { useCompare } from '../../stores/compare'
import type { ImageManifest, ProductCardProp, VehicleProp } from '../../types/rimify'

/* The page's shared props, as far as the tile reads them: the Kleinunternehmer flag (usePriceTerms). */
const page = vi.hoisted(() => ({ props: { smallBusiness: false } as Record<string, unknown> }))

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
    usePage: () => page,
}))

const { default: ProductTile } = await import('./ProductTile.vue')
const { toast } = await import('../Chrome/toast')

const image: ImageManifest = {
    name: 'demo-zehnspeiche-z-07',
    base: '/storage/demo/wheels/demo-zehnspeiche-z-07/tile',
    width: 1200,
    height: 1200,
    widths: [320, 640, 1200],
    placeholder: 'data:image/png;base64,AAAA',
    fallback: 'png',
}

function card(n = 1, overrides: Partial<ProductCardProp> = {}): ProductCardProp {
    return {
        modelId: n,
        modelName: `Zehnspeiche Z-0${n}`,
        slug: `demo-zehnspeiche-z-0${n}`,
        brandName: 'Demo',
        finishId: 2,
        finishName: 'Platinum Silber',
        art: { finish: 'silver', spokes: 5 },
        image: null,
        rating: null,
        ratingCount: 0,
        ratingLabel: null,
        // ONE rim (docs/specs/komplettrad.md §9): the tile prints it as it is.
        fromPriceCents: 17225,
        fromPrice: '',
        inStock: true,
        stockQty: 8,
        diameters: ['18', '19', '20'],
        fitment: null,
        ...overrides,
    }
}

const vehicle: VehicleProp = {
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

let wrappers: VueWrapper[] = []

function mountTile(props: Partial<{ card: ProductCardProp; vehicle: VehicleProp | null; compare: boolean; eager: boolean }> = {}): VueWrapper {
    const wrapper = mount(ProductTile, {
        props: { card: props.card ?? card(), vehicle: props.vehicle ?? null, compare: props.compare ?? false, eager: props.eager ?? false },
        attachTo: document.body,
    })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
    vi.restoreAllMocks()
})

describe('ProductTile', () => {
    it('has one link, the CTA, stretched over the card and named after the wheel', () => {
        const wrapper = mountTile({ compare: true })

        const links = wrapper.findAll('a')
        expect(links).toHaveLength(1)
        const cta = links[0]!
        expect(cta.classes()).toEqual(expect.arrayContaining(['tile__cta', 'btn', 'btn--primary', 'btn--sm']))
        expect(cta.text()).toBe('Details ansehen')
        expect(cta.attributes('href')).toBe('/felgen/demo-zehnspeiche-z-01?ausfuehrung=2')
        expect(cta.attributes('aria-label')).toBe('Demo Zehnspeiche Z-01 Platinum Silber: Details ansehen')

        // The name is text, not a link, in v2.
        expect(wrapper.find('.tile__name').element.tagName).toBe('SPAN')
        expect(wrapper.find('.tile__name').text()).toBe('Zehnspeiche Z-01')
        expect(wrapper.text()).not.toContain('Passt')
    })

    it('prices per wheel with the legal line, lists the sizes and the finish', () => {
        const wrapper = mountTile()

        expect(wrapper.find('.tile__brand').text()).toBe('Demo')
        expect(wrapper.find('.tile__finish').text()).toBe('Platinum Silber')
        expect(wrapper.find('.tile__sizes').text()).toBe(`18 · 19 · 20${NNBSP}Zoll`)
        expect(wrapper.find('.tile__price').text()).toBe(`ab ${formatMoney(17225)} pro Felge`)
        expect(wrapper.find('.tile__legal').text()).toBe('inkl. MwSt., zzgl. Versandkosten')
        expect(wrapper.find('.verdict').exists()).toBe(false)
        expect(wrapper.find('.stock--out').exists()).toBe(false)
    })

    it('names no VAT in the legal line when the seller is a Kleinunternehmer (§ 19 UStG)', () => {
        page.props.smallBusiness = true

        try {
            const wrapper = mountTile()

            expect(wrapper.find('.tile__price').text()).toBe(`ab ${formatMoney(17225)} pro Felge`)
            expect(wrapper.find('.tile__legal').text()).toBe('zzgl. Versandkosten, keine MwSt. nach § 19 UStG')
            expect(wrapper.text()).not.toContain('inkl. MwSt.')
        } finally {
            page.props.smallBusiness = false
        }
    })

    it('draws the outline without a caption when there is no cut-out, and the picture when there is', () => {
        const drawn = mountTile()
        expect(drawn.find('svg').exists()).toBe(true)
        expect(drawn.find('picture').exists()).toBe(false)
        expect(drawn.attributes('data-fallback')).toBe('true')
        expect(drawn.text()).not.toContain('Foto')

        const photographed = mountTile({ card: card(2, { image }) })
        expect(photographed.find('picture').exists()).toBe(true)
        expect(photographed.find('picture img').attributes('alt')).toBe('Demo Zehnspeiche Z-02 in Platinum Silber, Ansicht von vorn')
        expect(photographed.find('picture img').attributes('loading')).toBe('lazy')
        expect(photographed.attributes('data-fallback')).toBeUndefined()
        expect(photographed.find('svg').exists()).toBe(false)
    })

    it('lays a second studio angle over the front view for the hover, hidden from assistive tech — fetched when a mouse comes, not with the page', async () => {
        const single = mountTile({ card: card(2, { image }) })
        expect(single.findAll('picture')).toHaveLength(1)

        const angled = { ...image, name: 'schraeg', base: '/storage/demo/wheels/x-schraeg/x-schraeg', label: 'Schräg von vorn' }
        const withView = mountTile({ card: card(2, { image: { ...image, views: [angled] } }) })

        // With the page: the front view alone. A finger over the tile asks for nothing either (finding 110).
        expect(withView.findAll('picture')).toHaveLength(1)
        await withView.trigger('pointerenter', { pointerType: 'touch' })
        expect(withView.findAll('picture')).toHaveLength(1)

        await withView.trigger('pointerenter', { pointerType: 'mouse' })
        const pictures = withView.findAll('picture')

        expect(pictures).toHaveLength(2)
        // Asked for by the visitor: loaded at once, never lazily behind a picture that is in view.
        expect(pictures[1]!.find('img').attributes('loading')).toBe('eager')
        expect(pictures[0]!.find('img').attributes('alt')).toBe('Demo Zehnspeiche Z-02 in Platinum Silber, Ansicht von vorn')
        expect(pictures[1]!.classes()).toContain('tile__media--alt')
        expect(pictures[1]!.attributes('aria-hidden')).toBe('true')
        expect(pictures[1]!.find('img').attributes('alt')).toBe('')
        expect(pictures[1]!.find('img').attributes('src')).toContain('x-schraeg')
    })

    it('falls back to the drawing when the picture fails', async () => {
        const wrapper = mountTile({ card: card(2, { image }) })

        wrapper.find('picture img').element.dispatchEvent(new Event('error'))
        await nextTick()

        expect(wrapper.find('svg').exists()).toBe(true)
        expect(wrapper.attributes('data-fallback')).toBe('true')
    })

    it('shows the verdict only with a vehicle, in the four words, with its Auflagen as sentences', () => {
        const conditional = mountTile({
            vehicle,
            card: card(1, { fitment: { status: 'CONDITIONAL', requiresEntry: true, conditions: ['Die Änderung ist in die Fahrzeugpapiere einzutragen.'] } }),
        })
        expect(conditional.find('.tile__badge').text()).toBe('Mit Auflagen')
        expect(conditional.find('.tile__conditions').text()).toContain('Die Änderung ist in die Fahrzeugpapiere einzutragen.')

        // PERMITTED with an entry requirement is merged toward caution.
        const entry = mountTile({ vehicle, card: card(2, { fitment: { status: 'PERMITTED', requiresEntry: true, conditions: [] } }) })
        expect(entry.find('.tile__badge').text()).toBe('Mit Auflagen')

        const permitted = mountTile({ vehicle, card: card(3, { fitment: { status: 'PERMITTED', requiresEntry: false } }) })
        expect(permitted.find('.tile__badge').text()).toBe('Freigegeben')

        const unknown = mountTile({ vehicle, card: card(4, { fitment: { status: 'UNKNOWN', requiresEntry: false } }) })
        expect(unknown.find('.tile__badge').text()).toBe('Noch nicht bestätigt')

        const without = mountTile({ vehicle: null, card: card(5, { fitment: { status: 'PERMITTED', requiresEntry: false } }) })
        expect(without.find('.verdict').exists()).toBe(false)
    })

    /*
     * D-197: a real Gutachten's Auflagen are paragraphs (ABE 55255's V19 names 27 pairings in one sentence). Printed whole,
     * a card on the E46's listing stood 2.500 px tall. Counted there, the wording one press away — and never cut short.
     */
    it('counts the Auflagen where they are a Gutachten\'s paragraphs, and prints them where they are a line or two @kunde-22', () => {
        const V19 = `Bei Verwendung verschiedener Reifengrößen an Vorder- und Hinterachse sind folgende Reifenkombinationen möglich: ${'Nr. 1: 215/35R19 – 245/30R19; '.repeat(12)}`
        const long = mountTile({
            vehicle,
            card: card(1, { fitment: { status: 'CONDITIONAL', requiresEntry: true, conditions: ['Die Verwendung von Schneeketten ist nicht zulässig.', V19, 'Zur Befestigung der Räder dürfen nur die mitgelieferten Befestigungsmittel verwendet werden.'] } }),
        })

        expect(long.find('.tile__badge').text()).toBe('Mit Auflagen')
        expect(long.find('.tile__conditions').exists()).toBe(false)
        expect(long.find('[data-conditions="counted"]').text()).toBe('3 Auflagen und Hinweise aus dem Gutachten – im Wortlaut auf der Produktseite.')
        // No sentence is cut: none of the long one stands on the card.
        expect(long.text()).not.toContain('Reifenkombinationen')

        // One long sentence is one Auflage, said as one.
        const one = mountTile({ vehicle, card: card(2, { fitment: { status: 'CONDITIONAL', requiresEntry: false, conditions: [V19] } }) })
        expect(one.find('[data-conditions="counted"]').text()).toBe('1 Auflage oder Hinweis aus dem Gutachten – im Wortlaut auf der Produktseite.')

        // Two short ones stand in full, as before.
        const short = mountTile({
            vehicle,
            card: card(3, { fitment: { status: 'CONDITIONAL', requiresEntry: true, conditions: ['Eintragung in die Fahrzeugpapiere erforderlich.', 'Bördeln der Radläufe erforderlich.'] } }),
        })
        expect(short.findAll('.tile__conditions li').map((li) => li.text())).toEqual(['Eintragung in die Fahrzeugpapiere erforderlich.', 'Bördeln der Radläufe erforderlich.'])
        expect(short.find('[data-conditions="counted"]').exists()).toBe(false)
    })

    // #23, D-104: every Auflage a Hinweis (decided on the server) — „Freigegeben“, one quiet line, no list of notes.
    it('says „Freigegeben“ with one quiet line where every Auflage is a Hinweis, and never where an entry is needed', () => {
        const notes = mountTile({
            vehicle,
            card: card(1, { fitment: { status: 'CONDITIONAL', requiresEntry: false, notesOnly: true, conditions: ['Nur mit den Radschrauben des Herstellers.'] } }),
        })
        expect(notes.find('.tile__badge').text()).toBe('Freigegeben')
        expect(notes.find('.tile__badge').classes()).toContain('verdict--ok')
        expect(notes.find('.tile__conditions').exists()).toBe(false)
        expect(notes.text()).toContain('Mit Hinweisen aus dem Gutachten – auf der Produktseite.')

        // An entry is never a note, whatever the flag says.
        const entry = mountTile({
            vehicle,
            card: card(2, { fitment: { status: 'CONDITIONAL', requiresEntry: true, notesOnly: true, conditions: ['Eintragung erforderlich.'] } }),
        })
        expect(entry.find('.tile__badge').text()).toBe('Mit Auflagen')
    })

    it('greys a size no document permits on the car, never strikes it', () => {
        const wrapper = mountTile({
            vehicle,
            card: card(1, { diametersFitting: ['18', '19'], fitment: { status: 'PERMITTED', requiresEntry: false } }),
        })

        const none = wrapper.findAll('.tile__size--none')
        expect(none).toHaveLength(1)
        expect(none[0]!.text()).toContain('20')
        expect(none[0]!.find('.visually-hidden').text()).toBe('(keine Freigabe für dein Fahrzeug)')
        expect(wrapper.find('.tile__sizes').text()).toContain('18 · 19 · 20')
        expect(wrapper.find('.tile__sizes').html()).not.toContain('line-through')
        expect(wrapper.find('.tile__sizes').html()).not.toContain('<s>')
    })

    it('says Ausverkauft above the actions and keeps the CTA', () => {
        const wrapper = mountTile({ card: card(1, { inStock: false, stockQty: 0 }) })

        expect(wrapper.find('.stock--out').text()).toBe('Ausverkauft')
        expect(wrapper.find('.tile__cta').text()).toBe('Details ansehen')
        expect(wrapper.find('.stock--out').element.compareDocumentPosition(wrapper.find('.tile__actions').element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('renders the compare control after the CTA, named after the wheel, and only when asked', () => {
        expect(mountTile().find('.tile__compare').exists()).toBe(false)

        const wrapper = mountTile({ compare: true })
        const input = wrapper.find('input.tile__compare-input')
        expect(input.attributes('type')).toBe('checkbox')
        expect(input.attributes('aria-label')).toBe('Demo Zehnspeiche Z-01 Platinum Silber vergleichen')
        expect(wrapper.find('.tile__compare').text()).toBe('Vergleichen')

        const cta = wrapper.find('.tile__cta').element
        expect(cta.compareDocumentPosition(input.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('adds to the store with a toast and an undo, and removes silently', async () => {
        const show = vi.spyOn(toast, 'show')
        const store = useCompare()
        const wrapper = mountTile({ compare: true })
        const input = wrapper.find<HTMLInputElement>('input.tile__compare-input')

        input.element.checked = true
        await input.trigger('change')

        expect(store.keys).toEqual(['1:2'])
        expect(show).toHaveBeenCalledTimes(1)
        const message = show.mock.calls[0]![0]
        expect(message.text).toBe('Demo Zehnspeiche Z-01 zum Vergleich hinzugefügt.')
        expect(message.action?.label).toBe('Rückgängig')

        message.action?.run()
        await nextTick()
        expect(store.keys).toEqual([])
        expect(input.element.checked).toBe(false)

        input.element.checked = true
        await input.trigger('change')
        input.element.checked = false
        await input.trigger('change')
        expect(store.keys).toEqual([])
        expect(show).toHaveBeenCalledTimes(2)
    })

    it('disables the fifth checkbox at the cap and explains on the label', async () => {
        const show = vi.spyOn(toast, 'show')
        const store = useCompare()

        for (let n = 10; n < 14; n++) {
            store.add({ modelId: n, finishId: 1, slug: `m-${n}`, brandName: 'Demo', modelName: `M ${n}`, finishName: 'Matt', image: null, fromPriceCents: 1 })
        }

        const fifth = mountTile({ compare: true })
        const input = fifth.find<HTMLInputElement>('input.tile__compare-input')
        expect(input.attributes('disabled')).toBeDefined()
        expect(fifth.find('.tile__compare').classes()).toContain('tile__compare--full')

        await fifth.find('.tile__compare').trigger('click')
        expect(show).toHaveBeenCalledWith({ text: 'Höchstens 4 Felgen im Vergleich – entferne eine, um eine andere hinzuzufügen.', icon: 'info' })

        // A ticked card at the cap stays enabled: it can still be unticked.
        const ticked = mountTile({ compare: true, card: card(10, { finishId: 1 }) })
        expect(ticked.find<HTMLInputElement>('input.tile__compare-input').element.checked).toBe(true)
        expect(ticked.find('input.tile__compare-input').attributes('disabled')).toBeUndefined()
    })

    it('marks a demo row for the tests and says nothing about it on the card', () => {
        const wrapper = mountTile({ card: card(1, { isDemo: true }) })

        expect(wrapper.attributes('data-demo')).toBe('true')
        // The demo wheels' brand is literally "Demo"; beyond the brand line the card says nothing.
        expect(wrapper.find('.tile__brand').text()).toBe('Demo')
        expect(wrapper.text().replace(wrapper.find('.tile__brand').text(), '')).not.toContain('Demo')
    })
})
