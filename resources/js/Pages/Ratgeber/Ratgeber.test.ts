import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h, type VNode } from 'vue'

/*
 * A Blog article (the client's #10, D-230): structured blocks only, never HTML. A `<script>` someone typed is printed as
 * the characters it is; a table has its caption and real header cells; a figure carries its alt text.
 */

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: { canonical: 'https://rimify.test/ratgeber/einpresstiefe-et-erklaert' } }),
    Head: { render: () => null },
    Link: {
        props: { href: { type: String, required: true } },
        setup(props: { href: string }, { slots }: { slots: { default?: () => VNode[] } }) {
            return () => h('a', { href: props.href }, slots.default?.())
        },
    },
}))

const { default: Article } = await import('./Desktop.vue')

const guide = {
    slug: 'einpresstiefe-et-erklaert',
    title: 'Einpresstiefe (ET) verständlich erklärt',
    teaser: 'Was die ET ist und warum sie zählt.',
    minutes: 4,
    metaDescription: '',
    blocks: [
        { type: 'prose' as const, data: { heading: 'Was die ET misst', text: 'Erster Absatz.\n\n<script>alert(1)</script> bleibt Text.' } },
        { type: 'figure' as const, data: { src: '/storage/website-images/et.webp', alt: 'Schnitt durch eine Felge mit der Einpresstiefe', caption: 'Die ET in Millimetern' } },
        { type: 'table' as const, data: { caption: 'ET und Spur', head: ['ET', 'Wirkung'], rows: [['< 30', 'breitere Spur'], ['45', 'schmalere Spur']] } },
        { type: 'quote' as const, data: { text: 'Zuerst die Papiere,\n\ndann die Felge.', source: 'Eine Prüferin beim TÜV' } },
    ],
}

describe('a Blog article', () => {
    // The client's admin item 11, „We will go with your proposal“ (29.10.2026): blocks, deliberately no HTML. A standard
    // set of payloads in every field the editor has: each stays the characters it is — no element, no handler, no link.
    it('keeps every standard XSS payload inert in every field — no script, no handler, no javascript: link — and the table whole', () => {
        const payloads = [
            '<script>alert(1)</script>',
            '<img src=x onerror=alert(1)>',
            '<svg onload=alert(1)>',
            '<a href="javascript:alert(1)">klick</a>',
            '<iframe src="https://example.org"></iframe>',
            '<p style="background:url(javascript:alert(1))">x</p>',
            '"><b onmouseover=alert(1)>fett</b>',
        ]
        const hostile = {
            ...guide,
            blocks: [
                { type: 'prose' as const, data: { heading: payloads[1]!, text: payloads.join('\n\n') } },
                { type: 'figure' as const, data: { src: '/storage/website-images/et.webp', alt: payloads[0]!, caption: payloads[3]! } },
                { type: 'table' as const, data: { caption: payloads[4]!, head: [payloads[2]!, 'Wirkung'], rows: [[payloads[5]!, payloads[6]!], ['45', 'schmalere Spur']] } },
                { type: 'quote' as const, data: { text: payloads[3]!, source: payloads[1]! } },
            ],
        }
        const wrapper = mount(Article, { props: { guide: hostile, others: [] } })
        const article = wrapper.find('article').exists() ? wrapper.find('article') : wrapper

        expect(article.findAll('script, iframe, svg[onload], img[onerror], b, p[style]').filter((el) => el.element.closest('.guide__figure') === null || el.element.tagName !== 'IMG')).toHaveLength(0)
        expect(article.findAll('a').filter((a) => (a.attributes('href') ?? '').startsWith('javascript:'))).toHaveLength(0)
        expect([...article.element.querySelectorAll('*')].flatMap((el) => [...el.attributes].map((a) => a.name)).filter((name) => name.startsWith('on'))).toEqual([])
        for (const payload of payloads) {
            expect(article.text()).toContain(payload)
        }

        // The table stands whole: its caption, its header row, both body rows.
        const table = wrapper.find('table')
        expect(table.find('caption').text()).toBe(payloads[4])
        expect(table.findAll('thead th')).toHaveLength(2)
        expect(table.findAll('tbody tr')).toHaveLength(2)
    })

    it('prints what someone typed as text — a script tag included — and never runs it', () => {
        const wrapper = mount(Article, { props: { guide, others: [] } })

        expect(wrapper.find('script').exists()).toBe(false)
        expect(wrapper.text()).toContain('<script>alert(1)</script> bleibt Text.')
        expect(wrapper.html()).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    })

    it('writes a table with its caption and column headers, and a figure with its alt text', () => {
        const wrapper = mount(Article, { props: { guide, others: [] } })
        const table = wrapper.find('table')

        expect(table.find('caption').text()).toBe('ET und Spur')
        expect(table.findAll('thead th').map((th) => [th.text(), th.attributes('scope')])).toEqual([['ET', 'col'], ['Wirkung', 'col']])
        expect(table.findAll('tbody tr')).toHaveLength(2)
        expect(table.find('tbody td').text()).toBe('< 30')
        expect(wrapper.find('figure img').attributes('alt')).toBe('Schnitt durch eine Felge mit der Einpresstiefe')
        expect(wrapper.find('figcaption').text()).toBe('Die ET in Millimetern')
    })

    // SEI-34: a picture whose file is gone is left out, never shown broken.
    it('leaves out a picture whose file does not load', async () => {
        const wrapper = mount(Article, { props: { guide, others: [] } })

        await wrapper.find('figure.guide__figure img').trigger('error')

        expect(wrapper.find('figure.guide__figure').exists()).toBe(false)
        expect(wrapper.find('table').exists()).toBe(true)
    })

    it('sets a quote as a blockquote, its paragraphs apart and its source beneath', () => {
        const wrapper = mount(Article, { props: { guide, others: [] } })
        const quote = wrapper.find('figure.guide__quote')

        expect(quote.findAll('blockquote p').map((p) => p.text())).toEqual(['Zuerst die Papiere,', 'dann die Felge.'])
        expect(quote.find('figcaption').text()).toBe('Eine Prüferin beim TÜV')
    })

    it('leads back to the Blog', () => {
        const wrapper = mount(Article, { props: { guide, others: [{ slug: 'hsn-und-tsn-finden', title: 'HSN und TSN finden', href: '/ratgeber/hsn-und-tsn-finden' }] } })

        expect(wrapper.find('a[href="/blog"]').text()).toBe('Blog')
        expect(wrapper.find('a[href="/ratgeber/hsn-und-tsn-finden"]').exists()).toBe(true)
    })
})
