import type { MischbereifungSetProp } from '../../types/pages'

/**
 * How a set per axle is named (D-336): one maker's one line on both axles is one name; where the document lets the axles
 * differ — two profile types of one maker under V19, or two makers where nothing asks one — each axle names its own tyre,
 * the maker only where there are two.
 */
export interface SetNames {
    /** The maker, or both. */
    brands: string[]
    /** The line both axles carry; null where they differ. */
    line: string | null
    /** Each axle's tyre where they differ; null where one line stands on both. */
    front: string | null
    rear: string | null
}

const same = (a: string | undefined, b: string | undefined): boolean =>
    (a ?? '').trim().toLocaleLowerCase('de-DE') === (b ?? '').trim().toLocaleLowerCase('de-DE')

export function setNames(set: MischbereifungSetProp): SetNames {
    const rearBrand = set.rearBrandName ?? set.brandName
    const rearLine = set.rearName ?? set.name

    if (same(set.brandName, rearBrand) && same(set.name, rearLine)) {
        return { brands: [set.brandName], line: set.name, front: null, rear: null }
    }

    if (same(set.brandName, rearBrand)) {
        return { brands: [set.brandName], line: null, front: set.name, rear: rearLine }
    }

    return { brands: [set.brandName, rearBrand], line: null, front: `${set.brandName} ${set.name}`, rear: `${rearBrand} ${rearLine}` }
}
