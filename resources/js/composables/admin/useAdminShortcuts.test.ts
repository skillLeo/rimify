import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref } from 'vue'
import type { AdminNavGroup } from '../../types/admin'

/*
 * The admin's keyboard. The rules worth pinning: a shortcut never fires while somebody is typing
 * (except the modifier ones), a `g` target the viewer does not have is not bound, and `[` works on
 * a German keyboard, where it is AltGr 8.
 */

const visit = vi.fn()

vi.mock('@inertiajs/vue3', () => ({
    router: { visit: (...args: unknown[]) => visit(...args) },
}))

const { goTargets, useAdminShortcuts } = await import('./useAdminShortcuts')

const NAV: AdminNavGroup[] = [
    { key: 'uebersicht', label: 'Übersicht', icon: 'grid', pages: [{ label: 'Übersicht', href: '/admin', icon: 'grid', count: null, countTone: 'neutral' }] },
    {
        key: 'katalog',
        label: 'Katalog',
        icon: 'box',
        pages: [{ label: 'Wuchtgewichte-Farben', href: '/admin/wuchtgewichte', icon: 'wrench', count: null, countTone: 'neutral' }],
    },
    { key: 'gutachten', label: 'Gutachten', icon: 'document', pages: [{ label: 'Dokumente', href: '/admin/gutachten', icon: 'document', count: null, countTone: 'neutral' }] },
]

let mounted: VueWrapper[] = []
let wide = true

function mountKeys(): { palette: ReturnType<typeof ref<boolean>>; shortcuts: ReturnType<typeof ref<boolean>>; toggle: ReturnType<typeof vi.fn> } {
    const palette = ref(false)
    const shortcuts = ref(false)
    const toggle = vi.fn()

    mounted.push(
        mount(
            defineComponent({
                setup() {
                    useAdminShortcuts(
                        { paletteOpen: palette, shortcutsOpen: shortcuts, railCollapsed: ref(false), toggleRail: toggle },
                        computed(() => NAV)
                    )

                    return () => h('div')
                },
            }),
            { attachTo: document.body }
        )
    )

    return { palette, shortcuts, toggle }
}

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
    target.dispatchEvent(event)

    return event
}

beforeEach(() => {
    wide = true
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: wide, media: query }))
})

afterEach(() => {
    mounted.forEach((w) => w.unmount())
    mounted = []
    visit.mockReset()
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
})

describe('goTargets', () => {
    it('binds only what the viewer has, named the way the rail names it', () => {
        expect(goTargets(NAV)).toEqual([
            { key: 'u', label: 'Übersicht', href: '/admin' },
            { key: 'k', label: 'Katalog', href: '/admin/wuchtgewichte' },
            { key: 'g', label: 'Dokumente', href: '/admin/gutachten' },
        ])
    })
})

describe('useAdminShortcuts', () => {
    it('opens the palette with Strg K even from inside a field, and keeps the browser from saving the page', () => {
        const { palette } = mountKeys()
        const input = document.body.appendChild(document.createElement('input'))

        press('k', { ctrlKey: true }, input)
        expect(palette.value).toBe(true)

        expect(press('s', { ctrlKey: true }).defaultPrevented).toBe(true)
    })

    it('ignores single keys while somebody is typing', () => {
        const { palette, shortcuts } = mountKeys()
        const input = document.body.appendChild(document.createElement('input'))

        press('/', {}, input)
        press('?', {}, input)
        expect(palette.value).toBe(false)
        expect(shortcuts.value).toBe(false)
    })

    it('opens the palette with / and the shortcuts with ?', () => {
        const { palette, shortcuts } = mountKeys()

        press('/')
        expect(palette.value).toBe(true)

        palette.value = false
        press('?')
        expect(shortcuts.value).toBe(true)
    })

    it('jumps with g and a bound key, and ignores a key that is not bound', () => {
        mountKeys()

        press('g')
        press('b')
        expect(visit).not.toHaveBeenCalled()

        press('g')
        press('g')
        expect(visit).toHaveBeenCalledWith('/admin/gutachten')
    })

    it('takes [ typed as Option 5 on a Mac German keyboard, and a held key only once', () => {
        const { toggle } = mountKeys()

        press('[', { altKey: true })
        expect(toggle).toHaveBeenCalledOnce()

        press('[', { repeat: true })
        expect(toggle).toHaveBeenCalledOnce()
    })

    it('leaves the keys to an open menu, so typing in it never jumps to another page', () => {
        const { palette } = mountKeys()
        const menu = document.body.appendChild(document.createElement('div'))
        menu.setAttribute('role', 'menu')
        menu.setAttribute('data-state', 'open')

        press('g')
        press('g')
        press('/')
        expect(visit).not.toHaveBeenCalled()
        expect(palette.value).toBe(false)
    })

    it('toggles the rail with [ — typed as AltGr 8 on a German keyboard — from 1024 px only', () => {
        const { toggle } = mountKeys()
        const altGr = { ctrlKey: true, altKey: true, modifierAltGraph: true } as KeyboardEventInit

        press('[', altGr)
        expect(toggle).toHaveBeenCalledOnce()

        wide = false
        press('[', altGr)
        expect(toggle).toHaveBeenCalledOnce()
    })
})
