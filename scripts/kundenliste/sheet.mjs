// What goes into the client's own sheet (the operator's addendum of 13.10.2026): per item the value of his „Skill Leo“
// dropdown and the note for his Description cell — docs/review/KUNDENLISTE.csv, written by `npm run kundenliste` from
// the same results as the table, never by hand.
//
// One rule decides the dropdown: `SkillLeo Done` only when the item's tagged test passed AGAINST THE PREVIEW — the site
// he looks at. Proven on our own instance and not yet there is `Open`. So every result is recorded with its instance
// (docs/review/kundenliste/ergebnis-<instanz>.json), and this file reads the preview's.
//
// The notes are for a shop owner, in the language of his sheet (English): no commit, no test name, none of our words.
// For #19, #23 and #34 they are the operator's own wording, so the sheet and his message say the same thing.

export const DONE = 'SkillLeo Done'
export const OPEN = 'Open'

/** The instance a result came from, as recorded with it. */
export const INSTANCES = { ours: 'eigene-instanz', preview: 'vorschau' }

const WAITING_ON_HIS_VIEW = 'built, waiting on your view.'
const NOT_ON_PREVIEW_YET = 'Built and tested on our side. Not on your preview yet.'
const IN_PROGRESS = 'In progress.'

/** What each item does now, in one sentence he can check on the site. */
export const NOTES = {
    1: 'The hero button is light blue until a vehicle is chosen, says why it is waiting, and a click takes you to the vehicle picker.',
    2: 'The header is taller: 72 px on desktop, 64 px on mobile. Jump links now land with the heading visible.',
    3: 'The strip above the header is gone. What it said is still on the page.',
    4: 'The hero wheel photo is no longer a link and shows no price; its measurements stay.',
    5: 'The row is now „Meistgekaufte Felgen“, sorted by paid orders of the last 90 days. Before the first sale it reads „Neu im Shop“; with fewer than four wheels in the shop it is hidden.',
    6: 'The highlight in „Wir lesen das Gutachten“ sits on the right row at every screen size we checked, low windows included.',
    7: 'Switching between the three vehicle tabs no longer makes the hero jump.',
    8: 'The chosen vehicle is part of the address, so a page can be saved and shared; the link shows the same wheels and results in any browser.',
    9: 'Solved differently: the turning wheel is a real wheel from your photos that can be bought in the shop, the BORBET DB8GT2. Not a Motec, because we hold no rights to Motec photos; send us some and we swap it in.',
    10: 'The footer links the Felgenrechner and the Blog; both open, and the Blog lists its articles.',
    11: WAITING_ON_HIS_VIEW,
    12: 'The contact page has a form: name, e-mail, subject, message, your vehicle ticked. Messages are kept in the admin under Verkauf › Nachrichten. Spam protection without a third-party captcha.',
    13: 'On mobile the basket icon sits in the header, left of the menu, with its count.',
    14: 'Prices agree everywhere from the product tile to the invoice, for 1 to 5 wheels: one wheel 229,00 €, four wheels 916,00 €.',
    15: 'With „Komplettrad“, balance weights and TPMS sensors are separate lines with their own prices; with „Nur Felgen“ none of them appear. Valves are not offered on their own yet: we still need your answer on which valves you fit without sensors.',
    16: 'After adding to the basket a small window shows the item and the total, with „Weiter einkaufen“ and „Zum Warenkorb“.',
    17: 'Next to the price you choose 1 to 8 wheels, 4 preselected, never more than in stock; the line reads e.g. „4 × 229,00 € = 916,00 €“.',
    18: 'You choose „Nur Felgen“ or „Komplettrad“ without losing size, colour or quantity, and add matching tyres directly. The check then shows what the Gutachten requires for exactly that tyre size.',
    19: 'built as verified reviews, see our note — manual star ratings would be a legal risk for you. Real reviews from Google or your old shop can be imported with the source named.',
    20: 'Different sizes front and rear can be chosen, only in the pairs the Gutachten permits.',
    21: '„Eintragung“ now appears once. The Gutachten’s original wording is behind „Originaltext anzeigen“, each sentence under the tyre sizes it applies to.',
    22: 'On mobile „Vergleichen“ no longer covers the „Mit Auflagen“ label. Long conditions are shown as a count on the tile, with the wording on the product page.',
    23: 'configurable as you asked, with one floor — a condition needing an inspection cannot be set to green.',
    24: 'The filter column scrolls cleanly to its last entry.',
    25: 'The button without a function is gone; „Nur Felgen“ or „Komplettrad“ is chosen right by the price.',
    26: 'No button opens an e-mail program any more; all lead to the contact form. The Impressum shows your e-mail address as text once your seller details are entered; on the preview it still reads „noch nicht angegeben“.',
    27: 'A size or brand chosen first is kept when the vehicle is chosen afterwards.',
    28: 'RIMIFY-Check: choose a vehicle and a wheel, get one answer for that pair with its conditions and the page of the Gutachten, then buy directly. If the pair is not approved there is no buy button.',
    29: 'There is one footer now, the same on every page and screen size.',
    30: 'All filters work without a vehicle; one sentence says that results for a specific car need a vehicle.',
    31: 'On mobile, „Filter“ opens a sheet from the bottom with the same filters and counts as on desktop.',
    32: WAITING_ON_HIS_VIEW,
    33: WAITING_ON_HIS_VIEW,
    34: 'could you finish this sentence and we will build it with the rest.',
}

/**
 * One row of his sheet.
 *
 * @param {{nr: number, state: string}} item      the item as items.mjs holds it (`state`: what it can become at best)
 * @param {{passed: boolean}|null} ours           its result on our own instance, if it ran there
 * @param {{passed: boolean}|null} preview        its result on the preview, if it ran there
 * @returns {{nr: number, value: string, note: string}}
 */
export function sheetRow(item, ours, preview) {
    const note = NOTES[item.nr] ?? ''

    // Judgement, solved differently, or waiting on him: never ours to tick, whatever the tests say.
    if (item.state !== 'erledigt') {
        return { nr: item.nr, value: OPEN, note }
    }

    if (preview?.passed === true) {
        return { nr: item.nr, value: DONE, note }
    }

    return { nr: item.nr, value: OPEN, note: ours?.passed === true ? NOT_ON_PREVIEW_YET : IN_PROGRESS }
}

/** RFC 4180: a field with a comma, a quote or a line break is quoted, quotes doubled. */
const field = (value) => (/[",\r\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : String(value))

/** @param {{nr: number, value: string, note: string}[]} rows */
export function toCsv(rows) {
    return [['Nr', 'Skill Leo', 'Description'], ...rows.map((r) => [r.nr, r.value, r.note])].map((r) => r.map(field).join(',')).join('\r\n') + '\r\n'
}
