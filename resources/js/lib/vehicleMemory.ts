/**
 * The car stays with the page on screen (the client's #8, the operator's brief „THE 34“).
 *
 * The car lives in the address (`?fahrzeug=0005-Z46-00001`); the cookie is only the memory a page falls back to when
 * its own address names no car. Back and Forward restore a page from the browser's history without asking the server,
 * so after them the memory still names the car of the page just left: the E46's listing on screen, the E90 in the
 * cookie. Two things keep the next step with the car the visitor is looking at:
 *
 * - every visit from a page whose address names a car to another of the car's pages carries that car in its own
 *   address (`vehicleVisitOptions`, Inertia's `visitOptions` default) — the URL wins on the server, whatever the cookie
 *   says, and no request can overtake another;
 * - a page restored that way tells the server once more (`installVehicleMemory`): a partial reload of the same address,
 *   which VehicleFromUrl reads like any other, so the basket and the other pages without a car in their address follow.
 *
 * What a page shows is not touched by either: the answer is computed from the Gutachten on every request.
 */

import type { VisitOptions } from '@inertiajs/core'
import { router } from '@inertiajs/vue3'

export const VEHICLE_PARAM = 'fahrzeug'

/** The pages that answer for one car (VehicleFromUrl::ROUTES): `/`, `/felgen`, `/felgen/{model}`, `/vergleich`, `/rimify-check`. */
const VEHICLE_PAGES = /^\/(?:felgen(?:\/[^/]+)?|vergleich|rimify-check)?\/?$/

/** Whether a page's address names a car. */
export function namesVehicle(url: string): boolean {
    return new URL(url, 'http://localhost').searchParams.has(VEHICLE_PARAM)
}

/**
 * The options of a visit, with the car of the page on screen added where the visit goes to another of the car's pages
 * and names none itself. Only GET: a form never changes the car through its address, and choosing a car is a POST.
 */
export function vehicleVisitOptions(href: string, options: VisitOptions, here: string | null = typeof window === 'undefined' ? null : window.location.href): VisitOptions {
    if (here === null || (options.method ?? 'get') !== 'get') {
        return {}
    }

    const current = new URL(here)
    const car = current.searchParams.get(VEHICLE_PARAM)
    const target = new URL(href, current)
    const data = options.data ?? {}

    if (
        car === null
        || target.origin !== current.origin
        || target.searchParams.has(VEHICLE_PARAM)
        || !VEHICLE_PAGES.test(target.pathname)
        || typeof data !== 'object'
        || data === null
        || data instanceof FormData
        || VEHICLE_PARAM in data
    ) {
        return {}
    }

    return { data: { ...data, [VEHICLE_PARAM]: car } }
}

let installed = false

export function installVehicleMemory(): void {
    if (installed || typeof window === 'undefined') {
        return
    }

    installed = true

    // Set by Back or Forward, used by the navigation that restores the page; any visit of its own clears it.
    let restoring = false

    window.addEventListener('popstate', () => {
        restoring = true
    })

    router.on('before', () => {
        restoring = false
    })

    router.on('navigate', (event) => {
        if (!restoring) {
            return
        }

        restoring = false

        if (namesVehicle(event.detail.page.url)) {
            router.reload({ only: ['vehicle'] })
        }
    })
}
