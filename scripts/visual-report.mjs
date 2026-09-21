/**
 * §6 — the report at tests/visual/report.html.
 *
 * Worst case first, because the point of the report is to answer "what do I fix next", not to
 * display a score. Every row shows the prototype, our page and the diff at the same width, so
 * the difference can be seen rather than inferred from a percentage.
 *
 * Usage:  node scripts/visual-report.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'

const RESULT_FILE = join('tests', 'visual', 'artifacts', 'results.json')
const OUT = join('tests', 'visual', 'report.html')

if (!existsSync(RESULT_FILE)) {
    console.error(
        `\n  No results at ${RESULT_FILE}.\n` +
            `  Run the suite first:  npx playwright test --config playwright.visual.config.ts\n`
    )
    process.exit(1)
}

/** Windows editors and PowerShell's `Out-File -Encoding utf8` prepend a BOM, and `JSON.parse`
 *  rejects it with an error that names neither the file nor the cause. */
export const readJson = (file) => JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''))

const { threshold, results } = readJson(RESULT_FILE)

const esc = (s) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/** Paths in results.json are repo-relative; the report sits in tests/visual/. */
const rel = (p) => (p ? relative(dirname(OUT), p).split('\\').join('/') : null)

const sorted = [...results].sort((a, b) => {
    if (a.passed !== b.passed) return a.passed ? 1 : -1
    if (a.structural !== b.structural) return b.structural - a.structural
    return b.ratio - a.ratio
})

const passed = results.filter((r) => r.passed).length
const total = results.length

const pct = (r) => (r.sameSize ? `${(r.ratio * 100).toFixed(3)}%` : 'size differs')

const row = (r) => `
<section class="case ${r.passed ? 'ok' : 'bad'}">
  <header>
    <h2>${esc(r.id)} <span class="vp">${esc(r.viewport)}</span></h2>
    <div class="nums">
      <span class="n"><b class="micro">Pixel</b>${pct(r)}</span>
      <span class="n"><b class="micro">Höhe</b>${r.baselineHeight} → ${r.actualHeight}${
          r.baselineHeight === r.actualHeight ? '' : ` (${r.actualHeight - r.baselineHeight > 0 ? '+' : ''}${r.actualHeight - r.baselineHeight})`
      }</span>
      <span class="n"><b class="micro">Struktur</b>${r.structural === 0 ? 'identisch' : `${r.structural} Abweichung(en)`}</span>
      <span class="verdict">${r.passed ? 'BESTANDEN' : 'ABWEICHUNG'}</span>
    </div>
  </header>
  ${
      r.structuralDetail?.length
          ? `<pre class="detail">${esc(r.structuralDetail.map((d) => d.detail).join('\n\n'))}</pre>`
          : ''
  }
  <div class="shots">
    <figure><figcaption class="micro">Prototyp</figcaption><img loading="lazy" src="${rel(r.baseline)}" alt=""></figure>
    <figure><figcaption class="micro">RIMIFY</figcaption><img loading="lazy" src="${rel(r.actual)}" alt=""></figure>
    ${r.diff ? `<figure><figcaption class="micro">Differenz</figcaption><img loading="lazy" src="${rel(r.diff)}" alt=""></figure>` : ''}
  </div>
</section>`

const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RIMIFY — Fidelity</title>
<style>
  :root {
    --blue:#1A44D4; --wash:#EAEEFA; --bline:#C9D4F5;
    --ok:#2E8B22; --ok-w:#E8F4E5; --danger:#B01018; --danger-w:#FBE8E8;
    --ink:#0E1116; --ink2:#4A5160; --ink3:#7B8394;
    --ground:#F7F8FD; --line:#E5E5E5; --line-s:#EEF0F5;
  }
  * { box-sizing:border-box }
  body { margin:0; background:var(--ground); color:var(--ink);
         font:400 15px/1.55 Lato,-apple-system,Segoe UI,sans-serif }
  .micro { display:block; font:500 10px/1 'IBM Plex Mono',ui-monospace,monospace;
           letter-spacing:.10em; text-transform:uppercase; color:var(--ink3); margin-bottom:4px }
  .wrap { max-width:1240px; margin:0 auto; padding:32px 24px 80px }
  .top { background:#fff; border:1px solid var(--line); border-radius:14px; padding:24px 28px; margin-bottom:28px }
  .top h1 { margin:0 0 4px; font-weight:900; font-size:26px; letter-spacing:-.01em }
  .top p { margin:0; color:var(--ink2); font-size:14px }
  .score { font:500 34px/1 'IBM Plex Mono',ui-monospace,monospace; margin-top:14px }
  .score.green { color:var(--ok) } .score.red { color:var(--danger) }
  .bar { height:8px; border-radius:99px; background:var(--line-s); overflow:hidden; margin-top:12px }
  .bar i { display:block; height:100%; background:var(--ok) }
  .case { background:#fff; border:1px solid var(--line); border-radius:14px; margin-bottom:18px; overflow:hidden }
  .case.bad { border-color:var(--bline) }
  .case > header { display:flex; flex-wrap:wrap; gap:16px; align-items:flex-end;
                   justify-content:space-between; padding:18px 22px; border-bottom:1px solid var(--line-s) }
  .case h2 { margin:0; font-size:17px; font-weight:700 }
  .vp { font:500 11px/1 'IBM Plex Mono',ui-monospace,monospace; color:var(--ink3);
        border:1px solid var(--line); border-radius:99px; padding:4px 8px; margin-left:8px; vertical-align:2px }
  .nums { display:flex; gap:22px; align-items:flex-end }
  .n { font:500 13px/1.2 'IBM Plex Mono',ui-monospace,monospace; color:var(--ink2) }
  .verdict { font:500 11px/1 'IBM Plex Mono',ui-monospace,monospace; letter-spacing:.10em;
             padding:7px 11px; border-radius:99px }
  .ok .verdict { background:var(--ok-w); color:var(--ok) }
  .bad .verdict { background:var(--danger-w); color:var(--danger) }
  .detail { margin:0; padding:16px 22px; background:var(--wash); border-bottom:1px solid var(--line-s);
            font:400 12px/1.6 'IBM Plex Mono',ui-monospace,monospace; color:var(--ink); white-space:pre-wrap; overflow-x:auto }
  .shots { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; padding:18px 22px }
  .shots figure { margin:0 }
  .shots img { width:100%; border:1px solid var(--line); border-radius:8px; background:#fff; display:block }
  @media (max-width:860px) { .shots { grid-template-columns:1fr } }
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <span class="micro">RIMIFY · UI-Fidelity</span>
    <h1>Prototyp gegen Anwendung</h1>
    <p>Gate A: ≤ ${(threshold * 100).toFixed(1)} % abweichende Pixel und identische Höhe. Gate B: identische DOM-Signatur.</p>
    <div class="score ${passed === total ? 'green' : 'red'}">${passed} / ${total}</div>
    <div class="bar"><i style="width:${total ? (passed / total) * 100 : 0}%"></i></div>
  </div>
  ${sorted.map(row).join('\n')}
</div>
</body>
</html>`

writeFileSync(OUT, html, 'utf8')
console.log(`\n  ${OUT} — ${passed}/${total} green\n`)
