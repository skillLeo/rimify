import { usePage } from '@inertiajs/vue3'
import { computed, type ComputedRef } from 'vue'
import { useShared } from '../composables/useShared'

/** The shell's „Fahrzeug ändern“ for the page on screen. */
export function useVehicleChangeHref(): ComputedRef<string> {
    const shared = useShared()
    const page = usePage()

    return computed(() => vehicleChangeHref(shared.value.routeName, page.url))
}

/**
 * Where „Fahrzeug ändern“ leads from the shell — the header, the vehicle bar, the palette, the vehicle sheets.
 *
 * Everywhere the selector page, except on the RIMIFY-Check: there the question stays on screen and its own selector opens
 * (`aendern=1`, the wheel kept), so the car chosen answers the question instead of opening the listing (CHECK-16).
 */
export function vehicleChangeHref(routeName: string | null | undefined, url: string | null | undefined): string {
    if (routeName !== 'check.index') {
        return '/felgen-suchen'
    }

    const [path = '/rimify-check', query = ''] = (url ?? '/rimify-check').split('?')
    const params = new URLSearchParams(query)

    for (const drop of ['fahrzeug', 'marke', 'modell']) {
        params.delete(drop)
    }

    params.set('aendern', '1')

    return `${path}?${params.toString()}`
}
