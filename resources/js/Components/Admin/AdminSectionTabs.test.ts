import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

/*
 * The tab row under one rail item: links, each its own page, the current one marked by its path —
 * a query string or a hash does not make it a different tab.
 */

const current: { url: string } = { url: '/admin' }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const { default: AdminSectionTabs } = await import('./AdminSectionTabs.vue')
const { ZUBEHOER_TABS } = await import('./sectionTabs')

describe('AdminSectionTabs', () => {
    it('is a named navigation of links, not an ARIA tab list', () => {
        const wrapper = mount(AdminSectionTabs, { props: { label: 'Zubehörpreise', items: ZUBEHOER_TABS } })

        expect(wrapper.find('nav').attributes('aria-label')).toBe('Zubehörpreise')
        expect(wrapper.find('[role="tab"]').exists()).toBe(false)
        expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toEqual(['/admin/zubehoerpreise/wuchtgewichte', '/admin/zubehoerpreise/rdks'])
    })

    it('marks the page the reader is on, whatever the query says', () => {
        current.url = '/admin/zubehoerpreise/rdks?seite=2#liste'
        const wrapper = mount(AdminSectionTabs, { props: { label: 'Zubehörpreise', items: ZUBEHOER_TABS } })
        const links = wrapper.findAll('a')

        expect(links[0]?.attributes('aria-current')).toBeUndefined()
        expect(links[1]?.attributes('aria-current')).toBe('page')
    })
})
