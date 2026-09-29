<script setup lang="ts">
/**
 * Verkauf › Bestellungen › one order (the review release §4.4): what was bought, by whom and where it
 * goes — and, under every wheel line, the verdict as the customer was shown it when they bought,
 * restored from its frozen snapshot and never computed again (R-12). If the Gutachten has changed
 * since, the line says so; the order is explained by what it said then.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
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
    /** The tyre answer as the customer was shown it, and the whole sum behind it. */
    tyre?: { statusLabel: string; summary: string | null; basis: string | null; lines: string[]; fromPapers: boolean } | null
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
        test: boolean
    }
    customer: { name: string | null; email: string | null; phone: string | null }
    delivery: Address | null
    billing: Address | null
    sameAddress: boolean
    lines: { id: number; kind: string; label: string; quantity: number; unit: number; total: number; package: number | null; snapshot: Snapshot | null }[]
    /** Block G: what was paid and went back, the invoice and credit notes, and whether „Erstatten“ is offered. */
    money?: {
        paid: number
        refunded: number
        refundable: number
        /** `refundable` as the field's German figure („1.596,00“). */
        refundableInput: string
        canRefund: boolean
        flag: string | null
        error: string | null
        papers: { number: string; kind: string; gross: number; issuedAt: string | null; href: string }[]
        refunds: { amount: number; reason: string; status: string; at: string | null; by: string | null }[]
    }
}>()

/* ── Erstatten: through Stripe only, with the exact amount in the question ─── */

const page = usePage()
const refundErrors = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

/* The field starts at what is left, as the server writes the figure (Money::toGerman) — never divided here. */
const refundAmount = ref(props.money?.refundableInput ?? '')
const refundReason = ref('')
const refundLocal = ref<string | null>(null)
const refundOpen = ref(false)
const refunding = ref(false)

/** „1.234,56“ or „1234,5“ → cents, as the server reads it (Money::fromGerman); null when it is no amount. */
function parseAmount(text: string): number | null {
    const clean = text.trim().replace(/\s|€/g, '')

    if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(clean)) {
        return null
    }

    const [whole, fraction = ''] = clean.replace(/\./g, '').split(',')

    return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}

const refundCents = computed(() => parseAmount(refundAmount.value))

function askRefund(): void {
    const cents = refundCents.value
    refundLocal.value = null

    if (cents === null || cents < 1) {
        refundLocal.value = 'Gib den Betrag in Euro an, zum Beispiel 399,00.'

        return
    }

    if (props.money && cents > props.money.refundable) {
        refundLocal.value = `Höchstens ${formatMoney(props.money.refundable)} lassen sich noch erstatten.`

        return
    }

    if (refundReason.value.trim().length < 3) {
        refundLocal.value = 'Schreib dazu, wofür erstattet wird – es steht auf der Gutschrift.'

        return
    }

    refundOpen.value = true
}

