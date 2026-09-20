/**
 * Typed access to the props every page receives.
 *
 * `usePage().props` is `any` by default, which is how a renamed controller key becomes a blank
 * header nobody notices until a client review. This narrows it once, here.
 */

import { usePage } from '@inertiajs/vue3'
import { computed, type ComputedRef } from 'vue'
import type { Menus, SharedProps, VehicleProp } from '../types/rimify'

export function useShared(): ComputedRef<SharedProps> {
    const page = usePage<SharedProps>()

    return computed(() => page.props)
}

export function useVehicle(): ComputedRef<VehicleProp | null> {
    const shared = useShared()

    return computed(() => shared.value.vehicle)
}

export function useMenus(): ComputedRef<Menus> {
    const shared = useShared()

    return computed(
        () =>
            shared.value.menus ?? {
                header: [],
                footer_pages: [],
                footer_legal: [],
                mobile_bottom: [],
            }
    )
}

/**
 * `Felgen suchen` goes to the selector with no vehicle and to the listing with one. The rule lives
 * in the nav row's `behaviour`, so marketing can move the item without a developer — and so the
 * destination is not a branch buried in a component.
 */
export function resolveHref(
    href: string,
    behaviour: string | null,
    hasVehicle: boolean,
    listingHref: string
): string {
    return behaviour === 'vehicle_aware' && hasVehicle ? listingHref : href
}
