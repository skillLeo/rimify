// Every page at every width from phone to wide desktop: overflow, h1 count, tap targets.
import { chromium } from '@playwright/test'

const BASE = process.argv[2] ?? 'http://127.0.0.1:8000'
const PAGES = ['/', '/felgen-suchen', '/felgen', '/felgen/oz-racing-superturismo-gt', '/rimify-check', '/warenkorb', '/kasse',
  '/bestellung/RMF-2026-1001', '/faq', '/kontakt', '/rechtliches', '/admin/anmelden', '/gibt-es-nicht']
const WIDTHS = [320, 390, 768, 1024, 1440, 1920]
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'

const browser = await chromium.launch()
const bad = []
for (const w of WIDTHS) {
  const phone = w < 640
  const context = await browser.newContext(phone
    ? { viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true, userAgent: MOBILE_UA }
    : { viewport: { width: w, height: 900 } })
  for (const path of PAGES) {
    const page = await context.newPage()
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
    const r = await page.evaluate((phone) => {
      const vw = document.documentElement.clientWidth
      const over = document.documentElement.scrollWidth - vw
      let culprit = ''
      if (over > 1) {
        for (const el of document.querySelectorAll('main *')) {
          const b = el.getBoundingClientRect()
          if (b.right > vw + 1 && getComputedStyle(el).position !== 'fixed') { culprit = el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]; break }
        }
      }
      const small = phone ? [...document.querySelectorAll('main a, main button, main input, main select')].filter((el) => {
        const b = el.getBoundingClientRect(); const cs = getComputedStyle(el)
        return b.width > 0 && cs.visibility !== 'hidden' && (b.height < 43.5) && !el.closest('.pcard__link, .visually-hidden')
      }).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}(${Math.round(el.getBoundingClientRect().height)}px)`) : []
      return { over, culprit, h1: document.querySelectorAll('h1').length, small: [...new Set(small)].slice(0, 4) }
    }, phone)
    const problems = []
    if (r.over > 1) problems.push(`overflow ${r.over}px (${r.culprit})`)
    if (r.h1 !== 1) problems.push(`h1×${r.h1}`)
    if (r.small.length) problems.push(`small targets: ${r.small.join(', ')}`)
    if (problems.length) bad.push(`${String(w).padStart(4)} ${path.padEnd(34)} ${problems.join(' · ')}`)
    await page.close()
  }
  await context.close()
}
await browser.close()
console.log(bad.length ? bad.join('\n') : 'every page clean at every width')
