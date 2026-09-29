/**
 * `docSVG` — the Fahrzeugschein facsimile behind the `?` beside the key-number fields
 * (artwork spec §6).
 *
 * This drawing is the single highest-value piece of help on the site. The customer is holding a
 * document and looking for two numbers on it; a paragraph explaining where they are is useless
 * next to a picture of the document with the two fields ringed.
 *
 * Both layouts exist because both are in circulation: the Zulassungsbescheinigung Teil I issued
 * since 2005 carries them at 2.1 and 2.2, and the older Fahrzeugschein at 2 and 3. A customer
 * shown only the new one and holding the old one is worse off than with no help at all.
 */

import { idFor } from './palette'

export type DocVariant = 'neu' | 'alt'

export interface DocOptions {
    width?: number
    title?: string
}

export function docSVG(variant: DocVariant = 'neu', options: DocOptions = {}): string {
    const width = options.width ?? 560
    const id = idFor('doc', variant)
    const a11y = options.title
        ? `role="img" aria-label="${escapeAttr(options.title)}"`
        : 'role="presentation" aria-hidden="true"'

    const heading = variant === 'neu' ? 'Zulassungsbescheinigung Teil I' : 'Fahrzeugschein'
    const hsnField = variant === 'neu' ? '2.1' : '2'
    const tsnField = variant === 'neu' ? '2.2' : '3'

    // On the new certificate the two fields sit together in the upper block; on the older
    // Fahrzeugschein they are further apart, which is exactly why people miss them.
    const hsnY = variant === 'neu' ? 132 : 122
    const tsnY = variant === 'neu' ? 166 : 190

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 400" width="${width}" height="${Math.round((width * 400) / 560)}" ${a11y} focusable="false">
  <defs>
    <filter id="dsh-${id}" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0E1116" flood-opacity=".18"/>
    </filter>
  </defs>

  <rect x="20" y="16" width="520" height="368" rx="6" fill="#E8F0E2" stroke="#B9C9AE" stroke-width="1" filter="url(#dsh-${id})"/>

  <text x="44" y="52" font-family="Lato, Arial, sans-serif" font-size="13" font-weight="700" fill="#3C4A34">${escapeText(heading)}</text>
  <line x1="44" y1="64" x2="516" y2="64" stroke="#B9C9AE" stroke-width="1"/>

  ${rows(id, [hsnY, tsnY])}

  <!-- 2.1 / 2 — HSN, ringed in blue -->
  <rect x="${variant === 'neu' ? 40 : 40}" y="${hsnY - 18}" width="214" height="30" rx="4" fill="none" stroke="#1A44D4" stroke-width="2"/>
  <text x="50" y="${hsnY + 2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#3C4A34">${hsnField}</text>
  <text x="84" y="${hsnY + 3}" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="500" letter-spacing="3" fill="#0E1116">0005</text>
  <path d="M254 ${hsnY - 3} H300" stroke="#1A44D4" stroke-width="1.5" fill="none"/>
  <circle cx="302" cy="${hsnY - 3}" r="3" fill="#1A44D4"/>
  <text x="312" y="${hsnY + 1}" font-family="Lato, Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="1.2" fill="#1A44D4">HSN</text>

  <!-- 2.2 / 3 — TSN, ringed in green -->
  <rect x="40" y="${tsnY - 18}" width="214" height="30" rx="4" fill="none" stroke="#2E8B22" stroke-width="2"/>
  <text x="50" y="${tsnY + 2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#3C4A34">${tsnField}</text>
  <text x="84" y="${tsnY + 3}" font-family="'IBM Plex Mono', monospace" font-size="14" font-weight="500" letter-spacing="3" fill="#0E1116">AAS</text>
  <path d="M254 ${tsnY - 3} H300" stroke="#2E8B22" stroke-width="1.5" fill="none"/>
  <circle cx="302" cy="${tsnY - 3}" r="3" fill="#2E8B22"/>
  <text x="312" y="${tsnY + 1}" font-family="Lato, Arial, sans-serif" font-size="12" font-weight="900" letter-spacing="1.2" fill="#2E8B22">TSN</text>
</svg>`
}

/** A ringed field of the papers, or a greeked row (by its field number) between them. */
type PapersRow = { label: string; value: string; name: string } | { greek: number }

/**
 * `papersSVG` — the document with the fields the tyre check reads ringed (Block C, item 10): the permitted
 * axle loads front and rear (8.1, 8.2 — on the old Fahrzeugschein one field, Ziffer 16), the top speed
 * (T — old: Ziffer 6) and the power (P.2 — old: Ziffer 7). The values are placeholders the customer reads
 * past; the rings are what matters.
 *
 * Drawn for the width it is shown at, 294 to 360 px: a 360-unit viewBox, so no text falls below 12 px at
 * 294 px (15 units and up). The text takes the page's own face — no font-family of its own, which would
 * fall back to Arial — at weights 500 and 600, never letter-spaced (the look review of Block C, §4).
 */
export function papersSVG(variant: DocVariant = 'neu', options: DocOptions = {}): string {
    const width = options.width ?? 360
    const id = idFor('papers', variant)
    const a11y = options.title
        ? `role="img" aria-label="${escapeAttr(options.title)}"`
        : 'role="presentation" aria-hidden="true"'

    const heading = variant === 'neu' ? 'Zulassungsbescheinigung Teil I' : 'Fahrzeugschein'
    const rowsOf: PapersRow[] = variant === 'neu'
        ? [
            { label: '8.1', value: '1.120', name: 'Achslast vorn' },
            { label: '8.2', value: '1.180', name: 'Achslast hinten' },
            { greek: 9 },
            { label: 'T', value: '250', name: 'km/h' },
            { greek: 11 },
            { label: 'P.2', value: '140', name: 'kW' },
        ]
        : [
            { label: '6', value: '250', name: 'km/h' },
            { label: '7', value: '140', name: 'kW' },
            { greek: 12 },
            { greek: 14 },
            { label: '16', value: '1120 / 1180', name: 'Achslasten' },
        ]

    const STEP = 48
    const FIRST = 92
    const height = FIRST + (rowsOf.length - 1) * STEP + 34

    const drawn = rowsOf.map((row, i) => {
        const y = FIRST + i * STEP

        if ('greek' in row) {
            // The document's other fields are not the customer's problem: shapes, not legible dummy data.
            return `
  <text x="30" y="${y}" font-size="15" font-weight="500" fill="#7C8C74">${row.greek}</text>
  <rect x="66" y="${y - 11}" width="${80 + ((i * 29) % 40)}" height="10" rx="2" fill="#C9D8BF"/>
  <rect x="210" y="${y - 11}" width="${70 + ((i * 23) % 50)}" height="10" rx="2" fill="#D6E2CD"/>`
        }

        return `
  <rect x="20" y="${y - 24}" width="160" height="36" rx="4" fill="none" stroke="#1A44D4" stroke-width="2"/>
  <text x="30" y="${y}" font-size="15" font-weight="600" fill="#3C4A34">${escapeText(row.label)}</text>
  <text x="66" y="${y}" font-size="17" font-weight="500" fill="#0E1116">${escapeText(row.value)}</text>
  <path d="M180 ${y - 6} H200" stroke="#1A44D4" stroke-width="1.5" fill="none"/>
  <circle cx="202" cy="${y - 6}" r="3" fill="#1A44D4"/>
  <text x="210" y="${y}" font-size="15" font-weight="600" fill="#1A44D4">${escapeText(row.name)}</text>`
    }).join('')

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 ${height}" width="${width}" height="${Math.round((width * height) / 360)}" ${a11y} focusable="false">
  <rect x="8" y="8" width="344" height="${height - 16}" rx="6" fill="#E8F0E2" stroke="#B9C9AE" stroke-width="1"/>
  <text x="20" y="40" font-size="16" font-weight="600" fill="#3C4A34">${escapeText(heading)}</text>
  <line x1="20" y1="52" x2="340" y2="52" stroke="#B9C9AE" stroke-width="1"/>
  <g data-doc="${id}">${drawn}
  </g>
</svg>`
}

/** The numbered field grid the two ringed rows sit inside — greeked, because the document's other
 *  fields are not the customer's problem and legible dummy data would only invite reading. */
function rows(id: string, ringed: number[]): string {
    const out: string[] = []

    for (let i = 0; i < 9; i++) {
        const y = 100 + i * 32

        if (ringed.some((r) => Math.abs(y - r) < 20)) {
            continue
        }

        const w = 150 + ((i * 53) % 120)
        out.push(
            `<text x="50" y="${y + 2}" font-family="Lato, Arial, sans-serif" font-size="11" font-weight="700" fill="#7C8C74">${i + 4}</text>` +
                `<rect x="84" y="${y - 9}" width="${w}" height="9" rx="2" fill="#C9D8BF"/>` +
                `<rect x="300" y="${y - 9}" width="${110 + ((i * 37) % 100)}" height="9" rx="2" fill="#D6E2CD"/>`
        )
    }

    return `<g data-doc="${id}">${out.join('')}</g>`
}

function escapeText(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(s: string): string {
    return escapeText(s).replace(/"/g, '&quot;')
}
