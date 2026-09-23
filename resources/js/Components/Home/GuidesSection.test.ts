import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { GuideTeaser } from '../../types/pages'

/*
 * H10 · the guides: one lead and up to two small articles, each a link with its own teaser — and
 * with exactly two articles, two equals across the row rather than a lead beside a hole.
 */

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: GuidesSection } = await import('./GuidesSection.vue')

function guide(n: number): GuideTeaser {
    return { slug: `ratgeber-${n}`, title: `Ratgeber ${n}`, teaser: `Vorschau ${n}.`, minutes: n }
}

describe('GuidesSection', () => {
    it('renders three guides as a lead and two small articles, every one a link with its teaser', () => {
        const wrapper = mount(GuidesSection, { props: { guides: [guide(1), guide(2), guide(3)] } })

        expect(wrapper.find('.guides__grid').classes()).not.toContain('guides__grid--pair')
        expect(wrapper.findAll('article')).toHaveLength(3)
        expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toEqual(['/ratgeber/ratgeber-1', '/ratgeber/ratgeber-2', '/ratgeber/ratgeber-3'])
        expect(wrapper.findAll('.guide__teaser').map((p) => p.text())).toEqual(['Vorschau 1.', 'Vorschau 2.', 'Vorschau 3.'])
        expect(wrapper.find('.guide--lead h3').classes()).toContain('h3')
        expect(wrapper.findAll('.guides__aside h3').map((h3) => h3.classes()).flat()).toEqual(['h4', 'h4'])
        expect(wrapper.text()).toContain('2 Min. Lesezeit')
    })

    it('shows exactly two guides as equals, both with the lead’s type size and their teasers', () => {
        const wrapper = mount(GuidesSection, { props: { guides: [guide(1), guide(2)] } })

        expect(wrapper.find('.guides__grid').classes()).toContain('guides__grid--pair')
        expect(wrapper.findAll('article')).toHaveLength(2)
        expect(wrapper.findAll('h3').map((h3) => h3.classes()).flat()).toEqual(['h3', 'h3'])
        expect(wrapper.findAll('.guide__teaser')).toHaveLength(2)
    })

    it('prints no teaser paragraph for a guide without one', () => {
        const wrapper = mount(GuidesSection, { props: { guides: [guide(1), { ...guide(2), teaser: '' }, guide(3)] } })

        expect(wrapper.findAll('.guide__teaser')).toHaveLength(2)
    })
})
