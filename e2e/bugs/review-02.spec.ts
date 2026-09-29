import { expect, test } from '../fixtures';
import { SHOTS, focusFell, guardWrites, inertiaHeaders, isInertiaGet, signIn, waitForApp } from './gutachten-support';

/*
 * REVIEW-02 (S2) — Review › Rückmeldungen, keyboard: „Beantworten" and „Abbrechen" drop the focus to
 * `<body>` (docs/qa/BUGS.md). Feedback.vue swaps the button for the answer form with `v-if` / `v-else` and
 * back; the button that had the focus is gone and nothing takes it: the next Tab starts at „Zum Inhalt
 * springen", and the form just opened is a long way down the Tab order. „Speichern" does the same when the
 * form closes after the answer.
 *
 * Expected: „Beantworten" puts the focus into the form (its first field); „Abbrechen" and „Speichern" give
 * it back to „Beantworten".
 *
 * Nothing is written: the list is the server's own with one stand-in point on top (only in this test's
 * browser); nothing is saved.
 */

const ITEM_ID = 2_147_000_101;

const item = {
    id: ITEM_ID,
    type: 'fehler',
    typeLabel: 'Fehler',
    sentence: 'QA: ein Punkt nur im Browser dieses Tests.',
    url: '/admin',
    screen: 'Übersicht',
    viewport: '1440×900',
    browser: 'Chrome 140',
    role: null,
    by: 'QA',
    at: '27.09.2026, 10:00 Uhr',
    status: 'neu',
    statusLabel: 'Neu',
    answer: '',
    assigneeId: null,
    assignee: null,
    closedAt: null,
    image: null,
};

test('REVIEW-02 „Beantworten" and „Abbrechen" keep the focus with the point', async ({ page }, info) => {
    await signIn(page);
    await guardWrites(page);

    await page.route(
        (url) => url.pathname === '/admin/review/rueckmeldungen',
        async (route) => {
            const request = route.request();

            if (!(await isInertiaGet(request))) {
                await route.fallback();

                return;
            }

            const response = await route.fetch({ headers: await inertiaHeaders(request) });
            const json = (await response.json()) as { props: { items: unknown[]; can: { answer: boolean } } };

            json.props.items = [item, ...json.props.items];
            json.props.can = { answer: true };
            await route.fulfill({ response, json });
        },
    );

    await page.goto('/admin/review', { waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.locator('a[href$="/admin/review/rueckmeldungen"]').first().evaluate((link) => (link as HTMLElement).click());
    await page.waitForURL(/\/admin\/review\/rueckmeldungen$/);

    const point = page.locator('li.rf-item').filter({ hasText: item.sentence });
    await expect(point).toBeVisible();

    await point.getByRole('button', { name: 'Beantworten' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(`#rf-a-text-${ITEM_ID}`)).toBeVisible();

    const opened = await focusFell(page);

    await point.getByRole('button', { name: 'Abbrechen' }).focus();
    await page.keyboard.press('Enter');
    await expect(point.getByRole('button', { name: 'Beantworten' })).toBeVisible();

    const closed = await focusFell(page);

    await point.screenshot({ path: `${SHOTS}/review-02-point-${info.project.name}.png` });

    expect(
        { beantworten: opened.fell, abbrechen: closed.fell },
        `„Beantworten" left the focus on ${opened.on}; „Abbrechen" on ${closed.on}`,
    ).toEqual({ beantworten: false, abbrechen: false });
});
