/**
 * What the Gutachten sketch does with its cells — one car group × the paper's wheel size, each with its own tyres (the
 * Gutachten rework brief §6, §7): copying a cell to others, pasting several lines, and the soft warnings of step 4 and
 * step 5. In memory only; kept apart from the page so it is tested.
 */

import type { Cell, PaperCode, PairLine, TyreLine } from './gutachtenDemo'
import { readTyre, sizeKey, tyreLabel, type PasteLine } from './tyreInput'

let nextId = 1000

/** A fresh id for a line made in the browser: a copied line never shares one with its source. */
export function lineId(): number {
    nextId += 1

    return nextId
}

/**
 * After a session is restored: the counter starts above every id the restored lines hold, so a new line never takes
 * one of theirs — typed text would land in the other line, and removing one would remove both.
 */
export function reserveLineIds(cells: Cell[]): void {
    for (const cell of cells) {
        for (const line of [...cell.tyres, ...cell.pairs]) {
            nextId = Math.max(nextId, line.id)
        }
    }
}

/** `2 Reifen · 1 Kombination`, `1 Reifen`, `noch leer`. */
export function cellSummary(cell: Cell): string {
    const parts: string[] = []

    if (cell.tyres.length > 0) {
        parts.push(`${cell.tyres.length} Reifen`)
    }

    if (cell.pairs.length > 0) {
        parts.push(`${cell.pairs.length} ${cell.pairs.length === 1 ? 'Kombination' : 'Kombinationen'}`)
    }

    return parts.length === 0 ? 'noch leer' : parts.join(' · ')
}

/** A row is entered once it holds one line that reads: an empty or unreadable line is not a tyre. */
export function cellDone(cell: Cell): boolean {
    return cell.tyres.some((line) => readTyre(line.text) !== null) || cell.pairs.some((pair) => readTyre(pair.front) !== null && readTyre(pair.rear) !== null)
}

/** The lines that do not read — empty, or not a size — which keep a paper from release until they are fixed or removed. */
export function unreadableLines(cell: Cell): number[] {
    return [
        ...cell.tyres.filter((line) => readTyre(line.text) === null).map((line) => line.id),
        ...cell.pairs.filter((pair) => readTyre(pair.front) === null || readTyre(pair.rear) === null).map((pair) => pair.id),
    ]
}

function lineKey(line: TyreLine): string {
    const tyre = readTyre(line.text)

    return `${tyre === null ? line.text.trim() : sizeKey(tyre)}|${line.kw.trim()}|${line.axle}`
}

function pairKey(pair: PairLine): string {
    const front = readTyre(pair.front)
    const rear = readTyre(pair.rear)

    return `${front === null ? pair.front : sizeKey(front)}|${rear === null ? pair.rear : sizeKey(rear)}`
}

function copyTyre(line: TyreLine): TyreLine {
    return { ...line, id: lineId(), codes: [...line.codes] }
}

function copyPair(pair: PairLine): PairLine {
    return { ...pair, id: lineId(), codes: [...pair.codes] }
}

/**
 * „Kopieren nach …": `ersetzen` puts the source's tyres, pairs and general codes in place of the target's; `hinzufuegen`
 * adds the lines the target does not hold yet and keeps its own. Either way the target says where it came from until
 * someone edits it, and keeps its own page: each row of a paper stands on a page of its own.
 */
export function copyCell(source: Cell, target: Cell, mode: 'ersetzen' | 'hinzufuegen', sourceName: string): Cell {
    if (mode === 'ersetzen') {
        return {
            ...target,
            tyres: source.tyres.map(copyTyre),
            pairs: source.pairs.map(copyPair),
            general: [...source.general],
            copiedFrom: sourceName,
        }
    }

    const tyreKeys = new Set(target.tyres.map(lineKey))
    const pairKeys = new Set(target.pairs.map(pairKey))

    return {
        ...target,
        tyres: [...target.tyres, ...source.tyres.filter((line) => !tyreKeys.has(lineKey(line))).map(copyTyre)],
        pairs: [...target.pairs, ...source.pairs.filter((pair) => !pairKeys.has(pairKey(pair))).map(copyPair)],
        general: [...new Set([...target.general, ...source.general])],
        copiedFrom: sourceName,
    }
}

function counted(tyres: number, pairs: number): string {
    const parts = [tyres ? `${tyres} Reifen` : '', pairs ? `${pairs} ${pairs === 1 ? 'Kombination' : 'Kombinationen'}` : ''].filter(Boolean)

    return parts.join(' und ')
}

function groups(n: number): string {
    return `${n} ${n === 1 ? 'Fahrzeuggruppe' : 'Fahrzeuggruppen'}`
}

/**
 * What a copy will do, before it does it: `ersetzen` replaces each target's lines with the source's; `hinzufuegen` counts
 * only the lines a target does not hold yet — and says so when there are none.
 */
