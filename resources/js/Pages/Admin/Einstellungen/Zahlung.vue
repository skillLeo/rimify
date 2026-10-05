<script setup lang="ts">
/**
 * Einstellungen › Zahlung: the Stripe keys the shop takes money with (ZahlungController).
 *
 * The keys are write-only, as the bucket's: the page only ever gets their last four characters, masked, and a key
 * stays as stored until „Neuen Schlüssel eintragen“ opens an empty field. The mode says which kind of key the
 * shop takes — Testmodus only test keys, Livemodus only live keys, and a live key only on the live shop (the
 * server refuses the rest in a sentence). „Verbindung testen“ asks Stripe for the account behind the keys: its
 * name, country, currency and payment methods, or Stripe's own error, word for word.
 *
 * „Rechnungsnummern“ opens the real invoice numbers once, at the numbers the client's accounting has reached
 * (InvoiceSeries): until then every invoice is a test invoice. The form shows the first number as the invoice will
 * print it, and asks for the check against the accounting — it cannot be undone. Opened, it names when and by whom.
 */

import { Link, router, useForm } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSaveBar from '../../../Components/Admin/AdminSaveBar.vue'
import { useDirtyForm } from '../../../composables/admin/useDirtyForm'
import type { AdminZahlungProps } from '../../../types/admin/zahlung'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminZahlungProps>()

const editor = useDirtyForm(
    { mode: props.form.mode, publishable_key: '', secret_key: '', webhook_secret: '' },
    { method: 'put', url: '/admin/einstellungen/zahlung' }
)
const form = editor.form

type KeyField = 'publishable_key' | 'secret_key' | 'webhook_secret'

/* Each write-only field: closed (the masked value), or open for a new one. */
const open = ref<Record<KeyField, boolean>>({
    publishable_key: props.publishableMasked === null,
    secret_key: props.secretMasked === null,
    webhook_secret: props.webhookMasked === null,
})

function replace(field: KeyField): void {
    open.value[field] = true
    form[field] = ''
}

const KEYS: { field: KeyField; id: string; label: string; masked: string | null; help: string; secret: boolean }[] = [
    { field: 'publishable_key', id: 'za-publishable', label: 'Öffentlicher Schlüssel', masked: props.publishableMasked, help: 'Beginnt mit pk_test_ oder pk_live_ – Stripe-Dashboard › Entwickler › API-Schlüssel.', secret: false },
    { field: 'secret_key', id: 'za-secret', label: 'Geheimer Schlüssel', masked: props.secretMasked, help: 'Beginnt mit sk_test_ oder sk_live_ – am selben Ort. Er verlässt diesen Server nie.', secret: true },
    { field: 'webhook_secret', id: 'za-webhook', label: 'Webhook-Signaturschlüssel', masked: props.webhookMasked, help: 'Beginnt mit whsec_ – Stripe-Dashboard › Entwickler › Webhooks › der Endpunkt unten › Signaturschlüssel.', secret: true },
]

const SOURCES: Record<AdminZahlungProps['inForce']['source'], string> = {
    Einstellungen: 'diese Einstellungen',
    '.env': 'die Werte aus der .env-Datei – hier ist noch nichts gespeichert',
    keine: 'keine Schlüssel',
}

const context = computed(() => `In Kraft: ${SOURCES[props.inForce.source]} · ${props.inForce.mode === 'live' ? 'Livemodus' : 'Testmodus'}`)

const testing = ref(false)

function testConnection(): void {
    if (testing.value) {
        return
    }

    testing.value = true
    router.post('/admin/einstellungen/zahlung/test', {}, { preserveScroll: true, onFinish: () => (testing.value = false) })
}

