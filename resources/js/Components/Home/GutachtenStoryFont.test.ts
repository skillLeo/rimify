import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/*
 * Finding 116 (D-231): WebKit applied Archivo's variable width to the spacing but not to the letters, and the
 * facsimile's narrow small print overlapped. The facsimile is set in static cuts at the two widths it uses; nothing
 * there may lean on the variable axis again. (The picture is the acceptance run's, in WebKit at 390 × 844: @kunde-06.)
 */

const STORIES = ['resources/js/Components/Home/GutachtenStory.vue', 'resources/js/Components/Mobile/Home/GutachtenStory.vue']

describe('the Gutachten facsimile', () => {
    it('is set in the static cuts, in both the page and the phone version', () => {
        for (const file of STORIES) {
            const doc = /\n\.doc \{([^}]*)\}/.exec(readFileSync(file, 'utf8'))?.[1] ?? ''

            expect(doc, `${file}: .doc`).toContain('font-family: var(--font-doc);')
        }

        expect(readFileSync('resources/css/tokens.css', 'utf8')).toContain("--font-doc: 'Archivo Doc', var(--font-sans);")
    })

    it('has a static face for every width and weight it uses, and the file for each', () => {
        const faces = [...readFileSync('resources/css/fonts.css', 'utf8').matchAll(/@font-face \{ font-family: 'Archivo Doc';[^}]*font-weight: (\d+); font-stretch: ([^;]+); src: url\('([^']+)'\) format\('([^']+)'\); \}/g)]

        expect(faces.map((f) => `${f[2]} ${f[1]}`).sort()).toEqual(['50% 77.4% 400', '50% 77.4% 500', '50% 77.4% 600', '77.5% 200% 400', '77.5% 200% 500', '77.5% 200% 600'])

        for (const face of faces) {
            // Static, never `woff2-variations`: a face with an axis is the very thing WebKit drew wrong.
            expect(face[4]).toBe('woff2')
            expect(existsSync(`public${face[3]}`), face[3]).toBe(true)
        }
    })
})
