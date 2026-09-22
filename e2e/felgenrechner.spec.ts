import { expect, test, type Locator, type Page } from '@playwright/test';
import { consentGiven, expectNoHorizontalOverflow, open } from './support';

/*
 * /felgenrechner's rear view (ACCURACY.md §6, brief W6), measured in the browser on both documents:
 * every arrow is as long, in pixels, as the millimetres its label prints — within half a
 * millimetre, because the arrow is drawn to the exact shift and the label rounds it; no two labels
 * of the drawing overlap, none leaves the drawing's width or sits on the sheet, at the project's
 * width and at narrower ones; the inner arrow points inboard — towards the strut, to the left —
 * exactly when the inner edge moves closer to it. The comparisons arrive through `?rechner=`, which
 * must survive the page untouched. Reduced motion puts the drawing in its end state at once.
 *
 * Runs against the production build: it needs `npm run build` with this change in it first.
 */

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8000';

interface Case {
    name: string;
    param: string;
    /** What the two labels must say, word for word apart from the number's space. */
    outer: RegExp;
    inner: RegExp;
    /** +1 when the inner edge moves towards the strut (the arrow must point left), −1 away, 0 no arrow. */
    innerTowardsStrut: -1 | 0 | 1;
}

const CASES: Case[] = [
    {
        // The golden case: 7,5J ET 45 → 8,5J ET 35 moves the outer edge +22,7 and the inner edge +2,7 mm.
        name: 'the worked example',
        param: '7.5x17-45-225-45_8.5x19-35-225-35',
        outer: /^Außenkante: 23\smm weiter außen$/,
        inner: /^Innenkante: 3\smm näher am Federbein$/,
        innerTowardsStrut: 1,
    },
    {
        name: 'the same rim 15 mm further in',
        param: '8x18-45-225-40_8x18-60-225-40',
        outer: /^Außenkante: 15\smm weiter innen$/,
        inner: /^Innenkante: 15\smm näher am Federbein$/,
        innerTowardsStrut: 1,
    },
    {
        name: 'the same rim 15 mm further out',
        param: '8x18-45-225-40_8x18-30-225-40',
        outer: /^Außenkante: 15\smm weiter außen$/,
        inner: /^Innenkante: 15\smm weiter weg vom Federbein$/,
        innerTowardsStrut: -1,
    },
    {
        name: 'a large change: 6J ET 45 → 12J ET 10',
        param: '6x15-45-195-65_12x20-10-305-30',
        outer: /^Außenkante: 111\smm weiter außen$/,
        inner: /^Innenkante: 41\smm näher am Federbein$/,
        innerTowardsStrut: 1,
    },
    {
        // 1,5 inch wider and ET 19 more: the outer edge moves 0,05 mm — no printed millimetre, no arrow.
        name: 'an edge that moves less than a millimetre',
        param: '7x17-30-225-45_8.5x17-49-225-45',
        outer: /^Außenkante: unverändert$/,
        inner: /^Innenkante: 38\smm näher am Federbein$/,
        innerTowardsStrut: 1,
    },
    {
        name: 'nothing changes',
        param: '8x18-40-235-40_8x18-40-235-40',
        outer: /^Außenkante: unverändert$/,
        inner: /^Innenkante: unverändert$/,
        innerTowardsStrut: 0,
    },
];

/** The labels of the drawing, all of which must stay apart. */
const LABELS = '.cd__view, .cd__part, .cd__note, .cd__label, .cd__key, .cd__caption';

/** Narrower widths each document must also hold: the desktop document down to its tablet layout, the phone down to 320. */
const ALSO_AT: Record<string, number[]> = { 'desktop-1440': [1024, 768], 'mobile-390': [360, 320] };

const VERDICT = /zulässig|passt|legal|eintragungsfrei|toleranz|ohne gewähr|freigegeben|erlaubt|serienbereifung|\bok\b/i;

type Box = { x: number; y: number; width: number; height: number };

function printedMm(text: string): number | null {
    if (/unverändert/.test(text)) {
        return null;
    }

    const match = /(\d+)\smm/.exec(text);

    if (match === null || match[1] === undefined) {
        throw new Error(`no millimetres in the label "${text}"`);
    }

    return Number(match[1]);
}

function drawing(page: Page): Locator {
    return page.locator('.cd').first();
}

/** Pixels per millimetre: the sheet's rendered width over its viewBox width, times its one scale. */
async function pxPerMm(page: Page): Promise<number> {
    const svg = drawing(page).locator('.cd__sheet svg');
    const box = await svg.boundingBox();
    const viewBox = (await svg.getAttribute('viewBox')) ?? '';
    const width = Number(viewBox.split(/\s+/)[2]);
    const unitsPerMm = Number(await svg.getAttribute('data-units-per-mm'));

    if (box === null || !(width > 0) || !(unitsPerMm > 0)) {
        throw new Error('the sheet has no size or no scale');
    }

    return (box.width / width) * unitsPerMm;
}

