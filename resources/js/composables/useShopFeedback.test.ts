import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../Components/Chrome/ShopFeedback.vue', () => ({
    default: { name: 'ShopFeedbackStub', render: () => h('button', { class: 'shop-fb' }, 'Rückmeldung geben') },
}))

const { useShopFeedback } = await import('./useShopFeedback')

/*
 * D-255: the review's feedback button is loaded once the page is awake — for a reviewer only, never drawn by the server,
 * so never hydrated (#23's iPhone pass on the preview, 16.10.2026).
 */
function host(reviewer: { value: boolean }) {
    return defineComponent({
        setup() {
            const component = useShopFeedback(() => reviewer.value)

            return () => (component.value ? h(component.value) : h('span', { class: 'none' }))
        },
    })
}

describe('useShopFeedback', () => {
    it('loads the button for a reviewer once the page is mounted', async () => {
        const wrapper = mount(host(ref(true)))
        await flushPromises()

        expect(wrapper.find('.shop-fb').exists()).toBe(true)
    })

    it('never loads it for a visitor — and loads it when the page learns it has a reviewer', async () => {
        const reviewer = ref(false)
        const wrapper = mount(host(reviewer))
        await flushPromises()

        expect(wrapper.find('.shop-fb').exists()).toBe(false)

        reviewer.value = true
        await flushPromises()

        expect(wrapper.find('.shop-fb').exists()).toBe(true)
    })
})
