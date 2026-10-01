import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { devices, expect, test, type Locator, type Page } from '@playwright/test';
import {
    FINE_LINK_CHAINS,
    NO_CHAINS,
    SHOTS,
    SLUG,
    STATE,
    Sweep,
    check,
    chooseById,
    chooseCar,
    consent,
    modelsOf,
    norm,
    sizeChip,
    variantsOf,
    type VariantRow,
} from './support';

/*
 * The storefront as a visitor walks it (docs/reviews/sweep-storefront.md): every page, the vehicle picker, the
 * product page in every verdict state the preview can reach, the Gutachten PDF, the printable RIMIFY-Check, compare,
 * basket, checkout to the confirmation with the sandbox's Testzahlung, the account, FAQ, Kontakt, the legal pages,
 * a 404, a 419. Every page passes Sweep.probe(). Findings are written as they are found (support.ts), so a step that
 * breaks keeps what the steps before it saw; soft expectations mark the test red without stopping it.
 *
 * Run: see playwright.config.ts beside this file.
 */

const BASE = process.env.SWEEP_BASE_URL ?? 'https://rimify.skillleo.com';
const NO_ORDER = process.env.SWEEP_NO_ORDER === '1';
const PRODUCT = `/felgen/${SLUG}`;
const X3 = 'BMW X3 X83';

test.beforeEach(async ({ page }) => {
    await consent(page, BASE);
});

/** The car the brief names for „Freigegeben mit Auflagen“, by the selectors' own list (POST /fahrzeug). */
async function chooseX3(s: Sweep): Promise<boolean> {
    const row = await chooseCar(s, 'BMW', 'X3', 'X83');

    if (row === null) {
        s.note({ severity: 'S1', page: '/fahrzeug', what: 'BMW › X3 › X83 is not in the vehicle list or cannot be chosen', expected: 'the car ABE 55255 names on page 5' });
    }

    return row !== null;
}

/** The product page with a diameter chosen; returns the check panel. */
async function productWith(s: Sweep, diameter: string, label: string): Promise<Locator | null> {
    await s.open(PRODUCT);

    const chip = sizeChip(s.page, diameter);

    if (!(await chip.isVisible().catch(() => false))) {
        s.note({ severity: 'S1', page: PRODUCT, what: `${label}: no ${diameter}″ chip`, expected: 'the sizes 18 and 19' });

        return null;
    }

    if (!(await chip.isEnabled())) {
        s.observe(PRODUCT, `${label}: ${diameter}″ struck through — title „${norm((await chip.getAttribute('title')) ?? '')}“`);

        return null;
    }

    await chip.click();
    await s.page.waitForTimeout(400);

    return s.page.locator('.rcheck-panel').first();
}

// ── 01 · Startseite ─────────────────────────────────────────────────────────────────────────────────────────

test('01 Startseite: hero, live count, shelf, Größe vergleichen, Gutachten story, footer', async ({ page }, info) => {
    const s = new Sweep(page, info);
    const status = await s.open('/');

    check(s, status === 200, { severity: 'S1', page: '/', what: `answered ${status}`, expected: '200' });

    // The two wheels roll in: give the hero its entrance, then look at the first screen.
    await page.waitForTimeout(4000);
    const fold = await s.shot('home-fold', undefined, false);
    // The hero is #h2 on both documents (HomeHero.vue `.hero`, Startseite/Mobile.vue `.home-hero`).
    const heroArt = await page.locator('#h2 img, #h2 picture, #h2 canvas').count();

    check(s, heroArt > 0, { severity: 'S1', page: '/', what: 'the hero shows no wheel (no canvas, no image)', expected: 'the two wheels rolling in (PROTECTED.md)', shot: fold });

    if (!s.phone) {
        const pair = await page.locator('#h2 .hero__pair').count();
        const rolling = await page.locator('#h2 .hero__pair--rolling, #h2 .hero__roll').count();

        s.observe('/', `hero: pair ${pair}, rolling ${rolling}, images ${heroArt}`);
        check(s, pair > 0, { severity: 'S2', page: '/', what: 'the hero shows no wheel pair', expected: 'the two wheels rolling in (PROTECTED.md)', shot: fold });
    }

    const tiles = await page.locator('article.tile').count();

    check(s, tiles > 0, { severity: 'S2', page: '/', what: 'no shelf tile on the homepage', expected: 'the shelf with the published wheels', shot: fold });

    const compareSizes = page.locator('a[href="/felgenrechner"]', { hasText: 'Größe vergleichen' });

    if ((await compareSizes.count()) === 0) {
        s.observe('/', '„Größe vergleichen“ (→ /felgenrechner) not on this document');
    }

    const story = page.locator('.story__facts').first();

    if ((await story.count()) > 0) {
        const facts = norm(await story.innerText());

        check(s, /^\d[\d.]* Gutachten · \d[\d.]* Fahrzeugvarianten? · \d[\d.]* Felgen? mit Gutachten$/.test(facts), {
            severity: 'S2',
            page: '/',
            what: `Gutachten story numbers read „${facts}“`,
            expected: '„n Gutachten · n Fahrzeugvarianten · n Felgen mit Gutachten“, no 0, singular for 1',
            shot: fold,
        });
    } else {
        s.note({ severity: 'S3', page: '/', what: 'Gutachten story: no numbers line', expected: '„n Gutachten · n Fahrzeugvarianten · n Felgen mit Gutachten“', shot: fold });
    }

    const footer = norm(await page.locator('footer').last().innerText().catch(() => ''));

    check(s, /Testumgebung · Stand/.test(footer), { severity: 'S3', page: '/', what: `footer build line missing („${footer.slice(-120)}“)`, expected: '„Testumgebung · Stand …“ on the preview' });

    await s.probe('/');
});

// ── 02 · Fahrzeugwahl Marke & Modell ────────────────────────────────────────────────────────────────────────

