import { describe, expect, it } from 'vitest'
import { ADMIN_ICON_NAMES, NAV_ICONS, ROW_ACTION_ICONS, adminIconMarkup, isAdminIconName } from './index'

/*
 * The admin's own icons: one grid, one stroke, no fills, one glyph per rail object — and nothing in
 * the admin drawing from the storefront's set, except the two editors whose job is the storefront's
 * own icons.
 */

const numbers = (markup: string): number[] =>
    [...markup.matchAll(/(?:d|x|y|cx|cy|r|width|height|rx)="([^"]+)"/g)].flatMap((m) =>
        (m[1] ?? '').match(/-?\d*\.?\d+/g)?.map(Number) ?? []
    )

describe('the admin icon set', () => {
    it.each(ADMIN_ICON_NAMES)('%s stays on the 20-unit grid, drawn in stroke only', (name) => {
        const markup = adminIconMarkup(name)

        expect(markup).not.toMatch(/fill="(?!none)/)
        expect(markup).not.toMatch(/stroke-width|style=|<g|transform/)
        expect(markup).toMatch(/^(<(path|rect|circle)\b[^>]*\/>)+$/)

        // Every coordinate and size lies inside the square — relative steps included, so nothing is
        // drawn past the edge by a stray number.
        for (const value of numbers(markup)) {
            expect(Math.abs(value)).toBeLessThanOrEqual(20)
        }
    })

    it('has a glyph for every object the rail can carry, and no two alike', () => {
        const drawn = NAV_ICONS.map((name) => adminIconMarkup(name))

        expect(new Set(drawn).size).toBe(NAV_ICONS.length)
    })

    it('has the six row actions', () => {
        expect(ROW_ACTION_ICONS).toEqual(['edit', 'duplicate', 'delete', 'publish', 'export', 'more'])
        expect(ROW_ACTION_ICONS.every((name) => isAdminIconName(name))).toBe(true)
    })

    it('draws each object as itself, never one generic gear for several', () => {
        // Einstellungen are sliders, Versand a parcel, Zahlung a card, Steuern a receipt, System a rack.
        const objects = (['settings', 'shipping', 'payment', 'taxes', 'system'] as const).map((name) => adminIconMarkup(name))

        expect(new Set(objects).size).toBe(objects.length)
    })
})

describe('the admin draws from its own set', () => {
    const sources = import.meta.glob(['../../Components/Admin/**/*.vue', '../../Pages/Admin/**/*.vue', '../../Layouts/Admin*.vue'], {
        query: '?raw',
        import: 'default',
        eager: true,
    }) as Record<string, string>

    /** The two editors whose subject is the storefront's own icons. */
    const STOREFRONT_EDITORS = ['Pages/Admin/Navigation/Index.vue', 'Pages/Admin/Seiten/FieldInput.vue']

    it.each(Object.keys(sources))('%s', (path) => {
        const source = sources[path] ?? ''
        const importsStorefront = /from '[./]+(Components\/)?(Ui|Art)\/Icon\.vue'/.test(source)

        expect(importsStorefront && !STOREFRONT_EDITORS.some((editor) => path.endsWith(editor))).toBe(false)
    })
})
