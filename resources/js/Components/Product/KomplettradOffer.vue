<script setup lang="ts">
/**
 * The Komplettrad offer on the product page: every tyre the verdict permits on the chosen size,
 * priced per wheel on the server — or the one sentence saying why there is none, always with a
 * way forward. Never an empty panel and never a dead end (R-09 in spirit).
 *
 * Nothing here decides anything. The server chose the tyres (`TyreEligibility`, R-13), priced
 * them (`KomplettradPricer`) and formatted every figure (R-10); this component prints strings and
 * posts an id. The basket checks the combination again on the server whatever was shown (R-11).
 *
 * The refusal code is never rendered — it only picks which routes forward make sense: the
 * selector when the car is missing, the shop's e-mail when a person has to look at it, and the
 * plain Felgen purchase whenever the rim alone is still buyable.
 */

import { Link, useForm } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Ui/Icon.vue'
import TyreLabel from '../Ui/TyreLabel.vue'
import type { KomplettradOfferProp, KomplettradTyreProp, TyreClass } from '../../types/pages'

const props = defineProps<{
    offer: KomplettradOfferProp | null
    /** The configuration the offer belongs to; null while none is selected. */
    wheelConfigId: number | null
    /** From `config('rimify.contact')` — never typed into a component. */
    contactEmail: string
}>()

/* What the server refuses everything else with, should it ever send neither tyres nor a sentence. */
const FALLBACK_REFUSAL = 'Passende Reifen für diese Größe haben wir gerade nicht vorrätig. Die Felge allein kannst du bestellen.'

const form = useForm({
    kind: 'WHEEL' as const,
    wheelConfigId: 0,
    tyreVariantId: 0,
    quantity: 4,
})

const refusal = computed(() => {
    const offer = props.offer

    if (offer === null) {
        return null
    }

    return offer.refusal ?? (offer.tyres.length === 0 ? FALLBACK_REFUSAL : null)
})

/*
 * Which routes forward fit the refusal. A missing car is answered with the selector; a wheel the
 * document forbids is not answered with "buy the rim anyway"; everything else leaves the Felgen
 * purchase open and offers a person to write to.
 */
const forward = computed(() => {
    const code = props.offer?.refusalCode ?? null
    const vehicle = code === 'NO_VEHICLE' || code === 'VERDICT_RESTORED'

    return {
        vehicle,
        contact: code !== 'NO_VEHICLE',
        wheelsOnly: code !== 'VERDICT_NOT_PERMITTED' && code !== 'VERDICT_RESTORED',
    }
})

const mailto = computed(() => `mailto:${props.contactEmail}`)

/* The server's sentence for a refused add, under whichever key it answered with. */
const error = computed(() => form.errors.tyreVariantId ?? form.errors.wheelConfigId ?? null)

const TYRE_CLASSES: readonly string[] = ['A', 'B', 'C', 'D', 'E']
const NOISE_CLASSES: readonly string[] = ['A', 'B', 'C']

function isTyreClass(value: string | null): value is TyreClass {
    return value !== null && TYRE_CLASSES.includes(value)
}

function isNoiseClass(value: string | null): value is 'A' | 'B' | 'C' {
    return value !== null && NOISE_CLASSES.includes(value)
}

interface EuLabel {
    fuel: TyreClass
    wet: TyreClass
    noiseDb: number
    noiseClass: 'A' | 'B' | 'C'
    eprelId: string
    title: string
}

/* A label with a class the regulation does not know is not shown; it is never "corrected". */
function labelOf(tyre: KomplettradTyreProp): EuLabel | null {
    const label = tyre.label

    if (
        label === null ||
        !isTyreClass(label.fuel) ||
        !isTyreClass(label.wetGrip) ||
        label.noiseDb === null ||
        !isNoiseClass(label.noiseClass)
    ) {
        return null
    }

    return {
        fuel: label.fuel,
        wet: label.wetGrip,
        noiseDb: label.noiseDb,
        noiseClass: label.noiseClass,
        eprelId: label.eprelId,
        title: `${tyre.brandName} ${tyre.name} · ${tyre.sizeLabel}`,
    }
}

const cards = computed(() => (props.offer?.tyres ?? []).map((tyre) => ({ tyre, label: labelOf(tyre) })))

function add(tyreId: number): void {
    if (props.wheelConfigId === null || form.processing) {
        return
    }

    form.wheelConfigId = props.wheelConfigId
    form.tyreVariantId = tyreId
    form.post('/warenkorb', { preserveScroll: true })
}
</script>

