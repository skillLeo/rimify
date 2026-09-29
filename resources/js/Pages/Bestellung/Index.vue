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
 *
 * A seeded order (`demo`) says so at the top: nobody placed it, and its frozen verdicts are seed
 * data, not a statement about the car it names (ACCURACY.md §3.1 F3). The snapshots themselves
 * are never rewritten (R-12). No carrier is named (D7).
 *
 * It is also where Stripe sends the customer back (Block G), and arriving here pays nothing: only the provider's
 * signed webhook does. Until it has, the page says the payment is being confirmed and asks the server every two
 * seconds — then every fifteen, and says so — and changes its words when the answer changes: paid (the basket is
 * emptied now, not before), declined (back to the Kasse, everything typed still there) or closed.
 */

import { Head, Link, router } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import type { IconName } from '../../art'
import type { BestellungProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<BestellungProps & { demo?: boolean }>()

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

/*
 * Questions about the order go to the phone when the client has given one, otherwise to the
 * e-mail with the order number already in the subject — never to an invented number.
 */
const questionHref = computed(() =>
    props.contact.phone
        ? `tel:${(props.contact.phoneIntl ?? props.contact.phone).replace(/\s/g, '')}`
        : `mailto:${props.contact.email}?subject=${encodeURIComponent(`Bestellung ${props.order.number}`)}`
)

/* ── The payment, as the server last answered ─────────────────────────────── */

const state = computed(() => props.payment?.state ?? 'paid')

/** Two-second questions for the first ninety seconds, then one every fifteen: the page never stops on its own. */
const FAST_TRIES = 45
const tries = ref(0)
const slow = computed(() => tries.value >= FAST_TRIES)
let timer: ReturnType<typeof setTimeout> | null = null

async function ask(): Promise<void> {
    tries.value++

    try {
        const response = await fetch(`/bestellung/${encodeURIComponent(props.order.number)}/status`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })

        if (response.ok) {
            const answer = (await response.json()) as { state?: string }

            if (answer.state !== undefined && answer.state !== state.value) {
                router.reload({ only: ['order', 'payment'] })

                return
            }
        }
    } catch {
        // Offline for a moment: the next question goes out as planned.
    }

    schedule()
}

function schedule(): void {
    if (props.payment?.poll !== true) {
        return
    }

    timer = setTimeout(() => void ask(), state.value === 'confirming' && !slow.value ? 2000 : 15000)
}

onMounted(schedule)
onBeforeUnmount(() => {
    if (timer !== null) {
        clearTimeout(timer)
    }
})

const mailTo = computed(() => props.payment?.email ?? 'deine E-Mail-Adresse')

const heading = computed(() => {
    switch (state.value) {
        case 'confirming':
            return 'Deine Zahlung wird bestätigt.'
        case 'processing':
            return 'Deine Zahlung ist unterwegs.'
        case 'failed':
            return 'Die Zahlung hat nicht geklappt.'
        case 'closed':
            return 'Diese Bestellung ist nicht mehr offen.'
        default:
            return 'Vielen Dank für deine Bestellung.'
    }
})

const lead = computed(() => {
    switch (state.value) {
        case 'confirming':
            return slow.value
                ? `Das dauert länger als üblich. Du musst nichts weiter tun: Sobald die Zahlung bestätigt ist, bekommst du eine E-Mail an ${mailTo.value}.`
                : 'Das dauert meist nur ein paar Sekunden – diese Seite aktualisiert sich von selbst. Bezahlt ist deine Bestellung, sobald der Zahlungsdienst sie uns bestätigt.'
        case 'processing':
            return `Bei einer Lastschrift kann die Bestätigung ein paar Tage dauern. Sobald sie da ist, bekommst du eine E-Mail an ${mailTo.value} – erst dann versenden wir.`
        case 'failed':
            return 'Es wurde nichts abgebucht. Deine Angaben und dein Warenkorb sind noch da – versuch es gleich noch einmal, gern auch mit einer anderen Zahlungsart.'
        case 'closed':
            return 'Diese Bestellung wurde nicht bezahlt, es wurde nichts abgebucht.'
        default:
            return props.payment?.mailed
                ? `Deine Zahlung ist eingegangen. Die Bestätigung mit Rechnung, AGB und Widerrufsbelehrung haben wir an ${mailTo.value} geschickt. Heb dir die Bestellnummer auf – mit ihr beantworten wir deine Fragen.`
                : 'Heb dir die Bestellnummer auf – mit ihr beantworten wir deine Fragen.'
    }
})

const TICK: Record<string, { icon: IconName; tone: string }> = {
    paid: { icon: 'check-circle', tone: '' },
    confirming: { icon: 'clock', tone: 'ord__tick--wait' },
    processing: { icon: 'clock', tone: 'ord__tick--wait' },
    failed: { icon: 'info', tone: 'ord__tick--bad' },
    closed: { icon: 'info', tone: 'ord__tick--demo' },
}

const tick = computed(() => TICK[state.value] ?? { icon: 'check-circle' as IconName, tone: '' })

