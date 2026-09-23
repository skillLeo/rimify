/**
 * Basket mutations.
 *
 * Every change is a server round trip rather than local state, and deliberately so: the basket is
 * re-priced and every line re-verified on render, so a quantity change is also the moment a
 * superseded document or a stock movement becomes visible. Optimistic local arithmetic would show
 * a total the server does not agree with.
 *
 * A Komplettrad line has two more actions (docs/specs/komplettrad.md §4.10): its Wuchtgewichte
 * colour, which the server re-checks for `active`, and `Reifen entfernen`, which converts the
 * line to Felgen only. Both are server round trips for the same reason.
 */

import { router } from '@inertiajs/vue3'

export interface BasketActions {
    setQuantity(key: string, quantity: number): void
    remove(key: string): void
    setWeightColour(key: string, colourId: number): void
    removeTyre(key: string): void
}

export function useBasket(): BasketActions {
    function setQuantity(key: string, quantity: number): void {
        if (quantity < 1) {
            remove(key)

            return
        }

        router.patch(
            `/warenkorb/${encodeURIComponent(key)}`,
            { quantity },
            { preserveScroll: true, preserveState: true }
        )
    }

    function remove(key: string): void {
        router.delete(`/warenkorb/${encodeURIComponent(key)}`, { preserveScroll: true })
    }

    function setWeightColour(key: string, colourId: number): void {
        router.patch(
            `/warenkorb/${encodeURIComponent(key)}/gewichte`,
            { colourId },
            { preserveScroll: true, preserveState: true }
        )
    }

    function removeTyre(key: string): void {
        router.delete(`/warenkorb/${encodeURIComponent(key)}/reifen`, { preserveScroll: true })
    }

    return { setQuantity, remove, setWeightColour, removeTyre }
}
