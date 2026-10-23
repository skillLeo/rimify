<script setup lang="ts">
/**
 * Einstellungen › Verkäufer & Versand (VerkaeuferVersandController): the seller as the law names it — the Impressum,
 * the invoice and the order mail read it here — and what delivery costs and takes — the product page, the basket, the
 * checkout and the mail read that. One save for both.
 *
 * „Platzhalter“ marks values that are not the operator's own yet: they stay on this page and in the Impressum's
 * marked preview, every other surface treats them as not given, and the live shop's preflight refuses them. What a
 * real invoice or order still needs is named under each section, in the preflight's words.
 *
 * The Impressum renders from these fields (D-319): an empty one shows its marker, „[FIRMENNAME]“, and keeps the shop
 * out of search and live payments; one that does not apply is declared „Entfällt“ and left out — a declaration, never
 * an invented value.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSaveBar from '../../../Components/Admin/AdminSaveBar.vue'
import { useDirtyForm } from '../../../composables/admin/useDirtyForm'
import type { AdminVerkaeuferVersandProps, NotApplicableField, SellerForm } from '../../../types/admin/verkaeuferVersand'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminVerkaeuferVersandProps>()

const editor = useDirtyForm(
    { seller: { ...props.seller, not_applicable: { ...props.seller.not_applicable } }, shipping: { ...props.shipping } },
    { method: 'put', url: '/admin/einstellungen/verkaeufer-versand', stamp: () => props.stamp }
)
const form = editor.form

type SellerField = Exclude<keyof SellerForm, 'placeholder' | 'not_applicable'>

interface Field {
    key: SellerField
    label: string
    help?: string
    autocomplete?: string
    inputmode?: 'numeric' | 'email' | 'tel'
    /** The Impressum field this one may be declared „entfällt“ for, and the box's words (D-319). */
    notApplicable?: { field: NotApplicableField; label: string }
}

const GROUPS: { title: string; fields: Field[] }[] = [
    {
        title: 'Unternehmen',
        fields: [
            {
                key: 'name',
                label: 'Name des Unternehmens',
                help: 'So, wie er in den Unterlagen des Unternehmens steht, etwa im Handelsregister – nie nur der Markenname.',
                autocomplete: 'organization',
            },
            { key: 'legal_form', label: 'Rechtsform', help: 'Etwa GmbH, UG (haftungsbeschränkt) oder Einzelunternehmen.' },
            {
                key: 'managing_director',
                label: 'Geschäftsführung',
                help: 'Bei einer GmbH die Geschäftsführer mit Vor- und Nachnamen, durch Kommas getrennt.',
                notApplicable: { field: 'managing_director', label: 'Entfällt – keine Geschäftsführung' },
            },
        ],
    },
    {
        title: 'Anschrift',
        fields: [
            { key: 'street', label: 'Straße und Hausnummer', autocomplete: 'address-line1' },
            { key: 'zip', label: 'PLZ', autocomplete: 'postal-code', inputmode: 'numeric' },
            { key: 'city', label: 'Ort', autocomplete: 'address-level2' },
        ],
    },
    {
        title: 'Register und Steuer',
        fields: [
            { key: 'register_court', label: 'Registergericht', help: 'Das Amtsgericht, bei dem das Unternehmen eingetragen ist.' },
            {
                key: 'register_number',
                label: 'Registernummer',
                help: 'Abteilung und Nummer, etwa HRB und die Ziffern.',
                notApplicable: { field: 'register', label: 'Entfällt – kein Registereintrag' },
            },
            {
                key: 'vat_id',
                label: 'USt-IdNr.',
                help: 'DE und neun Ziffern. Hat das Unternehmen keine, reicht für die Rechnung die Steuernummer.',
                notApplicable: { field: 'vat_id', label: 'Entfällt – keine USt-IdNr.' },
            },
            { key: 'tax_number', label: 'Steuernummer', help: 'So, wie sie auf dem Bescheid des Finanzamts steht.' },
        ],
    },
    {
        title: 'Kontakt',
        fields: [
            { key: 'email', label: 'E-Mail-Adresse', inputmode: 'email', autocomplete: 'email' },
            {
                key: 'phone',
                label: 'Telefon',
                help: 'Die Nummer, unter der Kunden das Unternehmen anrufen können.',
                inputmode: 'tel',
                autocomplete: 'tel',
                notApplicable: { field: 'phone', label: 'Entfällt – keine Telefonnummer für Kunden' },
            },
        ],
    },
]

const SOURCES: Record<'Einstellungen' | '.env', string> = {
    Einstellungen: 'diese Einstellungen',
    '.env': 'die Werte aus der .env-Datei – hier ist noch nichts gespeichert',
}

const context = computed(() => `In Kraft: ${SOURCES[props.sellerSource]}`)