const COUNTRIES: Record<string, string> = { DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz', NL: 'Niederlande' }

const series = useForm({ first_invoice: '', first_credit_note: '', confirmed: false })
const seriesOpen = computed(() => props.invoiceSeries.invoice !== null && props.invoiceSeries.credit_note !== null)

/** `RE-001043` — the number as the invoice prints it, or null while the field holds no whole number. */
function preview(prefix: string, raw: string): string | null {
    return /^[1-9]\d{0,8}$/.test(raw.trim()) ? `${prefix}-${raw.trim().padStart(6, '0')}` : null
}

function openSeries(): void {
    if (series.processing) {
        return
    }

    series.post('/admin/einstellungen/zahlung/rechnungsnummern', { preserveScroll: true })
}
</script>

<template>
    <AdminPage title="Zahlung" :context="context">
        <p v-if="driver !== 'stripe'" class="adm-note" role="status">
            Der Shop nimmt noch keine Zahlungen über Stripe an (Zahlungsart in Kraft: {{ driver === 'sandbox' ? 'Testzahlung der Vorschau' : 'keine' }}).
            Die Schlüssel kannst du trotzdem schon eintragen und prüfen.
        </p>

        <!-- No real payment while a legal check fails (GoLiveChecks::liveRefusal): named here, each with where it is closed. -->
        <div v-if="liveBlockedBy.length > 0" class="adm-note za-blocked" role="status">
            <p>
                {{ inForce.mode === 'live' ? 'Echte Zahlungen sind gesperrt' : 'Im Livemodus nimmt der Shop keine echte Zahlung an' }}, solange diese
                Punkte offen sind:
            </p>
            <ul class="za-blocked__list">
                <li v-for="check in liveBlockedBy" :key="check.id">
                    <Link v-if="check.place.startsWith('/admin')" :href="check.place">{{ check.title }}</Link>
                    <template v-else>{{ check.title }}</template>
                    – {{ check.sentence }}
                </li>
            </ul>
            <p><Link href="/admin/system/was-fehlt">Alle Prüfungen unter System › Was fehlt</Link></p>
        </div>

        <form class="adm-form" novalidate @submit.prevent="editor.save">
            <fieldset class="adm-form__group">
                <legend class="adm-form__heading">Modus</legend>
                <label class="check">
                    <input v-model="form.mode" type="radio" name="za-mode" value="test">
                    Testmodus – nur Testschlüssel, es fließt kein Geld
                </label>
                <label class="check">
                    <input v-model="form.mode" type="radio" name="za-mode" value="live" :disabled="!production" :aria-describedby="production ? undefined : 'za-live-help'">
                    Livemodus – nur Live-Schlüssel, echte Zahlungen
                </label>
                <p v-if="!production" id="za-live-help" class="form-field__help">Livemodus gibt es nur im Live-Shop. Live-Schlüssel werden dort eingetragen – nie hier.</p>
                <p class="form-field__error">{{ form.errors.mode }}</p>
            </fieldset>

            <section class="adm-form__group" aria-labelledby="za-keys">
                <h2 id="za-keys" class="adm-form__heading">Schlüssel</h2>
                <p class="adm-form__note">Die Schlüssel werden verschlüsselt gespeichert und nie wieder angezeigt – nur ihre letzten vier Zeichen.</p>

                <div v-for="key in KEYS" :key="key.field" class="form-field">
                    <label class="form-field__label" :for="key.id">{{ key.label }}</label>
                    <div v-if="!open[key.field]" class="za-masked">
                        <output :id="key.id" class="za-masked__value" :aria-label="`Gespeicherter ${key.label}, nur die letzten vier Zeichen`">{{ key.masked }}</output>
                        <button class="btn btn--secondary btn--sm" type="button" @click="replace(key.field)">Neuen Schlüssel eintragen</button>
                    </div>
                    <input
                        v-else
                        :id="key.id"
                        v-model="form[key.field]"
                        class="input za-key"
                        :type="key.secret ? 'password' : 'text'"
                        :autocomplete="key.secret ? 'new-password' : 'off'"
                        spellcheck="false"
                        :aria-describedby="`${key.id}-help ${key.id}-error`"
                        :aria-invalid="form.errors[key.field] ? 'true' : undefined"
                    >
                    <p :id="`${key.id}-help`" class="form-field__help">{{ key.help }}<template v-if="open[key.field] && key.masked"> Leer lassen behält den gespeicherten.</template></p>
                    <p :id="`${key.id}-error`" class="form-field__error">{{ form.errors[key.field] }}</p>
                </div>

                <div class="form-field">
                    <span class="form-field__label">Webhook-Adresse für Stripe</span>
                    <code class="za-url">{{ webhookUrl }}</code>
                    <p class="form-field__help">Im Stripe-Dashboard als Endpunkt eintragen – mit den Ereignissen payment_intent.*, charge.refunded und charge.dispute.*. Bezahlt ist eine Bestellung erst, wenn Stripe es hierher meldet.</p>
                </div>
            </section>

            <section class="adm-form__group" aria-labelledby="za-test">
                <h2 id="za-test" class="adm-form__heading">Verbindung</h2>
                <p class="adm-form__note">Fragt Stripe mit den Schlüsseln in Kraft nach dem Konto dahinter. Es wird nichts gebucht.</p>

                <div>
                    <button class="btn btn--secondary" type="button" :aria-busy="testing ? 'true' : undefined" @click="testConnection">Verbindung testen</button>
                </div>

                <dl v-if="test?.ok" class="za-account" aria-label="Ergebnis der letzten Prüfung">
                    <div><dt>Konto</dt><dd>{{ test.name }}</dd></div>
                    <div><dt>Land</dt><dd>{{ COUNTRIES[test.country ?? ''] ?? test.country }}</dd></div>
                    <div><dt>Währung</dt><dd>{{ test.currency }}</dd></div>
                    <div><dt>Zahlungsarten</dt><dd>{{ test.methods.length ? test.methods.join(', ') : 'keine aktiv' }}</dd></div>
                    <div><dt>Schlüssel</dt><dd>{{ test.live ? 'Live' : 'Test' }}</dd></div>
                </dl>
                <div v-else-if="test" class="za-error" role="alert">
                    <p class="za-error__lead">Stripe hat abgelehnt:</p>
                    <code class="za-error__raw">{{ test.error }}</code>
                </div>
            </section>
        </form>

        <section v-if="seriesOpen && invoiceSeries.invoice && invoiceSeries.credit_note" class="adm-form za-series" aria-labelledby="za-series">
            <h2 id="za-series" class="adm-form__heading">Rechnungsnummern</h2>
            <p class="adm-form__note">
                Eröffnet am {{ invoiceSeries.invoice.openedAt }} von {{ invoiceSeries.invoice.openedBy }}. Der Shop zählt lückenlos weiter.
                Das lässt sich nicht rückgängig machen.
            </p>
            <dl class="za-account">
                <div><dt>Rechnungen</dt><dd>ab <span class="num">{{ invoiceSeries.invoice.first }}</span>, nächste <span class="num">{{ invoiceSeries.invoice.next }}</span></dd></div>
                <div><dt>Gutschriften</dt><dd>ab <span class="num">{{ invoiceSeries.credit_note.first }}</span>, nächste <span class="num">{{ invoiceSeries.credit_note.next }}</span></dd></div>
            </dl>
        </section>

        <form v-else class="adm-form za-series" novalidate aria-labelledby="za-series" @submit.prevent="openSeries">
            <h2 id="za-series" class="adm-form__heading">Rechnungsnummern</h2>
            <p class="adm-form__note">
                Die Rechnungsnummern sind noch nicht eröffnet. Bis dahin bekommt jede Bestellung eine Testrechnung. Trag die
                nächsten freien Nummern aus der Buchhaltung ein. Ab da zählt der Shop lückenlos weiter. Eröffnen kannst du sie nur einmal.
            </p>

            <div class="form-field">
                <label class="form-field__label" for="za-first-invoice">Erste Rechnungsnummer</label>
                <input id="za-first-invoice" v-model="series.first_invoice" class="input za-number" type="text" inputmode="numeric" autocomplete="off" aria-describedby="za-first-invoice-help za-first-invoice-error" :aria-invalid="series.errors.first_invoice ? 'true' : undefined">
                <p id="za-first-invoice-help" class="form-field__help">
                    <template v-if="preview('RE', series.first_invoice)">Die erste echte Rechnung trägt die Nummer <span class="num">{{ preview('RE', series.first_invoice) }}</span>.</template>
                    <template v-else>Die nächste freie Nummer aus der Buchhaltung – nur die Zahl, ohne „RE-“.</template>
                </p>
                <p id="za-first-invoice-error" class="form-field__error">{{ series.errors.first_invoice }}</p>
            </div>

            <div class="form-field">
                <label class="form-field__label" for="za-first-credit">Erste Gutschriftnummer</label>
                <input id="za-first-credit" v-model="series.first_credit_note" class="input za-number" type="text" inputmode="numeric" autocomplete="off" aria-describedby="za-first-credit-help za-first-credit-error" :aria-invalid="series.errors.first_credit_note ? 'true' : undefined">
                <p id="za-first-credit-help" class="form-field__help">
                    <template v-if="preview('GS', series.first_credit_note)">Die erste echte Gutschrift trägt die Nummer <span class="num">{{ preview('GS', series.first_credit_note) }}</span>.</template>
                    <template v-else>1, wenn es noch keine Gutschrift gab.</template>
                </p>
                <p id="za-first-credit-error" class="form-field__error">{{ series.errors.first_credit_note }}</p>
            </div>

            <label class="check">
                <input v-model="series.confirmed" type="checkbox" aria-describedby="za-confirmed-error">
                Ich habe beide Nummern mit der Buchhaltung abgeglichen.
            </label>
            <p id="za-confirmed-error" class="form-field__error">{{ series.errors.confirmed }}</p>

            <div>
                <button class="btn btn--secondary" type="submit" :disabled="series.processing" :aria-busy="series.processing ? 'true' : undefined">Rechnungsnummern eröffnen</button>
            </div>
        </form>

        <AdminSaveBar :editor="editor" />
    </AdminPage>
</template>

<style scoped>
.za-masked {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
}

.za-masked__value,
.za-key,
.za-number,
.za-url,
.za-error__raw {
    font-variant-numeric: tabular-nums;
}

.za-series {
    margin-top: var(--sp-32);
}

.za-blocked {
    display: grid;
    gap: var(--sp-8);
}

.za-blocked__list {
    display: grid;
    gap: var(--sp-4);
    padding-left: var(--sp-16);
    list-style: disc;
}

.za-number {
    max-width: 16ch;
}

.za-masked__value {
    color: var(--c-ink-2);
    letter-spacing: 0.04em;
}

.za-url {
    overflow-wrap: anywhere;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.za-account {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
}

.za-account > div {
    display: grid;
    grid-template-columns: minmax(96px, 160px) minmax(0, 1fr);
    gap: var(--sp-12);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.za-account dt {
    color: var(--c-ink-2);
}

.za-account dd {
    margin: 0;
}

.za-error {
    display: grid;
    gap: var(--sp-4);
}

.za-error__lead {
    margin: 0;
    color: var(--c-bad);
    font-weight: 600;
    font-size: var(--fs-small);
}

.za-error__raw {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}
</style>
