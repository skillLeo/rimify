import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import RechnerShare from './RechnerShare.vue'

const PARAM = '8.5x40x0_9.5x45x10'

let mounted: VueWrapper[] = []

function mountShare(props: Record<string, unknown> = {}): VueWrapper {
    const wrapper = mount(RechnerShare, { props: { param: PARAM, ...props }, attachTo: document.body })
    mounted.push(wrapper)

    return wrapper
}

function clipboard(writeText: unknown): void {
    Object.defineProperty(navigator, 'clipboard', { value: writeText === undefined ? undefined : { writeText }, configurable: true })
}

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    document.body.innerHTML = ''
    vi.useRealTimers()
})

describe('RechnerShare', () => {
    it('is one button that holds the page address with the comparison, and follows the figures — no address field', async () => {
        window.history.replaceState(null, '', '/felgenrechner?beliebt=neu')
        const wrapper = mountShare()
        const button = wrapper.get('button')

        // Before mount the button holds the relative address (the same on the server); mounted, the page's own.
        expect(button.attributes('data-href')).toBe(`/felgenrechner?rechner=${PARAM}`)
        await nextTick()

        expect(wrapper.find('input').exists()).toBe(false)
        expect(button.attributes('data-href')).toBe(`${window.location.origin}/felgenrechner?beliebt=neu&rechner=${PARAM}`)

        await wrapper.setProps({ param: '8x45x0_8x40x0' })
        expect(button.attributes('data-href')).toContain('rechner=8x45x0_8x40x0')
    })

    it('copies the link, stays busy for one --d-2, then says so', async () => {
        vi.useFakeTimers()
        const writeText = vi.fn().mockResolvedValue(undefined)
        clipboard(writeText)
        const wrapper = mountShare()
        const button = wrapper.find('button')

        expect(button.attributes('type')).toBe('button')
        expect(button.text()).toBe('Link zu dieser Berechnung kopieren')

        await button.trigger('click')
        await flushPromises()

        expect(writeText).toHaveBeenCalledTimes(1)
        expect(String(writeText.mock.calls[0]?.[0])).toContain(`rechner=${PARAM}`)
        expect(button.attributes('aria-busy')).toBe('true')
        expect(wrapper.find('[role="status"]').text()).toBe('')

        vi.advanceTimersByTime(250)
        await flushPromises()

        expect(button.attributes('aria-busy')).toBeUndefined()
        expect(wrapper.find('[role="status"]').text()).toBe('Link kopiert.')
    })

    it('points at the address bar when the clipboard is not available', async () => {
        vi.useFakeTimers()
        clipboard(undefined)
        const wrapper = mountShare()

        await wrapper.find('button').trigger('click')
        await flushPromises()
        vi.advanceTimersByTime(250)
        await flushPromises()

        expect(wrapper.find('[role="status"]').text()).toBe('Kopieren nicht möglich – der Link steht in der Adresszeile.')
    })

    it('renders the button full-width on the phone, and at the full 44 px everywhere', () => {
        expect(mountShare({ block: true }).find('button').classes()).toContain('btn--block')
        expect(mountShare().find('button').classes()).not.toContain('btn--block')
        expect(mountShare().find('button').classes()).not.toContain('btn--sm')
    })
})
