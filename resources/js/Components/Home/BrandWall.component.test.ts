/*
 * BrandWall.vue as rendered (home-brands.md §8, criteria 1, 7, 9–14). The pure helpers are covered
 * in brandWall.test.ts — a separate name, because on a case-insensitive disk `BrandWall.test.ts`
 * and `brandWall.test.ts` would be one file.
 */

import { renderToString } from '@vue/server-renderer'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { felgen } from '../../format'
import type { VehicleProp } from '../../types/rimify'
import type { Brand } from './brandWall'

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: BrandWall } = await import('./BrandWall.vue')

/** Stands in for the browser's image loader: records every probe, fails on request. */
class FakeImage {
    static made: FakeImage[] = []
    onerror: (() => void) | null = null
    src = ''

    constructor() {
        FakeImage.made.push(this)
    }
}

const SOFT_HYPHEN = '­'
const LOGO = '/storage/brands/motec.svg'

function brand(overrides: Partial<Brand> = {}): Brand {
    return { name: 'MOTEC', slug: 'motec', logo: null, logoAspect: null, count: 18, href: '/felgen?marke=motec', ...overrides }
}

const demo = brand({ name: 'Demo', slug: 'demo', count: 20, href: '/felgen?marke=demo' })

/** `n` brands: n − 1 manufacturers, then the sample range. */
function range(n: number): Brand[] {
    const makers = Array.from({ length: n - 1 }, (_, i) => brand({ name: `Marke ${i + 1}`, slug: `marke-${i + 1}`, count: i + 1, href: `/felgen?marke=marke-${i + 1}` }))

    return [...makers, demo]
}

const vehicle: VehicleProp = {
    id: 3,
    make: 'Audi',
    model: 'RS 4',
    variant: 'RS 4 Avant (B9)',
    label: 'Audi RS 4 Avant',
    short: 'Audi RS 4',
    hsn: '0588',
    tsn: 'BKH',
    keyNumbers: 'HSN 0588 · TSN BKH',
    buildWindow: '2017–2019',
}

let wrappers: VueWrapper[] = []

function mountWall(brands: Brand[], options: { vehicle?: VehicleProp | null; flush?: boolean } = {}): VueWrapper {
    const wrapper = mount(BrandWall, {
        props: { brands, vehicle: options.vehicle ?? null, flush: options.flush ?? false },
        attachTo: document.body,
    })
    wrappers.push(wrapper)

    return wrapper
}

/** The visible text a browser reads, without aria-hidden parts. */
function textOf(element: Element): string {
    if (element.getAttribute('aria-hidden') === 'true') {
        return ''
    }

    return Array.from(element.childNodes)
        .map((node) => (node.nodeType === 3 ? (node.textContent ?? '') : node.nodeType === 1 ? textOf(node as Element) : ''))
        .join('')
}

/**
 * The name a browser computes from the link's content: the stage and the foot are grid items
 * (block-level), so their texts are joined by whitespace, and runs of ASCII whitespace collapse.
 * The narrow no-break space inside the count stays what it is.
 */
function accessibleName(link: DOMWrapper<Element>): string {
    return Array.from(link.element.children)
        .map((child) => textOf(child))
        .join(' ')
        .replace(/[ \t\n\r\f]+/g, ' ')
        .trim()
}

const cssVar = (element: DOMWrapper<Element>, name: string): string => (element.element as HTMLElement).style.getPropertyValue(name)

beforeEach(() => {
    FakeImage.made = []
    vi.stubGlobal('Image', FakeImage)
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
})

