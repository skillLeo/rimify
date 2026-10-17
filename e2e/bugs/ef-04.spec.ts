import { expect, test, type APIRequestContext } from '../fixtures';
import { SHOP } from '../shop';
import { consentGiven, open } from '../support';
import { SHOTS } from './ef-support';

// A storefront spec: the e2e shop (e2e/shop.ts), its own database.
test.use({ baseURL: SHOP });

/*
 * EF-04 (S2) — Block E/F review: the search box and the vehicle selector still share one rate limit.
 *
 * b1df00f3 („every rate limit counts its own route") gave each throttle a key — but routes/web.php line 132 puts
 * the whole storefront API behind ONE: `throttle:60,1,api` covers /api/v1/search, /vehicles/models,
 * /vehicles/variants and /fitment/count. The header search fires one request per keystroke that follows the last
 * by more than 120 ms (useSearch.ts, SEARCH_DEBOUNCE_MS) — at ordinary typing speed, every keystroke. About sixty
 * characters typed into the search within a minute, and the search itself answers 429 („Die Suche ist gerade
 * nicht erreichbar."), and so does the next step of the vehicle selector: the hero's model list („Die Liste lässt
 * sich gerade nicht laden …"), the variant list and the live count, for the rest of that minute. The key is the
 * visitor's IP (no customer is signed in), so everyone behind one address shares the sixty.
 *
 * Expected: a customer who searches three times and then picks a make is never refused (no 429 on any storefront
 * API request of that journey).
 *
 * Writes nothing but the rate limiter's own counter. The api counter of 127.0.0.1 on this shop is exhausted when the
 * bug is present, so the test waits for it to clear before it ends — later specs meet the shop as they expect.
 */

const QUERIES = ['BBS CH-R 8,5x19 ET35', 'Borbet DB8 19 Zoll', 'Kraftfahrzeug-Zulassungsbescheinigung'];

/** A customer typing at about 65 words a minute: every keystroke more than the 120 ms debounce apart. */
const KEY_DELAY_MS = 180;

async function apiStatus(request: APIRequestContext): Promise<number> {
    return (await request.get('/api/v1/vehicles/models?marke=BMW', { headers: { Accept: 'application/json' } })).status();
}

// By request, never through the page (e2e/teardown.ts): the limiter's counter is the visitor's IP, which any request
// from this machine shares.
test.afterEach(async ({ request, isMobile }) => {
    if (isMobile) {
        return;
    }

    // The window is a minute from its first request; a refused request does not extend it.
    const until = Date.now() + 70_000;

    while (Date.now() < until && (await apiStatus(request)) === 429) {
        await new Promise((done) => setTimeout(done, 5_000));
    }
});

test('EF-04 searching three times and then choosing a make is never refused with 429', async ({ page, isMobile }, info) => {
    test.skip(isMobile, 'the header search box is the desktop document\'s');
    test.slow();

    await consentGiven(page.context(), SHOP);
    await open(page, '/');

    const answers: { path: string; status: number }[] = [];

    page.on('response', (response) => {
        const url = new URL(response.url());

        if (url.pathname.startsWith('/api/v1/')) {
            answers.push({ path: `${url.pathname}${url.search}`, status: response.status() });
        }
    });

    const box = page.locator('.sh__tools .sbox__input');

    await expect(box, 'the header search box is not on the page').toBeVisible();

    let typed = 0;

    for (const query of QUERIES) {
        await box.click();
        await box.fill('');
        await box.pressSequentially(query, { delay: KEY_DELAY_MS });
        typed += query.length;
        await page.waitForTimeout(600);
    }

    await page.screenshot({ path: `${SHOTS}/ef-04-search-after-${typed}-keys-${info.project.name}.png` });

    // The hero's first step, exactly as HeroSelector.vue asks it once a make is picked.
    const models = await page.evaluate(async () => {
        const response = await fetch('/api/v1/vehicles/models?marke=BMW', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });

        return response.status;
    });

    answers.push({ path: '/api/v1/vehicles/models?marke=BMW (the hero, after the searches)', status: models });

    const refused = answers.filter((a) => a.status === 429);

    expect(
        refused.map((a) => a.path),
        `${refused.length} of ${answers.length} storefront API answers were 429 after ${typed} keystrokes in the search — the first at answer #${answers.findIndex((a) => a.status === 429) + 1}; the vehicle selector's model list answered ${models}`,
    ).toEqual([]);
});