/* „Konto anlegen“: one click, the order's own address; the server mails the link to set the password. */
const accountSent = ref(false)
const accountBusy = ref(false)

function openAccount(): void {
    accountBusy.value = true
    router.post(`/bestellung/${encodeURIComponent(props.order.number)}/konto`, {}, {
        preserveScroll: true,
        onSuccess: () => {
            accountSent.value = true
        },
        onFinish: () => {
            accountBusy.value = false
        },
    })
}
</script>

<template>
    <Head :title="`Bestellung ${order.number}`" />

    <section class="section-dense">
        <div class="wrap">
            <header v-if="demo" class="ord__head">
                <span class="ord__tick ord__tick--demo"><Icon name="info" :size="24" /></span>
                <div>
                    <h1 class="t-h1">Beispielbestellung</h1>
                    <p class="t-lead ord__lead">
                        <span class="tag tag--unknown ord__demo-tag">Demodaten</span>
                        Diese Bestellung stammt aus unseren Beispieldaten – niemand hat sie aufgegeben.
                        Auch die Freigaben unten sind Beispieldaten: Sie sagen nichts darüber aus, ob
                        eine Felge an das genannte Fahrzeug darf.
                    </p>
                </div>
            </header>
            <header v-else class="ord__head">
                <span class="ord__tick" :class="tick.tone"><Icon :name="tick.icon" :size="24" /></span>
                <div role="status" aria-live="polite" class="ord__state">
                    <h1 class="t-h1">{{ heading }}</h1>
                    <p class="t-lead ord__lead">{{ lead }}</p>
                    <Link v-if="state === 'failed'" href="/kasse" class="btn btn--primary ord__retry">
                        Zurück zur Kasse und noch einmal bezahlen
                    </Link>
                    <Link v-else-if="state === 'closed'" href="/warenkorb" class="btn btn--secondary ord__retry">
                        Zum Warenkorb
                    </Link>
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
                        <!-- The invoice as issued, by a signed link (Invoices::link). -->
                        <a v-if="invoice" class="ord__invoice" :href="invoice.href" target="_blank" rel="noopener">
                            Rechnung {{ invoice.number }} herunterladen
                        </a>
                    </div>

                    <!-- Guest by default; the account is offered once, after the order, in one click (Block G §2). -->
                    <div v-if="accountOffer" class="card ord__account">
                        <template v-if="!accountSent">
                            <h2 class="t-h3">Konto anlegen?</h2>
                            <p class="t-small ord__account-text">
                                Mit einem Klick. Wir schicken dir einen Link an {{ payment?.email ?? 'deine E-Mail-Adresse' }}, mit dem
                                du dein Passwort festlegst – dann siehst du deine Bestellungen, Freigaben und Rechnungen jederzeit.
                            </p>
                            <button class="btn btn--secondary btn--block" type="button" :disabled="accountBusy" :aria-busy="accountBusy ? 'true' : undefined" @click="openAccount">
                                Konto anlegen
                            </button>
                        </template>
                        <p v-else class="t-small ord__account-text" role="status">
                            Der Link ist unterwegs. Mit ihm legst du dein Passwort fest.
                        </p>
                    </div>

                    <!-- What happens next, as rows with a real destination each. -->
                    <ul class="ord__next">
                        <li class="ord__next-row">
                            <Icon name="truck" :size="20" />
                            <div>
                                <p class="ord__next-title">Bestellung verfolgen</p>
                                <p v-if="order.trackingCode" class="ord__next-text">
                                    Sendungsnummer <span class="data">{{ order.trackingCode }}</span>
                                </p>
                                <p v-else class="ord__next-text">
                                    Die Sendungsnummer steht hier, sobald dein Paket unterwegs ist.
                                </p>
                            </div>
                        </li>
                        <li>
                            <a class="ord__next-row ord__next-link" :href="questionHref">
                                <Icon :name="contact.phone ? 'phone' : 'mail'" :size="20" />
                                <div>
                                    <p class="ord__next-title">Fragen zur Bestellung</p>
                                    <p class="ord__next-text">
                                        <span v-if="contact.phone" class="tabular">{{ contact.phone }}</span>
                                        <span v-else>{{ contact.email }}</span> · {{ contact.hours }}
                                    </p>
                                </div>
                                <Icon name="chevron-right" :size="20" />
                            </a>
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

.ord__tick--demo,
.ord__tick--wait {
    color: var(--ink2);
}

.ord__tick--bad {
    color: var(--danger);
}

.ord__state {
    min-width: 0;
}

.ord__account {
    display: grid;
    gap: var(--space-3);
}

.ord__invoice {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-top: var(--space-2);
    font-weight: 700;
}

.ord__account-text {
    color: var(--ink2);
}

.ord__retry {
    margin-top: var(--space-4);
}

.ord__lead {
    margin-top: var(--space-2);
    color: var(--ink2);
    max-width: 65ch;
}

.ord__demo-tag {
    margin-right: var(--space-2);
    vertical-align: middle;
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