/** The x of an arrowhead's base and tip, from `M base y L tip y L base y Z`. */
async function headOf(head: Locator): Promise<{ base: number; tip: number }> {
    const numbers = ((await head.getAttribute('d')) ?? '').match(/-?[\d.]+/g)?.map(Number) ?? [];

    return { base: numbers[0] ?? Number.NaN, tip: numbers[2] ?? Number.NaN };
}

function overlapArea(a: Box, b: Box): number {
    const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

    // Touching edges and sub-pixel rounding are not an overlap.
    return w > 0.5 && h > 0.5 ? w * h : 0;
}

/** No two labels overlap; none leaves the figure's width; none sits on the sheet. */
async function expectLabelsApart(page: Page, where: string): Promise<void> {
    const figure = drawing(page);
    const labels = figure.locator(LABELS);
    const count = await labels.count();
    expect(count, where).toBeGreaterThanOrEqual(9);

    const boxes: { name: string; box: Box }[] = [];

    for (let i = 0; i < count; i++) {
        const label = labels.nth(i);
        const box = await label.boundingBox();

        if (box !== null && box.width > 0 && box.height > 0) {
            boxes.push({ name: ((await label.textContent()) ?? '').trim(), box });
        }
    }

    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i];
            const b = boxes[j];

            if (a !== undefined && b !== undefined) {
                expect(overlapArea(a.box, b.box), `${where}: "${a.name}" overlaps "${b.name}"`).toBe(0);
            }
        }
    }

    const outer = await figure.boundingBox();
    const sheet = await figure.locator('.cd__sheet').boundingBox();
    expect(outer, where).not.toBeNull();
    expect(sheet, where).not.toBeNull();

    for (const { name, box } of boxes) {
        expect(box.x, `${where}: "${name}" leaves the drawing on the left`).toBeGreaterThanOrEqual((outer?.x ?? 0) - 0.5);
        expect(box.x + box.width, `${where}: "${name}" leaves the drawing on the right`).toBeLessThanOrEqual((outer?.x ?? 0) + (outer?.width ?? 0) + 0.5);
        expect(overlapArea(box, sheet as Box), `${where}: "${name}" sits on the drawing`).toBe(0);
    }
}

