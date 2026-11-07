import { router, usePage } from '@inertiajs/vue3'
import { computed, type ComputedRef } from 'vue'
import { useShared } from '../composables/useShared'

/* The pages a car is chosen for: the visitor comes back to them, with the version and the step (`zurueck`, ShopPath). */
const COMES_BACK = ['felgen.show', 'komplettrad.show']

/** The address without its car — the next one goes in on the way back (D-116) — and without a fragment, which is no path (ShopPath). */
function withoutCar(url: string | null | undefined): string {
    const address = new URL(url ?? '/', 'http://localhost')

    address.searchParams.delete('fahrzeug')

    return address.pathname + address.search
}

/** „Fahrzeug wählen“ from the shell, with no car yet: on a page a car is chosen for, the way back to it; else the selector. */
export function useVehicleChooseHref(): ComputedRef<string> {
    const shared = useShared()
    const page = usePage()

    return computed(() => (COMES_BACK.includes(shared.value.routeName ?? '') ? vehicleChangeHref(shared.value.routeName, page.url) : '/felgen-suchen'))
}

/** The shell's „Fahrzeug ändern“ for the page on screen. */
export function useVehicleChangeHref(): ComputedRef<string> {
    const shared = useShared()
    const page = usePage()

    return computed(() => vehicleChangeHref(shared.value.routeName, page.url))
}

/**
 * „Fahrzeug entfernen“: on a page the car was chosen for the visitor stays, without it, and the page answers for no car; elsewhere
 * the selector asks for the next.
 */
export function useRemoveVehicle(): () => void {
    const shared = useShared()
    const page = usePage()

    return () => {
        const stays = COMES_BACK.includes(shared.value.routeName ?? '')

        router.delete('/fahrzeug', { preserveScroll: true, ...(stays ? { data: { zurueck: withoutCar(page.url) } } : {}) })
    }
}

/**
 * Where „Fahrzeug ändern“ leads from the shell — the header, the vehicle bar, the palette, the vehicle sheets.
 *
 * The selector page; on the product page and the Komplettrad's steps with this page as the way back, so the car chosen answers for
 * the wheel and the version on screen instead of opening the listing. On the RIMIFY-Check the question stays on screen and its own
 * selector opens (`aendern=1`, the wheel kept), so the car chosen answers the question (CHECK-16).
 */
export function vehicleChangeHref(routeName: string | null | undefined, url: string | null | undefined): string {
    if (COMES_BACK.includes(routeName ?? '')) {
        return `/felgen-suchen?zurueck=${encodeURIComponent(withoutCar(url))}`
    }

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
