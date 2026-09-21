import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import KomplettradWheel from './KomplettradWheel.vue'

describe('KomplettradWheel', () => {
    it('renders the cut-out lazily at the phone width, and says what the picture is', () => {
        const wrapper = mount(KomplettradWheel)

        const img = wrapper.find('.komplett-wheel__turn img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('alt')).toBe('Komplettrad, Ansicht von vorn')
        expect(img.attributes('loading')).toBe('lazy')
        expect(img.attributes('sizes')).toBe('240px')
        expect(img.attributes('src')).toMatch(/hero-wheel-\d+\.png$/)
        // Square, so the turn never changes the layout box.
        expect(img.attributes('width')).toBe(img.attributes('height'))
    })

    it('falls back to the drawn wheel when the picture fails, and never to a photograph', async () => {
        const wrapper = mount(KomplettradWheel)

        await wrapper.find('img').trigger('error')
        expect(wrapper.find('img').exists()).toBe(false)
        expect(wrapper.find('.komplett-wheel__fallback svg.outline').exists()).toBe(true)
        expect(wrapper.find('.komplett-wheel__fallback').attributes('aria-hidden')).toBe('true')
    })
})