test('02 Fahrzeugwahl: Marke & Modell → BMW › X3 › X83, live count, then /felgen with the car', async ({ page }, info) => {
    const s = new Sweep(page, info);

    await s.open('/');

    let chosen = false;

    try {
        if (s.phone) {
            const panel = page.locator('#h2');
            const make = panel.getByLabel('Marke', { exact: true });

            await make.selectOption('BMW');

            const model = panel.getByLabel('Modell', { exact: true });

            await expect(model).toBeEnabled();
            await expect(model.locator('option[value="X3"]')).toHaveCount(1);
            await model.selectOption('X3');

            const vehicle = panel.getByLabel('Fahrzeug', { exact: true });

            await expect(vehicle).toBeEnabled();
            await expect.poll(() => vehicle.locator('option').count()).toBeGreaterThan(1);

            const option = await vehicle.locator('option').evaluateAll((options) => {
                const hit = (options as HTMLOptionElement[]).find((o) => /X83/.test(o.textContent ?? ''));

                return hit ? { value: hit.value, text: (hit.textContent ?? '').trim(), disabled: hit.disabled } : null;
            });

            check(s, option !== null && !option.disabled, { severity: 'S1', page: '/ (#h2 Fahrzeug)', what: `X83 option: ${JSON.stringify(option)}`, expected: 'X83 listed and selectable' });

            if (option !== null) {
                s.observe('/', `phone Fahrzeug option: „${option.text}“`);
                await vehicle.selectOption(option.value);
            }

            await page.waitForTimeout(1500);
            const count = norm(await panel.locator('.vpanel__count').innerText().catch(() => ''));

            check(s, /^\d[\d.]* Felgen? mit Gutachten für BMW X3/.test(count) && !/^0\s/.test(count), {
                severity: 'S2',
                page: '/ (#h2 live count)',
                what: `live count reads „${count}“`,
                expected: '„1 Felge mit Gutachten für BMW X3 X83“',
                shot: await s.shot('home-picker-x3', panel),
            });

            await panel.locator('button.vpanel__go').click();
        } else {
            const hero = page.locator('.hero__panel');

            await hero.getByLabel('Marke', { exact: true }).click();
            await page.locator('[aria-label="Marken"]').getByRole('option', { name: /^BMW\b/ }).click();

            const modelInput = hero.getByLabel('Modell', { exact: true });

            await expect(modelInput).toBeEnabled();

            const models = page.locator('[aria-label="Modelle"]');

            if (!(await models.isVisible())) {
                await modelInput.click();
            }

            await models.getByRole('option', { name: /^X3[\s  ]+\d/ }).click();

            const vehicleInput = hero.getByLabel('Fahrzeug', { exact: true });

            await expect(vehicleInput).toBeEnabled();
            await vehicleInput.click();

            const option = page.locator('[aria-label="Fahrzeuge"]').getByRole('option', { name: /X83/ }).first();

            s.observe('/', `hero Fahrzeug option: „${norm((await option.textContent()) ?? '')}“`);
            await option.click();
            await page.waitForTimeout(1500);

            const count = norm(await hero.locator('.sel__count').first().innerText().catch(() => ''));

            check(s, /^\d[\d.]* Felgen? mit Gutachten für BMW X3/.test(count) && !/^0\s/.test(count), {
                severity: 'S2',
                page: '/ (hero live count)',
                what: `live count reads „${count}“`,
                expected: '„1 Felge mit Gutachten für BMW X3 X83“',
                shot: await s.shot('home-picker-x3', hero),
            });

            s.observe('/', `hero button: „${norm(await hero.locator('button.sel__go').innerText())}“`);
            await hero.locator('button.sel__go').click();
        }

        await page.waitForURL(/\/felgen(\?|$)/, { timeout: 30_000 });
        await s.hydrated();
        chosen = true;
    } catch (error) {
        s.note({
            severity: 'S1',
            page: '/',
            what: `choosing BMW › X3 › X83 through the homepage picker failed: ${String(error).split('\n')[0]?.slice(0, 160)}`,
            expected: 'Marke, Modell, Fahrzeug, then the listing',
            shot: await s.shot('home-picker-failed'),
        });
    }

    if (!chosen && !(await chooseX3(s))) {
        return;
    }

    await s.open('/felgen');

    const bar = norm((await page.locator('header, .vbar').allInnerTexts().catch(() => [])).join(' '));

    check(s, bar.includes('X3'), { severity: 'S2', page: '/felgen', what: 'the header names no X3 after choosing it', expected: 'the vehicle bar names the car' });

    const tile = page.locator('article.tile', { hasText: 'DB8GT2' });

    check(s, (await tile.count()) > 0, { severity: 'S1', page: `/felgen (${X3})`, what: 'no DB8GT2 tile for the X3 X83', expected: 'the BORBET in the listing, with its verdict' });

    for (const text of await tile.allInnerTexts()) {
        const said = norm(text);

        check(s, !(said.includes(FINE_LINK_CHAINS) && said.includes(NO_CHAINS)), {
            severity: 'S1',
            page: `/felgen (${X3})`,
            what: `a tile lists both snow-chain sentences: „${said.slice(0, 160)}…“`,
            expected: 'only what holds for every size, and „Weitere Auflagen je nach Größe“',
        });
        s.observe('/felgen', `tile: „${said.slice(0, 260)}“`);
    }

    await s.probe(`/felgen (${X3})`);
});

// ── 03 · HSN/TSN, invalid input, paste, not found, scan ────────────────────────────────────────────────────

