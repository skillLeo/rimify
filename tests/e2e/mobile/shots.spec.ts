import { mkdirSync } from 'node:fs'
import { chooseVehicleFromHome, deviceName, expect, open, test } from './fixtures'

/**
 * Screenshots for the critic: docs/mobile/shots/<page>/<device>.png (the fold), plus the full
 * page, the two sheets and the vehicle state. Not assertions — evidence.
 */

const SHOTS = 'docs/mobile/shots'

test.describe('screenshots', () => {
    test('startseite', async ({ page }, info) => {
        const device = deviceName(info)
        mkdirSync(`${SHOTS}/startseite`, { recursive: true })
        mkdirSync(`${SHOTS}/shell`, { recursive: true })

        await open(page, '/')
        await page.waitForTimeout(400)
        await page.screenshot({ path: `${SHOTS}/startseite/${device}.png`, animations: 'disabled' })
        await page.screenshot({ path: `${SHOTS}/startseite/${device}-full.png`, fullPage: true, animations: 'disabled' })

        // The keys route with the chooser open.
        await page.getByRole('tab', { name: 'HSN/TSN' }).click()
        await page.getByLabel('HSN (Feld 2.1)').fill('1860')
        await page.getByLabel('TSN (Feld 2.2)').fill('AAS')
        await expect(page.locator('#h2 input[type="radio"]').first()).toBeVisible()
        await page.screenshot({ path: `${SHOTS}/startseite/${device}-ambiguous.png`, animations: 'disabled' })

        // The help sheet.
        await page.getByRole('button', { name: 'Wo finde ich HSN und TSN?' }).click()
        await expect(page.getByRole('dialog', { name: 'Wo finde ich HSN und TSN?' })).toBeVisible()
        await page.waitForTimeout(400)
        await page.screenshot({ path: `${SHOTS}/shell/${device}-sheet.png`, animations: 'disabled' })
        await page.goBack()

        // The search sheet.
        await page.getByRole('button', { name: 'Suche' }).click()
        const search = page.getByRole('dialog', { name: 'Suche' })
        await search.getByRole('searchbox', { name: 'Suche' }).fill('motec')
        await expect(search.getByRole('link', { name: /MOTEC/ }).first()).toBeVisible()
        await page.waitForTimeout(300)
        await page.screenshot({ path: `${SHOTS}/shell/${device}-search.png`, animations: 'disabled' })
        await page.goBack()

        // With a vehicle: the fold and the vehicle sheet.
        await chooseVehicleFromHome(page)
        await open(page, '/')
        await page.waitForTimeout(400)
        await page.screenshot({ path: `${SHOTS}/startseite/${device}-vehicle.png`, animations: 'disabled' })
        await page.getByRole('button', { name: /Dein Fahrzeug:/ }).click()
        await expect(page.getByRole('dialog', { name: 'Dein Fahrzeug' })).toBeVisible()
        await page.waitForTimeout(400)
        await page.screenshot({ path: `${SHOTS}/shell/${device}-vehicle-sheet.png`, animations: 'disabled' })
    })
})
