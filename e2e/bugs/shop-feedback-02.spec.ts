import { expect, test } from '../fixtures';
import { waitForApp } from './faq-support';
import { SHOP_FEEDBACK_BASE, SHOTS, feedbackButton, guardSends, signIn, topmostAt } from './shop-feedback-support';

test.use({ baseURL: SHOP_FEEDBACK_BASE });

/*
 * SHOP-FEEDBACK-02 (S2) — the cookie card hid the feedback button (docs/qa/BUGS.md).
 *
 * Both sat in the same corner: `.shop-fb` at right 24 / bottom 24 (16 / 16 on a phone), z-index --z-header (200); the
 * cookie card `.consent` at right 24 / bottom 24, 440 px wide from 1024 px (full width below), z-index --z-toast (600).
 * The admin pages carry no cookie card, so the client meets it on his first shop page after signing in — and there the
 * button was not to be seen, while Tab still landed on it under the card (WCAG 2.4.11).
 *
 * Decided (D-142): the card owns the corner until it is answered — the button is absent meanwhile, out of view and out
 * of the tab order — and appears in its corner, uncovered, once the card is answered. No consent cookie in this test,
 * on purpose. Writes nothing.
 */

test('SHOP-FEEDBACK-02 the feedback button never sits under the cookie card: it waits until the card is answered', async ({ page }, info) => {
    await signIn(page);
    await guardSends(page);

    await page.goto('/kontakt', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);

    const card = page.locator('section.consent');
    const button = feedbackButton(page);

    await expect(card, 'precondition: no cookie card for a browser that has not answered it').toBeVisible();
    await expect(button, 'the feedback button shows under the cookie card').toBeHidden();
    await page.screenshot({ path: `${SHOTS}/shop-feedback-02-cookie-card-${info.project.name}.png` });

    await card.getByRole('button', { name: 'Verstanden' }).first().click();
    await expect(card).toBeHidden();
    await expect(button, 'the feedback button did not come once the cookie card was answered').toBeVisible();

    const top = await topmostAt(button);

    expect(top.inside, `the button's centre shows ${top.what}`).toBe(true);
});
