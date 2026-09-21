/**
 * F1 — the live count under the vehicle selector.
 *
 * The same pattern as the search: a request waits 250 ms for the customer to settle, a request
 * still in flight is aborted when the next one starts, and an answer that arrives out of order is
 * dropped. The number on screen is always the answer to the vehicle in the form now — a count for
 * the previous car is worse than no count, because the button repeats it.
 *
 * By key numbers the server follows the resolver's rules (R-01): one match carries that car's
 * count and its label, several matches come back as `ambiguous` and no count, none is zero with
 * `vehicle: null`. Nothing here decides which car it is.
 */

import { onBeforeUnmount, ref, type Ref } from 'vue'

export interface CountVehicle {
    id: number
    label: string
    short: string
}

export interface FitmentCountResult {
    count: number
    permitted: number
    conditional: number
    vehicle: CountVehicle | null
    ambiguous: CountVehicle[]
}

export type FitmentCountQuery = { fahrzeug: number } | { hsn: string; tsn: string }

export interface FitmentCount {
    readonly result: Ref<FitmentCountResult | null>
    readonly loading: Ref<boolean>
    readonly failed: Ref<boolean>
    run(query: FitmentCountQuery): void
    clear(): void
}

export const COUNT_DEBOUNCE_MS = 250

function toParams(query: FitmentCountQuery): URLSearchParams {
    const params = new URLSearchParams()

    if ('fahrzeug' in query) {
        params.set('fahrzeug', String(query.fahrzeug))
    } else {
        params.set('hsn', query.hsn)
        params.set('tsn', query.tsn)
    }

    return params
}

export function useFitmentCount(): FitmentCount {
    const result = ref<FitmentCountResult | null>(null)
    const loading = ref(false)
    const failed = ref(false)

    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined
    let sequence = 0

    function clear(): void {
        if (timer !== undefined) {
            clearTimeout(timer)
            timer = undefined
        }

        controller?.abort()
        controller = undefined
        // A cleared form must never show the previous car's number, so the sequence moves on and a
        // late answer to the old request is dropped.
        sequence++
        result.value = null
        loading.value = false
        failed.value = false
    }

    async function fetchNow(query: FitmentCountQuery): Promise<void> {
        controller?.abort()
        controller = new AbortController()
        const mine = ++sequence
        loading.value = true
        failed.value = false

        try {
            const response = await fetch(`/api/v1/fitment/count?${toParams(query).toString()}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
                signal: controller.signal,
            })

            if (mine !== sequence) {
                return
            }

            if (!response.ok) {
                failed.value = true
                result.value = null

                return
            }

            result.value = (await response.json()) as FitmentCountResult
        } catch (error) {
            if ((error as { name?: string }).name === 'AbortError' || mine !== sequence) {
                return
            }

            failed.value = true
            result.value = null
        } finally {
            if (mine === sequence) {
                loading.value = false
            }
        }
    }

    function run(query: FitmentCountQuery): void {
        if (timer !== undefined) {
            clearTimeout(timer)
        }

        // The skeleton shows at once; the request waits for the customer to settle.
        loading.value = true
        failed.value = false
        result.value = null

        timer = setTimeout(() => {
            timer = undefined
            void fetchNow(query)
        }, COUNT_DEBOUNCE_MS)
    }

    onBeforeUnmount(clear)

    return { result, loading, failed, run, clear }
}
