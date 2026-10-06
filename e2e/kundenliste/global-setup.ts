import { execFileSync } from 'node:child_process'
import { ABNAHME_DB } from './support'

/*
 * Every run of the client's list starts from the same shop: the preview as it is after its reset, plus the acceptance
 * set (`rimify:demo --abnahme`) — what the client will see once he says yes to it. `E2E_KEEP_SHOP=1` skips the rebuild
 * (≈ 2 min), for a quick run of one spec that buys nothing.
 */
export default function globalSetup(): void {
    if (process.env.E2E_KEEP_SHOP === '1') {
        return
    }

    const php = process.env.PHP_BINARY ?? 'php'
    const options = { cwd: new URL('../..', import.meta.url), env: { ...process.env, ...ABNAHME_DB, DEMO_DATA: '1' }, stdio: 'pipe' as const }

    execFileSync(php, ['artisan', 'migrate:fresh', '--seed', '--seeder=Database\\Seeders\\KundenlisteShopSeeder', '--force', '--no-interaction'], options)
    execFileSync(php, ['artisan', 'rimify:demo', '--abnahme', '--no-interaction'], options)
}
