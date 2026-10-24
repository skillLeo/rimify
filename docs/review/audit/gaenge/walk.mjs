// The audit's interactive walker: one call = open a page as the super-admin, run steps, report what was seen.
// Usage: node walk.mjs <steps.json> [width]   (run from C:\rimify\wt-dev so @playwright/test resolves)
// steps.json: { "start": "/admin/x", "steps": [ {"fill":"#id","value":"x"}, {"click":"role=button[name=\"Speichern\"]"},
//   {"select":"#id","label":"x"}, {"check":"sel"}, {"upload":"#id","path":"C:/x.pdf"}, {"goto":"/x"}, {"wait":500},
//   {"press":"Enter"}, {"shot":"name"}, {"text":"sel"}, {"eval":"js"}, {"dblclick":"sel"}, {"back":true} ], "guest": false }
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

// Playwright from the worktree's own install: this script lives outside it.
const { chromium } = createRequire('C:/rimify/wt-dev/package.json')('@playwright/test');

const [stepsFile, widthArg] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(stepsFile, 'utf8'));
const BASE = process.env.AUDIT_URL ?? 'http://127.0.0.1:8050';
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const AUTH = path.join(DIR, 'walk-auth.json');
const SHOTS = path.join(DIR, 'shots');
const width = Number(widthArg ?? 1440);
fs.mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
    baseURL: BASE,
    viewport: { width, height: width >= 1024 ? 900 : 844 },
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    storageState: !spec.guest && fs.existsSync(AUTH) ? AUTH : undefined,
});
const page = await context.newPage();
const seen = { console: [], pageErrors: [], failed: [], requests: [] };
page.on('console', (m) => m.type() === 'error' && !/^Failed to load resource/.test(m.text()) && seen.console.push(m.text().slice(0, 300)));
page.on('pageerror', (e) => seen.pageErrors.push(String(e.message).slice(0, 300)));
page.on('response', (r) => {
    const line = `${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}${new URL(r.url()).search}`;
    if (r.request().method() !== 'GET' || r.status() >= 400) seen.requests.push(line);
    if (r.status() >= 400) seen.failed.push(line);
});

async function signIn() {
    await page.goto('/admin/anmelden', { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill('super-admin@rimify.test');
    await page.locator('input[type="password"]').fill('rimify-dev-2026');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((u) => !u.pathname.startsWith('/admin/anmelden'), { timeout: 20_000 });
    await context.storageState({ path: AUTH });
}

async function settle() {
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForFunction(() => document.querySelector('#app')?.__vue_app__ !== undefined, null, { timeout: 15_000 }).catch(() => {});
}

const out = { steps: [] };

try {
    await page.goto(spec.start ?? '/admin', { waitUntil: 'networkidle' });

    if (!spec.guest && new URL(page.url()).pathname.startsWith('/admin/anmelden')) {
        await signIn();
        await page.goto(spec.start ?? '/admin', { waitUntil: 'networkidle' });
    }

    if (!spec.guest && new URL(page.url()).pathname === '/admin/bestaetigen') {
        await page.locator('input[type="password"]').fill('rimify-dev-2026');
        await page.locator('button[type="submit"]').click();
        await page.waitForURL((u) => u.pathname !== '/admin/bestaetigen', { timeout: 20_000 });
        await context.storageState({ path: AUTH });
    }

    await settle();

    for (const step of spec.steps ?? []) {
        const at = Date.now();
        const target = (sel) => (/^(role=|text=|css=|#|\.)/.test(sel) || sel.includes('[') || sel.includes(':has') ? page.locator(sel) : page.getByText(sel, { exact: true })).first();

        if (step.fill) await target(step.fill).fill(step.value);
        else if (step.type) await target(step.type).pressSequentially(step.value);
        else if (step.click) await target(step.click).click({ timeout: step.timeout ?? 10_000 });
        else if (step.dblclick) await target(step.dblclick).dblclick();
        else if (step.select) await target(step.select).selectOption(step.label !== undefined ? { label: step.label } : step.value);
        else if (step.check) await target(step.check).check();
        else if (step.uncheck) await target(step.uncheck).uncheck();
        else if (step.upload) await target(step.upload).setInputFiles(step.path);
        else if (step.goto) await page.goto(step.goto, { waitUntil: 'networkidle' });
        else if (step.wait) await page.waitForTimeout(step.wait);
        else if (step.press) await page.keyboard.press(step.press);
        else if (step.back) await page.goBack({ waitUntil: 'networkidle' });
        else if (step.waitFor) await target(step.waitFor).waitFor({ timeout: step.timeout ?? 15_000 });
        else if (step.text) out.steps.push({ text: step.text, value: (await page.locator(step.text).allInnerTexts()).map((t) => t.slice(0, step.max ?? 400)) });
        else if (step.eval) out.steps.push({ eval: await page.evaluate(step.eval) });

        if (step.settle !== false) await settle();
        if (step.shot) await page.screenshot({ path: path.join(SHOTS, `${step.shot}.png`), fullPage: step.full ?? false });
        out.steps.push({ done: Object.keys(step)[0], ms: Date.now() - at });
    }
} catch (error) {
    out.error = String(error.message).split('\n').slice(0, 6).join(' | ');
}

const shot = path.join(SHOTS, `${spec.name ?? 'walk'}.png`);
await page.screenshot({ path: shot, fullPage: spec.full ?? false }).catch(() => {});
out.url = page.url();
out.h1 = (await page.locator('h1').first().textContent({ timeout: 1_000 }).catch(() => null))?.trim() ?? null;
out.fieldErrors = (await page.locator('.form-field__error:not(:empty), [role="alert"]:not(:empty)').allInnerTexts().catch(() => [])).map((t) => t.trim()).filter(Boolean).slice(0, 25);
out.toasts = (await page.locator('.toast, [class*="toast"]').allInnerTexts().catch(() => [])).map((t) => t.trim()).filter(Boolean).slice(0, 5);
out.wider = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth).catch(() => null);
if (spec.main) out.main = ((await page.locator('main').first().innerText().catch(() => '')) ?? '').slice(0, spec.main);
out.seen = seen;
out.shot = shot;
console.log(JSON.stringify(out, null, 1));
await browser.close();
