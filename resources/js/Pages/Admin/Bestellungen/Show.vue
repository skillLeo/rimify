<script setup lang="ts">
/**
 * Verkauf › Bestellungen › one order (the review release §4.4): what was bought, by whom and where it
 * goes — and, under every wheel line, the verdict as the customer was shown it when they bought,
 * restored from its frozen snapshot and never computed again (R-12). If the Gutachten has changed
 * since, the line says so; the order is explained by what it said then.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'
import { formatMoney } from '../../../lib/num'
import type { OrderState } from '../../../types/admin/bestellungen'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface Address {
    name: string
    company: string | null
    street: string
    extra: string | null
    city: string
    country: string | null
}

interface Snapshot {
    readable: boolean
    statusCode: string
    status?: string
    statusLabel?: string
    vehicle?: string | null
    wheel?: string | null
    document?: string | null
    issuer?: string | null
    sourcePage?: number | null
    requiresEntry?: boolean
    entryNote?: string | null
    conditions?: string[]
    front?: string[]
    rear?: string[]
    computedAt: string | null
    engine: string
    revision: number
    pdfSha: string | null
    documentHref: string
    documentToday: string | null
}

const props = defineProps<{
    order: {
        id: number
        number: string
        statusLabel: string
        payment: OrderState
        fulfilment: OrderState
        paymentMethod: string | null
        shippingMethod: string | null
        vehicle: string | null
        keys: string | null
        placedAt: string | null
        paidAt: string | null
        shippedAt: string | null
        tracking: string | null
        note: string | null
        subtotal: number
        shipping: number
        tax: number
        total: number
        demo: boolean
    }
    customer: { name: string | null; email: string | null; phone: string | null }
    delivery: Address | null
    billing: Address | null
    sameAddress: boolean
    lines: { id: number; kind: string; label: string; quantity: number; unit: number; total: number; package: number | null; snapshot: Snapshot | null }[]
}>()

const context = computed(() => [props.order.statusLabel, props.order.placedAt ? `bestellt am ${props.order.placedAt}` : 'noch nicht abgeschickt'].join(' · '))

const TONE: Record<string, string | null> = {
    PERMITTED: null,
    CONDITIONAL: 'adm-tag adm-tag--warn',
    NOT_PERMITTED: 'adm-tag adm-tag--bad',
    UNKNOWN: 'adm-tag adm-tag--neutral',
}

function tagClass(state: OrderState): string | null {
    return state.tone === 'plain' ? null : `adm-tag adm-tag--${state.tone}`
}
</script>

<template>
    <AdminPage :title="`Bestellung ${order.number}`" :context="context">
        <p v-if="order.demo" class="bs-demo" role="note">Diese Bestellung gehört zu den Demodaten. Niemand hat sie aufgegeben; es wird nichts versandt.</p>

        <div class="bs-top">
            <section class="adm-section bs-block" aria-labelledby="bs-state-h">
                <h2 id="bs-state-h" class="adm-section__title">Stand</h2>
                <dl class="adm-facts">
                    <div class="adm-facts__row">
                        <dt>Zahlung</dt>
                        <dd>
                            <span v-if="tagClass(order.payment)" :class="tagClass(order.payment)">{{ order.payment.label }}</span>
                            <template v-else>{{ order.payment.label }}</template>
                            <template v-if="order.paymentMethod"> · {{ order.paymentMethod }}</template>
                        </dd>
                    </div>
                    <div class="adm-facts__row">
                        <dt>Versand</dt>
                        <dd>
                            <span v-if="tagClass(order.fulfilment)" :class="tagClass(order.fulfilment)">{{ order.fulfilment.label }}</span>
                            <template v-else>{{ order.fulfilment.label }}</template>
                            <template v-if="order.shippingMethod"> · {{ order.shippingMethod }}</template>
                        </dd>
                    </div>
                    <div v-if="order.paidAt" class="adm-facts__row"><dt>Bezahlt am</dt><dd>{{ order.paidAt }}</dd></div>
                    <div v-if="order.shippedAt" class="adm-facts__row"><dt>Versandt am</dt><dd>{{ order.shippedAt }}</dd></div>
                    <div v-if="order.tracking" class="adm-facts__row"><dt>Sendungsnummer</dt><dd>{{ order.tracking }}</dd></div>
                    <div class="adm-facts__row"><dt>Fahrzeug</dt><dd>{{ order.vehicle ?? '–' }}<template v-if="order.keys"> · {{ order.keys }}</template></dd></div>
                </dl>
            </section>

            <section class="adm-section bs-block" aria-labelledby="bs-customer-h">
                <h2 id="bs-customer-h" class="adm-section__title">Kundin oder Kunde</h2>
                <dl class="adm-facts">
                    <div class="adm-facts__row"><dt>Name</dt><dd>{{ customer.name ?? '–' }}</dd></div>
                    <div class="adm-facts__row">
                        <dt>E-Mail</dt>
                        <dd><a v-if="customer.email" :href="`mailto:${customer.email}`">{{ customer.email }}</a><template v-else>–</template></dd>
                    </div>
                    <div v-if="customer.phone" class="adm-facts__row"><dt>Telefon</dt><dd>{{ customer.phone }}</dd></div>
                    <div class="adm-facts__row">
                        <dt>{{ sameAddress ? 'Liefer- und Rechnungsadresse' : 'Lieferadresse' }}</dt>
                        <dd>
                            <address v-if="delivery" class="bs-address">
                                <span>{{ delivery.name }}</span>
                                <span v-if="delivery.company">{{ delivery.company }}</span>
                                <span>{{ delivery.street }}</span>
                                <span v-if="delivery.extra">{{ delivery.extra }}</span>
                                <span>{{ delivery.city }}</span>
                                <span v-if="delivery.country">{{ delivery.country }}</span>
                            </address>
                            <template v-else>–</template>
                        </dd>
                    </div>
                    <div v-if="!sameAddress && billing" class="adm-facts__row">
                        <dt>Rechnungsadresse</dt>
                        <dd>
                            <address class="bs-address">
                                <span>{{ billing.name }}</span>
                                <span v-if="billing.company">{{ billing.company }}</span>
                                <span>{{ billing.street }}</span>
                                <span v-if="billing.extra">{{ billing.extra }}</span>
                                <span>{{ billing.city }}</span>
                                <span v-if="billing.country">{{ billing.country }}</span>
                            </address>
                        </dd>
                    </div>
                </dl>
            </section>
        </div>

        <section class="adm-section bs-positions" aria-labelledby="bs-lines-h">
            <div class="adm-section__head">
                <h2 id="bs-lines-h" class="adm-section__title">Positionen</h2>
            </div>
            <ol class="bs-lines">
                <li v-for="line in lines" :key="line.id" class="bs-line">
                    <div class="bs-line__head">
                        <span class="bs-line__label">{{ line.label }}</span>
                        <span class="bs-line__qty">{{ decimal(line.quantity, 0) }} × {{ formatMoney(line.unit) }}</span>
                        <span class="bs-line__total">{{ formatMoney(line.total) }}</span>
                    </div>

                    <!-- The verdict as the customer was shown it, frozen at the purchase. -->
                    <div v-if="line.snapshot" class="bs-proof">
                        <p class="bs-proof__title">
                            Prüfnachweis vom {{ line.snapshot.computedAt ?? '–' }}
                            <span v-if="line.snapshot.readable && line.snapshot.status && TONE[line.snapshot.status]" :class="TONE[line.snapshot.status]">{{ line.snapshot.statusLabel }}</span>
                            <span v-else-if="line.snapshot.readable" class="bs-proof__ok">{{ line.snapshot.statusLabel }}</span>
                        </p>
                        <template v-if="line.snapshot.readable">
                            <p v-if="line.snapshot.vehicle" class="bs-proof__line">Für {{ line.snapshot.vehicle }}</p>
                            <p v-if="line.snapshot.document" class="bs-proof__line">
                                Laut <Link :href="line.snapshot.documentHref">{{ line.snapshot.document }}</Link>, Fassung {{ line.snapshot.revision }}<template v-if="line.snapshot.issuer"> ({{ line.snapshot.issuer }})</template><template v-if="line.snapshot.sourcePage">, Seite {{ line.snapshot.sourcePage }}</template>
                            </p>
                            <p v-if="line.snapshot.front && line.snapshot.front.length" class="bs-proof__line">
                                Reifen: {{ line.snapshot.front.join(', ') }}<template v-if="line.snapshot.rear && line.snapshot.rear.length && line.snapshot.rear.join() !== line.snapshot.front.join()"> · hinten {{ line.snapshot.rear.join(', ') }}</template>
                            </p>
                            <p v-if="line.snapshot.requiresEntry" class="bs-proof__line">Eintragung in die Fahrzeugpapiere erforderlich.<template v-if="line.snapshot.entryNote"> {{ line.snapshot.entryNote }}</template></p>
                            <p v-for="sentence in line.snapshot.conditions ?? []" :key="sentence" class="bs-proof__line">{{ sentence }}</p>
                        </template>
                        <p v-else class="bs-proof__line">Dieser Prüfnachweis lässt sich nicht lesen. Er bleibt unverändert gespeichert.</p>
                        <p v-if="line.snapshot.documentToday" class="bs-proof__note">{{ line.snapshot.documentToday }} Maßgeblich für diese Bestellung bleibt der Stand oben.</p>
                        <p class="bs-proof__meta">Prüfung {{ line.snapshot.engine }}<template v-if="line.snapshot.pdfSha"> · PDF-Prüfsumme {{ line.snapshot.pdfSha }}…</template></p>
                    </div>
                </li>
            </ol>

            <dl class="bs-sums">
                <div class="bs-sums__row"><dt>Zwischensumme</dt><dd>{{ formatMoney(order.subtotal) }}</dd></div>
                <div class="bs-sums__row"><dt>Versand</dt><dd>{{ formatMoney(order.shipping) }}</dd></div>
                <div class="bs-sums__row bs-sums__row--total"><dt>Summe</dt><dd>{{ formatMoney(order.total) }}</dd></div>
                <div class="bs-sums__row bs-sums__row--tax"><dt>darin enthaltene MwSt.</dt><dd>{{ formatMoney(order.tax) }}</dd></div>
            </dl>
        </section>

        <p class="bs-back"><Link href="/admin/bestellungen">Zurück zu den Bestellungen</Link></p>
    </AdminPage>
</template>

<style scoped>
.bs-demo {
    max-width: var(--adm-form-max);
    margin: 0 0 var(--sp-24);
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.bs-top {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-32);
}

.bs-top .adm-section + .adm-section {
    margin-top: 0;
}

.bs-block .adm-section__title {
    margin-bottom: var(--sp-12);
}

.bs-positions {
    margin-top: var(--sp-32);
}

.bs-address {
    display: grid;
    font-style: normal;
}

.bs-lines {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.bs-line {
    display: grid;
    gap: var(--sp-12);
    padding-block: var(--sp-16);
    border-bottom: 1px solid var(--c-line);
}

.bs-line__head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: baseline;
    gap: var(--sp-16);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.bs-line__label {
    font-weight: 500;
    overflow-wrap: anywhere;
}

.bs-line__qty,
.bs-line__total {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.bs-line__qty {
    color: var(--c-ink-2);
}

.bs-line__total {
    min-width: 11ch;
    text-align: right;
}

.bs-proof {
    display: grid;
    gap: var(--sp-4);
    max-width: 72ch;
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.bs-proof__title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: 0 0 var(--sp-4);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
}

.bs-proof__ok {
    font-weight: 400;
    color: var(--c-ink-2);
}

.bs-proof__line,
.bs-proof__note,
.bs-proof__meta {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

.bs-proof__note {
    color: var(--c-ink);
}

.bs-proof__meta {
    margin-top: var(--sp-4);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.bs-sums {
    display: grid;
    gap: var(--sp-4);
    max-width: 40ch;
    margin: var(--sp-16) 0 0 auto;
}

.bs-sums__row {
    display: flex;
    justify-content: space-between;
    gap: var(--sp-16);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.bs-sums__row dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
}

.bs-sums__row--total {
    padding-top: var(--sp-8);
    border-top: 1px solid var(--c-line);
    font-weight: 600;
}

.bs-sums__row--tax {
    color: var(--c-ink-3);
}

.bs-back {
    margin: var(--sp-32) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

@media (max-width: 1023px) {
    .bs-top {
        grid-template-columns: minmax(0, 1fr);
        gap: 0;
    }

    .bs-top .adm-section + .adm-section {
        margin-top: var(--sp-32);
    }
}

@media (max-width: 767px) {
    .bs-line__head {
        grid-template-columns: minmax(0, 1fr) auto;
    }

    .bs-line__qty {
        grid-column: 1;
    }

    .bs-sums {
        max-width: none;
    }
}
</style>
