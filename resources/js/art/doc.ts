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

  ${rows(id, hsnY, tsnY)}

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

/** The numbered field grid the two ringed rows sit inside — greeked, because the document's other
 *  fields are not the customer's problem and legible dummy data would only invite reading. */
function rows(id: string, hsnY: number, tsnY: number): string {
    const out: string[] = []

    for (let i = 0; i < 9; i++) {
        const y = 100 + i * 32

        if (Math.abs(y - hsnY) < 20 || Math.abs(y - tsnY) < 20) {
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
