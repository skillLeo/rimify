import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { VerdictStatus } from '../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Head: defineComponent({ setup: () => () => null }),
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, 'data-inertia': 'link', ...attrs }, slots.default?.()),
    }),
    router: { on: vi.fn(() => () => undefined), delete: vi.fn(), visit: vi.fn() },
}))

const { default: CheckErgebnis } = await import('./Index.vue')

let mounted: VueWrapper[] = []

function mountResult(status: VerdictStatus | null): VueWrapper {
    // Fixture only — the shop's address lives in config/rimify.php; a reserved example domain.
    current.props = { contact: { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' } }
    const wrapper = mount(CheckErgebnis, { props: { token: 'abc123', result: status === null ? null : { status } } })
    mounted.push(wrapper)

    return wrapper
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('CheckErgebnis — "no document" leads to e-mail, not to the old form', () => {
    it('asks by e-mail on UNKNOWN, with the result link already in the mail', () => {
        const wrapper = mountResult('UNKNOWN')
        const primary = wrapper.find('.res__actions a.btn--primary')
        const href = primary.attributes('href') ?? ''
        const query = new URLSearchParams(href.split('?')[1] ?? '')

        expect(primary.text()).toBe('Per E-Mail nachfragen')
        expect(href.startsWith('mailto:service@example.com?')).toBe(true)
        // A plain link: a mail program is not an Inertia visit.
        expect(primary.attributes('data-inertia')).toBeUndefined()
        expect(query.get('body')).toContain('abc123')
        expect(wrapper.find('a[href="/kontakt"]').exists()).toBe(false)
    })

    it('keeps the other states on their Inertia links', () => {
        const wrapper = mountResult('PERMITTED')
        const primary = wrapper.find('.res__actions a.btn--primary')

        expect(primary.attributes('href')).toBe('/felgen')
        expect(primary.attributes('data-inertia')).toBe('link')
    })
})
