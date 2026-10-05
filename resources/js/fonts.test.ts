// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
// The generator itself, so the test measures exactly as the stylesheet was made.
import {
    css,
    CSS_FILE,
    faces,
    FALLBACKS,
    FONT,
    JSON_FILE,
    measure,
    WEIGHTS,
    WIDTHS,
    type FontMetrics,
} from '../../scripts/fonts/fallbacks.mjs';

/*
 * The font metric guard (the operator's brief of 05.10.2026, §4). Archivo's fallback faces are computed from the font
 * file — per weight and width band, for Arial and for Roboto — and this holds them to it: a font file replaced without
 * running the generator, a hand-edited face, a weight or width a style uses with no face for it, or a second
 * declaration of Archivo without them, each fails here before a page can shift on the swap.
 */

const ROOT = resolve(__dirname, '../..');
const read = (path: string): string => readFileSync(resolve(ROOT, path), 'utf8');

const recorded = JSON.parse(read(JSON_FILE)) as FontMetrics & { font: string };

/** Every stylesheet and component under resources/, as [path, text]. */
function sources(dir: string, pattern: RegExp): Array<[string, string]> {
    const out: Array<[string, string]> = [];

    for (const name of readdirSync(dir)) {
        const path = join(dir, name);

        if (statSync(path).isDirectory()) {
            out.push(...sources(path, pattern));
        } else if (pattern.test(name)) {
            out.push([relative(ROOT, path).replaceAll('\\', '/'), readFileSync(path, 'utf8')]);
        }
    }

    return out;
}

const STYLES = [
    ...sources(resolve(ROOT, 'resources/css'), /\.css$/),
    ...sources(resolve(ROOT, 'resources/js'), /\.vue$/),
];
const TOKENS = read('resources/css/tokens.css');

/** A `font-stretch` value as a percentage: a literal, or a --wdth-* token from tokens.css. */
function stretchOf(value: string): number | null {
    const token = value.match(/^var\((--wdth-[a-z]+)\)$/);
    const literal = token
        ? (TOKENS.match(new RegExp(`${token[1]}:\\s*([\\d.]+)%`))?.[1] ?? null)
        : (value.match(/^([\d.]+)%$/)?.[1] ?? null);

    return literal === null ? null : Number(literal);
}

describe('the fallback faces, held to the font file', () => {
    it('were generated from the font file in the repository — replace the font, run node scripts/fonts/fallbacks.mjs', () => {
        const now = measure();

        expect(recorded.font).toBe(FONT);
        expect(now.sha256, `${FONT} changed since the fallbacks were generated`).toBe(recorded.sha256);
        expect([now.unitsPerEm, now.ascent, now.descent, now.lineGap]).toEqual([
            recorded.unitsPerEm,
            recorded.ascent,
            recorded.descent,
            recorded.lineGap,
        ]);

        // Each band's average width and its „0", within a tenth of a unit of what the file gives today.
        for (const [band, width] of Object.entries(now.widths)) {
            expect(Math.abs(width - recorded.widths[band]!), band).toBeLessThanOrEqual(0.1);
            expect(Math.abs(now.zero[band]! - recorded.zero[band]!), `„0" at ${band}`).toBeLessThanOrEqual(
                0.1,
            );
        }
    });

    it('measure as capsize publishes Archivo at its normal width, so the method is the one the fallbacks were measured by', () => {
        // @capsizecss/metrics: Archivo 440 (400), 447 (500), 456 (600), 472 (700) per 1000 — the static instances.
        expect(Math.round(recorded.widths['400@100']!)).toBe(440);
        expect(Math.round(recorded.widths['500@100']!)).toBe(447);
        expect(Math.round(recorded.widths['600@100']!)).toBe(456);
        expect(Math.round(recorded.widths['700@100']!)).toBe(472);
    });

    it('is the stylesheet the generator writes, not one edited by hand', () => {
        expect(read(CSS_FILE)).toBe(css(recorded));
    });

    it('scales each face so its average letter is as wide as Archivo’s at that weight and width', () => {
        const display = faces(recorded).find(
            (f) =>
                f.family === 'Archivo fallback Arial' && f.weight === '650 900' && f.stretch === '111% 125%',
        )!;

        // The display headline: Archivo 700 at 112 % against Arial Bold (983 / 2048) — 11 % larger, where fontaine's one
        // face (Arial regular, 102,3 %) set it 17 % narrower than the font, and the swap added a line.
        expect(parseFloat(display.sizeAdjust)).toBeCloseTo(
            (recorded.widths['700@112']! / 1000 / (983 / 2048)) * 100,
            3,
        );
        expect(display.src).toEqual([
            'Arial Bold',
            'Arial-BoldMT',
            'Liberation Sans Bold',
            'LiberationSans-Bold',
        ]);
    });
});

