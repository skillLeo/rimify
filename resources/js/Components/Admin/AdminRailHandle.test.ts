import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref } from 'vue'
import AdminRailHandle from './AdminRailHandle.vue'
import { provideAdminShell } from '../../composables/admin/useAdmin'
import type { RailState } from '../../composables/admin/railResize'

/*
 * The rail's handle from the keyboard and to a screen reader: a separator with its range and value,
 * arrows by 16 px (Shift: 48), Home and End, Enter and Space to collapse and open, a double-click back
 * to 260 — and the result said once the keys stop, never the pixels on the way.
 */

const width = ref(260)
const collapsed = ref(false)
const set = vi.fn((state: RailState) => {
    width.value = state.width
    collapsed.value = state.collapsed
})

let wrapper: VueWrapper

function mountHandle(): VueWrapper {
    wrapper = mount(
        defineComponent({
            setup() {
                provideAdminShell({
                    paletteOpen: ref(false),
                    shortcutsOpen: ref(false),
                    railCollapsed: collapsed,
                    toggleRail: () => undefined,
                    rail: {
                        width,
                        shown: computed(() => collapsed.value),
                        forced: computed(() => false),
                        resizing: ref(false),
                        set,
                    },
                })

                return () => h(AdminRailHandle)
            },
        }),
        { attachTo: document.body }
    )

    return wrapper
}

beforeEach(() => {
    width.value = 260
    collapsed.value = false
    set.mockClear()
    vi.useFakeTimers()
    // A page wide enough for any width beside the content's 960 px (no .adm here: the document's width).
    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1920, configurable: true })
})

afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    Reflect.deleteProperty(document.documentElement, 'clientWidth')
})

describe('AdminRailHandle', () => {
    it('is a vertical separator with its range and its value, named „Seitenleistenbreite“', () => {
        const handle = mountHandle().get('[role="separator"]')

        expect(handle.attributes()).toMatchObject({
            'aria-orientation': 'vertical',
            'aria-label': 'Seitenleistenbreite',
            'aria-valuemin': '232',
            'aria-valuemax': '400',
            'aria-valuenow': '260',
            'aria-valuetext': 'Seitenleiste 260 Pixel breit',
            tabindex: '0',
        })
    })

    it('moves 16 px with an arrow and 48 with Shift, and keeps the value live', async () => {
        const handle = mountHandle().get('[role="separator"]')

        await handle.trigger('keydown', { key: 'ArrowRight' })
        expect(set).toHaveBeenLastCalledWith({ collapsed: false, width: 276 }, { animate: false, save: 'soon' })

        await handle.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
        expect(set).toHaveBeenLastCalledWith({ collapsed: false, width: 324 }, { animate: false, save: 'soon' })
        expect(handle.attributes('aria-valuenow')).toBe('324')
    })

    it('goes home to 260 and to the end at 400', async () => {
        width.value = 332
        const handle = mountHandle().get('[role="separator"]')

        await handle.trigger('keydown', { key: 'End' })
        expect(set).toHaveBeenLastCalledWith({ collapsed: false, width: 400 }, { animate: false, save: 'soon' })

        await handle.trigger('keydown', { key: 'Home' })
        expect(set).toHaveBeenLastCalledWith({ collapsed: false, width: 260 }, { animate: true, save: 'soon' })
    })

    it('collapses and opens with Enter and Space, animated', async () => {
        const handle = mountHandle().get('[role="separator"]')

        await handle.trigger('keydown', { key: 'Enter' })
        expect(set).toHaveBeenLastCalledWith({ collapsed: true, width: 260 }, { animate: true, save: 'soon' })
        expect(handle.attributes('aria-valuetext')).toBe('Seitenleiste eingeklappt')

        await handle.trigger('keydown', { key: ' ' })
        expect(set).toHaveBeenLastCalledWith({ collapsed: false, width: 260 }, { animate: true, save: 'soon' })
    })

    it('resets to 260 on a double-click, saved at once', async () => {
        width.value = 372
        await mountHandle().get('[role="separator"]').trigger('dblclick')

        expect(set).toHaveBeenLastCalledWith({ collapsed: false, width: 260 }, { animate: true, save: 'now' })
    })

    it('says where it ended, once the keys stop — not at every press', async () => {
        const handle = mountHandle().get('[role="separator"]')
        const status = wrapper.get('[role="status"]')

        await handle.trigger('keydown', { key: 'ArrowRight' })
        await handle.trigger('keydown', { key: 'ArrowRight' })
        await handle.trigger('keydown', { key: 'ArrowRight' })
        await vi.advanceTimersByTimeAsync(200)
        expect(status.text()).toBe('')

        await vi.advanceTimersByTimeAsync(600)
        expect(status.text()).toBe('Seitenleiste 308 Pixel breit')
    })

    it('does nothing with a key it has no use for', async () => {
        await mountHandle().get('[role="separator"]').trigger('keydown', { key: 'a' })

        expect(set).not.toHaveBeenCalled()
    })
})
