// Chooses a vehicle by key numbers and reports what the server answered — the step every gate
// with `--vehicle` relies on. Usage: node scripts/qa/probes/vehicle.mjs [width]
import { chromium } from '@playwright/test'
import { BASE, VIEWPORTS, newContext } from '../lib.mjs'

const width = Number(process.argv[2] ?? 1440)
const { height, mobile } = VIEWPORTS[width]
const browser = await chromium.launch()
const context = await newContext(browser, width, height, mobile)
const page = await context.newPage()
const responses = []
page.on('response', (r) => {
    if (r.request().method() === 'POST') responses.push(`${r.status()} ${r.url()}`)
})

await page.goto(BASE + '/felgen-suchen', { waitUntil: 'networkidle' })
await page.fill('input[id^=hsn]', '0005')
await page.fill('input[id^=tsn]', '582')
const buttons = await page.getByRole('button', { name: 'Fahrzeug wählen' }).all()
console.log(`buttons named "Fahrzeug wählen": ${buttons.length}`)
await buttons[0].click()
await page.waitForLoadState('networkidle')
await page.waitForTimeout(500)
console.log(`after click: ${page.url()}`)
console.log(`posts: ${responses.join(' | ') || 'none'}`)
console.log(`vehicle bar: ${await page.locator('.vbar').count()}, cookies: ${(await context.cookies()).map((c) => c.name).join(', ')}`)
await browser.close()