describe('the faces cover what the styles ask for', () => {
    it('has a face for every weight and width the stylesheets and components use', () => {
        const stretches = new Set<number>();
        const weights = new Set<number>();

        for (const [path, text] of STYLES) {
            if (path.endsWith('fonts.css') || path.endsWith('fonts-fallback.css')) {
                continue;
            }

            for (const m of text.matchAll(/font-stretch:\s*([^;}\n]+)/g)) {
                const value = stretchOf(m[1]!.trim());

                expect(value, `${path}: font-stretch ${m[1]} is no width a face covers`).not.toBeNull();
                stretches.add(value!);
            }

            for (const m of text.matchAll(/font-weight:\s*(\d{3})\b/g)) {
                weights.add(Number(m[1]));
            }
        }

        expect([...stretches].sort()).toEqual(expect.arrayContaining([70, 85, 100, 110, 112]));

        for (const stretch of stretches) {
            expect(
                WIDTHS.some((b) => stretch >= b.min && stretch <= b.max),
                `no width band holds ${stretch} %`,
            ).toBe(true);
        }

        for (const weight of weights) {
            expect(
                WEIGHTS.some((b) => weight >= b.min && weight <= b.max),
                `no weight band holds ${weight}`,
            ).toBe(true);
        }
    });

    it('gives each fallback its own family, and no two of its faces the same descriptors', () => {
        const all = faces(recorded);

        expect(new Set(all.map((f) => f.family))).toEqual(new Set(FALLBACKS.map((f) => f.family)));

        for (const family of FALLBACKS.map((f) => f.family)) {
            const keys = all.filter((f) => f.family === family).map((f) => `${f.weight}|${f.stretch}`);

            // The fault fontaine had: identical descriptors, so only the last face of a family ever counted.
            expect(new Set(keys).size, family).toBe(keys.length);
            expect(keys).toHaveLength(WEIGHTS.length * WIDTHS.length);
        }
    });
});

describe('measures in characters', () => {
    it('are Archivo’s own in the --ch-* tokens, held to the font file', () => {
        const em = (band: string): string => `${(recorded.zero[band]! / recorded.unitsPerEm).toFixed(4)}em`;

        expect(TOKENS).toContain(`--ch-text: ${em('400@100')};`);
        expect(TOKENS).toContain(`--ch-heading: ${em('700@110')};`);
        expect(TOKENS).toContain(`--ch-display: ${em('700@112')};`);
    });

    it('gain no new `ch` measure — a box in `ch` changes width on the swap; write calc(N * var(--ch-…))', () => {
        const found = STYLES.flatMap(([path, text]) =>
            [...text.matchAll(/(?<![\w-])\d+(?:\.\d+)?ch\b/g)].map((m) => `${path}: ${m[0]}`),
        );

        // 146 on 05.10.2026, once the hero's headline and subline and the cookie sheet moved to the tokens — the three
        // the layout-shift budget caught (e2e/cls-budget.spec.ts). The count may only go down.
        expect(found.length, found.join('\n')).toBeLessThanOrEqual(146);
    });
});

describe('every declaration of Archivo has the fallbacks behind it', () => {
    const VIEWS = sources(resolve(ROOT, 'resources/views'), /\.blade\.php$/);

    it('declares Archivo in fonts.css and on the standalone error page only', () => {
        const declaring = [...STYLES, ...VIEWS]
            .filter(([, text]) => /@font-face\s*\{[^}]*font-family:\s*'Archivo Variable'/.test(text))
            .map(([path]) => path);

        expect(declaring.sort()).toEqual([
            'resources/css/fonts.css',
            'resources/views/errors/_standalone.blade.php',
        ]);
    });

    it('names both fallback families right after Archivo, in the shop and on the error page', () => {
        const stack = "'Archivo Variable', 'Archivo fallback Arial', 'Archivo fallback Roboto', Arial";
        const errorPage = read('resources/views/errors/_standalone.blade.php');

        expect(TOKENS).toContain(`--font-sans: ${stack}`);
        expect(read('resources/css/app.css')).toMatch(
            /@import '\.\/fonts\.css';\s*@import '\.\/fonts-fallback\.css';/,
        );
        expect(errorPage).toContain(`font-family: ${stack}`);
        expect(errorPage).toContain("file_get_contents(resource_path('css/fonts-fallback.css'))");
    });
});
