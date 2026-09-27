import { test } from '@playwright/test'
import { signIn } from './bugs/faq-support'

/*
 * The admin session the gate scripts (scripts/qa/*.mjs) run the admin's routes with: signed in once
 * with the e2e helper and saved, so the scripts read a cookie jar, never a password.
 *
 *   npx playwright test e2e/qa-session.spec.ts --project=desktop-1440
 *   QA_STORAGE_STATE=node_modules/.cache/qa-admin-session.json node scripts/qa/axe.mjs --routes /admin
 */

export const SESSION_FILE = 'node_modules/.cache/qa-admin-session.json'

test('saves an admin session for the gate scripts', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'One session serves every width.')

    await signIn(page)
    await page.context().storageState({ path: SESSION_FILE })
})
