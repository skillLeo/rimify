/**
 * Basket mutations.
 *
 * Every change is a server round trip rather than local state, and deliberately so: the basket is
 * re-priced and every line re-verified on render, so a quantity change is also the moment a
 * superseded document or a stock movement becomes visible. Optimistic local arithmetic would show
 * a total the server does not agree with.
 */

import { router } from '@inertiajs/vue3'

export interface BasketActions {
    setQuantity(key: string, quantity: number): void
    remove(key: string): void
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

    return { setQuantity, remove }
}
