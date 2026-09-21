// The core flow: choose a vehicle by HSN/TSN, then by make/model/variant, and check the listing
// and product page reflect it. Prints every step so a failure names where it broke.
import { chromium } from '@playwright/test'

const BASE = process.argv[2] ?? 'http://127.0.0.1:8000'
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'

const browser = await chromium.launch()
let failures = 0
const check = (label, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? ' ok ' : 'FAIL'} ${label}${detail ? '  — ' + detail : ''}`) }

for (const [view, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: MOBILE_UA }],
]) {
  console.log(`\n== ${view}: key numbers ==`)
  const context = await browser.newContext(opts)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto(BASE + '/felgen-suchen', { waitUntil: 'networkidle' })
  const hsn = page.locator('input[id^="hsn-"]')
  const tsn = page.locator('input[id^="tsn-"]')
  check('one HSN field and one TSN field', (await hsn.count()) === 1 && (await tsn.count()) === 1, `hsn=${await hsn.count()} tsn=${await tsn.count()}`)
  await hsn.first().fill('0005')
  await tsn.first().fill('582')
  const submit = page.getByRole('button', { name: 'Fahrzeug wählen' })
  check('submit button found', (await submit.count()) >= 1, `count=${await submit.count()}`)
  await Promise.all([page.waitForLoadState('networkidle'), submit.first().click()])
  await page.waitForTimeout(500)
  check('lands on the listing', page.url().includes('/felgen') && !page.url().includes('suchen'), page.url())
  const h1 = await page.locator('h1').first().textContent()
  check('listing names the vehicle', /für deinen/.test(h1 ?? ''), `h1="${h1?.trim()}"`)
  const chip = await page.locator('.vchip').count()
  check('vehicle chip in the header', chip >= 1, `chips=${chip}`)
  const count = await page.locator('.plp__count').textContent()
  check('result count says Gutachten', /Gutachten/.test(count ?? ''), `"${count?.trim()}"`)

  await page.goto(BASE + '/felgen/borbet-havanna', { waitUntil: 'networkidle' })
  const verdict = await page.locator('.rcheck-panel__vehicle').first().textContent().catch(() => null)
  check('product page shows a verdict naming the car', /BMW/.test(verdict ?? ''), `"${verdict?.trim()}"`)

  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  const heroVehicle = await page.locator('.home-hero__vehicle').textContent().catch(() => null)
  check('homepage fold shows the chosen vehicle', /BMW/.test(heroVehicle ?? ''), `"${heroVehicle?.trim()}"`)
  check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '))
  await context.close()

  console.log(`\n== ${view}: make / model / variant ==`)
  const c2 = await browser.newContext(opts)
  const p2 = await c2.newPage()
  await p2.goto(BASE + '/felgen-suchen', { waitUntil: 'networkidle' })
  await Promise.all([p2.waitForLoadState('networkidle'), p2.locator('.row-item', { hasText: 'BMW' }).first().click()])
  await p2.waitForTimeout(400)
  check('make step → model list', p2.url().includes('marke=BMW'), p2.url())
  const firstModel = p2.locator('.row-item').first()
  await Promise.all([p2.waitForLoadState('networkidle'), firstModel.click()])
  await p2.waitForTimeout(400)
  check('model step → variant list', p2.url().includes('modell='), p2.url())
  await Promise.all([p2.waitForLoadState('networkidle'), p2.locator('.row-item').first().click()])
  await p2.waitForTimeout(600)
  check('variant → listing with vehicle', /für deinen/.test((await p2.locator('h1').first().textContent()) ?? ''), p2.url())
  await c2.close()
}
await browser.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks pass')
process.exit(failures ? 1 : 0)
