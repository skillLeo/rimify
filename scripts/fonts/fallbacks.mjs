// The fallback faces for Archivo Variable, computed from the real font file (the operator's brief of 05.10.2026, §4).
//
// Text set in a fallback must take the room the web font will take, or the swap moves it. Archivo is variable: the
// headings run at 110 and 112 % width and weight 700, the body at 100 % and 400–600, two figures at 85 and 70 % — and
// a fallback is one static font. So there is one face per weight band and width band, scaled (`size-adjust`) until its
// average letter is as wide as Archivo's at that weight and width, and carrying Archivo's vertical metrics
// (`ascent-`, `descent-`, `line-gap-override`), for each of two fallbacks a device may hold: Arial (Windows, macOS,
// iOS; Liberation Sans on Linux has Arial's widths) and Roboto (Android). Each fallback is its own family, so a device
// without Arial falls through to Roboto. fontaine wrote three faces with identical descriptors under one name, so
// only the last, Arial, ever counted, and only for upright text at 100 %: the 112 % headline grew a line on the swap
// (measured 05.10.2026).
//
// The average is capsize's — latin character frequencies (@capsizecss/unpack, MIT) — the weighting of capsize's
// published metrics for Arial and Roboto too, so the ratio compares like with like.
//
//   node scripts/fonts/fallbacks.mjs           writes resources/css/fonts-fallback.json and .css
//   node scripts/fonts/fallbacks.mjs --check   exits 1 when either is not what the font file gives
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { create } from 'fontkitten';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const FONT = 'public/fonts/archivo-latin-wdth.woff2';
export const JSON_FILE = 'resources/css/fonts-fallback.json';
export const CSS_FILE = 'resources/css/fonts-fallback.css';

/** The weights the styles use, each band measured at its own weight (font-weight: 400, 500, 600, 700). */
export const WEIGHTS = [
    { min: 100, max: 449, at: 400 },
    { min: 450, max: 549, at: 500 },
    { min: 550, max: 649, at: 600 },
    { min: 650, max: 900, at: 700 },
];

/** The widths the styles use (tokens.css --wdth-*, GutachtenStory's figures), each band measured at its own width. */
export const WIDTHS = [
    { min: 62, max: 77.4, at: 70 },
    { min: 77.5, max: 92.4, at: 85 },
    { min: 92.5, max: 104.9, at: 100 },
    { min: 105, max: 110.9, at: 110 },
    { min: 111, max: 125, at: 112 },
];

/**
 * The fallbacks, each its own family, with the widths capsize publishes for them (fontaine's copy of
 * @capsizecss/metrics: Arial regular 913 and bold 983 per 2048; Roboto per weight). Arial has no 500 or 600: a band
 * the regular face serves is measured against it, one the bold face serves against that.
 */
export const FALLBACKS = [
    {
        family: 'Archivo fallback Arial',
        unitsPerEm: 2048,
        faces: {
            400: { xWidthAvg: 913, src: ['Arial', 'ArialMT', 'Liberation Sans', 'LiberationSans'] },
            500: { xWidthAvg: 913, src: ['Arial', 'ArialMT', 'Liberation Sans', 'LiberationSans'] },
            600: { xWidthAvg: 983, src: ['Arial Bold', 'Arial-BoldMT', 'Liberation Sans Bold', 'LiberationSans-Bold'] },
            700: { xWidthAvg: 983, src: ['Arial Bold', 'Arial-BoldMT', 'Liberation Sans Bold', 'LiberationSans-Bold'] },
        },
    },
    {
        family: 'Archivo fallback Roboto',
        unitsPerEm: 2048,
        faces: {
            400: { xWidthAvg: 911, src: ['Roboto', 'Roboto-Regular'] },
            500: { xWidthAvg: 919, src: ['Roboto Medium', 'Roboto-Medium', 'Roboto'] },
            600: { xWidthAvg: 923, src: ['Roboto Bold', 'Roboto-Bold', 'Roboto'] },
            700: { xWidthAvg: 926, src: ['Roboto Bold', 'Roboto-Bold', 'Roboto'] },
        },
    },
];

