import { mkdirSync } from 'node:fs'
import { expect, test as setup } from '@playwright/test'
import { ROLES, hasCredentials, statePath, type Role } from './instance'

/*
 * One sign-in per role, reused: every test of a role starts signed in from the saved cookie jar instead of filling the
 * form again. The credentials come from the environment (instance.ts) and are neither printed nor stored — only the
 * session they open is, under tests/abnahme/.auth/, which git ignores.
 *
 * The page is the shop's real one: /admin/anmelden, „E-Mail“, „Passwort“, „Anmelden“, then the Übersicht.
 */

mkdirSync('tests/abnahme/.auth', { recursive: true })

for (const role of Object.keys(ROLES) as Role[]) {
    setup(`sign in once: ${role}`, async ({ page }) => {
        setup.skip(!hasCredentials(role), `no credentials in the environment for ${role} (${ROLES[role].email}, ${ROLES[role].password})`)

        await page.goto('/admin/anmelden')
        await page.getByLabel('E-Mail').fill(process.env[ROLES[role].email] as string)
        await page.getByLabel('Passwort').fill(process.env[ROLES[role].password] as string)
        await page.getByRole('button', { name: 'Anmelden' }).click()
        await expect(page.getByRole('heading', { name: 'Übersicht', level: 1 })).toBeVisible()
        await page.context().storageState({ path: statePath(role) })
    })
}
