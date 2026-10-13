import { expect, test, type Locator, type Page } from './fixtures';
import { consentGiven, open } from './support';
import { EMPTY_SHOP, SHOP } from './shop';

/*
 * The protected elements (docs/design/PROTECTED.md), at 1440 and at 390. Each has a structural
 * assertion that says in words what went missing, and a screenshot baseline beside it — so taking an
 * element away fails here, legibly, instead of passing quietly the way the hero's photographs once did.
 *
 * The baselines are taken with motion finished (Playwright disables animations for the capture): the
 * resting frame is the one the design fixes. `npx playwright test e2e/protected.spec.ts --update-snapshots`
 * renews them, and only as part of a change the operator agreed to (CLAUDE.md, protected elements).
 */

test.use({ baseURL: SHOP });

test.beforeEach(async ({ context, baseURL }) => {
    await consentGiven(context, baseURL ?? SHOP);
});

const SHOT = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.02 } as const;

/** A photograph actually loaded from the catalogue's own files — never a drawing, a data: URI or a placeholder. */
async function realPhotograph(img: Locator): Promise<{ src: string; loaded: boolean }> {
    return img.evaluate((el: HTMLImageElement) => ({ src: el.currentSrc || el.src, loaded: el.complete && el.naturalWidth > 0 }));
}

async function expectPhotograph(img: Locator, what: string): Promise<void> {
    await expect(img, `${what}: there is no <img> at all`).toHaveCount(1);
    await img.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await realPhotograph(img)).loaded, { message: `${what}: the photograph did not load` }).toBe(true);

    const { src } = await realPhotograph(img);
    expect(src, `${what}: the picture is not a photograph from the catalogue (${src})`).toMatch(/\/storage\/.+\/wheels\/.+\.(avif|webp|png|jpg)$/);
    expect(src, `${what}: the picture is a placeholder drawing`).not.toMatch(/placeholder/);
}

async function home(page: Page): Promise<void> {
    await open(page, '/');
}

test.describe('protected elements', () => {
    test('P1–P3 · the hero wheel: a real photograph, rolling in, in studio light, with its callouts', async ({ page }, testInfo) => {
        const phone = testInfo.project.name === 'mobile-390';
        await home(page);

        const stage = page.locator(phone ? '.hero-mobile' : '#h2 .hero__stage');
        const lead = stage.locator(phone ? '.hero-frame__roll' : '.hero__roll');
        const second = stage.locator(phone ? '.hero-frame__pair' : '.hero__pair');
        await expectPhotograph(lead.locator('img'), 'P1 leading wheel');
        // Two wheels, matte black leading and matte bronze behind it (the operator's decision of 01.10.2026).
        await expect(stage.locator('img'), 'P1: the hero no longer carries two wheels').toHaveCount(2);
        await expectPhotograph(second.locator('img'), 'P1 second wheel');
        await expect(stage.locator(phone ? '.hero-frame__pair--rolling' : '.hero__pair--rolling'), 'P1: the second wheel no longer rolls in').toHaveCount(1);
        await expect(second.locator('[data-callout]'), 'P1: a callout points at the second wheel — they belong to the leading one only').toHaveCount(0);

        await expect(stage.getByText('Symbolbild'), 'P1: the hero says "Symbolbild" — a drawing stands where the photograph belongs').toHaveCount(0);
        await expect(stage.locator(phone ? '.hero-frame__roll--rolling' : '.hero__roll--rolling'), 'P1: the wheel no longer rolls in').toHaveCount(1);
        await expect(stage.locator('.hero-studio'), 'P2: the studio light is gone').toHaveCount(1);
        // One contact shadow under each wheel, travelling with it.
        await expect(lead.locator('.hero-contact'), 'P2: the leading wheel\'s contact shadow is gone').toHaveCount(1);
        await expect(second.locator('.hero-contact'), 'P2: the second wheel\'s contact shadow is gone').toHaveCount(1);
        await expect(stage.locator('[data-callout="boltCircle"]'), 'P3: the Lochkreis callout is gone').toHaveCount(1);
        await expect(stage.locator('[data-callout="kba"]'), 'P3: the KBA callout is gone').toHaveCount(1);
        // The client's #4, agreed by the operator (D-108): the hero shows the wheel and its numbers — no price, no link.
        await expect(stage.locator('a[href^="/felgen/"]'), 'P1: the hero links to a product again — #4 took the link out').toHaveCount(0);
        await expect(stage.getByText('pro Felge'), 'P1: the hero shows a price again — #4 took it out').toHaveCount(0);

        await page.waitForTimeout(2000);
        await expect(stage).toHaveScreenshot(`p1-hero-${testInfo.project.name}.png`, SHOT);
    });

    test('P4 · the numbers section leads with the photograph and marks the value on it', async ({ page }, testInfo) => {
        await home(page);

        const section = page.locator('.rc').first();
        await expectPhotograph(section.locator('.rc-photo img'), 'P4 numbers-section photograph');

        for (const key of ['width', 'diameter', 'lk', 'mlb']) {
            await section.locator(`[data-token="${key}"]`).click();
            await expect(section.locator(`.rc-photo [data-shape="${key}"]`), `P4: choosing ${key} marks nothing on the photograph`).toHaveCount(1);
        }

        // The ET is the drawing's: a photograph of a wheel face cannot show it.
        await section.locator('[data-token="et"]').click();
        await expect(section.locator('.rc-photo [data-shape]'), 'P4: the ET is marked on the photograph').toHaveCount(0);
        await expect(section.getByText('Schnittzeichnung', { exact: false }), 'P4: the cross-section is gone').not.toHaveCount(0);

        await section.locator('[data-token="width"]').click();
        await expect(section).toHaveScreenshot(`p4-numbers-${testInfo.project.name}.png`, SHOT);
    });

    test('P5 · the Gutachten story keeps its Textmarker and its stamp', async ({ page }, testInfo) => {
        await home(page);

        const story = page.locator('[data-section="H4"]').first();
        await story.scrollIntoViewIfNeeded();
        await expect(story.locator('svg.marker').first(), 'P5: the Textmarker strokes are gone').toBeAttached();
        await expect(story.locator('.doc__stamp').first(), 'P5: the stamp is gone').toBeAttached();
        await expect(story).toHaveScreenshot(`p5-story-${testInfo.project.name}.png`, SHOT);
    });

    test('P6 · the dark band keeps its turning Komplettrad', async ({ page }, testInfo) => {
        await home(page);

        const band = page.locator('[data-section="H7"]');

        // The phone shows the band only beside a verified EU tyre label (D7, since b43c39ce); without
        // one its absence must be that reason and no other.
        if (testInfo.project.name === 'mobile-390' && (await band.count()) === 0) {
            const tyre = await page.evaluate(() => {
                // Inertia ships the page as JSON in a script tag (or, older, in the root's attribute).
                const script = document.querySelector('script[data-page]');
                const raw = script?.textContent ?? document.querySelector('#app[data-page]')?.getAttribute('data-page') ?? '{}';

                return (JSON.parse(raw) as { props?: { komplettrad?: { tyre?: unknown } } }).props?.komplettrad?.tyre ?? null;
            });
            expect(tyre, 'P6: the phone dropped the dark band although a verified tyre label exists').toBeNull();

            return;
        }

        await band.first().scrollIntoViewIfNeeded();
        await expect(band.first().locator('img'), 'P6: the Komplettrad illustration is gone').not.toHaveCount(0);
    });

    test('P7 · the calculator keeps its clearance drawing', async ({ page }, testInfo) => {
        await open(page, '/felgenrechner');

        const drawing = page.locator('.calc-drawing').first();
        await expect(drawing, 'P7: the clearance drawing is gone').toBeVisible();
        await expect(drawing).toHaveScreenshot(`p7-calculator-${testInfo.project.name}.png`, SHOT);
    });
});

