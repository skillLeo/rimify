<script setup lang="ts">
/** The confirmation on a phone: the same frozen verdicts, stacked as cards. */

import { Head, Link } from '@inertiajs/vue3'
import Svg from '../../Components/Art/Svg.vue'
import { thankYouCheckSVG } from '../../art'
import type { BestellungProps } from '../../types/pages'

defineProps<BestellungProps>()

const tick = thankYouCheckSVG(48)

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
        <div class="wrap">
            <div class="mord__head">
                <Svg :markup="tick" />
                <h1 class="t-h2">Danke für deine Bestellung.</h1>
                <p class="t-body">
                    Bestellnummer <strong class="data">{{ order.number }}</strong>
                </p>
            </div>

            <div class="stack-4 mord__lines">
                <article v-for="line in lines" :key="line.id" class="card">
                    <span class="micro">{{ line.kindLabel }}</span>
                    <p class="mord__label">{{ line.label }}</p>
                    <div class="between mord__foot">
                        <span v-if="line.verdict" class="tag" :class="VERDICT_CLASS[line.verdict.status]">
                            {{ VERDICT_LABEL[line.verdict.status] }}
                        </span>
                        <span v-else class="quiet">—</span>
                        <strong class="tabular">{{ line.quantity }} × {{ line.lineTotal }}</strong>
                    </div>
                </article>
            </div>

            <div class="card mord__summary">
                <dl class="mord__rows">
                    <div><dt>Status</dt><dd>{{ order.statusLabel }}</dd></div>
                    <div v-if="order.vehicleLabel"><dt>Fahrzeug</dt><dd>{{ order.vehicleLabel }}</dd></div>
                    <div><dt>Versand</dt><dd class="tabular">{{ order.shipping }}</dd></div>
                    <div><dt>Gesamt</dt><dd class="tabular mord__total">{{ order.total }}</dd></div>
                </dl>
                <p class="price-note">inkl. {{ order.tax }} MwSt.</p>
            </div>

            <div class="panel--wash mord__help">
                <span class="micro">Fragen zur Bestellung</span>
                <p class="mord__contact">{{ contact.phone }}</p>
                <p class="quiet">{{ contact.hours }}</p>
                <Link href="/kontakt" class="btn btn--secondary btn--block">Zum Kontaktformular</Link>
            </div>
        </div>
    </section>
</template>

<style scoped>
.mord__head {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: var(--s2);
}

.mord__lines {
    margin-top: var(--s5);
}

.mord__label {
    margin: 2px 0 var(--s3);
    font-weight: 700;
}

.mord__foot {
    align-items: center;
}

.mord__summary {
    margin-top: var(--s4);
}

.mord__rows {
    display: grid;
    gap: var(--s2);
    margin: 0;
}

.mord__rows div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--s3);
    font-size: 15px;
}

.mord__rows dt {
    color: var(--ink2);
}

.mord__rows dd {
    margin: 0;
    font-weight: 700;
    text-align: right;
}

.mord__total {
    font-size: 18px;
}

.mord__help {
    margin-top: var(--s4);
}

.mord__contact {
    margin: var(--s2) 0 0;
    font-size: 20px;
    font-weight: 700;
}
</style>
