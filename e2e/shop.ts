/*
 * Where the storefront specs find a shop with wheels in it.
 *
 * Example data never reaches the storefront (the review release §2): the demo catalogue is seeded as
 * drafts, so the storefront at :8000 shows no wheel until the client's catalogue is imported. The
 * storefront specs run against their own server and database instead — `rimify_wf_e2e`, seeded by
 * E2eShopSeeder (`composer e2e:shop`), which refuses every database not named `*_e2e` — started by
 * playwright.config.ts. A storefront spec says `test.use({ baseURL: SHOP })`.
 */

export const SHOP = process.env.E2E_SHOP_URL ?? 'http://127.0.0.1:8010'
