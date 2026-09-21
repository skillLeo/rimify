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
 *
 * A diameter can hold several configurations — 8J ET45 and 8,5J ET40 are both "18 Zoll" — and
 * they can carry different verdicts. So a diameter is struck through only when NONE of its
 * configurations is permitted: striking 18" because its first row is not permitted, while another
 * 18" row is, tells the customer something false about their car. The width/ET options inside the
 * chosen diameter are offered separately (`variants`), so every permitted configuration is
 * reachable.
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { ProduktConfig } from '../types/pages'

export interface SizeOption {
    readonly diameter: number
    readonly label: string
    /** What choosing this chip selects: the current choice if it has this diameter, else the best. */
    readonly config: ProduktConfig
    /** No configuration of this diameter is permitted on the chosen vehicle. Shown, disabled. */
    readonly blocked: boolean
    readonly reason: string | null
}

/** One width/ET configuration inside the chosen diameter. */
export interface VariantOption {
    readonly id: number
    /** `8,5J × 18 · ET 40`, formatted on the server by the one German helper (R-10). */
    readonly label: string
    readonly config: ProduktConfig
    readonly blocked: boolean
    readonly reason: string | null
}

export interface Configurator {
    readonly finishId: Ref<number>
    readonly configId: Ref<number | null>
    readonly selected: ComputedRef<ProduktConfig | null>
    readonly sizes: ComputedRef<SizeOption[]>
    /** The width/ET configurations of the selected diameter. Worth showing when there are two or more. */
    readonly variants: ComputedRef<VariantOption[]>
    readonly fromPrice: ComputedRef<string | null>
    selectFinish(id: number): void
    selectSize(option: SizeOption): void
    selectVariant(option: VariantOption): void
}

const FALLBACK_REASON = 'Für dein Fahrzeug nicht freigegeben.'

/** With no vehicle there is no verdict and no claim: every configuration may be bought. */
function sellable(config: ProduktConfig): boolean {
    return config.verdict === null || config.verdict.sellable
}

/** Permitted and in stock first, then permitted, then the rest; cheapest within each. */
function best(configs: ProduktConfig[]): ProduktConfig | null {
    const rank = (c: ProduktConfig): number => (sellable(c) ? (c.inStock ? 0 : 1) : 2)

    return [...configs].sort((a, b) => rank(a) - rank(b) || a.priceCents - b.priceCents)[0] ?? null
}

function reasonFor(configs: ProduktConfig[]): string {
    return configs.find((c) => c.verdict?.reason)?.verdict?.reason ?? FALLBACK_REASON
}

export function useConfigurator(
    configs: () => ProduktConfig[],
    firstFinishId: number
): Configurator {
    const finishId = ref(firstFinishId)
    const configId = ref<number | null>(null)

    const forFinish = computed(() => configs().filter((c) => c.finishId === finishId.value))

    /**
     * The chosen configuration, or the best default: permitted and in stock, cheapest first —
     * never simply the first row, which on a car with a narrow approval would open the page on a
     * disabled chip and a blocked button.
     */
    const selected = computed<ProduktConfig | null>(() => {
        const explicit = forFinish.value.find((c) => c.id === configId.value)

        return explicit ?? best(forFinish.value)
    })

    const sizes = computed<SizeOption[]>(() => {
        const groups = new Map<number, ProduktConfig[]>()

        for (const config of forFinish.value) {
            groups.set(config.diameterIn, [...(groups.get(config.diameterIn) ?? []), config])
        }

        const current = selected.value

        return [...groups.entries()]
            .map(([diameter, group]): SizeOption => {
                const blocked = !group.some(sellable)
                const representative =
                    current !== null && group.includes(current) ? current : (best(group) ?? group[0]!)

                return {
                    diameter,
                    // German decimals: 18,5 not 18.5. Formatted here because the diameter arrives
                    // as a number for sorting and as a label for reading.
                    label: String(diameter).replace('.', ','),
                    config: representative,
                    blocked,
                    reason: blocked ? reasonFor(group) : null,
                }
            })
            .sort((a, b) => a.diameter - b.diameter)
    })

    const variants = computed<VariantOption[]>(() => {
        const current = selected.value

        if (current === null) {
            return []
        }

        return forFinish.value
            .filter((c) => c.diameterIn === current.diameterIn)
            .sort((a, b) => a.widthIn - b.widthIn || a.etMm - b.etMm)
            .map((config) => ({
                id: config.id,
                label: config.sizeLabel,
                config,
                blocked: !sellable(config),
                reason: sellable(config) ? null : reasonFor([config]),
            }))
    })

    const fromPrice = computed(() => {
        const cheapest = [...forFinish.value].sort((a, b) => a.priceCents - b.priceCents)[0]

        return cheapest?.price ?? null
    })

    /**
     * A new colourway keeps the customer's size where it can: the same width and ET if that
     * finish offers them permitted, otherwise the same diameter. Falling back to the default
     * silently swapped a chosen 19" for an 18" — and its price — on a colour change.
     */
    function selectFinish(id: number): void {
        const previous = selected.value
        finishId.value = id
        configId.value = null

        if (previous === null) {
            return
        }

        const candidates = forFinish.value.filter((c) => sellable(c) && c.diameterIn === previous.diameterIn)
        const same = candidates.find((c) => c.widthIn === previous.widthIn && c.etMm === previous.etMm)
        const keep = same ?? best(candidates)

        configId.value = keep?.id ?? null
    }

    function selectSize(option: SizeOption): void {
        if (option.blocked) {
            return
        }

        configId.value = option.config.id
    }

    function selectVariant(option: VariantOption): void {
        if (option.blocked) {
            return
        }

        configId.value = option.config.id
    }

    return {
        finishId,
        configId,
        selected,
        sizes,
        variants,
        fromPrice,
        selectFinish,
        selectSize,
        selectVariant,
    }
}
