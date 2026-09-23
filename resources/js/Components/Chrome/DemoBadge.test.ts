import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { provideMobileShell } from '../../composables/mobile/useMobileShell'
import { provideShell } from '../../composables/useShell'
import type { ContactProp } from '../../types/rimify'

const current: { props: Record<string, unknown> } = { props: {} }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => current,
    router: { delete: vi.fn(), on: vi.fn(() => () => undefined) },
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const { default: DemoBadge } = await import('./DemoBadge.vue')
const { default: SiteHeader } = await import('./SiteHeader.vue')
const { default: AppBar } = await import('../Mobile/AppBar.vue')

// Fixtures only — the shop's details live in config/rimify.php; a reserved example domain.
const CONTACT: ContactProp = { email: 'service@example.com', phone: null, phoneIntl: null, whatsapp: null, hours: 'Mo–Fr 9:00–17:00 Uhr' }

function shared(demo: boolean | undefined): Record<string, unknown> {
    return { demoBadge: demo, contact: CONTACT, vehicle: null, cartCount: 0, routeName: 'startseite', menus: {}, mega: { brands: [], sizes: [], makes: [], popular: [] } }
}

let mounted: VueWrapper[] = []

function track(wrapper: VueWrapper): VueWrapper {
    mounted.push(wrapper)

    return wrapper
}

const UnderShell = defineComponent({
    setup() {
        provideShell()

        return () => h(SiteHeader)
    },
})

const UnderPhoneShell = defineComponent({
    props: { top: Boolean, title: { type: String, default: undefined } },
    setup(props) {
        provideMobileShell()

        return () => h(AppBar, props)
    },
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
})

describe('DemoBadge', () => {
    it('says Demodaten while the server shares demo', () => {
        current.props = shared(true)
        const wrapper = track(mount(DemoBadge))

        expect(wrapper.find('.demo-badge').text()).toBe('Demodaten')
    })

    it('renders nothing without demonstration rows, or without the flag', () => {
        current.props = shared(false)
        expect(track(mount(DemoBadge)).find('.demo-badge').exists()).toBe(false)

        current.props = shared(undefined)
        expect(track(mount(DemoBadge)).find('.demo-badge').exists()).toBe(false)
    })
})

describe('the badge in the headers', () => {
    const stubs = { MegaMenu: true, SearchBox: true, VehicleBar: true }

    it('sits in the desktop utility strip and in the phone header row', () => {
        current.props = shared(true)
        const wrapper = track(mount(UnderShell, { global: { stubs } }))

        expect(wrapper.find('.utility__row .demo-badge').exists()).toBe(true)
        // The phone row's badge follows the wordmark and is hidden from 1024 px, where the strip shows.
        const phone = wrapper.find('.sh__bar > .demo-badge')
        expect(phone.exists()).toBe(true)
        expect(phone.classes()).toContain('until-lg')
        expect(phone.element.previousElementSibling?.classList.contains('brand')).toBe(true)
    })

    it('drops the unconfirmed "als PDF" from the utility strip', () => {
        current.props = shared(false)
        const wrapper = track(mount(UnderShell, { global: { stubs } }))

        expect(wrapper.find('.utility__row').text()).toContain('Gutachten zu jeder Felge')
        expect(wrapper.find('.utility__row').text()).not.toContain('PDF')
        expect(wrapper.find('.demo-badge').exists()).toBe(false)
    })

    it('sits after the wordmark or the title in the phone app bar, outside the two actions', () => {
        current.props = shared(true)

        const top = track(mount(UnderPhoneShell, { props: { top: true } }))
        expect(top.find('.mbar__row > .demo-badge').exists()).toBe(true)
        expect(top.find('.mbar__tools .demo-badge').exists()).toBe(false)

        const inner = track(mount(UnderPhoneShell, { props: { title: 'Kontakt' } }))
        const badge = inner.find('.mbar__row > .demo-badge')
        expect(badge.exists()).toBe(true)
        expect(badge.element.previousElementSibling?.classList.contains('mbar__title')).toBe(true)
    })
})
