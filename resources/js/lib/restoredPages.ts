/**
 * A page brought back by Back or Forward is the page as it was left: Inertia restores it from the browser's history, the
 * browser from its back/forward cache — neither asks the server. What it says may have moved on since:
 *
 * - the car's papers or build (the figures entered on another page, D-286), or the car itself where the address names
 *   none: its answers are then another car's;
 * - the catalogue its answers come from: a Gutachten corrected, a wheel published or taken off the shop (the client's
 *   admin item 16, D-294).
 *
 * So a restored page asks the server once, for those two things alone — a partial reload of the same address, which
 * VehicleFromUrl reads like any other, so the basket and the pages without a car in their address follow the car on
 * screen (the client's #8) — and is asked again whole where either moved on.
 */

import { router } from '@inertiajs/vue3'
import { namesVehicle } from './vehicleMemory'

type Props = Record<string, unknown> | undefined

/** What every answer about the car on a page rests on besides its documents: which car, its papers, its build. */
function carOf(props: Props): string | null {
    const vehicle = props?.vehicle as { id?: unknown; papers?: unknown; build?: unknown } | null | undefined

    return vehicle ? JSON.stringify([vehicle.id ?? null, vehicle.papers ?? null, vehicle.build ?? null]) : null
}

/** The catalogue's version the page was computed from (HandleInertiaRequests, CatalogueVersion). */
function catalogueOf(props: Props): string | null {
    return typeof props?.catalogue === 'string' ? props.catalogue : null
}

/**
 * Asks the server whether the page on screen still holds; asks for it again whole where it does not. An admin page asks
 * for its shell too — the bell's count and the rail's are as old as the page, and the answer to this reload is a page
 * from the server, which the bell takes as the freshest count there is (useAlertCount; BELL-02).
 */
export function recheck(page: { url: string; props?: Record<string, unknown> }): void {
    const car = carOf(page.props)
    const catalogue = catalogueOf(page.props)
    const only = [
        ...(namesVehicle(page.url) || car !== null ? ['vehicle'] : []),
        ...(catalogue !== null ? ['catalogue'] : []),
        ...(catalogue !== null && page.props?.admin !== undefined ? ['admin'] : []),
    ]

    if (only.length === 0) {
        return
    }

    router.reload({
        only,
        onSuccess: (fresh) => {
            if ((car !== null && carOf(fresh.props) !== car) || (catalogue !== null && catalogueOf(fresh.props) !== catalogue)) {
                router.reload()
            }
        },
    })
}

let installed = false

export function installRestoredPages(): void {
    if (installed || typeof window === 'undefined') {
        return
    }

    installed = true

    // Set by Back or Forward, used by the navigation that restores the page; any visit of its own clears it — not a
    // link fetched ahead under the pointer while the page comes back.
    let restoring = false

    window.addEventListener('popstate', () => {
        restoring = true
    })

    router.on('before', (event) => {
        if (!event.detail.visit.prefetch) {
            restoring = false
        }
    })

    router.on('navigate', (event) => {
        if (!restoring) {
            return
        }

        restoring = false
        recheck(event.detail.page)
    })

    // The back/forward cache brings the whole page back, script and all, with no navigation at all: the page is the
    // one Inertia keeps in the history entry.
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) {
            return
        }

        const page = (window.history.state as { page?: { url?: unknown; props?: Record<string, unknown> } } | null)?.page

        if (typeof page?.url === 'string') {
            recheck({ url: page.url, props: page.props })
        }
    })
}
