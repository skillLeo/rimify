import { createHmac } from 'node:crypto'
import type { Page } from '@playwright/test'

/*
 * The admin's second step in the browser suites (D-514). The development Super-Admins carry one known key
 * (AccessSeeder::DEMO_TOTP_KEY, local and test databases only — like their password), so a spec can make the code
 * an authenticator app would show. RFC 6238: HMAC-SHA1, six digits, 30 seconds — app/Support/Auth/Totp.php's twin.
 */

export const DEMO_TOTP_KEY = 'JBSWY3DPEHPK3PXP'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function unbase32(key: string): Buffer {
    let bits = ''

    for (const char of key.replace(/[\s=]/g, '').toUpperCase()) {
        const value = ALPHABET.indexOf(char)
        bits += value < 0 ? '' : value.toString(2).padStart(5, '0')
    }

    const bytes: number[] = []

    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2))
    }

    return Buffer.from(bytes)
}

/** The code an app shows for the key at a moment (default now, by this machine's clock — the server judges by its own wall clock). */
export function totp(key: string = DEMO_TOTP_KEY, at: number = Date.now()): string {
    const step = Buffer.alloc(8)
    step.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)))
    const hash = createHmac('sha1', unbase32(key)).update(step).digest()
    const offset = hash.readUInt8(19) & 0x0f
    const number = hash.readUInt32BE(offset) & 0x7fffffff

    return String(number % 1_000_000).padStart(6, '0')
}

/**
 * After the password on the sign-in page: answers the second step when the page asks for it — an account without one
 * goes straight on, and so does this.
 */
export async function answerSecondStep(page: Page, key: string = DEMO_TOTP_KEY): Promise<void> {
    const field = page.locator('#lg-totp')
    const asked = await Promise.race([
        field.waitFor({ state: 'visible', timeout: 30_000 }).then(() => true, () => false),
        page.waitForURL((url) => !url.pathname.startsWith('/admin/anmelden'), { timeout: 30_000 }).then(() => false, () => false),
    ])

    if (!asked) {
        return
    }

    await field.fill(totp(key))
    await page.locator('button[type=submit]').first().click()
}
