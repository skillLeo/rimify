<script setup lang="ts">
/**
 * The order confirmation.
 *
 * The verdict shown per line is the FROZEN one from `order_line_fitments`, not a fresh
 * computation. Eleven months from now a customer whose workshop refused the wheels will open this
 * page, and it has to say what they were told on the day — the state, every Auflage in full, the
 * Gutachten number and the revision of the document the answer came from.
 *
 * The order number on the page is the one in the URL: both come from the same row.
 *
 * One page for every width: the positions and the totals stack on a phone and sit side by side
 * from 1200px.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import type { BestellungProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<BestellungProps>()

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

/*
 * The snapshot's detail is stored JSON. It is read defensively: a field that is missing or of the
 * wrong shape is left out rather than guessed at.
 */
function conditionsOf(detail: Record<string, unknown>): string[] {
    const raw = detail.conditions

    if (!Array.isArray(raw)) {
        return []
    }

    return raw
        .map((c) => (c !== null && typeof c === 'object' ? (c as Record<string, unknown>).textDe : null))
        .filter((text): text is string => typeof text === 'string' && text.trim() !== '')
}

function documentOf(detail: Record<string, unknown>): string | null {
    const doc = detail.document

    if (doc === null || typeof doc !== 'object') {
        return null
    }

    const number = (doc as Record<string, unknown>).number

    return typeof number === 'string' && number !== '' ? number : null
}

const lines = computed(() =>
    props.lines.map((line) => ({
        ...line,
        conditions: line.verdict ? conditionsOf(line.verdict.detail) : [],
        documentNumber: line.verdict ? documentOf(line.verdict.detail) : null,
    }))
)

const telHref = computed(() => `tel:${props.contact.phone.replace(/\s/g, '')}`)
</script>

<template>
    <Head :title="`Bestellung ${order.number}`" />

    <section class="section-dense">
        <div class="wrap">
            <header class="ord__head">
                <span class="ord__tick"><Icon name="check-circle" :size="24" /></span>
                <div>
                    <h1 class="t-h1">Vielen Dank für deine Bestellung.</h1>
                    <p class="t-lead ord__lead">Eine Bestätigung ist unterwegs.</p>
                </div>
            </header>

            <dl class="ord__facts">
                <div>
                    <dt class="micro">Bestellnummer</dt>
                    <dd class="ord__number">{{ order.number }}</dd>
                </div>
                <div v-if="order.placedAt">
                    <dt class="micro">Bestellt am</dt>
                    <dd class="data">{{ order.placedAt }}</dd>
                </div>
                <div>
                    <dt class="micro">Status</dt>
                    <dd>{{ order.statusLabel }}</dd>
                </div>
                <div v-if="order.vehicleLabel">
                    <dt class="micro">Fahrzeug</dt>
                    <dd>
                        {{ order.vehicleLabel }}
                        <span v-if="order.keyNumbers" class="data">({{ order.keyNumbers }})</span>
                    </dd>
                </div>
            </dl>

            <div class="ord">
                <section class="ord__lines" aria-labelledby="ord-lines">
                    <h2 id="ord-lines" class="t-h2">Positionen und Freigaben</h2>
                    <p class="t-small quiet ord__frozen">
                        Die Freigabe jeder Position ist mit dem Stand vom Bestelltag gespeichert.
                    </p>

                    <ul class="ord__list">
                        <li v-for="line in lines" :key="line.id" class="ord__line">
                            <div class="ord__line-top">
                                <div class="ord__line-name">
                                    <p class="ord__kind">{{ line.kindLabel }}</p>
                                    <p class="ord__label">{{ line.label }}</p>
                                </div>
                                <div class="ord__line-price">
                                    <p class="ord__total tabular">{{ line.lineTotal }}</p>
                                    <p class="ord__unit tabular">{{ line.quantity }} × {{ line.unitPrice }}</p>
                                </div>
                            </div>

                            <div v-if="line.verdict" class="ord__verdict">
                                <p class="ord__verdict-row">
                                    <span class="tag" :class="VERDICT_CLASS[line.verdict.status] ?? 'tag--unknown'">
                                        {{ VERDICT_LABEL[line.verdict.status] ?? 'Keine Freigabe hinterlegt' }}
                                    </span>
                                    <span class="data">
                                        <template v-if="line.documentNumber">Gutachten {{ line.documentNumber }} · </template>Fassung {{ line.verdict.documentRevision }}
                                    </span>
                                </p>
                                <p
                                    v-if="line.verdict.requiresEntry && !line.conditions.some((c) => c.includes('Eintragung'))"
                                    class="ord__entry"
                                >
                                    Eintragung in die Fahrzeugpapiere erforderlich.
                                </p>
                                <ul v-if="line.conditions.length" class="ord__conditions">
                                    <li v-for="condition in line.conditions" :key="condition">{{ condition }}</li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </section>

                <aside class="ord__side">
                    <div class="card">
                        <h2 class="t-h3">Summe</h2>
                        <dl class="sum">
                            <div class="sum__row">
                                <dt>Zwischensumme</dt>
                                <dd class="tabular">{{ order.subtotal }}</dd>
                            </div>
                            <div class="sum__row">
                                <dt>Versand</dt>
                                <dd class="tabular">{{ order.shipping }}</dd>
                            </div>
                            <div class="sum__row sum__row--total">
                                <dt>Gesamt</dt>
                                <dd class="tabular">{{ order.total }}</dd>
                            </div>
                        </dl>
                        <p class="price-legal">inkl. {{ order.tax }} MwSt. und Versand</p>
                    </div>

                    <!-- What happens next, as rows with a real destination each. -->
                    <ul class="ord__next">
                        <li class="ord__next-row">
                            <Icon name="truck" :size="20" />
                            <div>
                                <p class="ord__next-title">Bestellung verfolgen</p>
                                <p v-if="order.trackingCode" class="ord__next-text">
                                    DHL-Sendungsnummer <span class="data">{{ order.trackingCode }}</span>
                                </p>
                                <p v-else class="ord__next-text">
                                    Die Sendungsnummer steht hier, sobald das Paket an DHL übergeben ist.
                                </p>
                            </div>
                        </li>
                        <li>
                            <a class="ord__next-row ord__next-link" :href="telHref">
                                <Icon name="phone" :size="20" />
                                <div>
                                    <p class="ord__next-title">Fragen zur Bestellung</p>
                                    <p class="ord__next-text">
                                        <span class="tabular">{{ contact.phone }}</span> · {{ contact.hours }}
                                    </p>
                                </div>
                                <Icon name="chevron-right" :size="20" />
                            </a>
                        </li>
                        <li>
                            <Link class="ord__next-row ord__next-link" href="/kontakt">
                                <Icon name="mail" :size="20" />
                                <div>
                                    <p class="ord__next-title">Schreib uns</p>
                                    <p class="ord__next-text">Nenne die Bestellnummer {{ order.number }}.</p>
                                </div>
                                <Icon name="chevron-right" :size="20" />
                            </Link>
                        </li>
                    </ul>
                </aside>
            </div>
        </div>
    </section>
