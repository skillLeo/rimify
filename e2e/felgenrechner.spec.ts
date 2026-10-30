import { expect, test, type Locator, type Page } from './fixtures';
import { DEV, consentGiven, expectNoHorizontalOverflow, open } from './support';
import { SHOP } from './shop';

// A storefront spec: the shop with wheels in it (e2e/shop.ts).
test.use({ baseURL: SHOP });

/*
 * /felgenrechner, rebuilt close to the client's example (his #11; the operator's brief of 29.10.2026, Batch 2), measured in
 * the browser on both documents: each rim edge of the new wheel stands as far from the current one, in pixels, as the
 * millimetres its answer prints — within half a millimetre, the answer being rounded and the drawing not; each chevron
 * points the way its edge moved; no two labels of the drawing overlap and none leaves it, at the project's width and at
 * narrower ones. The comparisons arrive through `?rechner=`, which must survive the page untouched. Reduced motion puts
 * the drawing in its end state at once.
 *
 * Runs against the production build: it needs `npm run build` with this change in it first.
 */

const BASE = DEV;

interface Case {
    name: string;
    param: string;
    inner: RegExp;
    outer: RegExp;
    /** Tenths of a millimetre the answers print, signed: inner towards the car, outer out of the car. */
    innerTenths: number;
    outerTenths: number;
}

const CASES: Case[] = [
    { name: 'his example: 8J ET45 against 8J ET40', param: '8x45x0_8x40x0', inner: /^Innen: 5,0\smm weiter vom Fahrwerk entfernt$/, outer: /^Außen: 5,0\smm weiter heraus$/, innerTenths: -50, outerTenths: 50 },
    { name: 'half an inch wider at the same ET: 6,35 mm shown as 6,4', param: '8x35x0_8.5x35x0', inner: /^Innen: 6,4\smm näher am Fahrwerk$/, outer: /^Außen: 6,4\smm weiter heraus$/, innerTenths: 64, outerTenths: 64 },
    { name: 'ten millimetres less ET', param: '8x45x0_8x35x0', inner: /^Innen: 10,0\smm weiter vom Fahrwerk entfernt$/, outer: /^Außen: 10,0\smm weiter heraus$/, innerTenths: -100, outerTenths: 100 },
    { name: 'wider, more ET and a 10 mm spacer', param: '8.5x40x0_9.5x45x10', inner: /^Innen: 7,7\smm näher am Fahrwerk$/, outer: /^Außen: 17,7\smm weiter heraus$/, innerTenths: 77, outerTenths: 177 },
    { name: 'ten millimetres more ET: the rim moves in', param: '8x35x0_8x45x0', inner: /^Innen: 10,0\smm näher am Fahrwerk$/, outer: /^Außen: 10,0\smm weiter hinein$/, innerTenths: 100, outerTenths: -100 },
    { name: 'a large change: 6J ET45 against 12J ET10 with 20 mm', param: '6x45x0_12x10x20', inner: /^Innen: 21,2\smm näher am Fahrwerk$/, outer: /^Außen: 131,2\smm weiter heraus$/, innerTenths: 212, outerTenths: 1312 },
    { name: 'nothing changes', param: '8x40x0_8x40x0', inner: /^Innen: unverändert$/, outer: /^Außen: unverändert$/, innerTenths: 0, outerTenths: 0 },
];

/** Narrower widths each document must also hold: the desktop document down to its tablet layout, the phone down to 320. */
const ALSO_AT: Record<string, number[]> = { 'desktop-1440': [1024, 768], 'mobile-390': [360, 320] };

const VERDICT = /zulässig|passt|legal|eintragungsfrei|toleranz|ohne gewähr|freigegeben|erlaubt|serienbereifung|\bok\b/i;

type Box = { x: number; y: number; width: number; height: number };

function drawing(page: Page): Locator {
    return page.locator('.calc-drawing').first();
}

/** Pixels per millimetre: one unit across is one millimetre. */
async function pxPerMm(page: Page): Promise<number> {
    const svg = drawing(page).locator('svg');
    const box = await svg.boundingBox();
    const width = Number(((await svg.getAttribute('viewBox')) ?? '').split(/\s+/)[2]);

    if (box === null || !(width > 0)) {
        throw new Error('the drawing has no size');
    }

    return box.width / width;
}

/** Where a wheel's rim edge stands on screen: the inner lip's left side, the outer lip's right side. */
async function edge(page: Page, wheel: 'current' | 'next', side: 'inner' | 'outer'): Promise<number> {
    const lips = drawing(page).locator(`.odraw__wheel--${wheel} .odraw__lip`);
    // Outer lips first (top, bottom), then the inner ones (OffsetDrawing.vue).
    const box = await lips.nth(side === 'outer' ? 0 : 2).evaluate((el: SVGGraphicsElement) => {
        const r = el.getBoundingClientRect();
        const stroke = parseFloat(getComputedStyle(el).strokeWidth) || 0;

        // The box less the stroke's half on each side: the shape's own edge.
        return { left: r.left + stroke / 2, right: r.right - stroke / 2 };
    });

    return side === 'outer' ? box.right : box.left;
}