describe('BrandWall — composition', () => {
    it.each([1, 2, 3, 4, 6, 7, 13])('has no empty cell with %i brands: every item is a link, the closing cell completes the last row', (n) => {
        const wrapper = mountWall(range(n))
        const wall = wrapper.find('ul.brand-wall')
        const items = wall.findAll('li')

        expect(wall.attributes('aria-label')).toBe('Felgen nach Marke')
        expect(wall.attributes('data-brands')).toBe(String(n))
        expect(items).toHaveLength(n + 1)

        for (const item of items) {
            expect(item.findAll('a')).toHaveLength(1)
            expect(item.attributes('aria-hidden')).toBeUndefined()
        }

        // The closing cell is last, and at every tier its span fills the last row exactly.
        expect(items.at(-1)?.classes()).toContain('brand-wall__item--all')
        for (const [tier, max] of [['s', 2], ['m', 4], ['l', 5], ['xl', 6]] as const) {
            const columns = Number(cssVar(wall, `--wall-cols-${tier}`))
            const span = Number(cssVar(wall, `--wall-span-${tier}`))

            if (n <= 3) {
                // One row of brands, the closing link a full-width footer strip under it.
                expect(columns, tier).toBe(n)
                expect(span, tier).toBe(n)
            } else {
                expect(columns, tier).toBeGreaterThanOrEqual(2)
                expect(columns, tier).toBeLessThanOrEqual(max)
                expect(span, tier).toBeGreaterThanOrEqual(1)
                expect(span, tier).toBeLessThanOrEqual(columns)
            }
            expect((n + span) % columns, tier).toBe(0)
        }
    })

    it('lays out today’s two brands as one row of two with the closing link as a footer strip at every tier', () => {
        const wall = mountWall([brand(), demo]).find('ul.brand-wall')

        for (const tier of ['s', 'm', 'l', 'xl']) {
            expect(cssVar(wall, `--wall-cols-${tier}`), tier).toBe('2')
            expect(cssVar(wall, `--wall-span-${tier}`), tier).toBe('2')
        }
    })

    it('marks nothing aria-hidden but the mark and the arrow, and puts an aria-label on no link', () => {
        const wrapper = mountWall([brand({ logo: LOGO, logoAspect: 4.2 }), brand({ name: 'BBS', slug: 'bbs' }), demo])

        for (const hidden of wrapper.findAll('.brand-wall [aria-hidden]')) {
            const isMark = hidden.classes().includes('brand-cell__mark')
            const isArrow = hidden.element.tagName.toLowerCase() === 'svg'

            expect(isMark || isArrow).toBe(true)
        }
        for (const link of wrapper.findAll('.brand-wall a')) {
            expect(link.attributes('aria-label')).toBeUndefined()
        }
    })

    it('renders nothing at all without brands — no lone closing cell, no note', () => {
        const wrapper = mountWall([])

        expect(wrapper.find('.brand-wall').exists()).toBe(false)
        expect(wrapper.find('.brand-wall__note').exists()).toBe(false)
    })

    it('drops the top margin on the phone document only', () => {
        expect(mountWall([brand()]).find('.brand-wall').classes()).not.toContain('brand-wall--flush')
        expect(mountWall([brand()], { flush: true }).find('.brand-wall').classes()).toContain('brand-wall--flush')
    })
})

describe('BrandWall — marks and wordmarks', () => {
    it('draws a wide logo as a mask box sized from its aspect, the name hidden but in the link name', () => {
        const wrapper = mountWall([brand({ logo: LOGO, logoAspect: 4.2 })])
        const link = wrapper.find('a.brand-cell[data-kind="mark"]')
        const mark = link.find('.brand-cell__mark')

        expect(mark.exists()).toBe(true)
        expect(mark.attributes('aria-hidden')).toBe('true')
        expect(cssVar(mark, '--logo-aspect')).toBe('4.200')
        expect(cssVar(mark, '--logo-sqrt')).toBe('2.049')
        expect(cssVar(mark, '--logo-url')).toContain(LOGO)
        expect(link.find('.brand-cell__name').exists()).toBe(false)
        expect(link.find('.visually-hidden').text()).toBe('MOTEC')
        expect(accessibleName(link)).toBe(`MOTEC ${felgen(18)}`)
        expect(wrapper.find('img').exists()).toBe(false)
    })

    it('draws a compact emblem with its own aspect', () => {
        const mark = mountWall([brand({ logo: '/storage/brands/emblem.png', logoAspect: 1 })]).find('.brand-cell__mark')

        expect(cssVar(mark, '--logo-aspect')).toBe('1.000')
        expect(cssVar(mark, '--logo-sqrt')).toBe('1.000')
    })

    it('sets the name as the mark when there is no usable logo', () => {
        for (const fallback of [
            brand(),
            brand({ logo: LOGO, logoAspect: null }),
            brand({ logo: '/storage/brands/motec.svg")', logoAspect: 4.2 }),
            brand({ logo: LOGO, logoAspect: 40 }),
        ]) {
            const wrapper = mountWall([fallback])
            const link = wrapper.find('a.brand-cell[data-kind="name"]')

            expect(link.find('.brand-cell__mark').exists()).toBe(false)
            expect(link.find('.brand-cell__name').text()).toBe('MOTEC')
            expect(link.find('.brand-cell__name').attributes('data-len')).toBe('s')
            expect(accessibleName(link)).toBe(`MOTEC ${felgen(18)}`)
        }
    })

    it('steps the wordmark by the longest word', () => {
        const wrapper = mountWall([brand({ name: 'OZ Racing', slug: 'oz' }), brand({ name: 'Leichtmetall', slug: 'lm' })])
        const names = wrapper.findAll('.brand-cell__name')

        expect(names.map((n) => n.attributes('data-len'))).toEqual(['m', 'l'])
    })

    it('shows every count through felgen(), tabular', () => {
        const wrapper = mountWall([brand({ count: 1 }), brand({ name: 'BBS', slug: 'bbs', count: 1234 })])
        const counts = wrapper.findAll('.brand-cell__count')

        expect(counts.map((c) => c.text())).toEqual([felgen(1), felgen(1234)])
        for (const count of counts) {
            expect(count.classes()).toContain('num')
        }
    })
})

