// Builds docs/phase0/before-after.html for the client: every page at the start of Phase 0 beside
// the finished page, at 390 and 1440, plus the two signature moments of the homepage.
//
//   node scripts/qa/before-after.mjs
//
// "Before" comes from the archived fidelity baselines (tests/_archive/fidelity/baseline); "after"
// from the review shots (docs/reviews/shots/<page>/<width>-full.png, made by review-shots.mjs).
// A page whose after-shot does not exist yet is listed as in progress rather than left out, so the
// document is honest about where the rebuild stands. Images are copied next to the HTML so the
// folder can be zipped and sent as it is.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BEFORE = 'tests/_archive/fidelity/baseline'
const AFTER = 'docs/reviews/shots'
const OUT_DIR = 'docs/phase0/before-after'
const OUT_HTML = 'docs/phase0/before-after.html'

/** Page slug → the archived baseline name and the review-shot folder. */
const PAGES = [
    ['Startseite', 'startseite', 'home'],
    ['Startseite mit Fahrzeug', 'startseite@vehicle', 'home-vehicle'],
    ['Fahrzeug wählen', 'felgen-suchen', 'felgen-suchen'],
    ['Felgen', 'felgen', 'felgen'],
    ['Produkt', 'produkt', 'produkt'],
    ['RIMIFY-Check', 'rimify-check', 'rimify-check'],
    ['Check-Ergebnis', 'check-ergebnis', 'check-ergebnis'],
    ['Warenkorb', 'warenkorb', 'warenkorb'],
    ['Kasse', 'kasse', 'kasse'],
    ['Bestellung', 'bestellung', 'bestellung'],
    ['FAQ', 'faq', 'faq'],
    ['Kontakt', 'kontakt', 'kontakt'],
    ['Rechtliches', 'rechtliches', 'rechtliches'],
    ['404', '404', 'gibt-es-nicht'],
]

/** The two signature moments, as section shots of the finished homepage. */
const MOMENTS = [
    ['Signature moment 1 — Studio light', 'Der Hero: ein Felgen-Freisteller auf einem Kontaktschatten, ein Lichtdurchlauf nach dem ersten Bild, dann zeichnen sich die Maßlinien.', 'home', 'h2'],
    ['Signature moment 2 — Textmarker', 'Die Gutachten-Geschichte: ein Papierdokument, in dem der Textmarker beim Scrollen die Fahrzeugzeile, die Reifengrößen und die Auflagen markiert, bis der Stempel fällt.', 'home', 'h4'],
]

mkdirSync(OUT_DIR, { recursive: true })

function copy(source, name) {
    if (!existsSync(source)) {
        return null
    }

    copyFileSync(source, join(OUT_DIR, name))

    return `before-after/${name}`
}

function figure(src, caption) {
    if (src === null) {
        return `<figure class="missing"><div class="placeholder">in Arbeit</div><figcaption>${caption}</figcaption></figure>`
    }

    return `<figure><a href="${src}"><img src="${src}" alt="${caption}" loading="lazy" decoding="async"></a><figcaption>${caption}</figcaption></figure>`
}

let rows = ''
let done = 0

for (const [title, before, after] of PAGES) {
    const b390 = copy(join(BEFORE, 'mobile', `${before}.png`), `${after}-before-390.png`)
    const b1440 = copy(join(BEFORE, 'desktop', `${before}.png`), `${after}-before-1440.png`)
    const a390 = copy(join(AFTER, after, '390-full.png'), `${after}-after-390.png`)
    const a1440 = copy(join(AFTER, after, '1440-full.png'), `${after}-after-1440.png`)

    if (a390 !== null && a1440 !== null) {
        done++
    }

    rows += `
    <section class="page">
        <h2>${title}</h2>
        <div class="pair">
            <div class="col"><h3>Vorher · 390</h3>${figure(b390, `${title} vorher, 390 px`)}</div>
            <div class="col"><h3>Nachher · 390</h3>${figure(a390, `${title} nachher, 390 px`)}</div>
        </div>
        <div class="pair">
            <div class="col"><h3>Vorher · 1440</h3>${figure(b1440, `${title} vorher, 1440 px`)}</div>
            <div class="col"><h3>Nachher · 1440</h3>${figure(a1440, `${title} nachher, 1440 px`)}</div>
        </div>
    </section>`
}

let moments = ''

for (const [title, text, folder, section] of MOMENTS) {
    const desktop = copy(join(AFTER, folder, `1440-${section}.png`), `${section}-1440.png`)
    const phone = copy(join(AFTER, folder, `390-${section}.png`), `${section}-390.png`)

    moments += `
    <section class="page">
        <h2>${title}</h2>
        <p class="lead">${text}</p>
        <div class="pair">
            <div class="col"><h3>1440</h3>${figure(desktop, `${title}, 1440 px`)}</div>
            <div class="col"><h3>390</h3>${figure(phone, `${title}, 390 px`)}</div>
        </div>
    </section>`
}

const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RIMIFY — vorher und nachher</title>
<style>
    :root { color-scheme: light; }
    body { margin: 0; font: 16px/1.5 Archivo, "Segoe UI", Arial, sans-serif; color: #0B0F14; background: #F3F4F6; }
    header { padding: 48px 24px 24px; background: #fff; border-bottom: 1px solid #E2E5E9; }
    h1 { margin: 0 0 8px; font-size: 32px; line-height: 1.2; }
    h2 { margin: 0 0 16px; font-size: 24px; }
    h3 { margin: 0 0 8px; font-size: 14px; font-weight: 500; color: #5F6875; }
    .lead { max-width: 60ch; margin: 0 0 24px; color: #3A424D; }
    main { padding: 24px; display: grid; gap: 48px; max-width: 1400px; margin: 0 auto; }
    .page { background: #fff; padding: 24px; border: 1px solid #E2E5E9; }
    .pair { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom: 24px; }
    figure { margin: 0; }
    figure img { display: block; width: 100%; height: auto; max-height: 70vh; object-fit: contain; object-position: top; border: 1px solid #E2E5E9; background: #fff; }
    figcaption { margin-top: 8px; font-size: 13px; color: #5F6875; }
    .placeholder { display: grid; place-items: center; height: 240px; border: 1px dashed #C9CED5; color: #5F6875; font-size: 14px; }
    footer { padding: 24px; font-size: 13px; color: #5F6875; text-align: center; }
</style>
</head>
<body>
<header>
    <h1>RIMIFY — vorher und nachher</h1>
    <p class="lead">Jede Seite zu Beginn von Phase 0 neben der fertigen Seite, bei 390 und 1440 Pixeln Breite. Stand: ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${done} von ${PAGES.length} Seiten fertig.</p>
</header>
<main>${moments}${rows}</main>
<footer>Screenshots der laufenden Anwendung; Beispieldaten.</footer>
</body>
</html>
`

writeFileSync(OUT_HTML, html)
console.log(`${OUT_HTML}: ${done}/${PAGES.length} pages with after-shots`)