test.describe('Felgenrechner rear view', () => {
    test.beforeEach(async ({ context, page }) => {
        await consentGiven(context, BASE);
        await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    for (const c of CASES) {
        test(`${c.name}: each arrow is as long as its label, the labels stay apart, the inner arrow points the right way`, async ({ page }, info) => {
            await open(page, `/felgenrechner?rechner=${c.param}`);

            // The share state survives the page: the address still carries the same comparison.
            expect(new URL(page.url()).searchParams.get('rechner')).toBe(c.param);

            const figure = drawing(page);
            await expect(figure).toBeVisible();

            const outerLabel = figure.locator('.cd__label[data-dim="outer"]');
            const innerLabel = figure.locator('.cd__label[data-dim="inner"]');
            await expect(outerLabel).toHaveText(c.outer);
            await expect(innerLabel).toHaveText(c.inner);

            // 1 · Every arrow against the number printed in its label, within half a millimetre.
            const scale = await pxPerMm(page);

            for (const dim of ['outer', 'inner'] as const) {
                const text = ((await figure.locator(`.cd__label[data-dim="${dim}"]`).textContent()) ?? '').trim();
                const value = printedMm(text);
                const shaft = figure.locator(`path.cd__dim[data-dim="${dim}"]`);

                if (value === null) {
                    await expect(shaft, `${dim}: no arrow for "${text}"`).toHaveCount(0);
                    await expect(figure.locator(`path.cd__head[data-dim="${dim}"]`)).toHaveCount(0);
                } else {
                    await expect(shaft, `${dim}: an arrow for "${text}"`).toHaveCount(1);
                    // The line's own geometry as rendered: its SVG length times the sheet's screen
                    // scale. The element's client box would add the stroke's anti-aliasing fringe
                    // (a constant pixel), which is not length.
                    const drawn = await shaft.evaluate((path: SVGPathElement) => {
                        const svg = path.ownerSVGElement as SVGSVGElement;
                        const viewBoxWidth = svg.viewBox.baseVal.width;

                        return path.getBBox().width * (svg.getBoundingClientRect().width / viewBoxWidth);
                    });
                    const expected = value * scale;
                    // Half a millimetre on the drawing's own scale: the label rounds, the arrow does not.
                    expect(
                        Math.abs(drawn - expected),
                        `${dim}: ${drawn.toFixed(2)} px drawn for ${value} mm (${expected.toFixed(2)} px at ${scale.toFixed(3)} px/mm)`
                    ).toBeLessThanOrEqual(0.5 * scale + 0.05);
                }
            }

            // 2 · The inner arrow points inboard (left, towards the strut) exactly when the edge moves closer to it.
            const head = figure.locator('path.cd__head[data-dim="inner"]');

            if (c.innerTowardsStrut === 0) {
                await expect(head).toHaveCount(0);
            } else {
                await expect(head).toHaveCount(1);
                const { base, tip } = await headOf(head);
                expect(Math.sign(tip - base), 'the direction of the inner arrow').toBe(c.innerTowardsStrut === 1 ? -1 : 1);

                // On screen, too: the new rim's inner edge moved that way.
                const oldRim = await figure.locator('g[data-wheel="current"] rect.cd__rim').boundingBox();
                const newRim = await figure.locator('g[data-wheel="next"] rect.cd__rim').boundingBox();
                expect(oldRim).not.toBeNull();
                expect(newRim).not.toBeNull();

                if (c.innerTowardsStrut === 1) {
                    expect(newRim?.x ?? 0).toBeLessThan(oldRim?.x ?? 0);
                } else {
                    expect(newRim?.x ?? 0).toBeGreaterThan(oldRim?.x ?? 0);
                }
            }

            // 3 · The labels stay apart at this width and at the narrower ones.
            await expectLabelsApart(page, `${info.project.name}`);

            // Arithmetic only, in words: not one verdict word on the page, and no horizontal overflow.
            await expect(page.locator('[data-result="lage"] .calc-result__say')).toBeVisible();
            expect((await page.locator('.rechner').first().textContent()) ?? '').not.toMatch(VERDICT);
            await expectNoHorizontalOverflow(page);

            const viewport = page.viewportSize();

            for (const width of ALSO_AT[info.project.name] ?? []) {
                await page.setViewportSize({ width, height: viewport?.height ?? 900 });
                await expectLabelsApart(page, `${info.project.name} at ${width}`);
            }
        });
    }

    test('answers the worked example in plain German sentences first, the figures kept from the translator', async ({ page }) => {
        await open(page, '/felgenrechner?rechner=7.5x17-45-225-45_8.5x19-35-225-35');

        await expect(page.locator('[data-result="lage"] .calc-result__say')).toHaveText(
            /^Die neue Felge steht rechnerisch 23\smm weiter außen – näher am Kotflügel\. Die Innenkante rückt rechnerisch 3\smm näher ans Federbein\.$/
        );
        await expect(page.locator('[data-result="groesse"] .calc-result__say')).toHaveText(/^Das Rad wird rechnerisch 6\smm größer im Durchmesser \(\+0,91\s%\)\.$/);
        await expect(page.locator('[data-result="tacho"] .calc-result__say')).toHaveText(
            /^Zeigt der Tacho 100\skm\/h, fährst du rechnerisch 100,9\skm\/h – 0,9\skm\/h mehr als mit der bisherigen Größe\.$/
        );
        await expect(page.locator('[data-say="tachoangleichung"]')).toHaveText('Dann kann eine Tachoangleichung nötig werden – das steht im Gutachten.');

        // Chrome once translated "5,5 J" as "5.5 years": every select and every figure is translate="no".
        const selects = page.locator('.rechner select');
        expect(await selects.count()).toBeGreaterThanOrEqual(4);

        for (const select of await selects.all()) {
            await expect(select).toHaveAttribute('translate', 'no');
        }

        await expect(page.locator('[data-result="lage"] [translate="no"]').first()).toHaveText(/^23\smm$/);
    });

    test('says in one sentence that a tyre and its rim do not belong together, and draws and prints nothing for it', async ({ page }) => {
        // 5,5J (139,7 mm) with a 305 tyre: 0,46 × its width.
        await open(page, '/felgenrechner?rechner=7.5x17-45-225-45_5.5x19-35-305-30');

        await expect(page.locator('[data-result="implausible"] .calc-result__say')).toHaveText(
            'Diese Reifenbreite und diese Maulweite gehören so nicht zusammen – prüf die Angaben.'
        );
        await expect(page.locator('.cd')).toHaveCount(0);
        await expect(page.locator('.specs')).toHaveCount(0);
        await expect(page.locator('[data-result="lage"]')).toHaveCount(0);
        await expectNoHorizontalOverflow(page);
    });
});
