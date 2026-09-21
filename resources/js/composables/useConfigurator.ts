/**
 * The product configurator.
 *
 * Two rules, and both are the difference between a shop and a compliance tool:
 *
 * 1. Configuration NARROWS, it never rejects. A size that exists but is not permitted on the
 *    chosen car is shown, disabled, with the reason — hiding it would let the customer believe the
 *    wheel is not made in that size, which is a different and false statement.
 *
 * 2. Price, stock and verdict change in ONE commit. They come from the same config object, so
 *    there is no frame in which the page shows a new price beside an old legal answer. That frame
 *    is short, and it is exactly the kind of thing that ends up in a screenshot.
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { ProduktConfig } from '../types/pages'

export interface SizeOption {
    readonly diameter: number
    readonly label: string
    readonly config: ProduktConfig
    /** Not permitted on the chosen vehicle. Shown and disabled, with `reason` set. */
    readonly blocked: boolean
    readonly reason: string | null
}

export interface Configurator {
    readonly finishId: Ref<number>
    readonly configId: Ref<number | null>
    readonly selected: ComputedRef<ProduktConfig | null>
    readonly sizes: ComputedRef<SizeOption[]>
    readonly fromPrice: ComputedRef<string | null>
    selectFinish(id: number): void
    selectSize(option: SizeOption): void
}

export function useConfigurator(
    configs: () => ProduktConfig[],
    firstFinishId: number
): Configurator {
    const finishId = ref(firstFinishId)
    const configId = ref<number | null>(null)

    const forFinish = computed(() => configs().filter((c) => c.finishId === finishId.value))

    const sizes = computed<SizeOption[]>(() => {
        const seen = new Map<number, SizeOption>()

        for (const config of forFinish.value) {
            if (seen.has(config.diameterIn)) {
                continue
            }

            const verdict = config.verdict
            const blocked = verdict !== null && !verdict.sellable

            seen.set(config.diameterIn, {
                diameter: config.diameterIn,
                // German decimals: 18,5 not 18.5. Formatted here because the diameter arrives as
                // a number for sorting and as a label for reading.
                label: String(config.diameterIn).replace('.', ','),
                config,
                blocked,
                reason: blocked
                    ? (verdict.reason ?? 'Für Ihr Fahrzeug nicht freigegeben.')
                    : null,
            })
        }

        return [...seen.values()].sort((a, b) => a.diameter - b.diameter)
    })

    /**
     * The chosen configuration, or the best default.
     *
     * The default is the cheapest size that is actually permitted — never simply the first, which
     * on a car with a narrow approval would open the page on a disabled chip and a blocked button.
     */
    const selected = computed<ProduktConfig | null>(() => {
        const explicit = forFinish.value.find((c) => c.id === configId.value)

        if (explicit) {
            return explicit
        }

        const sellable = forFinish.value
            .filter((c) => c.verdict === null || c.verdict.sellable)
            .sort((a, b) => a.priceCents - b.priceCents)

        return sellable[0] ?? forFinish.value[0] ?? null
    })

    const fromPrice = computed(() => {
        const cheapest = [...forFinish.value].sort((a, b) => a.priceCents - b.priceCents)[0]

        return cheapest?.price ?? null
    })

    function selectFinish(id: number): void {
        finishId.value = id
        // The chosen size rarely survives a finish change, and carrying a stale id would show the
        // price of a configuration that no longer exists in this colourway.
        configId.value = null
    }

    function selectSize(option: SizeOption): void {
        if (option.blocked) {
            return
        }

        configId.value = option.config.id
    }

    return { finishId, configId, selected, sizes, fromPrice, selectFinish, selectSize }
}