/** capsize's latin weighting (@capsizecss/unpack src/weightings.ts, MIT): how often each character occurs. */
const LATIN = {
    0: 0.0053, 1: 0.0023, 2: 0.0026, 3: 0.001, 4: 0.0008, 5: 0.0015, 6: 0.0007, 7: 0.0005, 8: 0.0007, 9: 0.0006,
    ',': 0.0083, ' ': 0.154, t: 0.0672, h: 0.0351, e: 0.0922, o: 0.0571, f: 0.017, P: 0.0023, p: 0.0163, l: 0.0304,
    "'": 0.0014, s: 0.0469, R: 0.0015, u: 0.0207, b: 0.0114, i: 0.0588, c: 0.0232, C: 0.0031, n: 0.0578, a: 0.0668,
    d: 0.0298, y: 0.0123, w: 0.011, B: 0.002, r: 0.0526, z: 0.0011, G: 0.0011, j: 0.0009, T: 0.0041, '.': 0.0079,
    L: 0.0012, k: 0.0046, m: 0.0181, ']': 0.0007, J: 0.0009, F: 0.0015, v: 0.0076, g: 0.0155, A: 0.004, N: 0.0014,
    '-': 0.0018, H: 0.0013, D: 0.0013, M: 0.0025, I: 0.0022, E: 0.0011, '"': 0.0012, S: 0.0041, '(': 0.001,
    ')': 0.001, x: 0.0025, W: 0.0012, Q: 0.0001, Y: 0.0003, q: 0.0008, V: 0.0005, á: 0.0001, K: 0.0007, U: 0.0016,
    '=': 0.0007, '[': 0.0021, O: 0.0009, é: 0.0001, $: 0.0002, ':': 0.0008, '|': 0.0038, '/': 0.0001, '%': 0.0001,
    Z: 0.0002, ';': 0.0001, X: 0.0001,
};

/** The tables a width needs, none of which WOFF2 transforms (it transforms only `glyf` and `loca`). */
const METRIC_TABLES = ['head', 'hhea', 'maxp', 'cmap', 'hmtx', 'HVAR', 'fvar', 'avar', 'name', 'OS/2', 'post'];

/**
 * The WOFF2's metric tables as a TrueType file of their own. fontkitten cannot take an instance of a WOFF2 font
 * (`getVariation` reads the compressed bytes as a TrueType directory), and an advance at an instance needs no outline:
 * `hmtx` plus the `HVAR` delta for the instance's coordinates.
 */
function metricsFont(woff2) {
    const font = create(new Uint8Array(woff2));
    const missing = METRIC_TABLES.filter((tag) => !font.directory.tables[tag] || font.directory.tables[tag].transformed);

    if (missing.length > 0) {
        throw new Error(`${FONT}: no untransformed ${missing.join(', ')} — the widths cannot be read from it.`);
    }

    void font.head; // decompresses the table data
    const data = font.stream.buffer;
    let offset = 12 + 16 * METRIC_TABLES.length;
    const placed = METRIC_TABLES.map((tag) => {
        const entry = font.directory.tables[tag];
        const at = offset;

        offset += (entry.length + 3) & ~3;

        return { tag, at, body: data.subarray(entry.offset, entry.offset + entry.length) };
    });
    const out = new Uint8Array(offset);
    const view = new DataView(out.buffer);
    const pow = 2 ** Math.floor(Math.log2(placed.length));

    view.setUint32(0, 0x00010000);
    view.setUint16(4, placed.length);
    view.setUint16(6, pow * 16);
    view.setUint16(8, Math.log2(pow));
    view.setUint16(10, placed.length * 16 - pow * 16);
    placed.forEach((table, i) => {
        const record = 12 + i * 16;

        for (let k = 0; k < 4; k++) {
            out[record + k] = table.tag.charCodeAt(k);
        }

        view.setUint32(record + 8, table.at);
        view.setUint32(record + 12, table.body.length);
        out.set(table.body, table.at);
    });

    return out;
}

/** One instance of the font: a character's advance at a weight and width, in the font's units. */
function instance(plain, base, wght, wdth) {
    const coords = base.fvar.axis.map((axis) => ({ wght, wdth })[axis.axisTag.trim()] ?? axis.defaultValue);
    const font = new base.constructor(new base.stream.constructor(plain), coords);
    const variation = font._variationProcessor;
    const { metrics } = font.hmtx;

    return (character) => {
        const gid = font._cmapProcessor.lookup(character.codePointAt(0));
        const metric = gid < metrics.length ? metrics.get(gid) : metrics.get(metrics.length - 1);

        return metric.advance + variation.getAdvanceAdjustment(gid, font.HVAR);
    };
}

/** The weighted average advance at one weight and width, in the font's units (capsize's avgWidthForSubset). */
function averageWidth(advance) {
    return Object.entries(LATIN).reduce((sum, [character, weighting]) => sum + advance(character) * weighting, 0);
}

