import { expect, test } from '../fixtures';
import { focused, signIn } from './gutachten-support';
import { REASON, SHOTS, T88, openWithLimitWarning } from './c-support';

/*
 * C-05 (S2) — Block C review: a confirmed load-index limit drops the keyboard to <body>.
 *
 * Auflagenverzeichnis.vue confirmLimit(): onSuccess only clears the error. The answer carries `limitConfirmed`,
 * so the confirm form — with the „Zahl bestätigen" button the person pressed — is replaced by the line
 * „Bestätigt von … am …", and nothing asks for the focus (the rest of this list uses useFocusAfter for exactly
 * this; K2-03…05 were the same defect). The person then has to find their way back from the top of the admin to
 * the Freigabe or the next warning.
 *
 * Expected: after the confirmation the keyboard lands on something in the Auflagenverzeichnis — the
 * confirmed line, the next unconfirmed warning's reason, or „Code hinzufügen" — never on <body>.
 *
 * Nothing is written: as C-04.
 */

test('C-05 after „Zahl bestätigen" the keyboard stays in the Auflagenverzeichnis', async ({ page }, info) => {
    await signIn(page);
    await openWithLimitWarning(page);

    const reason = page.locator(`#av-limit-${T88.id}`);

    await reason.focus();
    await page.keyboard.type(REASON);
    await page.keyboard.press('Tab');
    await expect(page.locator('.av-limit__form').getByRole('button', { name: 'Zahl bestätigen' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.locator('.av-limit__done'), 'T88 was not shown as confirmed after the answer').toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(400);

    const on = await focused(page);

    await page.locator('.av').screenshot({ path: `${SHOTS}/c-05-after-confirm-${info.project.name}.png` });

    expect(on, 'after „Zahl bestätigen" the keyboard fell to <body>').not.toBe('<body>');
});
