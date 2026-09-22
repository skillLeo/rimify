import { describe, expect, it } from 'vitest'

/*
 * Guards on how components write their styles.
 *
 * In a `<style scoped>` block Vue compiles `:global(.a) .b` to `.a` alone — everything after the
 * `:global()` is dropped. SpecCallout once wrote `:global(.frame:not(.is-ready)) .callout__line`
 * to hide its leader lines and hid the whole hero frame, photograph included, until an animation
 * had run. A global selector goes inside the parentheses in full: `:global(.a .b)`.
 */

const sources = import.meta.glob<string>('./**/*.vue', { query: '?raw', import: 'default', eager: true })

/** `:global(` … balanced `)` followed by more selector on the same rule. */
function globalsWithTrailingSelector(css: string): string[] {
    const found: string[] = []
    let from = 0

    for (;;) {
        const start = css.indexOf(':global(', from)

        if (start === -1) {
            return found
        }

        let depth = 0
        let end = start + ':global'.length

        for (; end < css.length; end++) {
            if (css[end] === '(') depth++
            if (css[end] === ')' && --depth === 0) break
        }

        const rest = css.slice(end + 1).match(/^\s*([^\s,{])/)

        if (rest !== null) {
            found.push(css.slice(start, end + 1 + (rest.index ?? 0) + rest[0].length + 20).split('{')[0]!.trim())
        }

        from = end + 1
    }
}

describe('component styles', () => {
    it('finds the components to check', () => {
        expect(Object.keys(sources).length).toBeGreaterThan(50)
    })

    it('never follows a :global() with more selector in a scoped block', () => {
        const offenders = Object.entries(sources).flatMap(([file, source]) =>
            [...source.matchAll(/<style\b[^>]*\bscoped\b[^>]*>([\s\S]*?)<\/style>/g)].flatMap((m) =>
                globalsWithTrailingSelector((m[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '')).map((selector) => `${file}: ${selector}`),
            ),
        )

        expect(offenders).toEqual([])
    })

    it('recognises the mistake it guards against', () => {
        expect(globalsWithTrailingSelector(':global(.frame:not(.is-ready)) .callout__line { opacity: 0 }')).toHaveLength(1)
        expect(globalsWithTrailingSelector(':global(.frame:not(.is-ready) .callout__line) { opacity: 0 }')).toEqual([])
        expect(globalsWithTrailingSelector(':global(.a), .b { color: red }')).toEqual([])
    })
})
