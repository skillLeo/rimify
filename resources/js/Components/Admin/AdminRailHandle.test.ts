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
const max = ref(400)
const set = vi.fn((state: RailState) => {
    width.value = state.width
    collapsed.value = state.collapsed
})
const toggle = vi.fn(() => {
    collapsed.value = !collapsed.value
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
                    toggleRail: toggle,
                    rail: {
                        width,
                        max,
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
    max.value = 400
    set.mockClear()
    toggle.mockClear()
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

    it('collapses and opens with Enter and Space — the toggle’s own move, which keeps the width', async () => {
        const handle = mountHandle().get('[role="separator"]')

        await handle.trigger('keydown', { key: 'Enter' })
        expect(toggle).toHaveBeenCalledTimes(1)
        expect(handle.attributes('aria-valuetext')).toBe('Seitenleiste eingeklappt')

        await handle.trigger('keydown', { key: ' ' })
        expect(toggle).toHaveBeenCalledTimes(2)
        expect(set).not.toHaveBeenCalled()
    })

    it('saves the width once the keys stop, as it is then — the keyboard’s pointerup', async () => {
        const handle = mountHandle().get('[role="separator"]')

        await handle.trigger('keydown', { key: 'ArrowRight' })
        await handle.trigger('keydown', { key: 'ArrowRight' })
        await vi.advanceTimersByTimeAsync(600)

        expect(set).toHaveBeenLastCalledWith({ collapsed: false, width: 292 }, { save: 'now' })
    })

    it('leaves Alt, Ctrl and ⌘ to the browser — Alt+← is Back', async () => {
        const handle = mountHandle().get('[role="separator"]')

        await handle.trigger('keydown', { key: 'ArrowLeft', altKey: true })
        await handle.trigger('keydown', { key: 'ArrowRight', ctrlKey: true })
        await handle.trigger('keydown', { key: 'End', metaKey: true })

        expect(set).not.toHaveBeenCalled()
    })

    it('says as its maximum the widest the window allows', () => {
        max.value = 305

        expect(mountHandle().get('[role="separator"]').attributes('aria-valuemax')).toBe('305')
    })

    it('resets to 260 on a double-click, saved and said once — its two clicks move nothing', async () => {
        width.value = 372
        const handle = mountHandle().get('[role="separator"]')

        for (let click = 0; click < 2; click++) {
            await handle.trigger('pointerdown', { button: 0, clientX: 372, pointerId: 1 })
            await handle.trigger('pointerup', { button: 0, clientX: 372, pointerId: 1 })
        }

        expect(set).not.toHaveBeenCalled()

        await handle.trigger('dblclick')
        expect(set).toHaveBeenCalledTimes(1)
        expect(set).toHaveBeenLastCalledWith({ collapsed: false, width: 260 }, { animate: true, save: 'now' })
    })

    it('ends under the pointer: a release with no move of its own still counts', async () => {
        const handle = mountHandle().get('[role="separator"]')

        await handle.trigger('pointerdown', { button: 0, clientX: 260, pointerId: 1 })
        await handle.trigger('pointerup', { button: 0, clientX: 350, pointerId: 1 })

        expect(set).toHaveBeenLastCalledWith({ collapsed: false, width: 350 }, { save: 'now' })
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
