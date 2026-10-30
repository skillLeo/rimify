// What goes into the client's own sheet (the operator's addendum of 13.10.2026): per item the value of his „Skill Leo“
// dropdown and the note for his Description cell — docs/review/KUNDENLISTE.csv, written by `npm run kundenliste` from
// the same results as the table, never by hand.
//
// One rule decides the dropdown: `SkillLeo Done` only when the item's tagged test passed AGAINST THE PREVIEW — the site
// he looks at. Proven on our own instance and not yet there is `Open`. So every result is recorded with its instance
// (docs/review/kundenliste/ergebnis-<instanz>.json), and this file reads the preview's.
//
// The notes are for a shop owner, in the language of his sheet (English): no commit, no test name, none of our words.
// For #23 and #34 they are the operator's own wording, so the sheet and his message say the same thing; #19's follows
// the operator's decision of 29.10.2026 (built as we had told him, D-344). The three
// judgement items say what changed and what the alternative was; their look is his verdict, in his own column.

export const DONE = 'SkillLeo Done'
export const OPEN = 'Open'

/** The instance a result came from, as recorded with it. */
export const INSTANCES = { ours: 'eigene-instanz', preview: 'vorschau' }

const YOUR_VERDICT = 'Whether it looks right is your call, in your column; we have before and after pictures at desktop and phone width.'
// True whether or not the release that carries it is on the preview: what is missing is a test passing there.
const NOT_ON_PREVIEW_YET = 'Built and tested on our test shop. Not yet checked by a test on your preview.'
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
    11: `Done on our side: our own cross-section marks the ET as a measured arrow and the rim width as a dimension, a second view shows the bolt circle and centre bore, and the wheel moves in the arch when the ET changes. The alternative was a photographic wheel like jr-wheels.com, which needs an illustration we hold the rights to. ${YOUR_VERDICT}`,
    12: 'The contact page has a form: name, e-mail, subject, message, your vehicle ticked. Messages are kept in the admin under Verkauf › Nachrichten. Spam protection without a third-party captcha.',
    13: 'On mobile the basket icon sits in the header, left of the menu, with its count.',
    14: 'Prices agree everywhere from the product tile to the invoice, for 1 to 5 wheels: one wheel 229,00 €, four wheels 916,00 €.',
    15: 'With „Komplettrad“, balance weights and TPMS sensors are separate lines with their own prices; with „Nur Felgen“ none of them appear. Valves are not offered on their own yet: we still need your answer on which valves you fit without sensors.',
    16: 'After adding to the basket a small window shows the item and the total, with „Weiter einkaufen“ and „Zum Warenkorb“.',
    17: 'Next to the price you choose 1 to 8 wheels, 4 preselected, never more than in stock; the line reads e.g. „4 × 229,00 € = 916,00 €“.',
    18: 'You choose „Nur Felgen“ or „Komplettrad“ without losing size, colour or quantity, and add matching tyres directly. The check then shows what the Gutachten requires for exactly that tyre size.',
    19: 'In the admin open a rim and scroll to „Sterne von Hand“: enter the stars, the number of reviews and one sentence saying where they come from (e.g. your eBay shop). The shop shows them under the rim’s name with your sentence beside them, and none without it. They are never shown as a verified purchase and are not passed to search engines.',
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
    32: `Done on our side: a pale blue-grey surface alternates with white between the homepage sections; not every section is tinted. The alternative is a clearer light blue on more sections, closer to your words. ${YOUR_VERDICT}`,
    33: `Done on our side: the icons, the chosen tab, chosen option buttons and the keyboard frame are blue, and blue stays the colour of what can be clicked or chosen. The alternative is blue beyond that, on headings or larger areas. ${YOUR_VERDICT}`,
    34: 'could you finish this sentence and we will build it with the rest.',
}

/**
 * One row of his sheet.
 *
 * @param {{nr: number, state: string, tick?: boolean, previewNote?: string}} item  the item as items.mjs holds it (`state`:
 *        what it can become at best; `tick`: its column is ours though its state is not; `previewNote`: why a test on his
 *        preview cannot show it, where only a write there could)
 * @param {{passed: boolean}|null} ours           its result on our own instance, if it ran there
 * @param {{passed: boolean}|null} preview        its result on the preview, if it ran there
 * @param {Record<number, string>} notes          the list's notes: his storefront list's (above) or his admin list's
 * @returns {{nr: number, value: string, note: string}}
 */
export function sheetRow(item, ours, preview, notes = NOTES) {
    const note = notes[item.nr] ?? ''

    // Solved differently, or waiting on him: not ours to tick, whatever the tests say — unless the operator made the
    // column ours (`tick`: the judgement items and #23), and then only by a pass on the preview, like every other row.
    if (item.state !== 'erledigt' && item.tick !== true) {
        return { nr: item.nr, value: OPEN, note }
    }

    if (preview?.passed === true) {
        return { nr: item.nr, value: DONE, note }
    }

    return { nr: item.nr, value: OPEN, note: ours?.passed === true ? (item.previewNote ?? NOT_ON_PREVIEW_YET) : IN_PROGRESS }
}

/** RFC 4180: a field with a comma, a quote or a line break is quoted, quotes doubled. */
const field = (value) => (/[",\r\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : String(value))

/** @param {{nr: number, value: string, note: string}[]} rows */
export function toCsv(rows) {
    return [['Nr', 'Skill Leo', 'Description'], ...rows.map((r) => [r.nr, r.value, r.note])].map((r) => r.map(field).join(',')).join('\r\n') + '\r\n'
}