describe('BrandWall — the sample range', () => {
    it('labels Demo as the Beispielsortiment, last among the brands, never a wordmark or a logo', () => {
        const withLogo = { ...demo, logo: LOGO, logoAspect: 4.2 }
        const wrapper = mountWall([withLogo, brand(), brand({ name: 'BBS', slug: 'bbs' })])
        const links = wrapper.findAll('a.brand-cell:not(.brand-cell--all)')
        const sample = links.at(-1)

        expect(links.map((l) => l.attributes('data-kind'))).toEqual(['name', 'name', 'sample'])
        expect(sample?.attributes('href')).toBe('/felgen?marke=demo')
        expect(sample?.find('.brand-cell__sample').text()).toBe(`Beispiel${SOFT_HYPHEN}sortiment`)
        expect(sample?.find('.brand-cell__mark').exists()).toBe(false)
        expect(sample?.find('.brand-cell__name').exists()).toBe(false)
        expect(sample ? accessibleName(sample) : '').toBe(`Beispiel${SOFT_HYPHEN}sortiment (Demo) ${felgen(20)}`)
        // The sample range is not probed: it never draws a logo.
        expect(FakeImage.made).toHaveLength(0)
    })
})

describe('BrandWall — the closing cell and the note', () => {
    it('without a vehicle: all wheels, and the rule', () => {
        const wrapper = mountWall([brand(), demo])
        const closing = wrapper.find('a.brand-cell--all')

        expect(closing.attributes('href')).toBe('/felgen')
        expect(closing.attributes('data-kind')).toBe('all')
        expect(accessibleName(closing)).toBe('Alle Felgen ansehen')
        expect(closing.find('svg').attributes('aria-hidden')).toBe('true')
        expect(wrapper.find('.brand-wall__note').text()).toBe('Nur Marken, von denen gerade Felgen auf Lager sind.')
    })

    it('with a vehicle: the fitting list, and the counts named as the whole stock', () => {
        const wrapper = mountWall([brand(), demo], { vehicle })

        expect(accessibleName(wrapper.find('a.brand-cell--all'))).toBe('Passende Felgen anzeigen')
        expect(wrapper.find('.brand-wall__note').text()).toBe(
            'Nur Marken, von denen gerade Felgen auf Lager sind. Die Zahl ist der gesamte Lagerbestand der Marke; welche davon an deinen Audi RS 4 passen, zeigt dir die Liste.'
        )
        // Counts do not change with a vehicle.
        expect(wrapper.find('.brand-cell__count').text()).toBe(felgen(18))
    })
})

describe('BrandWall — a logo that fails to load', () => {
    it('probes each logo once after mount and falls back to the name on error', async () => {
        const wrapper = mountWall([brand({ logo: LOGO, logoAspect: 4.2 }), brand({ name: 'BBS', slug: 'bbs' })])

        expect(FakeImage.made).toHaveLength(1)
        expect(FakeImage.made[0]?.src).toBe(LOGO)
        expect(wrapper.find('.brand-cell__mark').exists()).toBe(true)

        FakeImage.made[0]?.onerror?.()
        await nextTick()

        const link = wrapper.find('a.brand-cell')
        expect(link.attributes('data-kind')).toBe('name')
        expect(link.find('.brand-cell__mark').exists()).toBe(false)
        expect(link.find('.brand-cell__name').text()).toBe('MOTEC')
        expect(accessibleName(link)).toBe(`MOTEC ${felgen(18)}`)
    })

    it('keeps the mark in the server render: the probe is client-only, so hydration matches', async () => {
        const html = await renderToString(createSSRApp({ render: () => h(BrandWall, { brands: [brand({ logo: LOGO, logoAspect: 4.2 }), demo], vehicle: null }) }))

        expect(html).toContain('brand-cell__mark')
        expect(html).toContain('--logo-aspect:4.200')
        expect(html).not.toContain('brand-cell__name')
        expect(html).toContain('Alle Felgen ansehen')
        // A custom property is written verbatim; a camel-cased WebkitMaskImage would lose its dash.
        expect(html).not.toMatch(/[^-]webkit-mask-image/)
        expect(FakeImage.made).toHaveLength(0)
    })
})
