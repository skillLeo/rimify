import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Accordion from './Accordion.vue'

/*
 * One question open at a time, each a real button that says „expanded“ or „collapsed“ and names its answer; ↑ ↓ Home End
 * move between the questions. Our own since 29.10.2026: reka-ui measured the page on every tap, and the phone's home
 * page missed its 200 ms budget for it (Accordion.vue).
 */

const items = [
    { id: 1, title: 'Woher weiß ich, welche Felge passt?', body: 'Aus dem Gutachten für dein Fahrzeug.' },
    { id: 2, title: 'Was ist eine Eintragung?', body: 'Ein Vermerk in deinen Fahrzeugpapieren.' },
    { id: 3, title: 'Wie lange dauert der Versand?', body: 'Meist zwei bis vier Werktage.' },
]

describe('Accordion', () => {
    it('opens one answer at a time, says so on its button, and closes it on a second tap', async () => {
        const wrapper = mount(Accordion, { props: { items, level: 3 }, attachTo: document.body })
        const triggers = wrapper.findAll('.accordion__trigger')
        const panels = wrapper.findAll('.accordion__content')

        // Every answer is in the page, hidden until asked for; each button names its answer, each answer its question.
        expect(triggers.map((t) => t.attributes('aria-expanded'))).toEqual(['false', 'false', 'false'])
        expect(panels.map((p) => p.attributes('hidden'))).toEqual(['', '', ''])
        expect(triggers[0]!.attributes('aria-controls')).toBe(panels[0]!.attributes('id'))
        expect(panels[0]!.attributes('aria-labelledby')).toBe(triggers[0]!.attributes('id'))
        expect(panels[0]!.attributes('role')).toBe('region')
        expect(wrapper.findAll('h3.accordion__header')).toHaveLength(3)

        await triggers[1]!.trigger('click')
        expect(triggers.map((t) => t.attributes('aria-expanded'))).toEqual(['false', 'true', 'false'])
        expect(triggers[1]!.attributes('data-state')).toBe('open')
        expect(panels[1]!.attributes('hidden')).toBeUndefined()
        expect(panels[1]!.text()).toBe('Ein Vermerk in deinen Fahrzeugpapieren.')

        await triggers[2]!.trigger('click')
        expect(triggers.map((t) => t.attributes('aria-expanded'))).toEqual(['false', 'false', 'true'])

        await triggers[2]!.trigger('click')
        expect(triggers.map((t) => t.attributes('aria-expanded'))).toEqual(['false', 'false', 'false'])

        wrapper.unmount()
    })

    it('moves between the questions with ↑ ↓ Home and End, and leaves other keys alone', async () => {
        const wrapper = mount(Accordion, { props: { items }, attachTo: document.body })
        const triggers = wrapper.findAll('.accordion__trigger')
        const focused = (): string | null => (document.activeElement as HTMLElement | null)?.textContent?.trim() ?? null

        ;(triggers[0]!.element as HTMLButtonElement).focus()
        await triggers[0]!.trigger('keydown', { key: 'ArrowDown' })
        expect(focused()).toBe(items[1]!.title)

        await triggers[1]!.trigger('keydown', { key: 'End' })
        expect(focused()).toBe(items[2]!.title)

        await triggers[2]!.trigger('keydown', { key: 'ArrowDown' })
        expect(focused()).toBe(items[0]!.title)

        await triggers[0]!.trigger('keydown', { key: 'ArrowUp' })
        expect(focused()).toBe(items[2]!.title)

        await triggers[2]!.trigger('keydown', { key: 'Home' })
        expect(focused()).toBe(items[0]!.title)

        await triggers[0]!.trigger('keydown', { key: 'a' })
        expect(focused()).toBe(items[0]!.title)

        wrapper.unmount()
    })
})