function refund(): void {
    refunding.value = true
    router.post(`/admin/bestellungen/${props.order.id}/erstattung`, { amount: refundAmount.value, reason: refundReason.value }, {
        preserveScroll: true,
        onSuccess: () => {
            refundReason.value = ''
            refundAmount.value = props.money?.refundableInput ?? ''
        },
        onFinish: () => {
            refunding.value = false
            refundOpen.value = false
        },
    })
}

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
        <p v-else-if="order.test" class="bs-demo" role="note">Testbestellung über die Testzahlung – dabei fließt kein Geld, was auch immer der Status sagt.</p>

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
                <h2 id="bs-customer-h" class="adm-section__title">Kundendaten</h2>
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
                            <!-- The tyre answer and its whole sum, unfolded: the proof shows everything the customer could open. -->
                            <template v-if="line.snapshot.tyre">
                                <p class="bs-proof__line">Reifen: {{ line.snapshot.tyre.statusLabel }}<template v-if="line.snapshot.tyre.summary"> – {{ line.snapshot.tyre.summary }}</template></p>
                                <p v-if="line.snapshot.tyre.basis" class="bs-proof__line">{{ line.snapshot.tyre.basis }}</p>
                                <p v-if="line.snapshot.tyre.fromPapers" class="bs-proof__line">Mit den Werten aus den Fahrzeugpapieren des Kunden gerechnet; sie haben die Antwort strenger gemacht.</p>
                                <ol v-if="line.snapshot.tyre.lines.length" class="bs-proof__sum">
                                    <li v-for="sentence in line.snapshot.tyre.lines" :key="sentence">{{ sentence }}</li>
                                </ol>
                            </template>
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

        <section v-if="money" class="adm-section bs-money" aria-labelledby="bs-money-h">
            <h2 id="bs-money-h" class="adm-section__title">Zahlung und Erstattung</h2>

            <p v-if="money.flag" class="adm-alert" role="alert">{{ money.flag }}</p>
            <p v-else-if="money.error" class="bs-money__error">Letzte Meldung des Zahlungsdienstes: {{ money.error }}</p>

            <dl class="adm-facts">
                <div class="adm-facts__row"><dt>Bezahlt</dt><dd>{{ formatMoney(money.paid) }}</dd></div>
                <div class="adm-facts__row"><dt>Erstattet</dt><dd>{{ formatMoney(money.refunded) }}</dd></div>
                <div v-if="money.paid > 0" class="adm-facts__row"><dt>Noch erstattbar</dt><dd>{{ formatMoney(money.refundable) }}</dd></div>
            </dl>

            <ul v-if="money.papers.length" class="bs-papers" aria-label="Rechnung und Gutschriften">
                <li v-for="paper in money.papers" :key="paper.number">
                    <a :href="paper.href" target="_blank" rel="noopener">{{ paper.kind }} {{ paper.number }}</a>
                    <span class="bs-papers__meta">{{ paper.issuedAt }} · {{ formatMoney(paper.gross) }}</span>
                </li>
            </ul>

            <ol v-if="money.refunds.length" class="bs-refunds" aria-label="Erstattungen">
                <li v-for="(item, i) in money.refunds" :key="i">
                    <span class="bs-refunds__amount">{{ formatMoney(item.amount) }}</span> · {{ item.status }} · {{ item.at }}<template v-if="item.by"> · {{ item.by }}</template>
                    <span class="bs-refunds__reason">{{ item.reason }}</span>
                </li>
            </ol>

            <form v-if="money.canRefund" class="bs-refund" novalidate @submit.prevent="askRefund">
                <div class="form-field">
                    <label class="form-field__label" for="bs-refund-amount">Betrag</label>
                    <span class="input-group bs-refund__amount"><input id="bs-refund-amount" v-model="refundAmount" class="input bs-refund__input" type="text" inputmode="decimal" autocomplete="off" aria-describedby="bs-refund-help bs-refund-err"><span class="input-group__suffix" aria-hidden="true">€</span></span>
                    <p id="bs-refund-help" class="form-field__help">In Euro, höchstens {{ formatMoney(money.refundable) }}. Das Geld geht über Stripe auf dem Weg zurück, auf dem bezahlt wurde.</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="bs-refund-reason">Grund</label>
                    <input id="bs-refund-reason" v-model="refundReason" class="input" type="text" maxlength="300" autocomplete="off" aria-describedby="bs-refund-reason-help bs-refund-err">
                    <p id="bs-refund-reason-help" class="form-field__help">Steht auf der Gutschrift, die die Kundin oder der Kunde bekommt – etwa „Eine Felge zurückgeschickt“.</p>
                </div>
                <p id="bs-refund-err" class="form-field__error" role="alert">{{ refundLocal ?? refundErrors.refund ?? refundErrors.amountCents ?? refundErrors.reason ?? '' }}</p>
                <div class="adm-fields__actions">
                    <button class="btn btn--secondary" type="submit" :disabled="refunding">Erstatten …</button>
                </div>
            </form>
        </section>

        <p class="bs-back"><Link href="/admin/bestellungen">Zurück zu den Bestellungen</Link></p>

        <AdminConfirm
            v-model:open="refundOpen"
            :title="`${formatMoney(refundCents ?? 0)} erstatten?`"
            :body="`Das Geld geht über Stripe an ${customer.name ?? 'die Kundin oder den Kunden'} zurück; eine Gutschrift wird ausgestellt. Eine Erstattung lässt sich nicht zurücknehmen.`"
            :confirm-label="`${formatMoney(refundCents ?? 0)} erstatten`"
            :busy="refunding"
            @confirm="refund"
        />
    </AdminPage>
</template>

<style scoped>
.bs-money {
    max-width: var(--adm-form-max);
}

.bs-money__error {
    margin: 0 0 var(--sp-16);
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.bs-papers,
.bs-refunds {
    display: grid;
    gap: var(--sp-8);
    margin: var(--sp-16) 0 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.bs-papers li,
.bs-refunds li {
    display: grid;
    gap: var(--sp-4);
}

.bs-papers__meta,
.bs-refunds__reason {
    color: var(--c-ink-2);
}

.bs-refunds__amount {
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}

.bs-refund {
    display: grid;
    gap: var(--sp-16);
    margin-top: var(--sp-24);
    padding-top: var(--sp-16);
    border-top: 1px solid var(--c-line);
}

.bs-refund__amount {
    max-width: calc(var(--sp-128) + var(--sp-32));
}

.bs-refund__input {
    padding-right: var(--sp-32);
    text-align: right;
    font-variant-numeric: tabular-nums;
}

/* The money on the order: figures right-aligned in one column, digits that line up. */
.bs-money .adm-facts__row {
    grid-template-columns: minmax(0, 160px) var(--sp-128);
}

.bs-money .adm-facts__row dd {
    text-align: right;
    font-variant-numeric: tabular-nums;
}

.bs-refund .form-field__error:empty {
    display: none;
}

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

.bs-top + .bs-positions {
    margin-top: var(--sp-40);
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

.bs-proof__sum {
    display: grid;
    gap: var(--sp-4);
    margin: var(--sp-4) 0 0;
    padding-left: var(--sp-20);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
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