export function copyPreview(source: Cell, targets: Cell[], mode: 'ersetzen' | 'hinzufuegen'): string {
    if (mode === 'ersetzen') {
        return `Ersetzt durch ${counted(source.tyres.length, source.pairs.length) || 'nichts'} für ${groups(targets.length)}.`
    }

    let tyres = 0
    let pairs = 0

    for (const target of targets) {
        const tyreKeys = new Set(target.tyres.map(lineKey))
        const pairKeys = new Set(target.pairs.map(pairKey))

        tyres += source.tyres.filter((line) => !tyreKeys.has(lineKey(line))).length
        pairs += source.pairs.filter((pair) => !pairKeys.has(pairKey(pair))).length
    }

    return tyres + pairs === 0 ? 'Nichts kommt hinzu: Alles steht dort schon.' : `Hinzu ${tyres + pairs === 1 ? 'kommt' : 'kommen'} insgesamt ${counted(tyres, pairs)}, für ${groups(targets.length)}.`
}

/** Every code a cell names: beside a tyre, beside a pair, or for the whole row. */
export function usedCodes(cells: Cell[]): Set<string> {
    const used = new Set<string>()

    for (const cell of cells) {
        cell.tyres.forEach((line) => line.codes.forEach((code) => used.add(code)))
        cell.pairs.forEach((pair) => pair.codes.forEach((code) => used.add(code)))
        cell.general.forEach((code) => used.add(code))
    }

    return used
}

/** The codes in use that nobody has described yet, in the order of the paper's list, then any not in it at all. */
export function undescribedCodes(cells: Cell[], codes: PaperCode[]): string[] {
    const used = usedCodes(cells)
    const described = new Set(codes.filter((code) => code.text !== null && code.text.trim() !== '').map((code) => code.code))
    const listed = codes.map((code) => code.code).filter((code) => used.has(code) && !described.has(code))
    const unlisted = [...used].filter((code) => !codes.some((listedCode) => listedCode.code === code))

    return [...listed, ...unlisted]
}

/** Every size the paper lists as a tyre line for this wheel size, in any cell. */
export function paperSizes(cells: Cell[]): Set<string> {
    const sizes = new Set<string>()

    for (const cell of cells) {
        for (const line of cell.tyres) {
            const tyre = readTyre(line.text)

            if (tyre !== null) {
                sizes.add(sizeKey(tyre))
            }
        }
    }

    return sizes
}

/**
 * A pair whose front or rear size is not among the tyre lines entered for this paper (the brief §4.3): if the paper does
 * not list it, that axle needs another rim size, covered by another paper. Said in words of what is recorded (R-17), never
 * refused — the existing staggered logic decides which rim goes where.
 */
export function pairWarnings(cell: Cell, sizes: Set<string>): { id: number; text: string }[] {
    const out: { id: number; text: string }[] = []

    for (const pair of cell.pairs) {
        const front = readTyre(pair.front)
        const rear = readTyre(pair.rear)

        if (front !== null && !sizes.has(sizeKey(front))) {
            out.push({ id: pair.id, text: 'Die vordere Reifengröße ist zu diesem Gutachten noch nicht als Reifen erfasst. Steht sie dort nicht, braucht sie eine andere Felgengröße.' })
        }

        if (rear !== null && !sizes.has(sizeKey(rear))) {
            out.push({ id: pair.id, text: 'Die hintere Reifengröße ist zu diesem Gutachten noch nicht als Reifen erfasst. Steht sie dort nicht, braucht sie eine andere Felgengröße.' })
        }
    }

    return out
}

/** The lines that repeat a size already on the row — the same size, power band and axle; the later one is named. */
export function duplicateLines(cell: Cell): number[] {
    const seen = new Set<string>()
    const twice: number[] = []

    for (const line of cell.tyres) {
        const key = lineKey(line)

        if (readTyre(line.text) !== null && seen.has(key)) {
            twice.push(line.id)
        }

        seen.add(key)
    }

    return twice
}

/** „Mehrere einfügen", confirmed: each size a tyre line, each pair a pair line, as the shop writes them; unread lines left out. */
export function applyPaste(cell: Cell, lines: PasteLine[]): Cell {
    const tyres: TyreLine[] = []
    const pairs: PairLine[] = []

    for (const line of lines) {
        for (const size of line.sizes ?? []) {
            tyres.push({ id: lineId(), text: tyreLabel(size), codes: [], kw: '', axle: 'ALL' })
        }

        for (const pair of line.pairs ?? []) {
            pairs.push({ id: lineId(), front: tyreLabel(pair.front), rear: tyreLabel(pair.rear), codes: [] })
        }
    }

    return { ...cell, tyres: [...cell.tyres, ...tyres], pairs: [...cell.pairs, ...pairs], copiedFrom: null }
}
