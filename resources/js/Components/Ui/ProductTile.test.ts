import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { euro, NNBSP } from '../../format'
import { useCompare } from '../../stores/compare'
import type { ImageManifest, ProductCardProp, VehicleProp } from '../../types/rimify'

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const { default: ProductTile } = await import('./ProductTile.vue')
const { toast } = await import('../Chrome/toast')

const image: ImageManifest = {
    name: 'bbs-ci-r',
    base: '/storage/demo/wheels/bbs-ci-r/tile',
    width: 1200,
    height: 1200,
    widths: [320, 640, 1200],
    placeholder: 'data:image/png;base64,AAAA',
    fallback: 'png',
}

function card(n = 1, overrides: Partial<ProductCardProp> = {}): ProductCardProp {
    return {
        modelId: n,
        modelName: `CI-R ${n}`,
        slug: `bbs-ci-r-${n}`,
        brandName: 'BBS',
        finishId: 2,
        finishName: 'Platinum Silber',
        art: { finish: 'silver', spokes: 5 },
        image: null,
        rating: null,
        ratingCount: 0,
        ratingLabel: null,
        fromPriceCents: 68900,
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
        expect(cta.attributes('href')).toBe('/felgen/bbs-ci-r-1?ausfuehrung=2')
        expect(cta.attributes('aria-label')).toBe('BBS CI-R 1 Platinum Silber: Details ansehen')

        // The name is text, not a link, in v2.
        expect(wrapper.find('.tile__name').element.tagName).toBe('SPAN')
        expect(wrapper.find('.tile__name').text()).toBe('CI-R 1')
        expect(wrapper.text()).not.toContain('Passt')
    })

    it('prices per wheel with the legal line, lists the sizes and the finish', () => {
        const wrapper = mountTile()

        expect(wrapper.find('.tile__brand').text()).toBe('BBS')
        expect(wrapper.find('.tile__finish').text()).toBe('Platinum Silber')
        expect(wrapper.find('.tile__sizes').text()).toBe(`18 · 19 · 20${NNBSP}Zoll`)
        expect(wrapper.find('.tile__price').text()).toBe(`ab ${euro(17225)} pro Felge`)
        expect(wrapper.find('.tile__legal').text()).toBe('inkl. MwSt., zzgl. Versand')
        expect(wrapper.find('.verdict').exists()).toBe(false)
        expect(wrapper.find('.stock--out').exists()).toBe(false)
    })

    it('draws the outline without a caption when there is no cut-out, and the picture when there is', () => {
        const drawn = mountTile()
        expect(drawn.find('svg').exists()).toBe(true)
        expect(drawn.find('picture').exists()).toBe(false)
        expect(drawn.attributes('data-fallback')).toBe('true')
        expect(drawn.text()).not.toContain('Foto')

        const photographed = mountTile({ card: card(2, { image }) })
        expect(photographed.find('picture').exists()).toBe(true)
        expect(photographed.find('picture img').attributes('alt')).toBe('BBS CI-R 2 in Platinum Silber, Ansicht von vorn')
        expect(photographed.find('picture img').attributes('loading')).toBe('lazy')
        expect(photographed.attributes('data-fallback')).toBeUndefined()
        expect(photographed.find('svg').exists()).toBe(false)
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
        expect(unknown.find('.tile__badge').text()).toBe('Unbekannt')

        const without = mountTile({ vehicle: null, card: card(5, { fitment: { status: 'PERMITTED', requiresEntry: false } }) })
        expect(without.find('.verdict').exists()).toBe(false)
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
        expect(input.attributes('aria-label')).toBe('BBS CI-R 1 Platinum Silber vergleichen')
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
        expect(message.text).toBe('BBS CI-R 1 zum Vergleich hinzugefügt.')
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
            store.add({ modelId: n, finishId: 1, slug: `m-${n}`, brandName: 'OZ', modelName: `M ${n}`, finishName: 'Matt', image: null, fromPriceCents: 1 })
        }

        const fifth = mountTile({ compare: true })
        const input = fifth.find<HTMLInputElement>('input.tile__compare-input')
        expect(input.attributes('disabled')).toBeDefined()
        expect(fifth.find('.tile__compare').classes()).toContain('tile__compare--full')

        await fifth.find('.tile__compare').trigger('click')
        expect(show).toHaveBeenCalledWith({ text: 'Höchstens 4 Felgen im Vergleich – entferne eine, um eine andere hinzuzufügen.' })

        // A ticked card at the cap stays enabled: it can still be unticked.
        const ticked = mountTile({ compare: true, card: card(10, { finishId: 1 }) })
        expect(ticked.find<HTMLInputElement>('input.tile__compare-input').element.checked).toBe(true)
        expect(ticked.find('input.tile__compare-input').attributes('disabled')).toBeUndefined()
    })

    it('marks a demo row for the tests and says nothing about it on the card', () => {
        const wrapper = mountTile({ card: card(1, { isDemo: true }) })

        expect(wrapper.attributes('data-demo')).toBe('true')
        expect(wrapper.text()).not.toContain('Demo')
    })
})