test('03 Fahrzeugwahl: HSN/TSN — invalid input, paste, not found (three ways on), the scan tab', async ({ page }, info) => {
    const s = new Sweep(page, info);

    await s.open('/');

    const scope = s.phone ? page.locator('#h2') : page.locator('.hero__panel');

    await scope.getByRole('tab', { name: 'HSN/TSN' }).click();

    const hsn = scope.getByLabel('HSN (Feld 2.1)');
    const tsn = scope.getByLabel('TSN (Feld 2.2)');

    // Too short, then left: the field says so.
    await hsn.fill('12');
    await tsn.click();
    await page.waitForTimeout(300);

    const errors = norm((await scope.locator('.form-field__error').allInnerTexts()).join(' '));

    check(s, errors !== '', { severity: 'S2', page: '/ (HSN/TSN)', what: 'HSN „12“ left without a word', expected: 'a sentence under the field', shot: await s.shot('home-hsn-invalid', scope) });
    s.observe('/', `HSN „12“ → „${errors}“`);

    // Letters in the HSN.
    await hsn.fill('AB12');
    s.observe('/', `HSN typed „AB12“ → value „${await hsn.inputValue()}“`);

    // Not found: what was typed stays, and three ways on (R-09).
    await hsn.fill('9999');
    await tsn.fill('ZZZ');
    await tsn.press('Tab');
    await page.waitForTimeout(1500);

    const go = scope.locator(s.phone ? 'button.vpanel__go' : 'button.sel__go');

    if (await go.isEnabled().catch(() => false)) {
        await go.click();
    }

    await page.waitForTimeout(2500);

    const missed = scope.locator(s.phone ? '.vpanel__miss' : '.sel__notfound');
    const missShot = await s.shot('home-hsn-notfound', scope);

    if (await missed.isVisible().catch(() => false)) {
        const ways = await missed.locator('button, a').count();

        check(s, ways === 3, { severity: 'S2', page: '/ (HSN/TSN not found)', what: `${ways} ways on after 9999/ZZZ`, expected: 'three ways forward (R-09)', shot: missShot });
        check(s, (await hsn.inputValue()) === '9999', { severity: 'S2', page: '/ (HSN/TSN not found)', what: `the HSN field was cleared („${await hsn.inputValue()}“)`, expected: 'what was typed stays (R-09)', shot: missShot });
        s.observe('/', `not found: „${norm(await missed.innerText())}“`);
    } else {
        s.note({ severity: 'S2', page: '/ (HSN/TSN)', what: 'HSN 9999 / TSN ZZZ: no answer shown', expected: 'a sentence and three ways forward (R-09)', shot: missShot });
    }

    // Paste „0005/582“ and „0005 582“ into the HSN. A pair that names several cars brings the chooser up in place of
    // the fields (R-01): then the second paste has nothing to go into, and the chooser is what is recorded.
    for (const text of ['0005/582', '0005 582']) {
        if (!(await hsn.isVisible().catch(() => false))) {
            s.observe('/', `before pasting „${text}“: the fields are gone — „${norm(await scope.innerText().catch(() => '')).slice(0, 200)}“`);
            await s.shot(`home-hsn-paste-chooser`, scope);
            break;
        }

        await hsn.fill('');
        await tsn.fill('');
        await hsn.focus();

        if (s.phone) {
            // The phone panel has no paste handler: what a phone's paste would insert.
            await page.keyboard.insertText(text);
        } else {
            await hsn.evaluate((el, value) => {
                const data = new DataTransfer();

                data.setData('text/plain', value);
                el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
            }, text);
        }

        await page.waitForTimeout(300);

        const got = [await hsn.inputValue().catch(() => '?'), await tsn.inputValue().catch(() => '?')];

        check(s, got[0] === '0005' && got[1] === '582', {
            severity: 'S3',
            page: '/ (HSN/TSN paste)',
            what: `pasting „${text}“ into the HSN gives HSN „${got[0]}“, TSN „${got[1]}“`,
            expected: 'HSN 0005, TSN 582 (leading zeros kept)',
            shot: await s.shot(`home-hsn-paste-${text.replace(/\W/g, '')}`, scope),
        });
    }

    // The scan tab (desktop) / the scan button (phone): shown, never opened here.
    if (s.phone) {
        const scan = page.locator('#h2').getByRole('button', { name: /scann|Foto/i });

        check(s, (await scan.count()) > 0, { severity: 'S3', page: '/ (scan)', what: 'no scan button on the phone panel', expected: '„Fahrzeugschein scannen“' });
    } else {
        await scope.getByRole('tab', { name: 'Fahrzeugschein scannen' }).click();
        await page.waitForTimeout(500);

        const panel = scope.locator('[role="tabpanel"]:visible').first();
        const said = norm(await panel.innerText().catch(() => ''));

        check(s, said.length > 20, { severity: 'S2', page: '/ (scan tab)', what: `the scan tab reads „${said}“`, expected: 'what to do, and that the photo stays on the device', shot: await s.shot('home-scan-tab', scope) });
    }

    s.drain('/ (HSN/TSN)');
});

// ── 04 · /felgen without a car ──────────────────────────────────────────────────────────────────────────────

test('04 /felgen ohne Fahrzeug: tiles, demo marked, prices', async ({ page }, info) => {
    const s = new Sweep(page, info);

    await s.open('/felgen');

    const tiles = page.locator('article.tile');
    const count = await tiles.count();

    check(s, count > 0, { severity: 'S1', page: '/felgen', what: 'no tile', expected: 'the published wheels' });

    const real = page.locator('article.tile', { hasText: 'DB8GT2' });

    check(s, (await real.count()) >= 1, { severity: 'S1', page: '/felgen', what: 'no DB8GT2 tile', expected: 'BORBET DB8GT2 in Schwarz matt and Bronze matt' });

    for (const text of await real.allInnerTexts()) {
        s.observe('/felgen', `real tile: „${norm(text).slice(0, 200)}“`);
        check(s, /ab 229,00\s?€/.test(norm(text)), { severity: 'S2', page: '/felgen', what: `DB8GT2 tile price: „${norm(text).slice(0, 160)}“`, expected: '„ab 229,00 € pro Felge“' });
    }

    // Demo tiles carry „Demo“ as their brand; nothing else may pose as real.
    const demo = await page.locator('article.tile[data-demo="true"]').evaluateAll((els) => els.map((el) => (el.querySelector('.tile__brand')?.textContent ?? '').trim()));

    check(s, demo.every((brand) => brand === 'Demo'), { severity: 'S2', page: '/felgen', what: `demo tiles not marked: brands ${JSON.stringify(demo)}`, expected: 'every demo item marked as such' });
    s.observe('/felgen', `${count} tiles, ${demo.length} demo`);

    await s.probe('/felgen');
});

// ── 05 · Product page, X3 X83 ───────────────────────────────────────────────────────────────────────────────

