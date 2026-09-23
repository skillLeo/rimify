import { describe, expect, it } from 'vitest'
import { isTyping, shortcutFor } from './useShortcuts'

function keydown(key: string, options: Partial<KeyboardEventInit> & { target?: HTMLElement } = {}): KeyboardEvent {
    const { target, ...init } = options
    const event = new KeyboardEvent('keydown', { key, ...init })

    if (target) {
        Object.defineProperty(event, 'target', { value: target })
    }

    return event
}

describe('shortcutFor', () => {
    it('maps the three keys to their handlers on the page', () => {
        expect(shortcutFor(keydown('/'))).toBe('onSearch')
        expect(shortcutFor(keydown('?'))).toBe('onHelp')
        expect(shortcutFor(keydown('k', { ctrlKey: true }))).toBe('onPalette')
        expect(shortcutFor(keydown('K', { metaKey: true }))).toBe('onPalette')
    })

    it('never fires the page shortcuts while the visitor is typing', () => {
        const input = document.createElement('input')
        const area = document.createElement('textarea')

        expect(shortcutFor(keydown('/', { target: input }))).toBeNull()
        expect(shortcutFor(keydown('?', { target: area }))).toBeNull()
    })

    it('still opens the palette from inside a field, as every editor does', () => {
        const input = document.createElement('input')

        expect(shortcutFor(keydown('k', { ctrlKey: true, target: input }))).toBe('onPalette')
    })

    it('ignores other keys and modified keys', () => {
        expect(shortcutFor(keydown('a'))).toBeNull()
        expect(shortcutFor(keydown('/', { altKey: true }))).toBeNull()
        expect(shortcutFor(keydown('Escape'))).toBeNull()
    })
})

describe('isTyping', () => {
    it('recognises fields, selects and editable regions', () => {
        const editable = document.createElement('div')
        Object.defineProperty(editable, 'isContentEditable', { value: true })

        expect(isTyping(document.createElement('input'))).toBe(true)
        expect(isTyping(document.createElement('select'))).toBe(true)
        expect(isTyping(editable)).toBe(true)
        expect(isTyping(document.createElement('button'))).toBe(false)
        expect(isTyping(null)).toBe(false)
    })
})
