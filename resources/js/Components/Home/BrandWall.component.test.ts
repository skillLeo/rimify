/*
 * BrandWall.vue as rendered (home-brands.md §8, criteria 1, 7, 9–14). The pure helpers are covered
 * in brandWall.test.ts — a separate name, because on a case-insensitive disk `BrandWall.test.ts`
 * and `brandWall.test.ts` would be one file.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
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

/** The component's own scoped stylesheet: the greyed colours are rules there, not inline styles. */
const SOURCE = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), './BrandWall.vue'), 'utf8')

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
    it.each([1, 2, 3, 4, 6, 7, 13])('has no empty cell with %i brands: every stocked item is a link, the closing cell completes the last row', (n) => {
        const wrapper = mountWall(range(n))
        const wall = wrapper.find('ul.brand-wall')
        const items = wall.findAll('li')

        expect(wall.attributes('aria-label')).toBe('Felgen nach Marke')
        expect(wall.attributes('data-brands')).toBe(String(n))
        expect(items).toHaveLength(n + 1)

        // Every brand of the range has stock, so every item is a link (a greyed one is tested below).
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

describe('BrandWall — a brand without stock: greyed, in place, not a link', () => {
    const bare = brand({ name: 'BBS', slug: 'bbs', count: 0, href: null })
    const bareWithLogo = brand({ name: 'BBS', slug: 'bbs', logo: '/images/brands/bbs.svg', logoAspect: 4, count: 0, href: null })
    const GREYED_RULE = 'Ausgegraute Marken haben gerade keine Felgen auf Lager.'

    it('renders the cell as a span — no link, no count — and says why where the count would be', () => {
        const wrapper = mountWall([brand(), bare, demo])
        const items = wrapper.findAll('ul.brand-wall li')
        const item = items[1]
        const cell = item?.find('.brand-cell')

        expect(items).toHaveLength(4)
        expect(item?.findAll('a')).toHaveLength(0)
        expect(cell?.element.tagName.toLowerCase()).toBe('span')
        expect(cell?.classes()).toContain('brand-cell--none')
        expect(cell?.attributes('href')).toBeUndefined()
        expect(cell?.attributes('aria-disabled')).toBe('true')
        expect(cell?.attributes('aria-label')).toBeUndefined()
        expect(cell?.attributes('data-kind')).toBe('name')
        expect(cell?.find('.brand-cell__name').text()).toBe('BBS')
        expect(cell?.find('.brand-cell__count').exists()).toBe(false)
        expect(cell?.find('.brand-cell__none').text()).toBe('Noch keine Felgen auf Lager')
        expect(cell?.find('.brand-cell__none').classes()).toContain('small')
        // What a reader gets: the name, then the sentence — the shape of a linked cell's name.
        expect(cell ? accessibleName(cell) : '').toBe('BBS Noch keine Felgen auf Lager')
        // The stocked neighbours are untouched.
        expect(items[0]?.findAll('a')).toHaveLength(1)
        expect(items[0]?.find('.brand-cell__count').text()).toBe(felgen(18))
        expect(items[2]?.find('a').attributes('data-kind')).toBe('sample')
    })

    it('keeps the mark, filled with the tertiary ink instead of the ink, with no light and no pointer', () => {
        const wrapper = mountWall([bareWithLogo])
        const cell = wrapper.find('span.brand-cell--none')
        const mark = cell.find('.brand-cell__mark')

        expect(cell.attributes('data-kind')).toBe('mark')
        expect(mark.exists()).toBe(true)
        expect(mark.attributes('aria-hidden')).toBe('true')
        expect(cssVar(mark, '--logo-aspect')).toBe('4.000')
        expect(cssVar(mark, '--logo-url')).toContain('/images/brands/bbs.svg')
        expect(cell.find('.visually-hidden').text()).toBe('BBS')
        expect(accessibleName(cell)).toBe('BBS Noch keine Felgen auf Lager')
        // The fill is a scoped rule, so the stylesheet is the proof: ink-3 for a greyed mark, name and label.
        expect(SOURCE).toMatch(/\.brand-cell--none \.brand-cell__mark,\s*\.brand-cell--none \.brand-cell__name,\s*\.brand-cell--none \.brand-cell__sample \{\s*color: var\(--c-ink-3\);/)
        expect(SOURCE).toMatch(/\.brand-cell__none \{\s*color: var\(--c-ink-3\);/)
        // No showcase light to fade in, and the cursor says it goes nowhere.
        expect(SOURCE).toMatch(/\.brand-cell--none::before \{\s*content: none;/)
        expect(SOURCE).toMatch(/\.brand-cell--none \{\s*cursor: not-allowed;/)
        // Probed like any mark: a broken file still falls back to the name.
        expect(FakeImage.made.map((image) => image.src)).toEqual(['/images/brands/bbs.svg'])
    })

    it('never hides a greyed brand, keeps its place, and still closes the wall on its link cell', () => {
        const wrapper = mountWall([bare, brand(), brand({ name: 'RONAL', slug: 'ronal', count: 0, href: null }), demo])
        const wall = wrapper.find('ul.brand-wall')

        expect(wall.attributes('data-brands')).toBe('4')
        expect(wall.findAll('li')).toHaveLength(5)
        expect(wall.findAll('li .brand-cell').map((cell) => cell.element.tagName.toLowerCase())).toEqual(['span', 'a', 'span', 'a', 'a'])
        expect(wall.findAll('a')).toHaveLength(3)
        expect(wall.findAll('li').at(-1)?.find('a').attributes('data-kind')).toBe('all')
        for (const link of wall.findAll('a')) {
            expect(link.attributes('aria-label')).toBeUndefined()
        }
    })

    it('fails closed: a count with no link, or a link with no count, is not a link either', () => {
        const wrapper = mountWall([brand({ count: 5, href: null }), brand({ name: 'BBS', slug: 'bbs', count: 0, href: '/felgen?marke=bbs' })])

        expect(wrapper.findAll('a.brand-cell:not(.brand-cell--all)')).toHaveLength(0)
        expect(wrapper.findAll('span.brand-cell--none')).toHaveLength(2)
    })

    it('greys the sample range like any other brand: still labelled, still last, no link', () => {
        const wrapper = mountWall([brand(), { ...demo, count: 0, href: null }])
        const sample = wrapper.findAll('.brand-cell:not(.brand-cell--all)').at(-1)

        expect(sample?.element.tagName.toLowerCase()).toBe('span')
        expect(sample?.attributes('data-kind')).toBe('sample')
        expect(sample?.find('.brand-cell__sample').text()).toBe(`Beispiel${SOFT_HYPHEN}sortiment`)
        expect(sample?.find('.brand-cell__mark').exists()).toBe(false)
        expect(sample ? accessibleName(sample) : '').toBe(`Beispiel${SOFT_HYPHEN}sortiment (Demo) Noch keine Felgen auf Lager`)
    })

    it('changes the note to the greyed rule, and keeps the vehicle sentence after it', () => {
        expect(mountWall([brand(), demo]).find('.brand-wall__note').text()).toBe('Nur Marken, von denen gerade Felgen auf Lager sind.')
        expect(mountWall([brand(), bare, demo]).find('.brand-wall__note').text()).toBe(GREYED_RULE)
        expect(mountWall([brand(), bare, demo], { vehicle }).find('.brand-wall__note').text()).toBe(
            `${GREYED_RULE} Die Zahl ist der gesamte Lagerbestand der Marke; welche davon an deinen Audi RS 4 passen, zeigt dir die Liste.`
        )
    })

    it('renders the greyed cell as a span on the server too, so hydration matches', async () => {
        const html = await renderToString(createSSRApp({ render: () => h(BrandWall, { brands: [brand(), bareWithLogo], vehicle: null }) }))

        expect(html).toMatch(/<span[^>]*class="brand-cell brand-cell--none"[^>]*>/)
        expect(html).toContain('aria-disabled="true"')
        expect(html).toContain('Noch keine Felgen auf Lager')
        expect(html).toContain(GREYED_RULE)
        // Exactly two links: MOTEC and the closing cell.
        expect(html.match(/<a\b/g)).toHaveLength(2)
        expect(FakeImage.made).toHaveLength(0)
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
