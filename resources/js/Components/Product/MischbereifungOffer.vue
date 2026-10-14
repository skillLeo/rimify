<script setup lang="ts">
/**
 * Mischbereifung on the product page (#20, D-105): the front/rear pairs the released Gutachten's own table lists for
 * the chosen car on this rim, each with the tyre sets that meet both axles — or the one sentence saying why there are
 * none. Shown only where the document prints such a table; elsewhere the server sends null and nothing renders.
 *
 * Nothing here decides anything: the pairs, the sets, the per-axle minimum and every price come from the server
 * (`TyreEligibility`, `KomplettradPricer`, `LinePrice`), and the basket asks the engine again on the click (R-11).
 * The document's own conditions are quoted, never paraphrased: they are what the customer carries in the car.
 */

import { useForm } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import Icon from '../Ui/Icon.vue'
import { usePriceTerms } from '../../composables/usePriceTerms'
import type { MischbereifungProp, MischbereifungSetProp } from '../../types/pages'

const props = withDefaults(
    defineProps<{
        offer: MischbereifungProp
        wheelConfigId: number | null
        /** The Wuchtgewichte colour and the RDKS answer picked in the Komplettrad above (#15): a mixed set takes them too. */
        weightColourId?: number | null
        rdks?: 'ja' | 'nein' | null
    }>(),
    { weightColourId: null, rdks: null }
)

/* „inkl. MwSt., zzgl. Versandkosten“ — or the Kleinunternehmer's line — as every price on the site says it. */
const terms = usePriceTerms()

const chosenKey = ref<string | null>(props.offer.pairs[0]?.key ?? null)

/* A size change brings other pairs: the first of them, never a key that no longer exists. */
watch(
    () => props.offer.pairs.map((pair) => pair.key).join(','),
    () => {
        if (!props.offer.pairs.some((pair) => pair.key === chosenKey.value)) {
            chosenKey.value = props.offer.pairs[0]?.key ?? null
        }
    },
)

const chosen = computed(() => props.offer.pairs.find((pair) => pair.key === chosenKey.value) ?? null)

const form = useForm({
    kind: 'WHEEL' as const,
    wheelConfigId: 0,
    tyreVariantId: 0,
    rearTyreVariantId: 0,
    weightColourId: null as number | null,
    rdks: null as 'ja' | 'nein' | null,
    quantity: 2,
})

const error = computed(() => form.errors.tyreVariantId ?? form.errors.rearTyreVariantId ?? form.errors.wheelConfigId ?? null)

/* The figures for the colour picked above — what the basket charges (PDP-07); the default colour's without one. */
function priceOf(set: MischbereifungSetProp): Pick<MischbereifungSetProp, 'forFour' | 'perWheelFront' | 'perWheelRear'> {
    return set.prices?.find((price) => price.colourId === props.weightColourId) ?? set
}

/* The card whose button was pressed: only it says it is busy, the others keep their label. */
const pressed = ref<string | null>(null)

function add(key: string, frontId: number, rearId: number): void {
    if (props.wheelConfigId === null || form.processing) {
        return
    }

    pressed.value = key
    form.wheelConfigId = props.wheelConfigId
    form.tyreVariantId = frontId
    form.rearTyreVariantId = rearId
    form.weightColourId = props.weightColourId
    form.rdks = props.rdks
    form.quantity = props.offer.perAxle
    form.post('/warenkorb', { preserveScroll: true })
}
</script>