function error(key: string): string | undefined {
    return (form.errors as Record<string, string | undefined>)[key]
}

const emailHelp = computed(() =>
    props.contactEmail ? `Leer lassen, dann gilt die Kontaktadresse des Shops (${props.contactEmail}).` : 'Die Adresse, unter der Kunden das Unternehmen erreichen.'
)
</script>

<template>
    <AdminPage title="Verkäufer & Versand" :context="context">
        <form class="adm-form" novalidate @submit.prevent="editor.save">
            <section class="adm-form__group" aria-labelledby="vv-seller">
                <h2 id="vv-seller" class="adm-form__heading">
                    Verkäufer
                    <span v-if="form.seller.placeholder" class="adm-tag adm-tag--warn vv-tag">Platzhalter</span>
                </h2>
                <p class="adm-form__note">
                    So steht der Shop im Impressum, auf jeder Rechnung und in der Bestellbestätigung. Trag nur ein, was in den Unterlagen des Unternehmens steht.
                    Bleibt eine Angabe des Impressums leer, steht dort ein Platzhalter, etwa „[FIRMENNAME]“. Trifft eine Angabe auf das Unternehmen nicht zu, setz das Häkchen bei „Entfällt“ – dann lässt das Impressum die Zeile weg.
                </p>
                <p v-if="sellerMissing.length" class="adm-note vv-open" role="status">
                    Für echte Rechnungen fehlt noch: {{ sellerMissing.join(', ') }}. Bis dahin ist jede Rechnung eine Testrechnung.
                </p>
                <p v-if="impressumMissing.length" class="adm-note vv-open vv-impressum" role="status">
                    Im Impressum fehlt noch: {{ impressumMissing.join(', ') }}. Bis dahin sperrt der Shop Suchmaschinen aus und nimmt keine echten Zahlungen an.
                </p>
                <p v-if="legacyRegister" class="adm-form__note">Aus der .env-Datei: Registereintrag „{{ legacyRegister }}“. Trag Gericht und Nummer hier getrennt ein.</p>

                <fieldset v-for="group in GROUPS" :key="group.title" class="vv-group">
                    <legend class="vv-legend">{{ group.title }}</legend>
                    <div class="vv-fields">
                        <div v-for="field in group.fields" :key="field.key" class="form-field">
                            <label class="form-field__label" :for="`vv-${field.key}`">{{ field.label }}</label>
                            <input
                                :id="`vv-${field.key}`"
                                v-model="form.seller[field.key]"
                                class="input"
                                type="text"
                                :inputmode="field.inputmode"
                                :autocomplete="field.autocomplete ?? 'off'"
                                :aria-describedby="`vv-${field.key}-help vv-${field.key}-error`"
                                :aria-invalid="error(`seller.${field.key}`) ? 'true' : undefined"
                            >
                            <p :id="`vv-${field.key}-help`" class="form-field__help">{{ field.key === 'email' ? emailHelp : field.help }}</p>
                            <p :id="`vv-${field.key}-error`" class="form-field__error">{{ error(`seller.${field.key}`) }}</p>
                            <label v-if="field.notApplicable" class="check vv-na">
                                <input :id="`vv-na-${field.notApplicable.field}`" v-model="form.seller.not_applicable[field.notApplicable.field]" type="checkbox">
                                {{ field.notApplicable.label }}
                            </label>
                        </div>
                    </div>
                </fieldset>

                <label class="check">
                    <input v-model="form.seller.placeholder" type="checkbox" aria-describedby="vv-seller-placeholder-help">
                    Platzhalter – das sind noch nicht die echten Angaben
                </label>
                <p id="vv-seller-placeholder-help" class="form-field__help">
                    Nur das Impressum zeigt diese Angaben, dort als Platzhalter gekennzeichnet. Rechnung und Bestellmail behandeln sie als nicht angegeben, und der Live-Shop startet so nicht.
                </p>
            </section>

            <section class="adm-form__group" aria-labelledby="vv-shipping">
                <h2 id="vv-shipping" class="adm-form__heading">
                    Versand
                    <span v-if="form.shipping.placeholder" class="adm-tag adm-tag--warn vv-tag">Platzhalter</span>
                </h2>
                <p class="adm-form__note">
                    Was die Lieferung kostet und wie lange sie dauert – auf der Produktseite, im Warenkorb, in der Kasse vor dem Bestellknopf und in der Bestellbestätigung.
                    <template v-if="shippingSource === '.env'"> In Kraft sind noch die Werte aus der .env-Datei.</template>
                </p>
                <p v-if="shippingMissing.length" class="adm-note vv-open" role="status">
                    Für echte Bestellungen fehlt noch: {{ shippingMissing.join(', ') }}. Bis dahin nimmt der Shop nur Testbestellungen an.
                </p>

                <fieldset v-for="(country, code) in countries" :key="code" class="vv-group">
                    <legend class="vv-legend">Lieferung nach {{ country }}</legend>
                    <div class="vv-fields">
                        <div class="form-field">
                            <label class="form-field__label" :for="`vv-cost-${code}`">Versandkosten</label>
                            <input
                                :id="`vv-cost-${code}`"
                                v-model="form.shipping.cost"
                                class="input vv-num"
                                type="text"
                                inputmode="decimal"
                                autocomplete="off"
                                :aria-describedby="`vv-cost-${code}-help vv-cost-${code}-error`"
                                :aria-invalid="error('shipping.cost') ? 'true' : undefined"
                            >
                            <p :id="`vv-cost-${code}-help`" class="form-field__help">Endpreis je Bestellung, etwa 4,90. 0 heißt versandkostenfrei.</p>
                            <p :id="`vv-cost-${code}-error`" class="form-field__error">{{ error('shipping.cost') }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" :for="`vv-free-${code}`">Versandkostenfrei ab</label>
                            <input
                                :id="`vv-free-${code}`"
                                v-model="form.shipping.free_from"
                                class="input vv-num"
                                type="text"
                                inputmode="decimal"
                                autocomplete="off"
                                :aria-describedby="`vv-free-${code}-help vv-free-${code}-error`"
                                :aria-invalid="error('shipping.free_from') ? 'true' : undefined"
                            >
                            <p :id="`vv-free-${code}-help`" class="form-field__help">Warenwert, ab dem die Lieferung nichts kostet. Leer lassen, wenn es keine Grenze gibt.</p>
                            <p :id="`vv-free-${code}-error`" class="form-field__error">{{ error('shipping.free_from') }}</p>
                        </div>
                    </div>
                    <p class="form-field__help">Der Shop liefert nur nach Deutschland. Für ein weiteres Lieferland braucht die Kasse eine Länderauswahl, und die Umsatzsteuer ist neu zu klären.</p>
                </fieldset>

                <fieldset class="vv-group" aria-describedby="vv-days-help vv-days-error">
                    <legend class="vv-legend">Lieferzeit in Werktagen</legend>
                    <div class="vv-fields vv-days">
                        <div class="form-field">
                            <label class="form-field__label" for="vv-min-days">Von</label>
                            <input id="vv-min-days" v-model="form.shipping.min_days" class="input vv-num" type="text" inputmode="numeric" autocomplete="off" :aria-invalid="error('shipping.min_days') ? 'true' : undefined">
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="vv-max-days">Bis</label>
                            <input id="vv-max-days" v-model="form.shipping.max_days" class="input vv-num" type="text" inputmode="numeric" autocomplete="off" :aria-invalid="error('shipping.max_days') ? 'true' : undefined">
                        </div>
                    </div>
                    <p id="vv-days-help" class="form-field__help">
                        Ab Zahlungseingang, etwa 3 bis 5.<template v-if="legacyTime"> Aus der .env-Datei: „{{ legacyTime }}“.</template>
                    </p>
                    <p id="vv-days-error" class="form-field__error">{{ error('shipping.min_days') ?? error('shipping.max_days') }}</p>
                </fieldset>

                <p v-if="shippingPreview" class="vv-preview"><span class="vv-preview__label">Auf der Produktseite</span> {{ shippingPreview }}</p>

                <label class="check">
                    <input v-model="form.shipping.placeholder" type="checkbox" aria-describedby="vv-shipping-placeholder-help">
                    Platzhalter – das sind noch nicht die echten Angaben
                </label>
                <p id="vv-shipping-placeholder-help" class="form-field__help">
                    Platzhalter sieht kein Kunde: Der Shop sagt „Die Versandkosten werden noch festgelegt.“ und nimmt nur Testbestellungen an.
                </p>
            </section>

            <p class="adm-form__note">
                Die Rechnungsnummern eröffnest du einmal unter <Link href="/admin/einstellungen/zahlung">Einstellungen › Zahlung</Link>.
            </p>
        </form>

        <AdminSaveBar :editor="editor" />
    </AdminPage>
</template>

<style scoped>
.vv-tag {
    margin-left: var(--sp-8);
    vertical-align: middle;
}

.vv-open {
    margin: 0;
}

/* The „Entfällt“ box sits under its field's help and error, as part of the field. */
.vv-na {
    margin-top: var(--sp-4);
}

.vv-group {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

.vv-legend {
    padding: 0;
    margin-bottom: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
    color: var(--c-ink-2);
}

.vv-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
    gap: var(--sp-12) var(--sp-16);
}

.vv-days {
    grid-template-columns: repeat(2, minmax(0, 120px));
}

.vv-num {
    font-variant-numeric: tabular-nums;
}

.vv-preview {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
}

.vv-preview__label {
    display: block;
    color: var(--c-ink-3);
}
</style>
