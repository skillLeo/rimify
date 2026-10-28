#!/usr/bin/env node
// Human QA Part B: docs/review/LINK-MATRIX.md from the cells the matrix run wrote (storage/qa-evidence/part-b/cells.json)
// and the cells checked another way (storage/qa-evidence/part-b/manual.json: same shape, `how` says how). One row per
// admin action, one column per storefront place; a cell is PASS, FAIL or n/a, with its note. The pictures stay in
// storage/qa-evidence/ — the repository is public — and the table names them.
//
//   node scripts/qa/link-matrix.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const DIR = 'storage/qa-evidence/part-b'
const read = (file) => (existsSync(`${DIR}/${file}`) ? JSON.parse(readFileSync(`${DIR}/${file}`, 'utf8')) : [])
const cells = [...read('cells.json'), ...read('manual.json')]

const ROWS = {
    create: 'Felge angelegt (alle Felder) und veröffentlicht',
    price: 'Preis geändert, Felge schon im Warenkorb',
    rename: 'Namensteile geändert (Modell, Radtypenbezeichnung)',
    unavailable: 'Verfügbar → Nicht verfügbar, Felge im Warenkorb',
    withdraw: 'Zurückgezogen',
}
const rows = [...new Set(cells.map((c) => c.row))]
const places = [...new Set(cells.map((c) => c.place))]
const mark = { PASS: '✅ PASS', FAIL: '❌ FAIL', 'n/a': 'n/a' }

const count = (r) => cells.filter((c) => c.result === r).length
const lines = [
    '# Link matrix — admin action to storefront',
    '',
    `Human QA Part B (\`HUMAN-QA-FULL.md\` §5), on our own instance: each admin action done in the admin as a person does it,`,
    'then every storefront place asked again without clearing anything. Written by `scripts/qa/link-matrix.mjs` from the',
    'run of `e2e/kundenliste/link-matrix.spec.ts` and the cells checked by other means; pictures in',
    '`storage/qa-evidence/part-b/` (not in the repository).',
    '',
    `**${cells.length} cells: ${count('PASS')} PASS · ${count('FAIL')} FAIL · ${count('n/a')} n/a.**`,
    '',
    '| Admin action | ' + places.join(' | ') + ' |',
    '|---|' + places.map(() => '---').join('|') + '|',
    ...rows.map((row) => `| ${ROWS[row] ?? row} | ` + places.map((place) => {
        const cell = cells.find((c) => c.row === row && c.place === place)

        return cell ? mark[cell.result] : '–'
    }).join(' | ') + ' |'),
    '',
    '## Every cell',
    '',
    '| Action | Place | Result | What was checked | How |',
    '|---|---|---|---|---|',
    ...cells.map((c) => `| ${ROWS[c.row] ?? c.row} | ${c.place} | ${c.result} | ${String(c.note).replace(/\|/g, '\\|')} | ${c.how ?? 'browser, link-matrix.spec.ts'} |`),
    '',
]

writeFileSync('docs/review/LINK-MATRIX.md', lines.join('\n'))
process.stdout.write(`LINK-MATRIX.md: ${cells.length} cells, ${count('FAIL')} FAIL\n`)
