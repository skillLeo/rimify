import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

/*
 * The banner for an urgent system problem: there only for the shop closed or a queue dead for an
 * hour, never dismissible — „Später erinnern“ hides it now and saves an 8-hour reminder on the
 * account — and leading to System › Zustand, which explains it.
 */

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const { default: AdminHealthBanner } = await import('./AdminHealthBanner.vue')

function mountBanner(health: Record<string, unknown> | null) {
    current.props = { admin: { health } }

    return mount(AdminHealthBanner)
}

const QUEUE = {
    state: 'warn',
    sentence: 'Warteschlange steht seit 2 Stunden',
    label: 'Warteschlange stockt',
    count: '2 Std',
    href: '/admin/system',
    banner: { key: 'queue', sentence: 'Die Warteschlange steht seit 2 Stunden: E-Mails und andere Hintergrundaufgaben werden nicht abgearbeitet.' },
}

afterEach(() => vi.unstubAllGlobals())

describe('AdminHealthBanner', () => {
    it('is not there without an urgent problem', () => {
        expect(mountBanner({ ...QUEUE, banner: null }).find('.adm-banner').exists()).toBe(false)
        expect(mountBanner(null).find('.adm-banner').exists()).toBe(false)
    })

    it('says the problem in a sentence, leads to System › Zustand, and has no way to close it', () => {
        const banner = mountBanner(QUEUE).find('.adm-banner')

        expect(banner.attributes('role')).toBe('alert')
        expect(banner.find('.adm-banner__text').text()).toBe(QUEUE.banner.sentence)
        expect(banner.find('a').attributes('href')).toBe('/admin/system')
        expect(banner.findAll('button').map((b) => b.text())).toEqual(['Später erinnern'])
    })

    it('wears the failure tint for maintenance mode, the warning tint for a dead queue', () => {
        expect(mountBanner(QUEUE).find('.adm-banner--warn').exists()).toBe(true)
        expect(mountBanner({ ...QUEUE, state: 'bad', banner: { key: 'maintenance', sentence: 'Wartungsmodus.' } }).find('.adm-banner--bad').exists()).toBe(true)
    })

    it('„Später erinnern“ hides it at once and asks the server to remember it for this problem', async () => {
        const fetch = vi.fn(async () => ({ ok: true }))
        vi.stubGlobal('fetch', fetch)
        const wrapper = mountBanner(QUEUE)

        await wrapper.find('button').trigger('click')

        expect(wrapper.find('.adm-banner').exists()).toBe(false)
        expect(fetch).toHaveBeenCalledWith('/admin/ansicht', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ snooze: 'queue' }) }))
    })
})