<template>
    <section v-if="offer" class="kr" aria-labelledby="kr-heading">
        <h2 id="kr-heading" class="t-h2">Komplettrad – Felge mit Reifen, montiert und gewuchtet</h2>
        <p class="t-body kr__lead">
            Wir ziehen den Reifen auf die Felge, wuchten das Rad aus und liefern es fertig montiert.
            Die Farbe der Wuchtgewichte wählst du im Warenkorb.
        </p>

        <!-- The minimum as a sentence, never a bare number pair (§8.1). -->
        <p v-if="offer.minSentence" class="t-small kr__min">{{ offer.minSentence }}</p>

        <!-- One sentence and a way forward: the panel is never empty and never a dead end. -->
        <div v-if="refusal" class="notice kr__refusal">
            <Icon name="info" :size="20" />
            <div>
                <p class="kr__refusal-text">{{ refusal }}</p>
                <p class="kr__routes">
                    <Link v-if="forward.vehicle" href="/felgen-suchen" class="btn btn--secondary btn--sm">
                        Fahrzeug wählen
                    </Link>
                    <a v-if="forward.contact" :href="mailto" class="link kr__mail">Schreib uns</a>
                    <a v-if="forward.wheelsOnly" href="#felgen-kaufen" class="link kr__wheels-only">
                        Nur die Felgen bestellen
                    </a>
                </p>
            </div>
        </div>

        <template v-else>
            <p v-if="error" class="notice notice--bad kr__error" role="alert">
                <Icon name="warning" :size="20" />
                <span>{{ error }}</span>
            </p>

            <ul class="kr__grid" role="list">
                <li v-for="card in cards" :key="card.tyre.id" class="kr-card">
                    <span class="micro">{{ card.tyre.brandName }}</span>
                    <h3 class="kr-card__name">{{ card.tyre.name }}</h3>
                    <p class="kr-card__meta">
                        {{ card.tyre.seasonLabel }} · <span class="data">{{ card.tyre.sizeLabel }}</span>
                    </p>

                    <!-- The EU label, only where the tyre carries a verified EPREL id (ACCURACY D7). -->
                    <TyreLabel v-if="card.label" v-bind="card.label" class="kr-card__label" />

                    <div class="kr-card__price">
                        <p class="price">{{ card.tyre.perWheel }}</p>
                        <p class="price-note">Preis je Rad, inklusive Reifen, Montage und Wuchtgewichten.</p>
                        <p class="price-note">inkl. MwSt., zzgl. Versand</p>
                        <p class="t-small kr-card__set">
                            <span class="tabular">{{ card.tyre.forFour }}</span> für 4 Kompletträder
                        </p>
                        <p v-if="offer.priceOpen" class="t-small quiet kr-card__open">
                            Der Preis für Montage und Auswuchten steht noch nicht fest.
                        </p>
                    </div>

                    <button
                        type="button"
                        class="btn btn--primary btn--block kr-card__add"
                        :disabled="form.processing || wheelConfigId === null"
                        @click="add(card.tyre.id)"
                    >
                        {{ form.processing ? 'Wird hinzugefügt …' : 'Als Komplettrad in den Warenkorb' }}
                    </button>
                </li>
            </ul>

            <p class="kr__fallback">
                <a href="#felgen-kaufen" class="link kr__wheels-only">Nur die Felgen bestellen</a>
            </p>
        </template>
    </section>
</template>

<style scoped>
.kr__lead,
.kr__min {
    max-width: 720px;
    color: var(--ink2);
}

.kr__lead {
    margin-top: var(--space-2);
}

.kr__min {
    margin-top: var(--space-3);
}

.kr__refusal,
.kr__error {
    margin-top: var(--space-4);
}

.kr__refusal-text {
    margin: 0;
}

.kr__routes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-4);
    align-items: center;
    margin: var(--space-3) 0 0;
}

.kr__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--space-4);
    margin: var(--space-4) 0 0;
    padding: 0;
    list-style: none;
}

.kr-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    background: var(--surface);
}

.kr-card__name {
    margin: 0;
    font-size: var(--text-h3);
    font-weight: 700;
}

.kr-card__meta {
    margin: 0;
    color: var(--ink2);
}

.kr-card__label {
    margin-top: var(--space-2);
}

/* The price sits on the card's bottom edge whatever the label above it takes up. */
.kr-card__price {
    margin-top: auto;
    padding-top: var(--space-3);
}

.kr-card__set {
    margin: var(--space-1) 0 0;
    color: var(--ink2);
}

.kr-card__open {
    margin: var(--space-1) 0 0;
}

.kr-card__add {
    margin-top: var(--space-3);
}

.kr__fallback {
    margin: var(--space-4) 0 0;
}
</style>
