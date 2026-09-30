import { execFileSync } from 'node:child_process'
import { SHOP_DB } from './shop'

/*
 * Every run of the suite starts from the same shop.
 *
 * The storefront specs buy in the review's sandbox — kasse.spec, PAY-01 — and a paid order keeps its wheels sold
 * (OrderPayments releases stock only for a cancelled or expired order). So each run used to leave the shop with less
 * on its shelves than the one before: a spec that passed in one run met a different shop in the next, and PAY-01
 * alone takes half a size's stock and one more. The shop's database is rebuilt from E2eShopSeeder before the run
 * instead (`composer e2e:shop`, ≈20 s; the seeder refuses any database not named `*_e2e`).
 *
 * `E2E_KEEP_SHOP=1` skips it, for a quick run of one spec that buys nothing.
 */
export default function globalSetup(): void {
    if (process.env.E2E_KEEP_SHOP === '1') {
        return
    }

    execFileSync(process.env.PHP_BINARY ?? 'php', ['artisan', 'migrate:fresh', '--seed', '--seeder=E2eShopSeeder', '--force', '--no-interaction'], {
        cwd: new URL('..', import.meta.url),
        env: { ...process.env, ...SHOP_DB },
        stdio: 'pipe',
    })
}
