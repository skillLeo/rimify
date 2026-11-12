import { expect, test } from './fixtures'
import { signIn, waitForApp } from './bugs/faq-support'

/*
 * The client's request H (D-462): a vehicle list goes to the server in parts, the page shows how much is there, the server
 * reads and checks the file on its own while the run's page shows how far it is, and the Probelauf appears when it is
 * done. Here in parts of 64 KB (e2e/shop.ts E2E_FEATURES), so a file of 600 KB takes ten requests; on the host a part is
 * sized from its own limits.
 *
 * Nothing is imported: the Probelauf writes no car, and the run stays in the list as a Probelauf.
 */

test.skip(({ isMobile }) => isMobile, 'A dataset is brought in at a desk; the run page itself is checked at 390 by the phone suite.')

function list(rows: number): string {
    const lines = ['HSN;TSN;Hersteller;Handelsname;Variante;Baubeginn;Achslast vorn kg;Achslast hinten kg;Höchstgeschwindigkeit km/h;Bemerkung']

    for (let i = 0; i < rows; i++) {
        lines.push(`9${String(800 + Math.floor(i / 1000)).padStart(3, '0')};T${String(i % 100).padStart(2, '0')};Beispielmarke;Teilprobe ${Math.floor((i % 1000) / 100)};Teilprobe ${i};03.2015;1.050;1.120;210;${'x'.repeat(220)}`)
    }

    return `${lines.join('\n')}\n`
}

test('a file of 600 KB goes up in parts and comes back as a Probelauf with every row counted', async ({ page }) => {
    test.setTimeout(180_000)
    await signIn(page)
    await page.goto('/admin/fahrzeuge/import', { waitUntil: 'networkidle' })
    await waitForApp(page)

    const csv = list(2_400)
    const parts: number[] = []
    page.on('request', (request) => {
        if (request.method() === 'POST' && /\/admin\/fahrzeuge\/import\/\d+\/teil$/.test(new URL(request.url()).pathname)) {
            parts.push(request.postDataBuffer()?.length ?? 0)
        }
    })

    await page.locator('#fi-file').setInputFiles({ name: 'teilprobe.csv', mimeType: 'text/csv', buffer: Buffer.from(csv, 'utf8') })
    await page.locator('#fi-source').selectOption('import_kba')
    await page.getByRole('button', { name: 'Probelauf starten' }).click()

    // The bar while the parts go up, then the run's own page while the server reads and checks.
    await page.waitForURL(/\/admin\/fahrzeuge\/import\/\d+$/, { timeout: 60_000 })
    await expect(page.locator('#fr-h-result')).toHaveText('Probelauf', { timeout: 120_000 })

    expect(parts.length, 'the file went up in several parts').toBeGreaterThanOrEqual(Math.ceil(Buffer.byteLength(csv) / 65_536))

    const count = (label: string) => page.locator('.fr-count').filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) }).locator('dd')
    await expect(count('Neue Fahrzeuge')).toHaveText('2.400')
    await expect(count('Abgelehnt')).toHaveText('0')
    await expect(page.locator('.fr-gaps')).toContainText('0 von 2.400')
    // Nothing imported: the Probelauf writes no car.
    await expect(page.getByRole('button', { name: 'Importieren', exact: true })).toBeVisible()
})
