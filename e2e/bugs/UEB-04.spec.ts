import { expect, test } from '../fixtures';
import { SHOTS, isPhone, signIn, waitForApp } from './ueb-support';

/*
 * UEB-04 (S2) — on an iPhone an own Zeitraum cannot be typed (docs/qa/BUGS.md).
 *
 * PeriodSwitcher.vue: the „Von" / „Bis" fields carry `inputmode="numeric"`, which on iOS brings up
 * the digits-only number pad — no full stop, no comma — while applyCustom() accepts nothing but
 * TT.MM.JJJJ (days.ts parseGermanDay: `^\d{1,2}\.\d{1,2}\.\d{4}$`). Whoever clears a field, or selects
 * it and types over it, can only enter „01082026", which is refused with „Bitte schreib das Datum als
 * TT.MM.JJJJ …". The only way through is to edit digits around the prefilled full stops.
 *
 * The test types what the keypad the field asks for can produce: digits only for numeric / decimal /
 * tel, the dotted date otherwise. Expected: the range is applied (`?zeitraum=eigen&von=2026-08-01…`).
 *
 * The Zeitraum is remembered on the account: the test puts 30 days back whatever happens.
 */

test('UEB-04 an own Zeitraum can be typed with the keypad its fields ask for', async ({ page }, info) => {
    test.skip(!isPhone(info.project.name), 'The phone keypad.');

    await signIn(page);

    try {
        await page.goto('/admin?zeitraum=30', { waitUntil: 'networkidle' });
        await waitForApp(page);

        await page.locator('.period__custom').click();

        const von = page.locator('#period-von');
        const bis = page.locator('#period-bis');

        await expect(von).toBeVisible();

        const mode = (await von.getAttribute('inputmode')) ?? 'text';
        const digitsOnly = ['numeric', 'decimal', 'tel'].includes(mode);

        await von.fill(digitsOnly ? '01082026' : '01.08.2026');
        await bis.fill(digitsOnly ? '31082026' : '31.08.2026');
        await page.getByRole('button', { name: 'Anwenden' }).click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: `${SHOTS}/ueb-04-own-range-${info.project.name}.png` });

        // The server answers with its query in its own order (Laravel sorts it): each part is checked.
        await expect
            .poll(
                () => {
                    const query = new URL(page.url()).searchParams;

                    return `${query.get('zeitraum')} ${query.get('von')} ${query.get('bis')}`;
                },
                { message: `inputmode="${mode}" brings up a keypad without a full stop, yet only TT.MM.JJJJ is accepted` },
            )
            .toBe('eigen 2026-08-01 2026-08-31');
    } finally {
        await page.goto('/admin?zeitraum=30', { waitUntil: 'networkidle' });
    }
});
