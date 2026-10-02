import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'

/*
 * The client's #3 (D-107): of the strip above the header, the one line nothing else on the page says — where to ask
 * and when someone reads it — stands under the hero's selector. It goes to the contact form, never to a mail program
 * (#26), and promises no reply time.
 */

const contact = ref<{ email: string; phone: string | null; phoneIntl: string | null; hours: string }>({
    email: 'info@rimify.de',
    phone: null,
    phoneIntl: null,
    hours: 'Mo–Fr 9:00–17:00 Uhr',
})

vi.mock('../../composables/useShared', () => ({
    useShared: () => ref({ contact: contact.value }),
}))

vi.mock('@inertiajs/vue3', () => ({
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots }) => () => h('a', { href: props.href }, slots.default?.()),
    }),
}))

const { default: HeroHelp } = await import('./HeroHelp.vue')

describe('HeroHelp', () => {
    it('links to the contact form with the hours, and to no mail program', () => {
        const wrapper = mount(HeroHelp, { global: { stubs: { Icon: true } } })

        expect(wrapper.find('a').attributes('href')).toBe('/kontakt')
        expect(wrapper.html()).not.toContain('mailto:')
        expect(wrapper.text()).toContain('Schreib uns')
        expect(wrapper.text()).toContain('Mo–Fr 9:00–17:00 Uhr')
    })

    it('calls the phone instead, only where the client has given one', () => {
        contact.value = { ...contact.value, phone: '0221 123 456', phoneIntl: '+49221123456' }
        const wrapper = mount(HeroHelp, { global: { stubs: { Icon: true } } })

        expect(wrapper.find('a').attributes('href')).toBe('tel:+49221123456')
    })
})
