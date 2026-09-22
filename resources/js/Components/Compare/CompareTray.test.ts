import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { provideMobileShell } from '../../composables/mobile/useMobileShell'
import { useCompare, type CompareEntry } from '../../stores/compare'

const shared: { props: Record<string, unknown> } = { props: { isMobile: false, routeName: 'startseite' } }

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => shared,
    Link: defineComponent({
        props: { href: { type: String, required: true } },
        setup: (props, { slots, attrs }) => () => h('a', { href: props.href, ...attrs }, slots.default?.()),
    }),
}))

const { default: CompareTray } = await import('./CompareTray.vue')

function entry(n: number): CompareEntry {
    return { modelId: n, finishId: 1, slug: `m-${n}`, brandName: 'Demo', modelName: `Zehnspeiche Z-0${n}`, finishName: 'Silber', image: null, fromPriceCents: 68900 }
}

let wrappers: VueWrapper[] = []

/* The tray chooses its phone anatomy by the phone shell providing (MobileLayout), not by the device flag. */
const UnderPhoneShell = defineComponent({
    props: { hidden: Boolean, bottomNav: Boolean },
    setup(props) {
        provideMobileShell({ tabBar: ref(true) })

        return () => h(CompareTray, props)
    },
})

function mountTray(props: { hidden?: boolean; bottomNav?: boolean } = {}, phoneShell = false): VueWrapper {
    const wrapper = mount(phoneShell ? UnderPhoneShell : CompareTray, { props, attachTo: document.body, global: { stubs: { BottomSheet: true } } })
    wrappers.push(wrapper)

    return wrapper
}

beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
    shared.props = { isMobile: false, routeName: 'startseite' }
})

afterEach(() => {
    wrappers.forEach((w) => w.unmount())
    wrappers = []
    document.body.innerHTML = ''
    delete document.documentElement.dataset.tray
})

describe('CompareTray', () => {
    it('renders nothing while the list is empty, and reads the list the browser kept', async () => {
        window.localStorage.setItem('rmf_compare', JSON.stringify({ v: 1, items: [entry(1)] }))
        const wrapper = mountTray()

        // Mounted: hydrated from storage.
        await nextTick()
        expect(wrapper.find('.tray').exists()).toBe(true)
        expect(document.documentElement.dataset.tray).toBe('open')

        useCompare().clear()
        await nextTick()
        expect(wrapper.find('.tray').exists()).toBe(false)
        expect(document.documentElement.dataset.tray).toBeUndefined()
    })

    it('names the region, counts, and disables the button below two with the reason before it', async () => {
        const wrapper = mountTray()
        const store = useCompare()
        store.add(entry(1))
        await nextTick()

        const tray = wrapper.find('.tray')
        expect(tray.attributes('role')).toBe('region')
        expect(tray.attributes('aria-label')).toBe('Vergleich')
        expect(tray.findAll('.tray__thumb')).toHaveLength(1)
        expect(tray.find('.tray__count').text()).toContain('1 von 4')
        expect(tray.find('.tray__count').text()).toContain('Wähle mindestens 2 Felgen.')

        const go = tray.find('.tray__go')
        expect(go.element.tagName).toBe('BUTTON')
        expect(go.attributes('aria-disabled')).toBe('true')
        expect(go.text()).toBe('Vergleichen (1)')

        store.add(entry(2))
        await nextTick()
        const link = wrapper.find('.tray__go')
        expect(link.element.tagName).toBe('A')
        expect(link.attributes('href')).toBe('/vergleich?f=1:1,2:1')
        expect(link.text()).toBe('Vergleichen (2)')
        expect(wrapper.find('.tray__count').text()).not.toContain('Wähle mindestens')
    })

    it('removes one wheel by its named button, or all of them', async () => {
        const wrapper = mountTray()
        const store = useCompare()
        store.add(entry(1))
        store.add(entry(2))
        await nextTick()

        const remove = wrapper.findAll('.tray__remove')
        expect(remove.map((b) => b.attributes('aria-label'))).toEqual(['Demo Zehnspeiche Z-01 aus dem Vergleich entfernen', 'Demo Zehnspeiche Z-02 aus dem Vergleich entfernen'])
        expect(remove[0]!.attributes('type')).toBe('button')

        await remove[0]!.trigger('click')
        expect(store.keys).toEqual(['2:1'])

        await wrapper.find('.tray__clear').trigger('click')
        expect(store.keys).toEqual([])
        await nextTick()
        expect(wrapper.find('.tray').exists()).toBe(false)
    })

    it('steps aside on the compare page, the basket, the checkout and under a sticky bar', async () => {
        const store = useCompare()
        store.hydrate()
        store.add(entry(1))

        shared.props = { isMobile: false, routeName: 'vergleich.index' }
        expect(mountTray().find('.tray').exists()).toBe(false)

        shared.props = { isMobile: false, routeName: 'kasse.index' }
        expect(mountTray().find('.tray').exists()).toBe(false)

        shared.props = { isMobile: false, routeName: 'felgen.index' }
        const hidden = mountTray({ hidden: true })
        await nextTick()
        expect(hidden.find('.tray').exists()).toBe(false)
        expect(store.keys).toEqual(['1:1'])
    })

    it('renders the phone anatomy under the phone shell', async () => {
        shared.props = { isMobile: true, routeName: 'startseite' }
        const wrapper = mountTray({ bottomNav: true }, true)
        const store = useCompare()
        store.add(entry(1))
        store.add(entry(2))
        await nextTick()

        const button = wrapper.find('.tray__thumbs-btn')
        expect(button.attributes('aria-label')).toBe('Deinen Vergleich anzeigen, 2 von 4')
        expect(button.findAll('.tray__thumb')).toHaveLength(2)
        expect(wrapper.find('.tray').classes()).toContain('tray--phone')
        expect(wrapper.find('.tray__go').attributes('href')).toBe('/vergleich?f=1:1,2:1')
    })
})
