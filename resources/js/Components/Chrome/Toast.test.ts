import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

type Listener = (event: { detail: { page: { props: Record<string, unknown> } } }) => void

const listeners: Record<string, Listener[]> = {}
const current: { props: Record<string, unknown> } = { props: { flash: { toast: null } } }

vi.mock('@inertiajs/vue3', () => ({
    router: {
        on(name: string, listener: Listener) {
            ;(listeners[name] ??= []).push(listener)

            return () => {
                listeners[name] = (listeners[name] ?? []).filter((l) => l !== listener)
            }
        },
    },
    usePage: () => current,
}))

const { default: Toast } = await import('./Toast.vue')
const { toastFrom, TOAST_MS } = await import('./toast')

/** A server response arriving, as Inertia announces it. */
function respond(toast: string | null): void {
    for (const listener of listeners.success ?? []) {
        listener({ detail: { page: { props: { flash: { toast } } } } })
    }
}

function navigationType(type: string): void {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type } as unknown as PerformanceEntry])
}

describe('Toast', () => {
    beforeEach(() => {
        current.props = { flash: { toast: null } }
        navigationType('navigate')
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
        for (const key of Object.keys(listeners)) delete listeners[key]
    })

    it('shows the same confirmation again when the customer adds a second time', async () => {
        const wrapper = mount(Toast)

        respond('Zum Warenkorb hinzugefügt.')
        await nextTick()
        expect(wrapper.find('.toast').text()).toContain('Zum Warenkorb hinzugefügt.')

        await wrapper.find('.toast__close').trigger('click')
        expect(wrapper.find('.toast').exists()).toBe(false)

        // The identical string: a watcher on the text never fired here.
        respond('Zum Warenkorb hinzugefügt.')
        await nextTick()
        expect(wrapper.find('.toast').exists()).toBe(true)
    })

    it('stays quiet for a response that flashed nothing', async () => {
        const wrapper = mount(Toast)

        respond(null)
        await nextTick()

        expect(wrapper.find('.toast').exists()).toBe(false)
    })

    it('does not replay an old confirmation when the back button restores a page', async () => {
        navigationType('back_forward')
        current.props = { flash: { toast: 'Zum Warenkorb hinzugefügt.' } }

        const wrapper = mount(Toast)
        await nextTick()

        expect(wrapper.find('.toast').exists()).toBe(false)
    })

    it('shows a confirmation that arrived with a full page load', async () => {
        current.props = { flash: { toast: 'Fahrzeug entfernt.' } }

        const wrapper = mount(Toast)
        await nextTick()

        expect(wrapper.find('.toast').text()).toContain('Fahrzeug entfernt.')
    })

    it('dismisses itself after a few seconds', async () => {
        vi.useFakeTimers()
        const wrapper = mount(Toast)

        respond('Position entfernt.')
        await nextTick()
        vi.advanceTimersByTime(TOAST_MS + 10)
        await nextTick()

        expect(wrapper.find('.toast').exists()).toBe(false)
    })

    it('keeps the live region in the document so an inserted message is announced', () => {
        const wrapper = mount(Toast)

        expect(wrapper.find('[role="status"][aria-live="polite"]').exists()).toBe(true)
    })

    it('stops listening when it unmounts', () => {
        const wrapper = mount(Toast)
        expect(listeners.success).toHaveLength(1)

        wrapper.unmount()
        expect(listeners.success).toHaveLength(0)
    })
})

describe('toastFrom', () => {
    it('reads the flashed text and ignores anything else', () => {
        expect(toastFrom({ flash: { toast: 'Fahrzeug entfernt.' } })).toBe('Fahrzeug entfernt.')
        expect(toastFrom({ flash: { toast: '  ' } })).toBeNull()
        expect(toastFrom({ flash: null })).toBeNull()
        expect(toastFrom({})).toBeNull()
        expect(toastFrom(undefined)).toBeNull()
    })
})