/*
 * While the catalogue is empty the baseline asserts presence, not pixels (the operator's brief of 05.10.2026, §2): the
 * hero stands on the brand's photographs in every state, and a run against an empty shop checks that they are there,
 * load, roll in and stand in their light, with the photograph's own callouts (P3; the client's #4: the hero asks the
 * catalogue nothing) — but compares no picture. The numbers section (P4) and the turning band (P6) need a wheel in the
 * catalogue, and are not asked for here.
 */
test.describe('protected elements while the catalogue is empty — presence, not pixels', () => {
    test.use({ baseURL: EMPTY_SHOP });

    test.beforeEach(async ({ context }) => {
        await consentGiven(context, EMPTY_SHOP);
    });

    test('P1–P3 · the hero stands on its two photographs, rolling in, in studio light, with the photograph\'s callouts', async ({ page }, testInfo) => {
        const phone = testInfo.project.name === 'mobile-390';
        await home(page);

        const stage = page.locator(phone ? '.hero-mobile' : '#h2 .hero__stage');
        const lead = stage.locator(phone ? '.hero-frame__roll' : '.hero__roll');
        const second = stage.locator(phone ? '.hero-frame__pair' : '.hero__pair');

        // The client's #4 (the operator's brief „THE 34“): the hero asks the catalogue nothing, so its callouts and spec
        // line — the photograph's own values — stand with the shop empty too.
        await expect(page.locator('[data-hero="values"]'), 'P3: the empty shop\'s hero lost the photograph\'s values').toHaveCount(1);
        await expect(stage.locator('[data-callout]').first(), 'P3: no callout on the photograph with the shop empty').toBeAttached();
        await expectPhotograph(lead.locator('img'), 'P1 leading wheel (empty catalogue)');
        await expect(stage.locator('img'), 'P1: the hero no longer carries two wheels with the catalogue empty').toHaveCount(2);
        await expectPhotograph(second.locator('img'), 'P1 second wheel (empty catalogue)');
        await expect(stage.locator(phone ? '.hero-frame__roll--rolling' : '.hero__roll--rolling'), 'P1: the wheel no longer rolls in').toHaveCount(1);
        await expect(stage.getByText('Symbolbild'), 'P1: a drawing stands where the photograph belongs').toHaveCount(0);
        await expect(stage.locator(phone ? '.hero-frame__outline' : '.hero__outline'), 'P1: the outline stands where the photograph belongs').toHaveCount(0);
        await expect(stage.locator('.hero-studio'), 'P2: the studio light is gone').toHaveCount(1);
        await expect(lead.locator('.hero-contact'), 'P2: the leading wheel\'s contact shadow is gone').toHaveCount(1);
        await expect(second.locator('.hero-contact'), 'P2: the second wheel\'s contact shadow is gone').toHaveCount(1);

        const box = await stage.boundingBox();
        expect(box?.height ?? 0, 'P1: the hero stage has no height').toBeGreaterThan(100);
        // Presence, not pixels: no screenshot is compared while the catalogue is empty.
    });
});