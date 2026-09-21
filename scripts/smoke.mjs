// Smoke: every page at phone and desktop width — status, console/page errors, overflow, SSR markup.
import { chromium } from '@playwright/test'

const BASE = process.argv[2] ?? 'http://127.0.0.1:8000'
const PAGES = ['/', '/felgen-suchen', '/felgen-suchen?marke=BMW', '/felgen', '/felgen/borbet-havanna', '/rimify-check', '/warenkorb', '/kasse',
  '/bestellung/RMF-2026-1001', '/faq', '/kontakt', '/rechtliches', '/admin/anmelden', '/gibt-es-nicht']
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36'
const VIEWS = [
  { name: 'mobile', ctx: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: MOBILE_UA } },
  { name: 'desktop', ctx: { viewport: { width: 1440, height: 900 } } },
]

const browser = await chromium.launch()
let failures = 0
for (const view of VIEWS) {
  const context = await browser.newContext(view.ctx)
  for (const path of PAGES) {
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    // The 404 page IS a 404; the browser logs its own status as a console error. Everything else counts.
    page.on('console', (m) => {
      const text = m.text()
      if (m.type() !== 'error') return
      if (/status of 404/.test(text) && path === '/gibt-es-nicht') return
      errors.push(`console: ${text.slice(0, 160)}`)
    })
    let status = 0
    try {
      const res = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 })
      status = res?.status() ?? 0
    } catch (e) { errors.push(`goto: ${e.message.slice(0, 120)}`) }
    // SSR: the very first response must already contain the page's markup.
    let ssr = false
    try {
      const raw = await (await fetch(BASE + path, { headers: view.ctx.userAgent ? { 'User-Agent': view.ctx.userAgent } : {} })).text()
      ssr = /<main[\s>]/.test(raw) && raw.includes('data-page')
    } catch {}
    const m = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      let widest = null
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width && r.right > vw + 1) { const cs = getComputedStyle(el); if (cs.position !== 'fixed') { widest = el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.split(' ')[0] : ''); break } }
      }
      return { innerW: window.innerWidth, scrollW: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, main: !!document.querySelector('main'), header: !!document.querySelector('header'), widest }
    })
    const okStatus = path === '/gibt-es-nicht' ? status === 404 : status === 200
    const overflow = m.scrollW > m.innerW + 1
    const bad = !okStatus || errors.length || overflow || !m.main || !ssr
    if (bad) failures++
    console.log(`${bad ? 'FAIL' : ' ok '} ${view.name.padEnd(7)} ${path.padEnd(28)} ${status} ssr=${ssr ? 'y' : 'n'} h=${m.h} ${overflow ? `OVERFLOW ${m.scrollW}>${m.innerW} (${m.widest})` : ''}`)
    for (const e of errors.slice(0, 4)) console.log(`        ${e}`)
    await page.close()
  }
  await context.close()
}
await browser.close()
console.log(failures ? `${failures} failing page(s)` : 'all pages pass')
process.exit(failures ? 1 : 0)
