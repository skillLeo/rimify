/**
 * The Größen-Matrix: sizes made from lists — finishes × diameters × widths × ETs — sharing one bolt
 * pattern, bore, price and stock, each with an SKU built from its parts (the review release §4.2).
 *
 * Values stay the German text a person types (`8,5`); the server reads them (GermanNumber, Money).
 * Here they are only compared, so a size that already exists is not made twice.
 */

import type { FinishForm, SizeForm } from '../../../types/admin/felgen'

export interface MatrixInput {
    finishes: string[]
    diameters: string
    widths: string
    ets: string
    bolt_holes: number
    bolt_circle: string
    bore: string
    price: string
    stock: number
}

/**
 * A list as typed: `8 8,5 9`, `8; 8,5; 9` or one per line. The comma is the decimal mark, so it never
 * separates. Each value is kept as typed, doubles dropped.
 */
export function parseList(text: string): string[] {
    const seen = new Set<string>()

    return text
        .split(/[\s;]+/)
        .map((value) => value.trim().replace(/,$/, ''))
        .filter((value) => {
            if (value === '' || seen.has(normal(value))) {
                return false
            }

            seen.add(normal(value))

            return true
        })
}

/** `8,50` and `8,5` and `8.5` are one width. */
export function normal(value: string): string {
    const n = Number(value.trim().replace(',', '.'))

    return Number.isFinite(n) ? String(n) : value.trim().toLowerCase()
}

/** The key two sizes share when they are the same size in the same finish. */
export function sizeKey(size: Pick<SizeForm, 'finish' | 'diameter' | 'width' | 'et' | 'bolt_circle'>): string {
    return [size.finish, normal(size.diameter), normal(size.width), normal(size.et), normal(size.bolt_circle)].join('|')
}

/** `Graphit matt` → `GM`; `Silber` → `S`. */
export function finishCode(name: string): string {
    const code = ascii(name)
        .split(/[^A-Z0-9]+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join('')

    return code || 'F'
}

/** `NORDFELGE-FJORD-18X8.5-ET35-GM` */
export function skuFor(brand: string, model: string, finish: string, diameter: string, width: string, et: string): string {
    const part = (s: string): string =>
        ascii(s)
            .replace(/[^A-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')

    return [part(brand) || 'MARKE', part(model) || 'MODELL', `${normal(diameter)}X${normal(width)}`, `ET${normal(et)}`, finishCode(finish)]
        .join('-')
        .replace(/-{2,}/g, '-')
        .slice(0, 64)
}

function ascii(s: string): string {
    return s
        .toUpperCase()
        .replace(/Ä/g, 'AE')
        .replace(/Ö/g, 'OE')
        .replace(/Ü/g, 'UE')
        .replace(/ß/g, 'SS')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
}

/**
 * The new sizes for the lists, in finish, diameter, width, ET order — none that the table already
 * holds. `nextKey` names each new row for the page.
 */
export function generate(input: MatrixInput, finishes: FinishForm[], existing: SizeForm[], brand: string, model: string, nextKey: () => string): SizeForm[] {
    const have = new Set(existing.map(sizeKey))
    const skus = new Set(existing.map((size) => size.sku.toLowerCase()))
    const out: SizeForm[] = []

    for (const finishKey of input.finishes) {
        const finish = finishes.find((f) => f.key === finishKey)

        if (!finish) {
            continue
        }

        for (const diameter of parseList(input.diameters)) {
            for (const width of parseList(input.widths)) {
                for (const et of parseList(input.ets)) {
                    const size: SizeForm = {
                        key: nextKey(),
                        id: null,
                        finish: finish.key,
                        diameter,
                        width,
                        et,
                        bolt_holes: input.bolt_holes,
                        bolt_circle: input.bolt_circle.trim(),
                        bore: input.bore.trim(),
                        sku: skuFor(brand, model, finish.name, diameter, width, et),
                        ean: '',
                        kba: '',
                        price: input.price.trim(),
                        stock: input.stock,
                        weight_g: null,
                    }

                    if (have.has(sizeKey(size))) {
                        continue
                    }

                    // An SKU already taken gets a number, so the new row never collides on its own.
                    let sku = size.sku
                    let n = 2

                    while (skus.has(sku.toLowerCase())) {
                        sku = `${size.sku.slice(0, 60)}-${n++}`
                    }

                    size.sku = sku
                    skus.add(sku.toLowerCase())
                    have.add(sizeKey(size))
                    out.push(size)
                }
            }
        }
    }

    return out
}

/** How many sizes the lists would make, before the existing ones are left out. */
export function planned(input: MatrixInput): number {
    return input.finishes.length * parseList(input.diameters).length * parseList(input.widths).length * parseList(input.ets).length
}
