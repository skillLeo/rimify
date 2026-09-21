import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { trapTab, useOverlay } from './useDialog'

function panel(): HTMLElement {
    const el = document.createElement('div')
    el.innerHTML = '<button id="a">A</button><a id="b" href="/x">B</a><button id="c" disabled>C</button>'
    document.body.append(el)

    return el
}

function tab(shiftKey = false): KeyboardEvent {
    return new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true })
}

afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.removeProperty('overflow')
})

describe('trapTab', () => {
    it('wraps from the last control back to the first, skipping disabled ones', () => {
        const el = panel()
        el.querySelector<HTMLElement>('#b')?.focus()

        const event = tab()
        trapTab(event, el)

        expect(event.defaultPrevented).toBe(true)
        expect(document.activeElement?.id).toBe('a')
    })

    it('wraps backwards from the first control to the last', () => {
        const el = panel()
        el.querySelector<HTMLElement>('#a')?.focus()

        const event = tab(true)
        trapTab(event, el)

        expect(document.activeElement?.id).toBe('b')
    })

    it('leaves Tab alone between two controls inside the panel', () => {
        const el = panel()
        el.querySelector<HTMLElement>('#a')?.focus()

        const event = tab()
        trapTab(event, el)

        expect(event.defaultPrevented).toBe(false)
    })
})

describe('useOverlay', () => {
    function host() {
        const open = ref(false)
        const container = ref<HTMLElement | null>(null)

        const Host = defineComponent({
            setup() {
                useOverlay(open, container)

                return () =>
                    h('div', [
                        h('button', { id: 'opener', onClick: () => (open.value = true) }, 'Filter'),
                        open.value
                            ? h('div', { ref: container, role: 'dialog' }, [h('button', { id: 'inside' }, 'X')])
                            : null,
                    ])
            },
        })

        return { open, wrapper: mount(Host, { attachTo: document.body }) }
    }

    it('closes on Escape, unlocks the page and hands focus back to the opener', async () => {
        const { open, wrapper } = host()
        const opener = wrapper.find('#opener').element as HTMLElement
        opener.focus()

        await wrapper.find('#opener').trigger('click')
        await nextTick()
        await nextTick()

        expect(document.body.style.overflow).toBe('hidden')
        expect(document.activeElement?.id).toBe('inside')

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
        await nextTick()
        await nextTick()

        expect(open.value).toBe(false)
        expect(document.body.style.overflow).toBe('')
        expect(document.activeElement?.id).toBe('opener')

        wrapper.unmount()
    })

    it('does nothing with Escape while closed', () => {
        const { open, wrapper } = host()

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

        expect(open.value).toBe(false)
        wrapper.unmount()
    })
})