/** +1 when a chevron points right, −1 left: `M x y L tip y L x y`. */
async function pointing(chevron: Locator): Promise<number> {
    const n = ((await chevron.getAttribute('d')) ?? '').match(/-?[\d.]+/g)?.map(Number) ?? [];

    return Math.sign((n[2] ?? 0) - (n[0] ?? 0));
}

function overlapArea(a: Box, b: Box): number {
    const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

    return w > 0.5 && h > 0.5 ? w * h : 0;
}

/** No two labels overlap; none leaves the drawing's width. */
async function expectLabelsApart(page: Page, where: string, expected: number): Promise<void> {
    const stage = await drawing(page).locator('.odraw__stage').boundingBox();
    const labels = drawing(page).locator('.odraw__label');
    const boxes: { name: string; box: Box }[] = [];

    for (let i = 0; i < (await labels.count()); i++) {
        const box = await labels.nth(i).boundingBox();

        if (box !== null && box.width > 0) {
            boxes.push({ name: ((await labels.nth(i).textContent()) ?? '').trim(), box });
        }
    }

    expect(boxes.length, where).toBe(expected);

    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            expect(overlapArea(boxes[i]!.box, boxes[j]!.box), `${where}: "${boxes[i]!.name}" overlaps "${boxes[j]!.name}"`).toBe(0);
        }

        expect(boxes[i]!.box.x, `${where}: "${boxes[i]!.name}" leaves the drawing on the left`).toBeGreaterThanOrEqual((stage?.x ?? 0) - 0.5);
        expect(boxes[i]!.box.x + boxes[i]!.box.width, `${where}: "${boxes[i]!.name}" leaves the drawing on the right`).toBeLessThanOrEqual((stage?.x ?? 0) + (stage?.width ?? 0) + 0.5);
    }
}

