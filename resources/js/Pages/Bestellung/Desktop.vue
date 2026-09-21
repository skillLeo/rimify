<script setup lang="ts">
/**
 * The order confirmation.
 *
 * The verdict shown per line is the FROZEN one, not a fresh computation. Eleven months from now a
 * customer whose workshop refused the wheels will open this page, and it has to say what they were
 * told on the day — including which revision of the document that answer came from.
 */

import { Head, Link } from '@inertiajs/vue3'
import Svg from '../../Components/Art/Svg.vue'
import { thankYouCheckSVG } from '../../art'
import type { BestellungProps } from '../../types/pages'

defineProps<BestellungProps>()

const tick = thankYouCheckSVG(56)

const VERDICT_LABEL: Record<string, string> = {
    PERMITTED: 'Freigegeben',
    CONDITIONAL: 'Freigegeben mit Auflagen',
    NOT_PERMITTED: 'Nicht freigegeben',
    UNKNOWN: 'Keine Freigabe hinterlegt',
}

const VERDICT_CLASS: Record<string, string> = {
    PERMITTED: 'tag--ok',
    CONDITIONAL: 'tag--warn',
    NOT_PERMITTED: 'tag--danger',
    UNKNOWN: 'tag--unknown',
}
</script>

<template>
    <Head :title="`Bestellung ${order.number}`" />

    <section class="section">
        <div class="wrap ord">
            <div class="ord__head">
                <Svg :markup="tick" />
                <h1 class="t-h2">Danke für deine Bestellung.</h1>
                <p class="t-body">
                    Deine Bestellnummer ist <strong class="data">{{ order.number }}</strong
                    >. Eine Bestätigung ist unterwegs.
                </p>
            </div>

            <div class="split ord__split">
                <div class="card">
                    <h2 class="t-h3">Positionen</h2>

                    <table class="table">
                        <thead>
                            <tr>
                                <th scope="col">Artikel</th>
                                <th scope="col">Freigabe</th>
                                <th scope="col" class="num">Menge</th>
                                <th scope="col" class="num">Summe</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="line in lines" :key="line.id">
                                <td>
                                    <span class="micro">{{ line.kindLabel }}</span>
                                    <p class="ord__label">{{ line.label }}</p>
                                </td>
                                <td>
                                    <span
                                        v-if="line.verdict"
                                        class="tag"
                                        :class="VERDICT_CLASS[line.verdict.status]"
                                    >
                                        {{ VERDICT_LABEL[line.verdict.status] }}
                                    </span>
                                    <p v-if="line.verdict" class="data ord__rev">
                                        Fassung {{ line.verdict.documentRevision }}
                                    </p>
                                    <span v-if="!line.verdict" class="quiet">—</span>
                                </td>
                                <td class="num tabular">{{ line.quantity }}</td>
                                <td class="num"><strong class="tabular">{{ line.lineTotal }}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <aside class="stack-4">
                    <div class="card">
                        <h2 class="t-h3">Übersicht</h2>
                        <dl class="ord__rows">
                            <div><dt>Status</dt><dd>{{ order.statusLabel }}</dd></div>
                            <div v-if="order.placedAt"><dt>Bestellt am</dt><dd class="data">{{ order.placedAt }}</dd></div>
                            <div v-if="order.vehicleLabel"><dt>Fahrzeug</dt><dd>{{ order.vehicleLabel }}</dd></div>
                            <div v-if="order.keyNumbers"><dt>HSN/TSN</dt><dd class="data">{{ order.keyNumbers }}</dd></div>
                            <div v-if="order.trackingCode"><dt>Sendung</dt><dd class="data">{{ order.trackingCode }}</dd></div>
                        </dl>

                        <hr class="hr" />

                        <dl class="ord__rows">
                            <div><dt>Zwischensumme</dt><dd class="tabular">{{ order.subtotal }}</dd></div>
                            <div><dt>Versand</dt><dd class="tabular">{{ order.shipping }}</dd></div>
                            <div><dt>Gesamt</dt><dd class="tabular ord__total">{{ order.total }}</dd></div>
                        </dl>
                        <p class="price-note">inkl. {{ order.tax }} MwSt.</p>
                    </div>

                    <div class="panel--wash">
                        <span class="micro">Fragen zur Bestellung</span>
                        <p class="ord__contact">{{ contact.phone }}</p>
                        <p class="quiet">{{ contact.hours }}</p>
                        <Link href="/kontakt" class="btn btn--secondary btn--block">Zum Kontaktformular</Link>
                    </div>
                </aside>
            </div>
        </div>
    </section>
</template>

<style scoped>
.ord__head {
    text-align: center;
    display: grid;
    justify-items: center;
    gap: var(--s2);
    margin-bottom: var(--s7);
}

.ord__split {
    align-items: start;
}

.ord__label {
    margin: 2px 0 0;
    font-weight: 700;
}

.ord__rev {
    margin: 4px 0 0;
}

.ord__rows {
    display: grid;
    gap: var(--s2);
    margin: var(--s4) 0;
}

.ord__rows div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--s3);
    font-size: 15px;
}

.ord__rows dt {
    color: var(--ink2);
}

.ord__rows dd {
    margin: 0;
    font-weight: 700;
    text-align: right;
}

.ord__total {
    font-size: 18px;
}

.ord__contact {
    margin: var(--s2) 0 0;
    font-size: 20px;
    font-weight: 700;
}
</style>