<template>
    <section class="mix" aria-labelledby="mix-heading">
        <h2 id="mix-heading" class="t-h3">Mischbereifung – vorne und hinten verschiedene Reifen</h2>
        <p class="mix__lead">
            Nur die Kombinationen, die das Gutachten für dein Fahrzeug nennt: {{ offer.perAxle }} Kompletträder
            für die Vorderachse, {{ offer.perAxle }} für die Hinterachse – montiert und gewuchtet.
        </p>

        <div v-if="offer.refusal" class="notice mix__notice">
            <Icon name="info" :size="20" />
            <p class="mix__notice-text">{{ offer.refusal }}</p>
        </div>

        <template v-else>
            <fieldset v-if="offer.pairs.length > 1" class="mix__pairs">
                <legend class="micro">Kombination aus dem Gutachten</legend>
                <div class="chip-row">
                    <button
                        v-for="pair in offer.pairs"
                        :key="pair.key"
                        type="button"
                        class="chip"
                        :aria-pressed="pair.key === chosenKey"
                        @click="chosenKey = pair.key"
                    >
                        vorne {{ pair.front }} · hinten {{ pair.rear }}
                    </button>
                </div>
            </fieldset>

            <template v-if="chosen">
                <p class="mix__pair">
                    <span class="data">vorne {{ chosen.front }}</span>
                    <span aria-hidden="true">·</span>
                    <span class="data">hinten {{ chosen.rear }}</span>
                    <span class="mix__source">
                        Kombination Nr.&nbsp;{{ chosen.number }}<template v-if="offer.sourcePage"> im Gutachten, Seite&nbsp;{{ offer.sourcePage }}</template>
                    </span>
                </p>
                <p class="mix__min">{{ chosen.minSentence }}</p>

                <p v-if="error" class="notice notice--bad mix__error" role="alert">
                    <Icon name="warning" :size="20" />
                    <span>{{ error }}</span>
                </p>

                <ul v-if="chosen.sets.length > 0" class="mix__grid" role="list">
                    <li v-for="set in chosen.sets" :key="set.key" class="mix-card">
                        <span class="micro">{{ set.brandName }}</span>
                        <h3 class="mix-card__name">{{ set.name }}</h3>
                        <p class="mix-card__meta">{{ set.seasonLabel }}</p>
                        <dl class="mix-card__axles">
                            <div>
                                <dt>Vorderachse</dt>
                                <dd><span class="tabular">{{ offer.perAxle }} ×</span> <span class="data">{{ set.frontLabel }}</span></dd>
                            </div>
                            <div>
                                <dt>Hinterachse</dt>
                                <dd><span class="tabular">{{ offer.perAxle }} ×</span> <span class="data">{{ set.rearLabel }}</span></dd>
                            </div>
                        </dl>
                        <div class="mix-card__price">
                            <p class="price">{{ priceOf(set).forFour }}</p>
                            <p class="price-note">
                                für {{ offer.perAxle }} + {{ offer.perAxle }} Kompletträder ·
                                pro Rad vorne {{ priceOf(set).perWheelFront }}, hinten {{ priceOf(set).perWheelRear }}
                            </p>
                            <!-- Each set is its own purchase, with its own button: its price carries the PAngV line. -->
                            <p class="price-legal">{{ terms.note }}</p>
                            <p v-if="offer.priceOpen" class="price-note">Ohne Montage und Auswuchten – der Preis dafür steht noch nicht fest.</p>
                        </div>
                        <button
                            type="button"
                            class="btn btn--primary btn--block mix-card__add"
                            :disabled="wheelConfigId === null"
                            :aria-busy="form.processing && pressed === set.key ? 'true' : undefined"
                            @click="add(set.key, set.frontTyreId, set.rearTyreId)"
                        >
                            {{ form.processing && pressed === set.key ? 'Wird hinzugefügt …' : 'Als Mischbereifung in den Warenkorb' }}
                        </button>
                    </li>
                </ul>
                <p v-else class="notice mix__notice">
                    <Icon name="info" :size="20" />
                    <span>Reifen für diese Kombination haben wir gerade nicht vorrätig. Die Felge allein kannst du bestellen.</span>
                </p>
            </template>

            <!-- The table's own conditions, quoted: what the customer must keep in the car. -->
            <figure v-if="offer.rules" class="mix__rules">
                <figcaption class="micro">Dazu verlangt das Gutachten<template v-if="offer.sourcePage"> (Seite&nbsp;{{ offer.sourcePage }})</template></figcaption>
                <blockquote class="mix__quote">{{ offer.rules }}</blockquote>
            </figure>
        </template>
    </section>
</template>

<style scoped>
.mix {
    display: grid;
    gap: var(--sp-16);
}

.mix__lead,
.mix__min {
    max-width: 72ch;
    margin: 0;
    color: var(--c-ink-2);
}

.mix__min {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.mix__notice-text {
    margin: 0;
}

.mix__pairs {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    border: 0;
}

.mix__pair {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-4) var(--sp-8);
    margin: 0;
    font-weight: 600;
}

.mix__source {
    color: var(--c-ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
}

.mix__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: var(--sp-16);
    margin: 0;
    padding: 0;
    list-style: none;
}

.mix-card {
    display: flex;
    flex-direction: column;
    gap: var(--sp-8);
    padding: var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
    background: var(--c-surface);
}

.mix-card__name {
    margin: 0;
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
}

.mix-card__meta {
    margin: 0;
    color: var(--c-ink-2);
}

.mix-card__axles {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
}

.mix-card__axles > div {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-12);
}

.mix-card__axles dt {
    color: var(--c-ink-2);
}

.mix-card__axles dd {
    margin: 0;
    text-align: right;
}

/* The price sits on the card's bottom edge whatever the axles above it take up. */
.mix-card__price {
    margin-top: auto;
    padding-top: var(--sp-12);
}

.mix-card__add {
    margin-top: var(--sp-12);
}

.mix__rules {
    display: grid;
    gap: var(--sp-4);
    max-width: 72ch;
    margin: 0;
    padding: var(--sp-12) var(--sp-16);
    border-left: 2px solid var(--c-line-2);
    background: var(--c-band);
}

.mix__quote {
    margin: 0;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}
</style>
