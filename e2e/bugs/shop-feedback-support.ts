import { expect, type Locator, type Page } from '@playwright/test';
import { REVIEW_PASSWORD } from '../support';
import { waitForApp } from './faq-support';

/*
 * Shared steps of the shop-feedback bug tests of 03.10.2026 (docs/qa/BUGS.md, SHOP-FEEDBACK-xx;
 * docs/qa/reviews/SHOP-FEEDBACK-2026-10-03.md): the review's „Rückmeldung geben“ on the shop's own pages (D-142) —
 * ShopFeedback.vue, FeedbackDialog.vue (surface „shop“), useFeedback.ts, HandleInertiaRequests::reviewer().
 *
 * The development shop, the admin's address (as e2e/shop-feedback.spec.ts — :8000 unless E2E_ADMIN_PORT moves it): the
 * review is on there and the review accounts carry the development password. `SHOP_FEEDBACK_BASE_URL` names another
 * copy. Nothing in these specs needs a wheel in the catalogue: the pages used are /kontakt and /faq, and the compare
 * list is put into the browser's own storage.
 *
 * Nothing is written: `guardSends` stops every POST to /admin/review/rueckmeldungen in the browser unless a spec has put
 * its own handler in front (SHOP-FEEDBACK-01 answers it in the browser). No point reaches the database.
 */

export const SHOP_FEEDBACK_BASE =
    process.env.SHOP_FEEDBACK_BASE_URL ?? process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8000';

/** Where the specs leave their evidence. Relative to the project root, where Playwright runs. */
export const SHOTS = 'docs/qa/shots/shop-feedback-2026-10-03';

/** The review account the brief names; the development password is the seeder's (ReviewAccountsSeeder::PASSWORD). */
export const REVIEWER = { email: 'verkauf@rimify.test', password: REVIEW_PASSWORD };

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Signs in to the admin as the Verkauf review account and waits for the Übersicht. */
export async function signIn(page: Page): Promise<void> {
    await page.goto('/admin/anmelden', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.fill('#lg-mail', REVIEWER.email);
    await page.fill('#lg-pass', REVIEWER.password);
    await page.locator('button[type=submit]').first().click();
    await page.waitForURL(/\/admin(\?.*)?$/, { waitUntil: 'domcontentloaded', timeout: 30_000 });
}

/** Aborts, in the browser, every POST to the review's feedback address that no later handler answers. */
export async function guardSends(page: Page): Promise<string[]> {
    const stopped: string[] = [];

    await page.route(
        (url) => url.pathname === '/admin/review/rueckmeldungen',
        async (route) => {
            if (route.request().method() === 'GET') {
                await route.fallback();

                return;
            }

            stopped.push(`${route.request().method()} /admin/review/rueckmeldungen`);
            await route.abort();
        },
    );

    return stopped;
}

/** The feedback button. */
export function feedbackButton(page: Page): Locator {
    return page.locator('button.shop-fb');
}

/**
 * The feedback dialog („Rückmeldung geben“): reka's dialog element around the sentence field. Found by CSS, not by the
 * accessibility tree, so it is still found while another modal (Inertia's error dialog) has made it inert.
 */
export function feedbackDialog(page: Page): Locator {
    return page.locator('[role="dialog"]:has(#fb-sentence)');
}

/** A shop page, hydrated, with the feedback button on it (the signed-in admin's). */
export async function openShop(page: Page, path: string): Promise<Locator> {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    const button = feedbackButton(page);

    await expect(
        button,
        `precondition: no feedback button on ${path} for the signed-in review account`,
    ).toBeVisible({ timeout: 15_000 });

    return button;
}

/** Opens the dialog with the button (the screenshot is taken first, which takes a moment) and returns it. */
export async function openFeedback(page: Page): Promise<Locator> {
    await feedbackButton(page).click();

    const dialog = feedbackDialog(page);

    await expect(dialog, 'the feedback dialog did not open').toBeVisible({ timeout: 30_000 });

    return dialog;
}

export function intersects(a: Box, b: Box): boolean {
    return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export function fmt(box: Box): string {
    return `${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}×${Math.round(box.height)}`;
}

/**
 * What a finger or a pointer would hit on `target`: its centre, or a point 12 px inside its right end. `inside` is true
 * when the topmost element there is the target or inside it.
 */
export async function topmostAt(
    target: Locator,
    where: 'centre' | 'right' = 'centre',
): Promise<{ inside: boolean; what: string }> {
    return target.evaluate((element, at) => {
        const r = element.getBoundingClientRect();
        const x = at === 'right' ? r.right - Math.min(12, r.width / 4) : r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const hit = document.elementFromPoint(x, y);
        const name = (el: Element | null): string => {
            if (el === null) {
                return 'nothing';
            }

            const id = el.id ? `#${el.id}` : '';
            const classes =
                typeof el.className === 'string' && el.className.trim() !== ''
                    ? `.${el.className.trim().split(/\s+/).join('.')}`
                    : '';
            const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 48);

            return `<${el.tagName.toLowerCase()}${id}${classes}>${text === '' ? '' : ` „${text}“`}`;
        };

        return { inside: hit !== null && (hit === element || element.contains(hit)), what: name(hit) };
    }, where);
}

/** Counts the magenta pixels (#ff00ff, with a margin for smoothing) in a data-URL image, in the page. */
export async function magentaPixels(page: Page, dataUrl: string): Promise<number> {
    return page.evaluate(async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const context = canvas.getContext('2d');

        if (context === null) {
            return -1;
        }

        context.drawImage(img, 0, 0);

        const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let n = 0;

        for (let i = 0; i < data.length; i += 4) {
            if ((data[i] ?? 0) > 220 && (data[i + 1] ?? 255) < 60 && (data[i + 2] ?? 0) > 220) {
                n++;
            }
        }

        return n;
    }, dataUrl);
}