test('05 Produktseite BMW X3 X83: 19″ Freigegeben mit Auflagen, Auflagen grouped, papers line, Wortlaut, PDF, 18″, RIMIFY-Check print', async ({ page }, info) => {
    const s = new Sweep(page, info);

    if (!(await chooseX3(s))) {
        return;
    }

    const panel = await productWith(s, '19', X3);

    if (panel === null) {
        s.note({ severity: 'S1', page: PRODUCT, what: 'the 19″ cannot be chosen for the X3 X83', expected: 'Freigegeben mit Auflagen (ABE 55255)' });

        return;
    }

    const panelShot = await s.shot('product-x3-19-panel', panel);
    const headline = norm(await panel.locator('.rcheck-panel__vehicle').innerText());

    check(s, headline.startsWith('Mit Auflagen freigegeben für BMW X3'), { severity: 'S1', page: `${PRODUCT} (X3 X83, 19″)`, what: `headline „${headline}“`, expected: '„Mit Auflagen freigegeben für BMW X3 X83“', shot: panelShot });
    await s.checkPapersLine(panel, `${PRODUCT} (X3 X83, 19″) panel`, panelShot);
    s.observe(PRODUCT, `X3 19″ panel: „${norm(await panel.innerText()).slice(0, 900)}“`);

    // The groups on the product page: in the panel (ConditionGroups) where it renders them, else in the Wortlaut.
    const groupsInPanel = await panel.locator('[data-condition-groups]').count();

    if (groupsInPanel === 0) {
        s.observe(PRODUCT, 'the panel renders no ConditionGroups (overview + „alle Auflagen im Wortlaut“ instead)');
    } else {
        await s.checkGroups(panel, `${PRODUCT} (X3 X83, 19″) panel`, panelShot);
    }

    // „alle Auflagen im Wortlaut“
    const toDetail = panel.getByRole('link', { name: /alle Auflagen im Wortlaut/ });

    if (await toDetail.isVisible().catch(() => false)) {
        await toDetail.click();
        await page.waitForTimeout(800);

        const detail = page.locator('#auflagen');
        const detailShot = await s.shot('product-x3-19-wortlaut', detail);

        await s.checkGroups(detail, `${PRODUCT} (X3 X83, 19″) · alle Auflagen im Wortlaut`, detailShot, 'wording');

        const where = await detail.evaluate((el) => {
            const hit = Array.from(el.querySelectorAll('li')).find((li) => (li.textContent ?? '').includes('Schneeketten ist nicht zulässig'));

            return hit?.closest('.fdt__side') ? 'side column (Hinweise, small and grey)' : hit ? 'main column' : 'absent';
        });

        s.observe(PRODUCT, `„Die Verwendung von Schneeketten ist nicht zulässig.“ stands in the ${where}`);
    } else {
        s.note({ severity: 'S2', page: `${PRODUCT} (X3 X83, 19″)`, what: 'no „alle Auflagen im Wortlaut“ link', expected: 'the overview links to every Auflage in full', shot: panelShot });
    }

    // The Gutachten PDF, opened at the page the row stands on (ABE 55255: the X3 row is on page 5).
    const pdf = panel.locator('.fit__pdf a').first();

    if (await pdf.count()) {
        const href = (await pdf.getAttribute('href')) ?? '';
        const label = norm(await pdf.innerText());

        check(s, /#page=5$/.test(href), { severity: 'S2', page: `${PRODUCT} (X3 X83, 19″)`, what: `PDF link „${label}“ → ${href}`, expected: 'ABE 55255 at page 5 (#page=5)', shot: panelShot });

        const file = await page.request.get(href.replace(/#.*$/, ''), { maxRedirects: 5 }).catch(() => null);
        const head = file && file.ok() ? (await file.body()).subarray(0, 5).toString('latin1') : '';

        check(s, head === '%PDF-', { severity: 'S1', page: `${PRODUCT} (X3 X83, 19″)`, what: `the Gutachten PDF does not open (${file?.status() ?? 'no answer'})`, expected: 'the PDF of ABE 55255', shot: panelShot });
    } else {
        s.note({ severity: 'S2', page: `${PRODUCT} (X3 X83, 19″)`, what: 'no „Gutachten öffnen (PDF …)“ link', expected: 'the document, at the page of the row', shot: panelShot });
    }

    await s.probe(`${PRODUCT} (X3 X83, 19″)`);

    // The 18″ for the same car (Nachtrag 366-0350-21-WIRD/N1, Anlage 16).
    const eighteen = await productWith(s, '18', X3);

    if (eighteen !== null) {
        await s.shot('product-x3-18-panel', eighteen);
        s.observe(PRODUCT, `X3 18″ panel: „${norm(await eighteen.innerText()).slice(0, 700)}“`);
        await s.probe(`${PRODUCT} (X3 X83, 18″)`, { shot: false });
    }

    // „RIMIFY-Check drucken oder teilen“ for the 19″: the answer frozen, then its printable page.
    const again = await productWith(s, '19', X3);
    const issue = again?.getByRole('button', { name: /RIMIFY-Check drucken oder teilen/ });

    if (again === null || issue === undefined || !(await issue.isVisible().catch(() => false))) {
        s.note({ severity: 'S2', page: `${PRODUCT} (X3 X83, 19″)`, what: 'no „RIMIFY-Check drucken oder teilen“', expected: 'the printable check' });

        return;
    }

    await issue.click();
    await page.waitForURL(/\/rimify-check\/ergebnis\/[^/]+$/, { timeout: 30_000 });
    await s.hydrated();

    const result = page.locator('section[aria-labelledby="res-cond-h"]');
    const resultShot = await s.shot('check-result-x3-19');

    check(s, (await result.count()) > 0, { severity: 'S1', page: '/rimify-check/ergebnis (X3 X83, 19″)', what: 'no Auflagen section', expected: 'every Auflage, grouped', shot: resultShot });

    if (await result.count()) {
        await s.checkGroups(result, '/rimify-check/ergebnis (X3 X83, 19″)', resultShot);
        await s.checkPapersLine(result, '/rimify-check/ergebnis (X3 X83, 19″)', resultShot);
    }

    await s.probe('/rimify-check/ergebnis (X3 X83, 19″)', { shot: false });

    // On paper: nothing to click, none of the shop around it.
    await page.emulateMedia({ media: 'print' });

    const printShot = await s.shot('check-result-x3-19-print');
    const printed = await page.evaluate(() => ({
        actions: Array.from(document.querySelectorAll('.res__actions')).some((el) => getComputedStyle(el).display !== 'none'),
        header: Array.from(document.querySelectorAll('.site-header, header')).some((el) => getComputedStyle(el).display !== 'none'),
        ribbon: Array.from(document.querySelectorAll('.preview-ribbon')).some((el) => getComputedStyle(el).display !== 'none'),
        bar: Array.from(document.querySelectorAll('.vbar')).some((el) => getComputedStyle(el).display !== 'none'),
    }));

    check(s, !printed.actions && !printed.header, { severity: 'S3', page: '/rimify-check/ergebnis (print)', what: `printed: ${JSON.stringify(printed)}`, expected: 'the answer and its number only', shot: printShot });
    s.observe('/rimify-check/ergebnis', `print: ${JSON.stringify(printed)}`);

    if (!s.phone) {
        mkdirSync(SHOTS, { recursive: true });
        await page.pdf({ path: resolve(SHOTS, 'check-result-x3-19.pdf'), printBackground: true }).catch(() => undefined);
    }

    await page.emulateMedia({ media: 'screen' });
});

// ── 06 · Product page, MINI on the 18″ (Anlage fehlt) ──────────────────────────────────────────────────────

test('06 Produktseite MINI Paceman UKL-C/X *00: 18″ Anlage fehlt (UNKNOWN), 19″ waits for the Karosserieform', async ({ page }, info) => {
    const s = new Sweep(page, info);
    const row = await chooseCar(s, 'MINI', 'Paceman', 'UKL-C/X', (r: VariantRow) => /, \*00$/.test(norm(r.approval ?? '')));

    if (row === null) {
        s.note({ severity: 'S2', page: '/fahrzeug', what: 'MINI › Paceman › UKL-C/X (*00) cannot be chosen', expected: 'the car ABE 55255 names on page 5' });

        return;
    }

    await s.open(PRODUCT);

    const panel = page.locator('.rcheck-panel').first();
    const shot = await s.shot('product-mini-paceman', page.locator('.pdp__buy'));
    const said = norm(await panel.innerText());

    s.observe(PRODUCT, `MINI Paceman panel: „${said.slice(0, 600)}“`);
    check(s, /Keine Freigabe hinterlegt für MINI Paceman|Noch offen für MINI Paceman/.test(said), { severity: 'S2', page: `${PRODUCT} (MINI Paceman)`, what: `headline „${norm(await panel.locator('.rcheck-panel__vehicle').innerText())}“`, expected: 'an UNKNOWN answer, never „Nicht freigegeben“ (R-07)', shot });
    check(s, said.includes('Anlage'), { severity: 'S2', page: `${PRODUCT} (MINI Paceman, 18″)`, what: 'the answer does not say the Anlage is missing', expected: '„… liegt uns die entsprechende Anlage des Gutachtens noch nicht vor …“', shot });

    for (const diameter of ['18', '19']) {
        const chip = sizeChip(page, diameter);

        if (await chip.count()) {
            s.observe(PRODUCT, `MINI ${diameter}″ chip: ${(await chip.isEnabled()) ? 'enabled' : 'struck'} · title „${norm((await chip.getAttribute('title')) ?? '')}“`);
        }
    }

    const nineteen = sizeChip(page, '19');
    const title = norm((await nineteen.getAttribute('title').catch(() => null)) ?? '');

    if (!(await nineteen.isEnabled().catch(() => true)) && title.includes('Karosserieform')) {
        const asked = await page.locator('.bf').first().isVisible().catch(() => false);

        check(s, asked, {
            severity: 'S2',
            page: `${PRODUCT} (MINI Paceman, 19″)`,
            what: `the 19″ waits for the Karosserieform („${title}“) but is struck and the page never asks; the note says „${norm(await page.locator('.pdp__note').innerText().catch(() => ''))}“`,
            expected: 'the 19″ choosable and its question asked, as /felgen asks it (SWEEP-03)',
            shot,
        });
    }

    await s.probe(`${PRODUCT} (MINI Paceman)`);
});

// ── 07 · Product page, a car the 19″ refuses (NOT_PERMITTED) ───────────────────────────────────────────────

test('07 Produktseite BMW Z4 ZR: the 19″ refused (NOT_PERMITTED), said as such', async ({ page }, info) => {
    const s = new Sweep(page, info);
    const row = await chooseCar(s, 'BMW', 'Z4', 'ZR');

    if (row === null) {
        s.observe('/fahrzeug', 'BMW › Z4 › ZR not on the shop: NOT_PERMITTED not reached this way');

        return;
    }

    await s.open(PRODUCT);

    const nineteen = sizeChip(page, '19');
    const shot = await s.shot('product-z4', page.locator('.pdp__buy'));
    const title = norm((await nineteen.getAttribute('title').catch(() => null)) ?? '');
    const note = norm(await page.locator('.pdp__note').innerText().catch(() => ''));

    s.observe(PRODUCT, `Z4 19″: ${(await nineteen.isEnabled().catch(() => false)) ? 'enabled' : 'struck'} · title „${title}“ · note „${note}“`);
    s.observe(PRODUCT, `Z4 panel: „${norm(await page.locator('.rcheck-panel').first().innerText()).slice(0, 500)}“`);

    if (await nineteen.isEnabled().catch(() => false)) {
        await nineteen.click();

        const headline = norm(await page.locator('.rcheck-panel__vehicle').first().innerText());

        check(s, headline.startsWith('Nicht freigegeben für'), { severity: 'S1', page: `${PRODUCT} (Z4 ZR, 19″)`, what: `headline „${headline}“`, expected: '„Nicht freigegeben für BMW Z4 ZR“', shot });
    } else {
        check(s, /nicht freigegeben/i.test(note) || /nicht/i.test(title), { severity: 'S2', page: `${PRODUCT} (Z4 ZR, 19″)`, what: `struck 19″ says „${note}“ / title „${title}“`, expected: 'that the document does not permit it (NOT_PERMITTED), not „keine Freigabe hinterlegt“', shot });
    }

    await s.probe(`${PRODUCT} (Z4 ZR)`);
});

// ── 08 · Product page, a car no document names (UNKNOWN) ──────────────────────────────────────────────────

test('08 Produktseite: a car no document names → Keine Freigabe hinterlegt', async ({ page }, info) => {
    const s = new Sweep(page, info);

    await s.open('/');

    let picked: { make: string; model: string; id: number; label: string } | null = null;

    for (const make of ['VW', 'Volkswagen', 'Audi', 'Mercedes-Benz', 'Opel', 'Ford', 'Skoda', 'Seat', 'Toyota', 'Renault', 'Hyundai', 'Kia', 'Peugeot', 'Fiat']) {
        const models = await modelsOf(page, make);
        const first = models[0];

        if (first === undefined) {
            continue;
        }

        const variant = (await variantsOf(page, make, first.model))[0];

        if (variant !== undefined) {
            picked = { make, model: first.model, id: variant.id, label: `${make} ${first.model} ${variant.typeDesignation ?? variant.variant}` };
            break;
        }
    }

    if (picked === null || !(await chooseById(page, picked.id))) {
        s.observe('/fahrzeug', 'no make besides BMW and MINI on the shop: „Keine Freigabe hinterlegt“ for an unnamed car not reached');

        return;
    }

    await s.open(PRODUCT);

    const panel = page.locator('.rcheck-panel').first();
    const shot = await s.shot('product-unnamed-car', page.locator('.pdp__buy'));
    const headline = norm(await panel.locator('.rcheck-panel__vehicle').innerText());

    s.observe(PRODUCT, `${picked.label}: „${norm(await panel.innerText()).slice(0, 400)}“`);
    check(s, /^(Keine Freigabe hinterlegt|Nicht freigegeben|Noch offen) für /.test(headline), { severity: 'S1', page: `${PRODUCT} (${picked.label})`, what: `headline „${headline}“`, expected: 'no positive answer for a car no document names', shot });
    check(s, !(await page.locator('.pdp__add').isEnabled()), { severity: 'S1', page: `${PRODUCT} (${picked.label})`, what: 'the basket button is enabled for a car no document names', expected: 'disabled — the verdict is not sellable', shot });

    await s.probe(`${PRODUCT} (${picked.label})`);
});

// ── 09 · Felgenrechner ──────────────────────────────────────────────────────────────────────────────────────

test('09 /felgenrechner: results, figures, an invalid value', async ({ page }, info) => {
    const s = new Sweep(page, info);

    await s.open('/felgenrechner');
    await s.probe('/felgenrechner');

    const field = page.locator('main input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), main select').first();

    if (!(await field.count())) {
        s.note({ severity: 'S2', page: '/felgenrechner', what: 'no field to change', expected: 'the calculator’s inputs' });

        return;
    }

    const tag = await field.evaluate((el) => el.tagName);

    if (tag === 'SELECT') {
        const values = await field.locator('option').evaluateAll((os) => (os as HTMLOptionElement[]).map((o) => o.value));

        await field.selectOption(values[values.length - 1] ?? '');
    } else {
        await field.fill('999');
        await field.press('Tab');
    }

    await page.waitForTimeout(600);

    const errors = norm((await page.locator('[aria-invalid="true"], .form-field__error, .field-error, [role="alert"]').allInnerTexts()).join(' '));

    s.observe('/felgenrechner', `after changing the first ${tag.toLowerCase()}: errors „${errors}“`);
    await s.probe('/felgenrechner (changed)');
});

// ── 10 · Vergleich ──────────────────────────────────────────────────────────────────────────────────────────

test('10 /vergleich: two tiles compared, without and with the X3 X83', async ({ page }, info) => {
    const s = new Sweep(page, info);

    await s.open('/felgen');

    const boxes = page.locator('label.tile__compare');

    if ((await boxes.count()) < 2) {
        s.note({ severity: 'S2', page: '/felgen', what: `${await boxes.count()} „Vergleichen“ boxes`, expected: 'two tiles to compare' });

        return;
    }

    await boxes.nth(0).click();
    await page.waitForTimeout(400);
    await boxes.nth(1).click();
    await page.waitForTimeout(400);

    const tray = page.locator('.tray__go');

    check(s, await tray.isVisible().catch(() => false), { severity: 'S2', page: '/felgen (compare)', what: 'no compare tray after ticking two tiles', expected: 'the tray with „Vergleichen“', shot: await s.shot('compare-tray') });

    if (!(await tray.isVisible().catch(() => false))) {
        return;
    }

    await tray.click();
    await page.waitForURL(/\/vergleich\?/, { timeout: 30_000 });
    await s.hydrated();

    const url = page.url();
    const columns = await page.locator('[id^="compare-col-"]').count();

    check(s, columns >= 2, { severity: 'S1', page: '/vergleich', what: `${columns} columns`, expected: 'two', shot: await s.shot('compare-two') });
    await s.probe('/vergleich');

    if (!(await chooseX3(s))) {
        return;
    }

    await s.open(new URL(url).pathname + new URL(url).search);

    const text = norm(await page.locator('main').innerText());

    s.observe('/vergleich', `with X3: „${text.slice(0, 900)}“`);
    check(s, !(text.includes(FINE_LINK_CHAINS) && text.includes(NO_CHAINS)), { severity: 'S2', page: `/vergleich (${X3})`, what: 'the compare page lists both snow-chain sentences', expected: 'only what every size shares, „Weitere Auflagen je nach Größe“', shot: await s.shot('compare-two-x3') });
    await s.probe(`/vergleich (${X3})`);
});

// ── 11 · Warenkorb → Kasse → Testzahlung → Bestellung ─────────────────────────────────────────────────────

test('11 Warenkorb, Kasse („Auflagen lesen“), Testzahlung, Bestellbestätigung (X3 X83, 19″)', async ({ page, browser }, info) => {
    const s = new Sweep(page, info);

    if (!(await chooseX3(s))) {
        return;
    }

    if ((await productWith(s, '19', X3)) === null) {
        return;
    }

    // A double click: one line, never two (the button locks while it posts).
    await page.locator('.pdp__add').dblclick();

    const confirmed = await page
        .getByText('Zum Warenkorb hinzugefügt.')
        .first()
        .waitFor({ timeout: 30_000 })
        .then(() => true)
        .catch(() => false);

    check(s, confirmed, { severity: 'S3', page: PRODUCT, what: 'no confirmation after „In den Warenkorb“', expected: '„Zum Warenkorb hinzugefügt.“' });

    await s.open('/warenkorb');

    const lines = page.locator('li.bl__line', { hasText: 'DB8GT2' });

    check(s, (await lines.count()) === 1, { severity: 'S2', page: '/warenkorb', what: `${await lines.count()} DB8GT2 lines after a double click`, expected: 'one line' });

    const line = lines.first();
    const lineShot = await s.shot('basket-x3-19', line);

    await s.checkGroups(line, '/warenkorb (X3 X83, 19″)', lineShot);
    await s.checkPapersLine(line, '/warenkorb (X3 X83, 19″)', lineShot);

    const quantity = async (): Promise<number> => Number(norm(await line.locator('.bl__n').innerText().catch(() => '0')));
    const added = await quantity();

    // The button adds a set of four; a second post from the double click would make it eight.
    check(s, added === 4, { severity: 'S2', page: `${PRODUCT} → /warenkorb`, what: `a double click on „In den Warenkorb“ left quantity ${added}`, expected: '4 — one post', shot: lineShot });

    // One wheel is enough for a test order: the stock of the one real product is 12.
    for (let i = 0; i < 8 && (await quantity()) > 1; i += 1) {
        const before = await quantity();

        await line.getByRole('button', { name: 'Menge verringern' }).click();
        await expect.poll(quantity, { timeout: 15_000 }).toBeLessThan(before);
    }

    await s.probe('/warenkorb (X3 X83, 19″)');

    await page.locator('a.cart__go').click();
    await page.waitForURL(/\/kasse$/, { timeout: 30_000 });
    await s.hydrated();
    await s.probe('/kasse · Adresse');

    await page.locator('#ko-mail').fill('sweep-testkunde@example.com');
    await page.locator('#ko-name').fill('Sweep Testkunde');
    await page.locator('#ko-street').fill('Teststraße');
    await page.locator('#ko-nr').fill('1');
    await page.locator('#ko-zip').fill('10115');
    await page.locator('#ko-city').fill('Berlin');
    await page.getByRole('button', { name: 'Weiter zu Optionen & Versand' }).click();
    await page.waitForTimeout(800);
    await s.probe('/kasse · Optionen & Versand');
    await page.getByRole('button', { name: 'Weiter zur Zahlung' }).click();
    await page.waitForTimeout(800);

    const final = page.locator('.ko__final');

    check(s, await final.isVisible().catch(() => false), { severity: 'S1', page: '/kasse · Zahlung', what: 'the payment step did not open', expected: 'step 3 with the goods above the button', shot: await s.shot('kasse-step3-missing') });

    const read = final.locator('details.ko__auflagen').first();

    if (await read.count()) {
        await read.locator('summary').click();

        const readShot = await s.shot('kasse-auflagen-lesen', final);

        await s.checkGroups(read, '/kasse · Auflagen lesen (X3 X83, 19″)', readShot);
        await s.checkPapersLine(final.locator('.ko__essential').first(), '/kasse · Zahlung (X3 X83, 19″)', readShot);
    } else {
        s.note({ severity: 'S2', page: '/kasse · Zahlung', what: 'no „Auflagen lesen“', expected: 'the Auflagen one tap away, in full', shot: await s.shot('kasse-step3') });
    }

    check(s, await page.locator('#ko-sandbox').isVisible().catch(() => false), { severity: 'S3', page: '/kasse · Zahlung', what: 'no Testzahlung note on the preview', expected: 'the sandbox named as such' });
    await s.probe('/kasse · Zahlung');

    const orderFile = resolve(STATE, 'order.json');

    if (!s.phone && !NO_ORDER) {
        await page.getByRole('button', { name: 'Zahlungspflichtig bestellen' }).click();
        await page.waitForURL(/\/kasse\/testzahlung\//, { timeout: 30_000 });
        await s.hydrated();
        await s.probe('/kasse/testzahlung');
        await page.getByRole('button', { name: 'Zahlung erfolgreich' }).click();
        await page.waitForURL(/\/bestellung\//, { timeout: 30_000 });
        await s.hydrated();
        await page.waitForTimeout(2500);

        await checkOrder(s, page);

        mkdirSync(STATE, { recursive: true });
        await page.context().storageState({ path: resolve(STATE, 'order-state.json') });
        writeFileSync(orderFile, JSON.stringify({ url: page.url() }));
    }

    if (s.phone && existsSync(orderFile)) {
        // The desktop's order, read at 390 with the desktop's session (an order opens only for the browser that placed it).
        const { url } = JSON.parse(readFileSync(orderFile, 'utf8')) as { url: string };
        const context = await browser.newContext({
            ...devices['Pixel 7'],
            viewport: { width: 390, height: 844 },
            locale: 'de-DE',
            timezoneId: 'Europe/Berlin',
            storageState: resolve(STATE, 'order-state.json'),
        });
        const phonePage = await context.newPage();
        const phone = new Sweep(phonePage, info);

        await phone.open(url);
        await checkOrder(phone, phonePage);
        await context.close();
    } else if (s.phone) {
        s.observe('/bestellung', 'no order from the desktop project to read at 390');
    }
});

async function checkOrder(s: Sweep, page: Page): Promise<void> {
    const heading = norm(await page.locator('h1').first().innerText().catch(() => ''));
    const shot = await s.shot('order-confirmation');

    check(s, heading === 'Vielen Dank für deine Bestellung.', { severity: 'S1', page: '/bestellung/{nr}', what: `heading „${heading}“`, expected: '„Vielen Dank für deine Bestellung.“', shot });

    const lines = page.locator('.ord__lines');

    await s.checkGroups(lines, '/bestellung/{nr} (X3 X83, 19″)', shot);
    await s.checkPapersLine(lines, '/bestellung/{nr} (X3 X83, 19″)', shot);
    s.observe('/bestellung', `order page: „${norm(await page.locator('main').innerText().catch(() => '')).slice(0, 900)}“`);
    await s.probe('/bestellung/{nr}', { allow: /\/status/ });
}

// ── 12 · Konto, FAQ, Kontakt, Rechtliches, RIMIFY-Check, Fahrzeug wählen ───────────────────────────────────

test('12 Konto, FAQ, Kontakt, every Rechtliches page, /rimify-check, /felgen-suchen', async ({ page }, info) => {
    const s = new Sweep(page, info);

    await s.open('/konto');
    check(s, /\/konto\/anmelden/.test(page.url()), { severity: 'S2', page: '/konto', what: `a guest lands on ${page.url()}`, expected: '/konto/anmelden' });
    await s.probe('/konto/anmelden');
    await s.open('/konto/passwort-vergessen');
    await s.probe('/konto/passwort-vergessen');

    await s.open('/faq');
    await s.probe('/faq');

    const search = page.locator('#faq-q');

    if (await search.count()) {
        await search.fill('Eintragung');
        await page.waitForTimeout(300);
        check(s, (await page.locator('.acc').count()) > 0, { severity: 'S2', page: '/faq', what: 'searching „Eintragung“ finds nothing', expected: 'the answers about the Eintragung' });
        await search.fill('Kraftfahrzeug-Zulassungsbescheinigung-xyz');
        await page.waitForTimeout(300);

        const empty = norm(await page.locator('.faq__empty').innerText().catch(() => ''));

        check(s, empty.includes('Kraftfahrzeug-Zulassungsbescheinigung-xyz') && empty.includes('Suche löschen'), { severity: 'S2', page: '/faq', what: `no match reads „${empty}“`, expected: 'the term named, a way back', shot: await s.shot('faq-empty') });
        await s.probe('/faq (no match)', { shot: false });
    }

    await s.open('/kontakt');

    const mail = (await page.locator('a.kon__send').getAttribute('href').catch(() => null)) ?? '';

    check(s, mail.startsWith('mailto:'), { severity: 'S2', page: '/kontakt', what: `„E-Mail schreiben“ → ${mail}`, expected: 'a mailto: link' });
    await s.probe('/kontakt');

    for (const slug of ['impressum', 'datenschutz', 'agb', 'widerrufsbelehrung', 'versand']) {
        await s.open(`/rechtliches/${slug}`);

        const text = norm(await page.locator('main').innerText().catch(() => ''));

        if (text.includes('[Rechtstext folgt')) {
            s.note({ severity: 'S3', page: `/rechtliches/${slug}`, what: 'the Kanzlei’s text is still the marked placeholder „[Rechtstext folgt von der Kanzlei — …]“', expected: 'the Kanzlei’s text before launch (known, D-024)' });
        }

        await s.probe(`/rechtliches/${slug}`);
    }

    await s.open('/rechtliches/widerrufsformular');
    await s.probe('/rechtliches/widerrufsformular');

    const soft = await s.open('/rechtliches/gibt-es-nicht');

    if (soft === 200) {
        s.note({ severity: 'S3', page: '/rechtliches/gibt-es-nicht', what: `an unknown legal page answers 200 with „${norm(await page.locator('h1').first().innerText().catch(() => ''))}“`, expected: '404 (RechtlichesController falls back to the Impressum)' });
    }

    s.drain('/rechtliches/gibt-es-nicht');

    await s.open('/rimify-check');
    await s.probe('/rimify-check');
    await s.open('/felgen-suchen');
    await s.probe('/felgen-suchen');

    // With a car: Kontakt writes it into the mail.
    if (await chooseX3(s)) {
        await s.open('/kontakt');

        const body = decodeURIComponent((await page.locator('a.kon__send').getAttribute('href').catch(() => null)) ?? '');
        const hint = norm(await page.locator('.kon__hint').innerText().catch(() => ''));

        s.observe('/kontakt', `with X3: mail „${body}“ · hint „${hint}“`);
        check(s, !body.includes('HSN/TSN noch nicht hinterlegt'), { severity: 'S3', page: `/kontakt (${X3})`, what: `the prepared mail names the car as „${body.split('\n')[0]?.replace(/^.*body=/, '')}“ while the page says „${hint}“`, expected: 'the Feld K line the page shows (EF-06)' });
    }
});

// ── 13 · 404, 419, an expired check ────────────────────────────────────────────────────────────────────────

test('13 Fehlerseiten: 404, 419, an expired RIMIFY-Check link', async ({ page }, info) => {
    const s = new Sweep(page, info);

    for (const path of ['/gibt-es-nicht', `${PRODUCT}-gibt-es-nicht`]) {
        const status = await s.open(path);
        const h1 = norm(await page.locator('h1').first().innerText().catch(() => ''));
        const ways = await page.locator('.err__routes a').count();
        const shot = await s.shot(`error-404-${path.replace(/\W+/g, '-')}`);

        check(s, status === 404, { severity: 'S2', page: path, what: `answered ${status}`, expected: '404', shot });
        check(s, h1 === 'Diese Seite haben wir nicht gefunden.' && ways === 3, { severity: 'S2', page: path, what: `„${h1}“ with ${ways} ways on`, expected: 'the designed 404 with three ways forward (R-09)', shot });
        await s.probe(`${path} (404)`, { allow: /404/ });
    }

    // Another site's form posting to the shop: the 419 page. Nothing is processed. A form on the shop's own pages
    // cannot provoke it: Laravel 13 takes a browser's `Sec-Fetch-Site: same-origin` as proof (PreventRequestForgery),
    // so a tokenless same-site POST is validated and sent back, never refused.
    await s.open('/');
    await page.goto(`data:text/html,<form method="POST" action="${new URL('/warenkorb', page.url()).href}"></form>`);
    await Promise.all([
        page.waitForResponse((r) => r.url().endsWith('/warenkorb') && r.request().method() === 'POST'),
        page.evaluate(() => document.forms[0]?.submit()),
    ]);
    await page.waitForLoadState('domcontentloaded');
    await s.hydrated();

    const h1 = norm(await page.locator('h1').first().innerText().catch(() => ''));
    const ways = await page.locator('.err__routes a').count();

    check(s, h1 === 'Deine Sitzung ist abgelaufen.' && ways === 3, { severity: 'S2', page: '419', what: `„${h1}“ with ${ways} ways on`, expected: 'the designed 419 with three ways forward', shot: await s.shot('error-419') });
    await s.probe('419', { allow: /419/ });

    await s.open('/rimify-check/ergebnis/abgelaufen0000000000');

    const expired = norm(await page.locator('h1').first().innerText().catch(() => ''));

    check(s, /nicht mehr verfügbar|nicht gefunden/.test(expired), { severity: 'S2', page: '/rimify-check/ergebnis/{unbekannt}', what: `„${expired}“`, expected: '„Dieses Ergebnis ist nicht mehr verfügbar.“ and a way on', shot: await s.shot('check-expired') });
    await s.probe('/rimify-check/ergebnis/{unbekannt}', { allow: /404|ergebnis/ });
});

// ── 14 · Every link the pages showed ───────────────────────────────────────────────────────────────────────

test('14 Links: every same-origin link the walk met answers', async ({ page }, info) => {
    const s = new Sweep(page, info);
    const file = resolve(STATE, `links-${info.project.name}.txt`);

    if (!existsSync(file)) {
        s.observe('links', 'no links recorded');

        return;
    }

    const byUrl = new Map<string, string>();

    for (const row of readFileSync(file, 'utf8').split('\n')) {
        const [from, url] = row.split('\t');

        if (from && url && !byUrl.has(url)) {
            byUrl.set(url, from);
        }
    }

    // Signed or session-bound: answered for the browser that holds them, 403/404 for anyone else by design.
    const skip = /\/(kasse\/testzahlung|rechnung|konto\/passwort\/|bestellung\/|benachrichtigung\/)/;
    let checked = 0;

    for (const [url, from] of byUrl) {
        if (skip.test(url)) {
            continue;
        }

        const response = await page.request.get(url, { maxRedirects: 5 }).catch(() => null);

        checked += 1;

        if (response === null || response.status() >= 400) {
            s.note({ severity: 'S2', page: from, what: `dead link ${url} (${response?.status() ?? 'no answer'})`, expected: 'every link leads somewhere' });
        }
    }

    s.observe('links', `${checked} links checked, ${byUrl.size} met`);
});
