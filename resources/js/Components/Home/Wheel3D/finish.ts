/**
 * A catalogue finish name → the PBR parameters the scene renders it with. Roughness follows the
 * spec's three grades (matt 0,55 · glänzend 0,18 · poliert 0,08); the colour is read from the
 * German finish words a supplier uses. Unknown words render as glossy silver — the safe default,
 * never a guess at a colour the name does not say.
 */

import type { FinishMaterial } from './types'

const SILVER = '#c9ccd1'

const COLOURS: readonly { test: RegExp; color: string; metalness?: number }[] = [
    { test: /schwarz|black/i, color: '#25282c' },
    { test: /anthrazit|gunmetal|graphit|dunkelgrau/i, color: '#5b6169' },
    { test: /titan/i, color: '#8d9096' },
    { test: /bronze/i, color: '#8a6a45' },
    { test: /gold/i, color: '#b8963e' },
    { test: /kupfer|copper/i, color: '#a0603f' },
    { test: /grau|grey|gray/i, color: '#9a9ea4' },
    // White is paint, not metal: a low metalness keeps it white instead of a bright mirror.
    { test: /weiß|weiss|white/i, color: '#e6e7e9', metalness: 0.2 },
    { test: /poliert|polished|glanzgedreht/i, color: '#dcdee1' },
]

export function roughnessFor(name: string): number {
    if (/matt|satin|seidenmatt/i.test(name)) {
        return 0.55
    }

    if (/poliert|polished|glanzgedreht|hochglanz/i.test(name)) {
        return 0.08
    }

    return 0.18
}

export function finishFor(name: string): FinishMaterial {
    const hit = COLOURS.find((c) => c.test.test(name))

    return {
        color: hit?.color ?? SILVER,
        roughness: roughnessFor(name),
        metalness: hit?.metalness ?? 1,
    }
}

/** Black rubber: the band's tyre. No lettering, no mark. */
export const RUBBER: FinishMaterial = { color: '#141516', roughness: 0.82, metalness: 0 }
