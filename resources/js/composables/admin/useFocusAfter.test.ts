import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useFocusAfter } from './useFocusAfter'

/*
 * useFocusAfter (K2-03, K2-04, K2-05): the focus lands only on a control that can take it — connected,
 * shown, enabled — once the page has settled, and a waiting request keeps a closing menu from taking the
 * focus back to its trigger.
 */

let api: ReturnType<typeof useFocusAfter>

const Host = defineComponent({
    setup() {
        api = useFocusAfter()

        return () => h('div', [h('button', { id: 'first', disabled: true }, 'eins'), h('button', { id: 'second' }, 'zwei')])
    },
})

const frames = (n = 3): Promise<void> => new Promise((resolve) => setTimeout(resolve, n * 20))

beforeEach(() => {
    // jsdom lays nothing out: every element counts as shown here.
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([new DOMRect(0, 0, 10, 10)] as unknown as DOMRectList)
})

afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
})

describe('useFocusAfter', () => {
    it('waits for a disabled control to be enabled, then gives it the focus', async () => {
        const wrapper = mount(Host, { attachTo: document.body })
        const first = document.getElementById('first') as HTMLButtonElement

        api.request('first')
        await frames()
        expect(document.activeElement).not.toBe(first)

        first.disabled = false
        await frames()
        expect(document.activeElement).toBe(first)

        wrapper.unmount()
    })

    it('takes the first usable of several targets, best first', async () => {
        const wrapper = mount(Host, { attachTo: document.body })

        api.request(['gone', 'first', 'second'])
        await frames()

        expect(document.activeElement?.id).toBe('second')
        wrapper.unmount()
    })

    it('keeps a closing menu from taking the focus back while a request waits', async () => {
        const wrapper = mount(Host, { attachTo: document.body })
        const event = new Event('focus.autoFocusOnUnmount', { cancelable: true })

        api.request('first')
        api.onMenuClose(event)
        expect(event.defaultPrevented).toBe(true)

        const later = new Event('focus.autoFocusOnUnmount', { cancelable: true })
        api.cancel()
        api.onMenuClose(later)
        expect(later.defaultPrevented).toBe(false)

        wrapper.unmount()
    })
})