test.describe('Felgenrechner', () => {
    test.beforeEach(async ({ context, page }) => {
        await consentGiven(context, BASE);
        await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    for (const c of CASES) {
        test(`${c.name}: the answers, each edge drawn to scale, each chevron the right way, the labels apart`, async ({ page }, info) => {
            await open(page, `/felgenrechner?rechner=${c.param}`);

            // The share state survives the page: the address still carries the same comparison.
            expect(new URL(page.url()).searchParams.get('rechner')).toBe(c.param);

            const answers = page.locator('.rechner__answer');
            await expect(answers.nth(0)).toHaveText(c.inner);
            await expect(answers.nth(1)).toHaveText(c.outer);

            // 1 · Each edge of the new rim against the current one, as far as the answer says, within half a millimetre.
            const scale = await pxPerMm(page);
            const innerMoved = (await edge(page, 'next', 'inner')) - (await edge(page, 'current', 'inner'));
            const outerMoved = (await edge(page, 'current', 'outer')) - (await edge(page, 'next', 'outer'));

            for (const [name, moved, tenths] of [['inner', innerMoved, c.innerTenths], ['outer', outerMoved, c.outerTenths]] as const) {
                expect(Math.abs(moved - (tenths / 10) * scale), `${name}: ${moved.toFixed(2)} px for ${tenths / 10} mm at ${scale.toFixed(3)} px/mm`).toBeLessThanOrEqual(0.5 * scale + 0.3);
            }

            // 2 · A chevron at each edge that moved, pointing the way it moved: inner towards the car is right, outer out is left.
            const chevrons = drawing(page).locator('.odraw__chevron');
            await expect(chevrons).toHaveCount((c.innerTenths !== 0 ? 1 : 0) + (c.outerTenths !== 0 ? 1 : 0));

            if (c.outerTenths !== 0) {
                expect(await pointing(chevrons.first()), 'the outer chevron').toBe(c.outerTenths > 0 ? -1 : 1);
            }

            if (c.innerTenths !== 0) {
                expect(await pointing(chevrons.last()), 'the inner chevron').toBe(c.innerTenths > 0 ? 1 : -1);
            }

            // 3 · The labels apart and inside, at this width and at the narrower ones; arithmetic only, no overflow. Three names
            // always — außen, Fahrwerk, Radnabe — and a figure for each edge that moves.
            const labels = 3 + (c.innerTenths !== 0 ? 1 : 0) + (c.outerTenths !== 0 ? 1 : 0);
            await expectLabelsApart(page, info.project.name, labels);
            expect((await page.locator('.rechner').first().textContent()) ?? '').not.toMatch(VERDICT);
            await expectNoHorizontalOverflow(page);

            const viewport = page.viewportSize();

            for (const width of ALSO_AT[info.project.name] ?? []) {
                await page.setViewportSize({ width, height: viewport?.height ?? 900 });
                await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
                await expectLabelsApart(page, `${info.project.name} at ${width}`, labels);
                await expectNoHorizontalOverflow(page);
            }
        });
    }

    test('steps and typing as in his example: the answers follow at once, the address with them, a wrong figure kept and said', async ({ page }) => {
        await open(page, '/felgenrechner');
        const next = page.locator('.etc__block--next');

        await next.getByRole('button', { name: 'Breite erhöhen' }).click();
        await expect(page.locator('.rechner__answer').nth(1)).toHaveText(/^Außen: 11,4\smm weiter heraus$/);
        await expect.poll(() => new URL(page.url()).searchParams.get('rechner')).toBe('8x45x0_8.5x40x0');

        const et = next.locator('.etc__field').nth(1).locator('input');
        await et.fill('45');
        await et.blur();
        await expect(page.locator('.rechner__answer').nth(0)).toHaveText(/^Innen: 6,4\smm näher am Fahrwerk$/);

        // Key by key, as a person types: the 8 on the way to 81 never becomes the answer, and 81 is said at once — no
        // further key can make it right (interaction QA, 30.10.2026: ET 81 answered for ET 8).
        await et.fill('');
        await et.pressSequentially('81');
        await expect(et).toHaveAttribute('aria-invalid', 'true');
        await expect(next.locator('.etc__error')).toHaveText(/^Gib eine Einpresstiefe zwischen −50 und 80\smm ein, in ganzen Millimetern\.$/);
        // The drawing and the answers keep the figure the field had before the typing.
        await expect(page.locator('.rechner__answer').nth(0)).toHaveText(/^Innen: 6,4\smm näher am Fahrwerk$/);
        await expect(page.locator('.odraw__key-line').nth(1)).toHaveText(/ET\s45/);
        await et.blur();
        await expect(et).toHaveValue('81');

        // A sentence under a field stays a sentence, and the block keeps its steppers inside (at 1440 one under the
        // spacer pushed all three out of the panel).
        const spacer = next.locator('.etc__field').nth(2).locator('input');
        await spacer.fill('abc');
        await spacer.blur();
        await expect(next.locator('.etc__error')).toHaveCount(2);
        const panel = await next.boundingBox();

        for (const button of await next.locator('.etc__step').all()) {
            const box = await button.boundingBox();
            expect(box !== null && panel !== null && box.x >= panel.x - 0.5 && box.x + box.width <= panel.x + panel.width + 0.5, 'a stepper stands outside its block').toBe(true);
        }

        for (const error of await next.locator('.etc__error').all()) {
            expect((await error.boundingBox())?.height ?? 0, 'a sentence under a field broke into columns').toBeLessThan(120);
        }

        // The figures kept from the translator; the labels and sentences left to it.
        for (const input of await page.locator('.etc input').all()) {
            await expect(input.locator('xpath=ancestor::*[@translate="no"][1]')).toHaveCount(1);
        }
    });

    // Interaction QA, 30.10.2026: away and Back brought the figures the page had opened with, and rewrote the address.
    test('Back brings the comparison back as it was left, address and all', async ({ page }) => {
        await open(page, '/felgenrechner');
        const next = page.locator('.etc__block--next');

        await next.getByRole('button', { name: 'Breite erhöhen' }).click();
        await expect.poll(() => new URL(page.url()).searchParams.get('rechner')).toBe('8x45x0_8.5x40x0');

        const home = page.getByRole('link', { name: 'RIMIFY – Startseite' });
        await home.filter({ visible: true }).first().click();
        await page.waitForURL((url) => url.pathname === '/');
        await page.goBack();

        await expect(next.locator('.etc__field').first().locator('input')).toHaveValue('8,5');
        await expect(page.locator('.rechner__answer').nth(1)).toHaveText(/^Außen: 11,4\smm weiter heraus$/);
        expect(new URL(page.url()).searchParams.get('rechner')).toBe('8x45x0_8.5x40x0');
    });

    test('a link from before the rebuild opens on his example, and the address is set straight', async ({ page }) => {
        await open(page, '/felgenrechner?rechner=7.5x17-45-225-45_8.5x19-35-225-35');

        await expect(page.locator('.rechner__answer').nth(1)).toHaveText(/^Außen: 5,0\smm weiter heraus$/);
        await expect.poll(() => new URL(page.url()).searchParams.get('rechner')).toBe('8x45x0_8x40x0');
    });
});
