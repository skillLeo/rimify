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
 * reachable: each is one version of the rim, chosen on its own (the Gutachten rework §8), `versions`
 * those the car may have and `others` the rest — never a swap, and never hidden for good.
 *
 * Where a paper names two versions for the car, one on each axle (the client's fourth change), they are one thing to buy: a set,
 * `setsHere` under each diameter it holds. Such a version has no chip of its own and is never four. `selected` stays the version in
 * view, as the diameter chips show it; `selectedSet` is what is bought.
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { ProduktConfig, ProduktSet } from '../types/pages'

export interface SizeOption {
    readonly diameter: number
    readonly label: string
    /** What choosing this chip selects: the current choice if it has this diameter, else the best. */
    readonly config: ProduktConfig
    /** No configuration of this diameter is permitted on the chosen vehicle. Shown, disabled. */
    readonly blocked: boolean
    /**
     * Not sold, and not refused either (finding 103): the Gutachten approves the wheel for the car, and what cannot be
     * confirmed is the tyre size. Marked grey, never struck through — struck through reads as forbidden — and it can be
     * chosen, so the answer and the way on can be read.
     */
    readonly unconfirmed: boolean
    readonly reason: string | null
    /** Where it is struck: what its versions stand on, each kind once — what the legend may say of it (D-405). */
    readonly standings: readonly VersionStanding[]
}

/**
 * The wheel half approved, the tyre half without an answer: unverified, which is neither forbidden nor unavailable.
 * (A verdict that still waits for a fact of the car is „noch offen“, and is asked for in place — not this.)
 */
export function tyreUnconfirmed(verdict: ProduktConfig['verdict']): boolean {
    return (
        verdict !== null &&
        verdict !== undefined &&
        verdict.status === 'UNKNOWN' &&
        (verdict.wheelStatus === 'PERMITTED' || verdict.wheelStatus === 'CONDITIONAL') &&
        verdict.tyre?.status === 'UNKNOWN' &&
        (verdict.missing ?? []).length === 0
    )
}

/**
 * Why a version is not on offer for the car, in words true for each (D-383, D-387, R-17): a released paper rules the car out; or
 * nothing on record approves it; or a paper names the car and something it needs is still open — then „keine Freigabe“ would say
 * what no record says (D-214). The server's words for the same line: FitmentVerdict::stillOpen().
 */
export type VersionStanding = 'refused' | 'none' | 'open' | 'axle'

const NOTHING_ON_RECORD = ['NO_DOCUMENT', 'ANNEX_MISSING', 'COVERAGE_UNCONFIRMED']

function standingOf(verdict: ProduktConfig['verdict']): VersionStanding {
    if (verdict?.status === 'NOT_PERMITTED') {
        return 'refused'
    }

    return verdict?.reasonCode && !NOTHING_ON_RECORD.includes(verdict.reasonCode) ? 'open' : 'none'
}

/** One version of the rim inside the chosen diameter. */
export interface VariantOption {
    readonly id: number
    /** `Breite 8,5J · ET 40 · Lochkreis 5 × 112`, formatted on the server by the one German helper (R-10). */
    readonly label: string
    readonly config: ProduktConfig
    readonly blocked: boolean
    /** Why it is not on offer, where it is not. */
    readonly standing: VersionStanding | null
    /** Approved with its tyres unconfirmed (finding 103): grey, choosable — as a diameter chip. */
    readonly unconfirmed: boolean
    readonly reason: string | null
}

export interface Configurator {
    readonly finishId: Ref<number>
    readonly configId: Ref<number | null>
    readonly selected: ComputedRef<ProduktConfig | null>
    readonly sizes: ComputedRef<SizeOption[]>
    /** Every version of the selected diameter, narrowest first. */
    readonly variants: ComputedRef<VariantOption[]>
    /** The versions a customer can pick: every one without a car; with one, those a released paper approves. */
    readonly versions: ComputedRef<VariantOption[]>
    /** The versions the car may not have, or that nothing on record approves. Struck through and never a choice. */
    readonly others: ComputedRef<VariantOption[]>
    /** The chosen set, or the one the version in view stands in where it is sold only so. */
    readonly selectedSet: ComputedRef<ProduktSet | null>
    /** The sets of this colour that hold the diameter in view. */
    readonly setsHere: ComputedRef<ProduktSet[]>
    readonly setKey: Ref<string | null>
    readonly fromPrice: ComputedRef<string | null>
    /** The person's version, where the colour on screen does not have it: said on the page, never a swap in silence. */
    readonly colourLacks: Ref<ProduktConfig | null>
    selectFinish(id: number): void
    selectSize(option: SizeOption): void
    selectVariant(option: VariantOption): void
    selectSet(option: ProduktSet): void
}

const FALLBACK_REASON = 'Für dein Fahrzeug nicht freigegeben.'

/**
 * With no vehicle there is no verdict and no claim: every configuration may be bought. A rim that sells alone while
 * its tyres wait for the car's papers (D-289) is a size to buy, not a struck one.
 */
export function sellable(config: ProduktConfig): boolean {
    if (config.onlyInSet === true) {
        return false
    }

    return config.verdict === null || config.verdict.sellable || config.verdict.rimSellable === true
}

/*
 * An answer that waits only for a fact the customer can give — the body style, the drive (verdict.missing) — is not a
 * refusal: its size stays choosable, so the panel can ask the question. Buying stays off until it is answered (canBuy
 * reads `sellable`). Struck through, the size would hide the one question that could free it.
 */
function answerable(config: ProduktConfig): boolean {
    return config.onlyInSet !== true && config.verdict !== null && !config.verdict.sellable && config.verdict.status === 'UNKNOWN' && (config.verdict.missing ?? []).length > 0
}

function choosable(config: ProduktConfig): boolean {
    return sellable(config) || answerable(config)
}

/*
 * The order of OpeningSize on the server: sold and available, then sold; of the rest its tyres open, a question the customer can
 * answer, any other open answer, the refused last. The cheapest within each, the oldest row on a tie. So a diameter never leads
 * to a refused version beside one that can still be answered.
 */
function rank(config: ProduktConfig): number {
    if (config.onlyInSet === true) {
        return 6
    }

    if (sellable(config)) {
        return config.inStock ? 0 : 1
    }

    if (tyreUnconfirmed(config.verdict)) {
        return 2
    }

    if (answerable(config)) {
        return 3
    }

    return config.verdict?.status === 'UNKNOWN' ? 4 : 5
}

function best(configs: ProduktConfig[]): ProduktConfig | null {
    return [...configs].sort((a, b) => rank(a) - rank(b) || a.priceCents - b.priceCents || a.id - b.id)[0] ?? null
}

/* One version across colours: everything that makes it that version, and nothing a colour has to say (the rework §8). */
function sameVersion(a: ProduktConfig, b: ProduktConfig): boolean {
    return a.diameterIn === b.diameterIn && a.widthIn === b.widthIn && a.etMm === b.etMm && a.boltPattern === b.boltPattern && a.centreBore === b.centreBore
}

function reasonFor(configs: ProduktConfig[]): string {
    return configs.find((c) => c.verdict?.reason)?.verdict?.reason ?? FALLBACK_REASON
}

export function useConfigurator(
    configs: () => ProduktConfig[],
    firstFinishId: number,
    /** A size named in the link (`groesse`, the RIMIFY-Check's „Alles zur Felge“): opened on where it is of this finish. */
    initialConfigId: number | null = null,
    /** Finish id → the size the page opens on, picked on the server by the rule the cards follow (OpeningSize, M-6). */
    openOn: () => Record<string, number | null> = () => ({}),
    /** The sets of two versions the car's papers name. */
    wheelSets: () => ProduktSet[] = () => [],
    /** A set named in the link (`satz`). */
    initialSetKey: string | null = null
): Configurator {
    const finishId = ref(firstFinishId)
    const configId = ref<number | null>(initialConfigId)
    const setKey = ref<string | null>(initialSetKey)
    /* The version the person is after: what they last chose, or what was on screen when they first looked at another colour. */
    let wanted: ProduktConfig | null = null
    const colourLacks = ref<ProduktConfig | null>(null)

    const forFinish = computed(() => configs().filter((c) => c.finishId === finishId.value))

    /**
     * The chosen configuration, or the size the server opens this finish on — the rule its card follows too, so the card
     * and the page give one answer (OpeningSize, M-6) —, or, without one, the best default: permitted and in stock,
     * cheapest first — never simply the first row, which on a car with a narrow approval would open the page on a
     * disabled chip and a blocked button.
     */
    const selected = computed<ProduktConfig | null>(() => {
        const explicit = forFinish.value.find((c) => c.id === configId.value)
        const opening = openOn()[String(finishId.value)] ?? null

        return explicit ?? forFinish.value.find((c) => c.id === opening) ?? best(forFinish.value)
    })

    const setsOfFinish = computed(() => wheelSets().filter((set) => set.finishId === finishId.value))
    const standsInSet = (config: ProduktConfig): boolean => setsOfFinish.value.some((set) => set.frontId === config.id || set.rearId === config.id)

    const selectedSet = computed<ProduktSet | null>(() => {
        const chosen = setsOfFinish.value.find((set) => set.key === setKey.value)

        if (chosen !== undefined) {
            return chosen
        }

        const current = selected.value

        return current?.onlyInSet === true ? (setsOfFinish.value.find((set) => set.frontId === current.id || set.rearId === current.id) ?? null) : null
    })

    const setsHere = computed(() => {
        const diameter = selected.value?.diameterIn

        return setsOfFinish.value.filter((set) => diameter !== undefined && set.diameters.includes(diameter))
    })

    const sizes = computed<SizeOption[]>(() => {
        const groups = new Map<number, ProduktConfig[]>()

        for (const config of forFinish.value) {
            groups.set(config.diameterIn, [...(groups.get(config.diameterIn) ?? []), config])
        }

        const current = selected.value

        return [...groups.entries()]
            .map(([diameter, group]): SizeOption => {
                const inSet = setsOfFinish.value.some((set) => set.diameters.includes(diameter))
                const unconfirmed = !inSet && !group.some(choosable) && group.some((c) => c.onlyInSet !== true && tyreUnconfirmed(c.verdict))
                const blocked = !inSet && !group.some(choosable) && !unconfirmed
                const representative = current !== null && group.includes(current) ? current : best(group)!

                return {
                    diameter,
                    // German decimals: 18,5 not 18.5. Formatted here because the diameter arrives
                    // as a number for sorting and as a label for reading.
                    label: String(diameter).replace('.', ','),
                    config: representative,
                    blocked,
                    unconfirmed,
                    reason: blocked || unconfirmed ? reasonFor(group) : null,
                    standings: blocked ? [...new Set(group.map((c) => (c.onlyInSet === true ? 'axle' : standingOf(c.verdict))))] : [],
                }
            })
            .sort((a, b) => a.diameter - b.diameter)
    })

    const variants = computed<VariantOption[]>(() => {
        const current = selected.value

        if (current === null) {
            return []
        }

        // A version sold only within a set has no chip of its own: the set's chip stands for it.
        const row = forFinish.value.filter((c) => c.diameterIn === current.diameterIn && !(c.onlyInSet === true && standsInSet(c)))

        return [...row]
            .sort((a, b) => a.widthIn - b.widthIn || a.etMm - b.etMm || a.versionLabel.localeCompare(b.versionLabel, 'de', { numeric: true }))
            .map((config) => {
                const unconfirmed = config.onlyInSet !== true && !choosable(config) && tyreUnconfirmed(config.verdict)
                const blocked = !choosable(config) && !unconfirmed
                // Width, ET and bolt pattern tell versions apart; where they do not, the bore has to.
                const twin = row.some((other) => other.id !== config.id && other.versionLabel === config.versionLabel)

                return {
                    id: config.id,
                    label: twin ? `${config.versionLabel} · Mittenloch\u00A0${config.centreBore}` : config.versionLabel,
                    config,
                    blocked,
                    standing: blocked ? (config.onlyInSet === true ? 'axle' : standingOf(config.verdict)) : null,
                    unconfirmed,
                    reason: blocked || unconfirmed ? reasonFor([config]) : null,
                }
            })
    })

    const versions = computed(() => variants.value.filter((v) => !v.blocked))
    const others = computed(() => variants.value.filter((v) => v.blocked))

    const fromPrice = computed(() => {
        const cheapest = [...forFinish.value].sort((a, b) => a.priceCents - b.priceCents)[0]

        return cheapest?.price ?? null
    })

    /**
     * Another colour keeps the person's version: all of it, whatever this colour's answer for the car — struck there, it stays
     * and says so, never a swap in silence (the rework §8). Where the colour does not make it, the page says so and shows the
     * nearest of that diameter or the colour's opening size; on the way back the person's version is there again. Pressing
     * the colour already on changes nothing.
     */
    function selectFinish(id: number): void {
        if (id === finishId.value) {
            return
        }

        wanted ??= selected.value

        const setBefore = selectedSet.value
        const versionOf = (id: number): ProduktConfig | undefined => configs().find((c) => c.id === id)

        finishId.value = id
        configId.value = null
        colourLacks.value = null
        setKey.value = null

        // A set is two versions: in the other colour, the same two where it has them as a set.
        if (setBefore !== null) {
            const front = versionOf(setBefore.frontId)
            const rear = versionOf(setBefore.rearId)
            const same = setsOfFinish.value.find((set) => {
                const f = versionOf(set.frontId)
                const r = versionOf(set.rearId)

                return f !== undefined && r !== undefined && front !== undefined && rear !== undefined && sameVersion(f, front) && sameVersion(r, rear)
            })

            setKey.value = same?.key ?? null
        }

        const version = wanted

        if (version === null) {
            return
        }

        const same = forFinish.value.find((c) => sameVersion(c, version))

        if (same !== undefined) {
            configId.value = same.id

            return
        }

        // Sold, waiting for a fact of the car, or approved with its tyres open (D-286): never a jump for want of the papers.
        const nearest = best(forFinish.value.filter((c) => c.diameterIn === version.diameterIn && (choosable(c) || tyreUnconfirmed(c.verdict))))

        colourLacks.value = version
        configId.value = nearest?.id ?? null
    }

    function choose(chosen: ProduktConfig): void {
        wanted = chosen
        colourLacks.value = null
        configId.value = chosen.id
        setKey.value = null
    }

    function selectSize(option: SizeOption): void {
        if (option.blocked) {
            return
        }

        if (option.config.onlyInSet !== true) {
            choose(option.config)

            return
        }

        // A diameter sold only within a set: the set in view stays where it holds this diameter, or the first that does.
        const current = selectedSet.value
        const set = current !== null && current.diameters.includes(option.diameter) ? current : setsOfFinish.value.find((item) => item.diameters.includes(option.diameter))

        wanted = option.config
        colourLacks.value = null
        configId.value = option.config.id
        setKey.value = set?.key ?? null
    }

    function selectSet(option: ProduktSet): void {
        const current = selected.value
        const inView = current !== null && (current.id === option.frontId || current.id === option.rearId) ? current : configs().find((c) => c.id === (current?.diameterIn === option.diameters[1] ? option.rearId : option.frontId))

        colourLacks.value = null
        wanted = inView ?? wanted
        configId.value = inView?.id ?? option.frontId
        setKey.value = option.key
    }

    function selectVariant(option: VariantOption): void {
        if (!option.blocked) {
            choose(option.config)
        }
    }

    return {
        finishId,
        configId,
        selected,
        sizes,
        variants,
        versions,
        others,
        selectedSet,
        setsHere,
        setKey,
        fromPrice,
        colourLacks,
        selectFinish,
        selectSize,
        selectVariant,
        selectSet,
    }
}
