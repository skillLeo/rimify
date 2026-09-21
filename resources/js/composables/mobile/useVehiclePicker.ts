/**
 * The homepage selector's state on a phone: two routes to one vehicle id.
 *
 *   guided   Marke → Modell → Fahrzeug, each step a fetch of the next list
 *   keys     HSN + TSN, one fetch that answers with one vehicle, several, or none
 *
 * Both end in the same place — the live count for the vehicle — and both fail closed: a list
 * that cannot be loaded is reported as such, a count that cannot be loaded leaves the button
 * honest ("Passende Felgen anzeigen"), and several vehicles behind one key pair are shown, never
 * guessed (R-01). Every request aborts the one before it, and a late answer is dropped.
 *
 * Nothing here touches `window` until a watcher fires, so the server renders the resting state.
 */

import { computed, ref, watch, type Ref } from 'vue'
import type { FitmentCountResponse, ModelsResponse, VariantsResponse } from '../../types/mobile'

export type PickerRoute = 'guided' | 'keys'

export interface VariantRow {
    id: number
    variant: string
    buildWindow: string
    powerPs: number | null
    needsReview: boolean
}

export type CountState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'failed' }
    | { status: 'ambiguous'; rows: { id: number; label: string }[] }
    | { status: 'not_found' }
    | { status: 'ready'; count: number; vehicle: { id: number; label: string } }

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal })

    if (!response.ok) {
        throw new Error(String(response.status))
    }

    return (await response.json()) as T
}

/** A request slot: starting a new one aborts the last and outranks any late answer. */
function slot() {
    let controller: AbortController | undefined
    let sequence = 0

    return {
        async run<T>(url: string, apply: (data: T) => void, fail: () => void): Promise<void> {
            controller?.abort()
            controller = new AbortController()
            const mine = ++sequence

            try {
                const data = await fetchJson<T>(url, controller.signal)

                if (mine === sequence) {
                    apply(data)
                }
            } catch (error) {
                if ((error as { name?: string }).name !== 'AbortError' && mine === sequence) {
                    fail()
                }
            }
        },
        cancel(): void {
            controller?.abort()
            sequence++
        },
    }
}

export const HSN_LENGTH = 4
export const TSN_LENGTH = 3

export function useVehiclePicker() {
    const route: Ref<PickerRoute> = ref('guided')

    /* ── Guided ─────────────────────────────────────────────────────────────── */

    const make = ref('')
    const model = ref('')
    const variantId = ref<number | null>(null)

    const models = ref<{ model: string; variants: number }[]>([])
    const variants = ref<VariantRow[]>([])
    const modelsLoading = ref(false)
    const variantsLoading = ref(false)
    const modelsFailed = ref(false)
    const variantsFailed = ref(false)

    const modelsSlot = slot()
    const variantsSlot = slot()
    const countSlot = slot()

    const count = ref<CountState>({ status: 'idle' })

    watch(make, (value) => {
        model.value = ''
        variantId.value = null
        models.value = []
        variants.value = []
        modelsFailed.value = false
        count.value = { status: 'idle' }
        variantsSlot.cancel()
        countSlot.cancel()

        if (value === '') {
            modelsSlot.cancel()
            modelsLoading.value = false

            return
        }

        modelsLoading.value = true
        void modelsSlot.run<ModelsResponse>(
            `/api/v1/vehicles/models?marke=${encodeURIComponent(value)}`,
            (data) => {
                models.value = data.models
                modelsLoading.value = false
            },
            () => {
                modelsFailed.value = true
                modelsLoading.value = false
            }
        )
    })

    watch(model, (value) => {
        variantId.value = null
        variants.value = []
        variantsFailed.value = false
        count.value = { status: 'idle' }
        countSlot.cancel()

        if (value === '') {
            variantsSlot.cancel()
            variantsLoading.value = false

            return
        }

        variantsLoading.value = true
        void variantsSlot.run<VariantsResponse>(
            `/api/v1/vehicles/variants?marke=${encodeURIComponent(make.value)}&modell=${encodeURIComponent(value)}`,
            (data) => {
                variants.value = data.variants
                variantsLoading.value = false
            },
            () => {
                variantsFailed.value = true
                variantsLoading.value = false
            }
        )
    })

    watch(variantId, (id) => {
        if (id === null) {
            countSlot.cancel()
            count.value = { status: 'idle' }

            return
        }

        loadCount(`/api/v1/fitment/count?fahrzeug=${id}`)
    })

    /* ── Keys ───────────────────────────────────────────────────────────────── */

    const hsn = ref('')
    const tsn = ref('')

    const keysComplete = computed(() => hsn.value.length === HSN_LENGTH && tsn.value.length === TSN_LENGTH)

    watch([hsn, tsn], () => {
        if (route.value !== 'keys') {
            return
        }

        if (!keysComplete.value) {
            countSlot.cancel()
            count.value = { status: 'idle' }

            return
        }

        loadCount(`/api/v1/fitment/count?hsn=${encodeURIComponent(hsn.value)}&tsn=${encodeURIComponent(tsn.value)}`)
    })

    watch(route, () => {
        countSlot.cancel()
        count.value = { status: 'idle' }
    })

    function loadCount(url: string): void {
        count.value = { status: 'loading' }
        void countSlot.run<FitmentCountResponse>(
            url,
            (data) => {
                if (data.ambiguous.length > 0) {
                    count.value = { status: 'ambiguous', rows: data.ambiguous }
                } else if (data.vehicle === null) {
                    count.value = { status: 'not_found' }
                } else {
                    count.value = { status: 'ready', count: data.count, vehicle: data.vehicle }
                }
            },
            () => {
                count.value = { status: 'failed' }
            }
        )
    }

    /** Chosen from the chooser (R-01): from now on the count is that vehicle's. */
    function resolveAmbiguity(id: number): void {
        loadCount(`/api/v1/fitment/count?fahrzeug=${id}`)
    }

    /** The vehicle id the primary button submits, when the route has arrived at exactly one. */
    const chosenId = computed<number | null>(() => {
        if (count.value.status === 'ready') {
            return count.value.vehicle.id
        }

        return route.value === 'guided' ? variantId.value : null
    })

    return {
        route,
        make,
        model,
        variantId,
        models,
        variants,
        modelsLoading,
        variantsLoading,
        modelsFailed,
        variantsFailed,
        hsn,
        tsn,
        keysComplete,
        count,
        chosenId,
        resolveAmbiguity,
    }
}

/** Four digits; pasted text may carry spaces. */
export function cleanHsn(raw: string): string {
    return raw.replace(/\s+/g, '').toUpperCase().slice(0, HSN_LENGTH)
}

/** Three characters, capitals; the first three of field 2.2 when more were pasted. */
export function cleanTsn(raw: string): string {
    return raw.replace(/\s+/g, '').toUpperCase().slice(0, TSN_LENGTH)
}
