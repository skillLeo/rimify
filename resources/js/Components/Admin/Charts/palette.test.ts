import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { differenceEuclidean, filterDeficiencyDeuter, filterDeficiencyProt, parse, wcagContrast, type Color } from 'culori'
import { describe, expect, it } from 'vitest'

/*
 * The chart palette is computed, not judged (BRIEF §5). Read from tokens.css itself, so a colour
 * changed there is a colour tested here:
 *   - categorical: every adjacent pair ΔE (OKLab ×100) ≥ 15 under normal vision, ≥ 8 under
 *     deuteranopia and protanopia; every hue at least 3:1 against the chart surface (a mark);
 *   - sequential: lighter to darker with no step back, each step apart from the next;
 *   - the chart's text at least 4.5:1 against the surface.
 */

const css = readFileSync(resolve(__dirname, '../../../../css/tokens.css'), 'utf8')

function token(name: string): string {
    const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)

    if (!match?.[1]) {
        throw new Error(`Token --${name} is missing or not a hex colour`)
    }

    return match[1]
}

function colour(hex: string): Color {
    const parsed = parse(hex)

    if (!parsed) {
        throw new Error(`Not a colour: ${hex}`)
    }

    return parsed
}

const deltaE = differenceEuclidean('oklab')
const deuter = filterDeficiencyDeuter(1)
const prot = filterDeficiencyProt(1)

const SURFACE = colour(token('c-surface'))
const categorical = Array.from({ length: 8 }, (_, i) => token(`chart-cat-${i + 1}`))
const sequential = Array.from({ length: 7 }, (_, i) => token(`chart-seq-${i + 1}`))

describe('chart palette', () => {
    it.each(categorical.slice(1).map((hex, i) => [categorical[i]!, hex]))('keeps %s and %s apart for every reader', (a, b) => {
        const ca = colour(a)
        const cb = colour(b)

        expect(deltaE(ca, cb) * 100).toBeGreaterThanOrEqual(15)
        expect(deltaE(deuter(ca), deuter(cb)) * 100).toBeGreaterThanOrEqual(8)
        expect(deltaE(prot(ca), prot(cb)) * 100).toBeGreaterThanOrEqual(8)
    })

    it.each(categorical)('shows %s as a mark on the chart surface (≥ 3:1)', (hex) => {
        expect(wcagContrast(colour(hex), SURFACE)).toBeGreaterThanOrEqual(3)
    })

    it('runs the sequential ramp from light to dark without a step back', () => {
        // Darker is further from the white surface: the contrast rises with every step.
        const darkness = sequential.map((hex) => wcagContrast(colour(hex), SURFACE))

        for (let i = 1; i < darkness.length; i++) {
            expect(darkness[i]!).toBeGreaterThan(darkness[i - 1]!)
        }
    })

    it.each(sequential.slice(1).map((hex, i) => [sequential[i]!, hex]))('tells ramp step %s from %s', (a, b) => {
        expect(deltaE(colour(a), colour(b)) * 100).toBeGreaterThanOrEqual(5)
    })

    it('writes chart text readably on the surface (≥ 4.5:1)', () => {
        expect(wcagContrast(colour(token('c-ink-3')), SURFACE)).toBeGreaterThanOrEqual(4.5)
    })

    it('never uses a status colour as a series colour', () => {
        const statuses = ['c-ok', 'c-warn', 'c-bad'].map((name) => token(name).toLowerCase())

        for (const hex of categorical) {
            expect(statuses).not.toContain(hex.toLowerCase())
        }
    })
})
