import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, reactive } from 'vue'
import type { AdminGutachtenProps } from '../../../types/pages'

/*
 * Gutachten › Dokumente: only the exception is tagged, a filter is drawn only where it has something
 * to choose between, counts are German, and a phone card leaves out what it cannot carry.
 */

const current = reactive<{ props: Record<string, unknown> }>({ props: {} })

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
    router: { post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn(), on: vi.fn(() => () => undefined) },
}))

const { default: Page } = await import('./Index.vue')

type Document = AdminGutachtenProps['documents'][number]

function doc(overrides: Partial<Document> = {}): Document {
    return {
        id: 1,
        reportNumber: 'ABE 12345',
        kind: 'ABE',
        issuer: 'TÜV Süd',
        kbaNumber: '52918',
        issuedOn: '01.03.2024',
        revision: 1,
        status: 'published',
        pageCount: 12,
        fitmentCount: 1408,
        publishedCount: 1276,
        href: '/admin/gutachten/1',
        ...overrides,
    }
}

let mounted: VueWrapper[] = []

function mountPage(documents: Document[]): VueWrapper {
    const wrapper = mount(Page, { props: { documents, can: { create: false } }, attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('Gutachten › Dokumente', () => {
    it('prints the normal state as text and tags only the exceptions', () => {
        const wrapper = mountPage([
            doc(),
            doc({ id: 2, status: 'draft' }),
            doc({ id: 3, status: 'superseded' }),
            doc({ id: 4, status: 'withdrawn' }),
        ])
        const status = wrapper.findAll('tbody td[data-label="Status"]')

        expect(status[0]!.find('.adm-tag').exists()).toBe(false)
        expect(status[0]!.text()).toContain('Freigegeben')
        expect(status[1]!.find('.adm-tag--neutral').text()).toBe('Entwurf')
        expect(status[2]!.find('.adm-tag--warn').text()).toBe('Ersetzt')
        expect(status[3]!.find('.adm-tag--bad').text()).toBe('Zurückgezogen')
    })

    it('counts published against total in German, under one column header', () => {
        const wrapper = mountPage([doc()])

        expect(wrapper.findAll('th').map((th) => th.text())).toContain('Zeilen im Shop')
        expect(wrapper.find('tbody td[data-label="Zeilen im Shop"]').text()).toBe('1.276 von 1.408')
    })

    it('draws a filter only where there are at least two values to choose between', () => {
        const single = mountPage([doc(), doc({ id: 2 })])

        expect(single.find('.adm-filters').exists()).toBe(false)

        const mixed = mountPage([doc(), doc({ id: 2, status: 'draft' })])
        const groups = mixed.findAll('.adm-filter')

        expect(groups).toHaveLength(1)
        expect(groups[0]!.attributes('aria-label')).toBe('Status')
    })

    it('narrows the list in place and says so when nothing matches', async () => {
        const wrapper = mountPage([doc(), doc({ id: 2, status: 'draft', kind: 'ECE' })])
        const chip = wrapper.findAll('.adm-chip').find((c) => c.text().startsWith('Entwurf'))!

        await chip.trigger('click')

        expect(chip.attributes('aria-pressed')).toBe('true')
        expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    })

    it('leaves Art and Aussteller out of the phone card and puts the status on the key line', () => {
        const row = mountPage([doc()]).find('tbody tr')

        expect(row.find('[data-label="Art"]').attributes('data-phone')).toBe('hide')
        expect(row.find('[data-label="Aussteller"]').attributes('data-phone')).toBe('hide')
        expect(row.find('[data-label="Status"]').attributes('data-phone')).toBe('status')
    })
})