/** The font file's hash and metrics: its vertical metrics, and its average width at every band's weight and width. */
export function measure(path = resolve(ROOT, FONT)) {
    const bytes = readFileSync(path);
    const plain = metricsFont(bytes);
    const base = create(plain);
    const widths = {};
    const zero = {};

    for (const weight of WEIGHTS) {
        for (const width of WIDTHS) {
            const advance = instance(plain, base, weight.at, width.at);

            widths[`${weight.at}@${width.at}`] = Math.round(averageWidth(advance) * 10) / 10;
            // The `ch` unit: no fallback can match one glyph and the average at once, so a box measured in `ch` changes
            // width on the swap. Recorded here for the --ch-* tokens (tokens.css), which measure it in Archivo always.
            zero[`${weight.at}@${width.at}`] = Math.round(advance('0') * 10) / 10;
        }
    }

    return {
        sha256: createHash('sha256').update(bytes).digest('hex'),
        unitsPerEm: base.unitsPerEm,
        ascent: base.ascent,
        descent: base.descent,
        lineGap: base.lineGap,
        widths,
        zero,
    };
}

const percent = (value) => `${(Math.round(value * 1_000_000) / 10_000).toFixed(4)}%`;

/** Every face, from the measured metrics: what the CSS file says, in the order it says it. */
export function faces(metrics) {
    const out = [];

    for (const fallback of FALLBACKS) {
        for (const weight of WEIGHTS) {
            const face = fallback.faces[weight.at];

            for (const width of WIDTHS) {
                const archivo = metrics.widths[`${weight.at}@${width.at}`] / metrics.unitsPerEm;
                const sizeAdjust = archivo / (face.xWidthAvg / fallback.unitsPerEm);
                const em = metrics.unitsPerEm * sizeAdjust;

                out.push({
                    family: fallback.family,
                    src: face.src,
                    weight: `${weight.min} ${weight.max}`,
                    stretch: `${width.min}% ${width.max}%`,
                    sizeAdjust: percent(sizeAdjust),
                    ascentOverride: percent(metrics.ascent / em),
                    descentOverride: percent(Math.abs(metrics.descent) / em),
                    lineGapOverride: percent(metrics.lineGap / em),
                });
            }
        }
    }

    return out;
}

/** The stylesheet, from the recorded metrics: nothing in it is written by hand. */
export function css(metrics) {
    const rules = faces(metrics).map((f) =>
        [
            '@font-face {',
            `    font-family: '${f.family}';`,
            `    src: ${f.src.map((name) => `local('${name}')`).join(', ')};`,
            '    font-style: normal;',
            `    font-weight: ${f.weight};`,
            `    font-stretch: ${f.stretch};`,
            `    size-adjust: ${f.sizeAdjust};`,
            `    ascent-override: ${f.ascentOverride};`,
            `    descent-override: ${f.descentOverride};`,
            `    line-gap-override: ${f.lineGapOverride};`,
            '}',
        ].join('\n'),
    );

    return [
        '/*',
        ` * Generated by scripts/fonts/fallbacks.mjs from ${FONT}`,
        ` * (sha256 ${metrics.sha256}). Do not edit: run \`node scripts/fonts/fallbacks.mjs\` after the font changes.`,
        ' *',
        ' * Archivo Variable\'s fallback faces: Arial or Roboto, scaled per weight and width band so that the text takes the',
        ' * room Archivo will take — the swap moves nothing (the operator\'s brief of 05.10.2026, §4).',
        ' */',
        '',
        rules.join('\n\n'),
        '',
    ].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const metrics = measure();
    const json = `${JSON.stringify({ font: FONT, ...metrics }, null, 4)}\n`;
    const sheet = css(metrics);

    if (process.argv.includes('--check')) {
        const stale = [
            readFileSync(resolve(ROOT, JSON_FILE), 'utf8') !== json ? JSON_FILE : null,
            readFileSync(resolve(ROOT, CSS_FILE), 'utf8') !== sheet ? CSS_FILE : null,
        ].filter(Boolean);

        if (stale.length > 0) {
            console.error(`Not what ${FONT} gives: ${stale.join(', ')}. Run node scripts/fonts/fallbacks.mjs.`);
            process.exit(1);
        }

        console.log(`${JSON_FILE} and ${CSS_FILE} match ${FONT}.`);
    } else {
        writeFileSync(resolve(ROOT, JSON_FILE), json);
        writeFileSync(resolve(ROOT, CSS_FILE), sheet);
        console.log(`Wrote ${JSON_FILE} and ${CSS_FILE} (${faces(metrics).length} faces).`);
    }
}