</template>

<style scoped>
.ord__head {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
}

.ord__tick {
    display: inline-flex;
    flex: none;
    margin-top: var(--space-1);
    color: var(--ok);
}

.ord__lead {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.ord__facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-4);
    margin: var(--space-6) 0 0;
    padding-block: var(--space-4);
    border-block: 1px solid var(--line);
}

.ord__facts dd {
    margin: var(--space-1) 0 0;
    font-weight: 700;
}

.ord__facts .data {
    font-weight: 500;
}

.ord__number {
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
}

.ord {
    display: grid;
    gap: var(--space-7);
    margin-top: var(--space-7);
    align-items: start;
}

.ord__lines {
    min-width: 0;
}

.ord__frozen {
    margin-top: var(--space-2);
}

.ord__list {
    margin: var(--space-4) 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line);
}

.ord__line {
    padding-block: var(--space-4);
    border-bottom: 1px solid var(--line);
}

.ord__line-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
}

.ord__line-name {
    min-width: 0;
}

.ord__kind {
    font-size: var(--text-small);
    font-weight: 700;
    color: var(--ink2);
}

.ord__label {
    font-weight: 700;
}

.ord__line-price {
    flex: none;
    text-align: right;
}

.ord__total {
    font-family: var(--mono);
    font-weight: 700;
}

.ord__unit {
    font-size: var(--text-small);
    color: var(--ink2);
}

.ord__verdict {
    margin-top: var(--space-3);
}

.ord__verdict-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
}

.ord__entry {
    margin-top: var(--space-2);
    font-weight: 700;
}

.ord__conditions {
    display: grid;
    gap: var(--space-1);
    margin: var(--space-2) 0 0;
    padding-left: var(--space-4);
    max-width: 65ch;
}

.ord__side {
    display: grid;
    gap: var(--space-5);
    min-width: 0;
}

.sum {
    margin: var(--space-3) 0 var(--space-2);
}

.sum__row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    padding-block: var(--space-1);
}

.sum__row dt {
    color: var(--ink2);
}

.sum__row dd {
    margin: 0;
    font-family: var(--mono);
    font-weight: 500;
}

.sum__row--total {
    margin-top: var(--space-2);
    padding-top: var(--space-3);
    border-top: 2px solid var(--border-strong);
}

.sum__row--total dt,
.sum__row--total dd {
    color: var(--ink);
    font-size: var(--text-h3);
    font-weight: 700;
}

.ord__next {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line);
}

.ord__next-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 64px;
    padding-block: var(--space-3);
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
}

.ord__next-row :deep(svg) {
    flex: none;
    color: var(--ink2);
}

.ord__next-row > div {
    flex: 1;
    min-width: 0;
}

.ord__next-title {
    font-weight: 700;
}

.ord__next-text {
    font-size: var(--text-small);
    color: var(--ink2);
}

@media (hover: hover) and (pointer: fine) {
    .ord__next-link:hover .ord__next-title {
        color: var(--blue);
    }
}

@media (min-width: 900px) {
    .ord__facts {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

@media (min-width: 1200px) {
    .ord {
        grid-template-columns: minmax(0, 1fr) 380px;
    }
}
</style>
