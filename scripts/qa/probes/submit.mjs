// Why does the key-number form not submit on click? Every request and event around the click.
import { chromium } from '@playwright/test'
import { BASE, VIEWPORTS, newContext } from '../lib.mjs'

const browser = await chromium.launch()
const context = await newContext(browser, 1440, 900, false)
const page = await context.newPage()
const log = []
page.on('request', (r) => log.push(`request ${r.method()} ${r.url()}`))
page.on('pageerror', (e) => log.push(`pageerror ${e.message}`))
page.on('console', (m) => log.push(`console.${m.type()} ${m.text().slice(0, 160)}`))

await page.goto(BASE + '/felgen-suchen', { waitUntil: 'networkidle' })
await page.fill('input[id^=hsn]', '0005')
await page.fill('input[id^=tsn]', '582')
await page.evaluate(() => {
    for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click', 'submit']) {
        document.addEventListener(type, (e) => {
            const t = e.target
            console.log(`${type} on ${t.tagName.toLowerCase()}.${String(t.className).split(' ')[0]} default-prevented=${e.defaultPrevented}`)
        }, true)
    }
})
const button = page.getByRole('button', { name: 'Fahrzeug wählen' }).first()
const box = await button.boundingBox()
const under = await page.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x, y)
    return `${el?.tagName.toLowerCase()}.${String(el?.className).split(' ')[0]}`
}, [box.x + box.width / 2, box.y + box.height / 2])
console.log(`element under the click point: ${under}`)
log.length = 0
await button.click()
await page.waitForTimeout(1500)
console.log('after click:', page.url())
console.log(log.join('\n') || '(nothing)')
await browser.close()
