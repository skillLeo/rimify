/**
 * The order of an admin list as its address carries it (F-32): `sort` and `richtung`, left out where they are the list's
 * own default, so the plain list stays the bare address.
 */

export interface ListSort {
    sort: string
    richtung: 'auf' | 'ab'
}

/**
 * A heading pressed: the same column turns around; another starts with what a person looks for first — `auf` for names
 * and sizes, `ab` for counts and dates (the column's own first direction).
 */
export function nextSort(current: ListSort, column: string, first: 'auf' | 'ab' = 'auf'): ListSort {
    if (current.sort === column) {
        return { sort: column, richtung: current.richtung === 'auf' ? 'ab' : 'auf' }
    }

    return { sort: column, richtung: first }
}

/** The query for an order: nothing for the default. */
export function sortQuery(sort: ListSort, fallback: ListSort): Record<string, string> {
    return sort.sort === fallback.sort && sort.richtung === fallback.richtung ? {} : { sort: sort.sort, richtung: sort.richtung }
}
