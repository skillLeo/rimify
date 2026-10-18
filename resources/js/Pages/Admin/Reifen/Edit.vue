<script setup lang="ts">
/**
 * Katalog › Reifen › one tyre, or a new one (his admin item 10, D-302): one size of one profile — its brand, profile and
 * season, its size with load index and speed symbol, its EU tyre label (Regulation (EU) 2020/740) and how it is sold —
 * saved together through the save bar.
 *
 * Above the form stands what the shop does with the tyre now, read from the saved row: offered, or why not — not
 * available (D-301), or its label not complete on record (D-303). The label may be saved incomplete; the shop does not
 * offer the tyre until every entry is there. The two pictograms are answered „Ja“ or „Nein“ — unanswered is not „Nein“.
 * A demonstration tyre is shown and never changed.
 */

import { router } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage, { type AdminPageAction } from '../../../Components/Admin/AdminPage.vue'
import AdminSaveBar from '../../../Components/Admin/AdminSaveBar.vue'
import TyreLabel, { type TyreClass } from '../../../Components/Ui/TyreLabel.vue'
import { useDirtyForm } from '../../../composables/admin/useDirtyForm'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminReifenEditProps, TyreForm } from '../../../types/admin/reifen'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminReifenEditProps>()

const NEW_BRAND = -1

function fromProps(): TyreForm {
    const tyre = props.tyre
    const template = props.template

    return {
        brand_id: tyre?.brandId ?? template?.brandId ?? null,
        brand_new: '',
        name: tyre?.name ?? template?.name ?? '',
        season: tyre?.season ?? template?.season ?? '',
        width_mm: tyre?.width ?? '',
        aspect: tyre?.aspect ?? '',
        diameter_in: tyre?.diameter ?? '',
        load_index: tyre?.loadIndex ?? '',
        speed_symbol: tyre?.speedSymbol ?? '',
        eu_fuel_class: tyre?.fuel ?? '',
        eu_wet_grip_class: tyre?.wet ?? '',
        eu_noise_db: tyre?.noiseDb ?? '',
        eu_noise_class: tyre?.noiseClass ?? '',
        eu_snow_grip: tyre?.snow ?? null,
        eu_ice_grip: tyre?.ice ?? null,
        eprel_id: tyre?.eprelId ?? '',
        price: tyre?.price ?? '',
        available: tyre?.available ?? true,
    }
}

const editor = useDirtyForm<TyreForm>(fromProps(), {
    // Asked at each save: after the first save of a new tyre the page is the tyre's own.
    method: () => (props.tyre ? 'put' : 'post'),
    url: () => (props.tyre ? `/admin/reifen/${props.tyre.id}` : '/admin/reifen'),
    onSaved: () => sync(),
})

const form = editor.form

/* Sent as the server reads it: a chosen brand or a new one, never both. */
form.transform((data) => ({
    ...data,
    brand_id: data.brand_id === NEW_BRAND ? null : data.brand_id,
    brand_new: data.brand_id === NEW_BRAND ? data.brand_new : '',
}))

/** After a save the server's row is the truth. */
function sync(): void {
    form.defaults(fromProps())
    form.reset()
    form.clearErrors()
}

watch(
    () => props.tyre?.id,
    () => sync()
)

const demo = computed(() => props.tyre?.demo === true)
const editable = computed(() => !demo.value && (props.tyre ? props.can.edit : props.can.create))
const readonly = computed(() => !editable.value)
/* A tyre that was ordered keeps the size it was sold in: the order names its Auflagen by that size. */
const sizeLocked = computed(() => readonly.value || props.tyre?.sold === true)

const errors = computed(() => form.errors as Record<string, string | undefined>)

function err(field: string): string {
    return errors.value[field] ?? ''
}

const errorCount = computed(() => Object.values(errors.value).filter((value) => typeof value === 'string' && value !== '').length)

/* ── The name as the shop and the list show it ───────────────────────────────── */

const brandName = computed(() => (form.brand_id === NEW_BRAND ? form.brand_new.trim() : (props.brands.find((b) => b.value === form.brand_id)?.label ?? '')))

/** `225/45 R18 95Y` — once every part is there. */
const sizeLabel = computed(() => {
    const parts = [form.width_mm, form.aspect, form.diameter_in, form.load_index, form.speed_symbol].map((part) => String(part).trim())

    return parts.every((part) => part !== '') ? `${parts[0]}/${parts[1]} R${parts[2]} ${parts[3]}${parts[4]}` : ''
})

const title = computed(() => (props.tyre ? props.tyre.fullTitle : 'Neuer Reifen'))

const context = computed(() => {
    if (!props.tyre) {
        return props.template ? `Weitere Größe von ${[brandName.value, props.template.name].filter(Boolean).join(' ')}` : 'Noch nicht gespeichert'
    }

    return props.tyre.updated ? `Geändert am ${props.tyre.updated}` : 'Gespeichert'
})

/* ── The label, as the shop would print it ────────────────────────────────────── */

const CLASSES: readonly string[] = ['A', 'B', 'C', 'D', 'E']

/** The preview once the four figures are typed; the shop shows the label only with its EPREL number too (D-303). */
const preview = computed(() => {
    const noise = Number(form.eu_noise_db)

    if (!CLASSES.includes(form.eu_fuel_class) || !CLASSES.includes(form.eu_wet_grip_class) || !['A', 'B', 'C'].includes(form.eu_noise_class) || !Number.isInteger(noise) || noise <= 0) {
        return null
    }

    return {
        title: [brandName.value, form.name.trim(), sizeLabel.value].filter(Boolean).join(' · ') || 'Neuer Reifen',
        fuel: form.eu_fuel_class as TyreClass,
        wet: form.eu_wet_grip_class as TyreClass,
        noiseDb: noise,
        noiseClass: form.eu_noise_class as 'A' | 'B' | 'C',
        snowGrip: form.eu_snow_grip,
        iceGrip: form.eu_ice_grip,
        eprelId: /^\d+$/.test(form.eprel_id.trim()) ? form.eprel_id.trim() : null,
    }
})

/* ── Weitere Größe, Entfernen ─────────────────────────────────────────────────── */

const removeOpen = ref(false)
const removing = ref(false)

function remove(): void {
    if (!props.tyre) {
        return
    }

    removing.value = true
    router.delete(`/admin/reifen/${props.tyre.id}`, {
        onFinish: () => {
            removing.value = false
            removeOpen.value = false
        },
    })
}

const more = computed<AdminPageAction[]>(() => {
    const actions: AdminPageAction[] = []
    const tyre = props.tyre

    if (!tyre || tyre.demo) {
        return actions
    }

    if (props.can.create) {
        actions.push({ label: 'Weitere Größe anlegen', href: `/admin/reifen/neu?wie=${tyre.id}`, icon: 'plus' })
    }

    if (props.can.delete) {
        actions.push({ label: 'Entfernen', run: () => (removeOpen.value = true), danger: true })
    }

    return actions
})
</script>

<template>
    <!-- A demonstration tyre says why it cannot be changed in its own box; „ansehen, aber nicht ändern“ is about rights. -->
    <AdminPage :title="title" :context="context" :more="more" :read-only="readonly && !demo">
        <!-- What the shop does with this tyre now, read from the saved row (D-301, D-303). -->
        <section v-if="tyre" class="rf-state" :class="{ 'rf-state--off': !tyre.offered && !tyre.demo }" aria-labelledby="rf-state-h">
            <h2 id="rf-state-h" class="rf-state__title">
                Im Shop
                <span class="rf-state__verdict">
                    <template v-if="tyre.demo">Aus den Demodaten</template>
                    <template v-else-if="tyre.offered">Wird angeboten</template>
                    <template v-else>Wird nicht angeboten</template>
                </span>
            </h2>
            <ul class="rf-state__list">
                <li v-if="tyre.demo" class="rf-state__item">
                    <Icon name="info" :size="16" />
                    Ein Reifen aus den Demodaten: Er zeigt, wie ein Komplettrad aussieht, und lässt sich hier nicht ändern.
                </li>
                <template v-else>
                    <li v-if="tyre.offered" class="rf-state__item">
                        <Icon name="check" :size="16" />
                        Der Shop bietet ihn als Komplettrad an: auf Felgen, deren Gutachten diese Reifengröße für das Fahrzeug des Kunden freigibt, wenn er dessen Mindestwerte erfüllt.
                    </li>
                    <li v-if="!tyre.available" class="rf-state__item rf-state__item--bad">
                        <Icon name="warning" :size="16" />
                        Er ist als „Nicht verfügbar“ markiert.
                    </li>
                    <li v-if="tyre.missingLabel.length" class="rf-state__item rf-state__item--bad">
                        <Icon name="warning" :size="16" />
                        Das EU-Reifenlabel ist noch unvollständig. Noch nicht eingetragen: {{ tyre.missingLabel.join(', ') }}.
                    </li>
                </template>
            </ul>
        </section>
        <p v-else class="adm-note rf-first">Der Shop bietet einen Reifen erst an, wenn er verfügbar ist und sein EU-Reifenlabel vollständig eingetragen ist.</p>

        <p v-if="errorCount" class="adm-alert" role="alert">
            {{ errorCount === 1 ? 'Eine Angabe muss noch korrigiert werden.' : `${errorCount} Angaben müssen noch korrigiert werden.` }}
            Die Hinweise stehen bei den Feldern.
        </p>

        <form class="rf-form" novalidate @submit.prevent="editor.save">
            <!-- ── Der Reifen ─────────────────────────────────────────────────── -->
            <section class="adm-section" aria-labelledby="rf-h-tyre">
                <div class="adm-section__head">
                    <h2 id="rf-h-tyre" class="adm-section__title">Der Reifen</h2>
                </div>
                <div class="adm-fields rf-narrow">
                    <div class="form-field">
                        <label class="form-field__label" for="rf-brand">Marke</label>
                        <select id="rf-brand" v-model="form.brand_id" class="input" :disabled="readonly" :aria-invalid="err('brand_id') ? 'true' : undefined" aria-describedby="rf-brand-err">
                            <option :value="null" disabled>Marke wählen</option>
                            <option v-for="brand in brands" :key="brand.value" :value="brand.value">{{ brand.label }}</option>
                            <option :value="NEW_BRAND">Neue Marke anlegen …</option>
                        </select>
                        <p id="rf-brand-err" class="form-field__error">{{ err('brand_id') }}</p>
                    </div>
                    <div v-if="form.brand_id === NEW_BRAND" class="form-field">
                        <label class="form-field__label" for="rf-brand-new">Name der neuen Marke</label>
                        <input id="rf-brand-new" v-model="form.brand_new" class="input" type="text" maxlength="60" :aria-invalid="err('brand_new') ? 'true' : undefined" aria-describedby="rf-brand-new-err">
                        <p id="rf-brand-new-err" class="form-field__error">{{ err('brand_new') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="rf-name">Profil</label>
                        <input id="rf-name" v-model="form.name" class="input" type="text" maxlength="80" placeholder="PremiumContact 7" :readonly="readonly" :aria-invalid="err('name') ? 'true' : undefined" aria-describedby="rf-name-help rf-name-err">
                        <p id="rf-name-help" class="form-field__help">Der Name der Profilreihe, so wie der Hersteller ihn schreibt.</p>
                        <p id="rf-name-err" class="form-field__error">{{ err('name') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="rf-season">Saison</label>
                        <select id="rf-season" v-model="form.season" class="input rf-mid" :disabled="readonly" :aria-invalid="err('season') ? 'true' : undefined" aria-describedby="rf-season-err">
                            <option value="" disabled>Saison wählen</option>
                            <option v-for="season in options.seasons" :key="season.value" :value="season.value">{{ season.label }}</option>
                        </select>
                        <p id="rf-season-err" class="form-field__error">{{ err('season') }}</p>
                    </div>
                </div>
            </section>

            <!-- ── Größe ─────────────────────────────────────────────────────── -->
            <section class="adm-section" aria-labelledby="rf-h-size">
                <div class="adm-section__head">
                    <h2 id="rf-h-size" class="adm-section__title">Größe</h2>
                    <p v-if="sizeLabel" class="rf-size-preview" aria-live="polite">{{ sizeLabel }}</p>
                </div>
                <div class="adm-fields">
                    <p v-if="tyre?.sold && !readonly" class="adm-note">
                        Dieser Reifen wurde schon bestellt. Größe, Lastindex und Geschwindigkeitssymbol lassen sich deshalb nicht mehr ändern.
                        Für andere Werte leg über „Weitere Größe anlegen“ im Menü einen neuen Reifen an.
                    </p>
                    <!-- As the tyre's wall prints it, side by side: 225 / 45 R 18 · 95 Y. -->
                    <div class="rf-row">
                        <div class="form-field">
                            <label class="form-field__label" for="rf-width">Breite in mm</label>
                            <input id="rf-width" v-model="form.width_mm" class="input num" type="text" inputmode="numeric" maxlength="3" placeholder="225" :readonly="sizeLocked" :aria-invalid="err('width_mm') ? 'true' : undefined" aria-describedby="rf-width-err">
                            <p id="rf-width-err" class="form-field__error">{{ err('width_mm') }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="rf-aspect">Querschnitt in %</label>
                            <input id="rf-aspect" v-model="form.aspect" class="input num" type="text" inputmode="numeric" maxlength="2" placeholder="45" :readonly="sizeLocked" :aria-invalid="err('aspect') ? 'true' : undefined" aria-describedby="rf-aspect-err">
                            <p id="rf-aspect-err" class="form-field__error">{{ err('aspect') }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="rf-diameter">Durchmesser in Zoll</label>
                            <input id="rf-diameter" v-model="form.diameter_in" class="input num" type="text" inputmode="numeric" maxlength="2" placeholder="18" :readonly="sizeLocked" :aria-invalid="err('diameter_in') ? 'true' : undefined" aria-describedby="rf-diameter-err">
                            <p id="rf-diameter-err" class="form-field__error">{{ err('diameter_in') }}</p>
                        </div>
                    </div>
                    <div class="rf-row">
                        <div class="form-field">
                            <label class="form-field__label" for="rf-load">Lastindex</label>
                            <input id="rf-load" v-model="form.load_index" class="input num" type="text" inputmode="numeric" maxlength="3" placeholder="95" :readonly="sizeLocked" :aria-invalid="err('load_index') ? 'true' : undefined" aria-describedby="rf-load-err">
                            <p id="rf-load-err" class="form-field__error">{{ err('load_index') }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="rf-speed">Geschwindigkeitssymbol</label>
                            <select id="rf-speed" v-model="form.speed_symbol" class="input" :disabled="sizeLocked" :aria-invalid="err('speed_symbol') ? 'true' : undefined" aria-describedby="rf-speed-err">
                                <option value="" disabled>Symbol wählen</option>
                                <option v-for="symbol in options.speedSymbols" :key="symbol" :value="symbol">{{ symbol }}</option>
                            </select>
                            <p id="rf-speed-err" class="form-field__error">{{ err('speed_symbol') }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── EU-Reifenlabel ────────────────────────────────────────────── -->
            <section class="adm-section" aria-labelledby="rf-h-label">
                <div class="adm-section__head">
                    <h2 id="rf-h-label" class="adm-section__title">EU-Reifenlabel</h2>
                </div>
                <p class="rf-section-note">Trag die Werte so ein, wie sie auf dem Label und in EPREL stehen. Erst wenn alle eingetragen sind, bietet der Shop den Reifen an.</p>
                <div class="rf-label-grid">
                    <div class="adm-fields">
                        <div class="rf-row rf-row--label">
                            <div class="form-field">
                                <label class="form-field__label" for="rf-fuel">Kraftstoffeffizienz</label>
                                <select id="rf-fuel" v-model="form.eu_fuel_class" class="input" :disabled="readonly" :aria-invalid="err('eu_fuel_class') ? 'true' : undefined" aria-describedby="rf-fuel-err">
                                    <option value="">Noch nicht eingetragen</option>
                                    <option v-for="c in options.classes" :key="c" :value="c">Klasse {{ c }}</option>
                                </select>
                                <p id="rf-fuel-err" class="form-field__error">{{ err('eu_fuel_class') }}</p>
                            </div>
                            <div class="form-field">
                                <label class="form-field__label" for="rf-wet">Nasshaftung</label>
                                <select id="rf-wet" v-model="form.eu_wet_grip_class" class="input" :disabled="readonly" :aria-invalid="err('eu_wet_grip_class') ? 'true' : undefined" aria-describedby="rf-wet-err">
                                    <option value="">Noch nicht eingetragen</option>
                                    <option v-for="c in options.classes" :key="c" :value="c">Klasse {{ c }}</option>
                                </select>
                                <p id="rf-wet-err" class="form-field__error">{{ err('eu_wet_grip_class') }}</p>
                            </div>
                        </div>
                        <div class="rf-row rf-row--label">
                            <div class="form-field">
                                <label class="form-field__label" for="rf-noise">Externes Rollgeräusch in dB</label>
                                <input id="rf-noise" v-model="form.eu_noise_db" class="input num" type="text" inputmode="numeric" maxlength="2" placeholder="71" :readonly="readonly" :aria-invalid="err('eu_noise_db') ? 'true' : undefined" aria-describedby="rf-noise-err">
                                <p id="rf-noise-err" class="form-field__error">{{ err('eu_noise_db') }}</p>
                            </div>
                            <div class="form-field">
                                <label class="form-field__label" for="rf-noise-class">Rollgeräuschklasse</label>
                                <select id="rf-noise-class" v-model="form.eu_noise_class" class="input" :disabled="readonly" :aria-invalid="err('eu_noise_class') ? 'true' : undefined" aria-describedby="rf-noise-class-err">
                                    <option value="">Noch nicht eingetragen</option>
                                    <option v-for="c in options.noiseClasses" :key="c" :value="c">Klasse {{ c }}</option>
                                </select>
                                <p id="rf-noise-class-err" class="form-field__error">{{ err('eu_noise_class') }}</p>
                            </div>
                        </div>
                        <div class="rf-row rf-row--label">
                            <fieldset class="form-field rf-choice" :aria-invalid="err('eu_snow_grip') ? 'true' : undefined" aria-describedby="rf-snow-help rf-snow-err">
                                <legend class="form-field__label">Schneegriffigkeit</legend>
                                <div class="rf-choice__options">
                                    <label class="rf-choice__option"><input v-model="form.eu_snow_grip" type="radio" name="rf-snow" :value="true" :disabled="readonly"> Ja</label>
                                    <label class="rf-choice__option"><input v-model="form.eu_snow_grip" type="radio" name="rf-snow" :value="false" :disabled="readonly"> Nein</label>
                                </div>
                                <p id="rf-snow-help" class="form-field__help">Ja, wenn das Label das Schnee-Piktogramm zeigt (Berg mit Schneeflocke). Fehlt es, wähl Nein.</p>
                                <p id="rf-snow-err" class="form-field__error">{{ err('eu_snow_grip') }}</p>
                            </fieldset>
                            <fieldset class="form-field rf-choice" :aria-invalid="err('eu_ice_grip') ? 'true' : undefined" aria-describedby="rf-ice-help rf-ice-err">
                                <legend class="form-field__label">Eisgriffigkeit</legend>
                                <div class="rf-choice__options">
                                    <label class="rf-choice__option"><input v-model="form.eu_ice_grip" type="radio" name="rf-ice" :value="true" :disabled="readonly"> Ja</label>
                                    <label class="rf-choice__option"><input v-model="form.eu_ice_grip" type="radio" name="rf-ice" :value="false" :disabled="readonly"> Nein</label>
                                </div>
                                <p id="rf-ice-help" class="form-field__help">Ja, wenn das Label das Eis-Piktogramm zeigt. Fehlt es, wähl Nein.</p>
                                <p id="rf-ice-err" class="form-field__error">{{ err('eu_ice_grip') }}</p>
                            </fieldset>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="rf-eprel">EPREL-Nummer</label>
                            <input id="rf-eprel" v-model="form.eprel_id" class="input num rf-mid" type="text" inputmode="numeric" maxlength="16" spellcheck="false" autocomplete="off" placeholder="381090" :readonly="readonly" :aria-invalid="err('eprel_id') ? 'true' : undefined" aria-describedby="rf-eprel-help rf-eprel-err">
                            <p id="rf-eprel-help" class="form-field__help">Die Registriernummer des Reifens in der EU-Produktdatenbank EPREL. Der QR-Code auf dem Label öffnet seine EPREL-Seite, dort steht sie. Der Shop verlinkt das Label auf diese Seite.</p>
                            <p id="rf-eprel-err" class="form-field__error">{{ err('eprel_id') }}</p>
                        </div>
                    </div>

                    <!-- The label as the shop prints it, from what is typed. -->
                    <div class="rf-preview">
                        <p class="rf-preview__head">Vorschau</p>
                        <TyreLabel v-if="preview" v-bind="preview" />
                        <p v-else class="rf-preview__empty">Die Vorschau erscheint, sobald Kraftstoffeffizienz, Nasshaftung, Rollgeräusch und Rollgeräuschklasse eingetragen sind.</p>
                    </div>
                </div>
            </section>

            <!-- ── Verkauf ───────────────────────────────────────────────────── -->
            <section class="adm-section" aria-labelledby="rf-h-sale">
                <div class="adm-section__head">
                    <h2 id="rf-h-sale" class="adm-section__title">Verkauf</h2>
                </div>
                <div class="adm-fields">
                    <div class="rf-row">
                        <div class="form-field">
                            <label class="form-field__label" for="rf-price">Preis je Reifen in €</label>
                            <input id="rf-price" v-model="form.price" class="input num" type="text" inputmode="decimal" maxlength="12" placeholder="129,00" :readonly="readonly" :aria-invalid="err('price') ? 'true' : undefined" aria-describedby="rf-price-help rf-price-err">
                            <p id="rf-price-help" class="form-field__help">Mit Mehrwertsteuer, ohne Montage und Auswuchten.</p>
                            <p id="rf-price-err" class="form-field__error">{{ err('price') }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="rf-available">Verfügbarkeit</label>
                            <select id="rf-available" v-model="form.available" class="input" :disabled="readonly" aria-describedby="rf-available-err">
                                <option :value="true">Verfügbar</option>
                                <option :value="false">Nicht verfügbar</option>
                            </select>
                            <p id="rf-available-err" class="form-field__error">{{ err('available') }}</p>
                        </div>
                    </div>
                </div>
            </section>
        </form>

        <AdminSaveBar v-if="editable" :editor="editor" />

        <AdminConfirm
            v-model:open="removeOpen"
            title="Reifen entfernen?"
            body="Der Shop bietet ihn danach nicht mehr an. Bestellungen, in denen er steht, behalten ihn."
            confirm-label="Entfernen"
            :busy="removing"
            @confirm="remove"
        />
    </AdminPage>
</template>

<style scoped>
.rf-form .form-field__error:empty {
    display: none;
}

.rf-first {
    margin-bottom: var(--sp-24);
}

/* What the shop does with the tyre, in the Felge's Freigabe-Check's own values: one line each, a reason marked. */
.rf-state {
    display: grid;
    gap: var(--sp-12);
    max-width: var(--adm-form-max);
    margin-bottom: var(--sp-32);
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

/* Where the page body already spaces its parts (a form with its save bar), the box adds no second gap. */
:global(.adm-page__body:has(> .adm-savebar) > .rf-state),
:global(.adm-page__body:has(> .adm-savebar) > .rf-first) {
    margin-bottom: 0;
}

.rf-state--off {
    background: var(--c-warn-tint);
}

/* A section head here reads left to right: the title, then what belongs to it — never pushed to the far edge. */
.rf-form .adm-section__head {
    justify-content: flex-start;
}

/* The note under its title, not beside it. */
.rf-section-note {
    max-width: var(--adm-form-max);
    margin: 0 0 var(--sp-16);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.rf-state__title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4) var(--sp-16);
    margin: 0;
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
}

.rf-state__verdict {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-ink-2);
}

.rf-state__list {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.rf-state__item {
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr);
    gap: var(--sp-8);
    align-items: start;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.rf-state__item :deep(svg) {
    margin-top: 2px;
}

.rf-state__item--bad {
    color: var(--c-ink);
    font-weight: 500;
}

.rf-state__item--bad :deep(svg) {
    color: var(--c-bad);
}

.rf-narrow {
    max-width: var(--adm-form-max);
}

.rf-mid {
    max-width: calc(24 * var(--ch-text));
}

/* What the label and the tyre's wall print side by side: fields of one width, their edges on one line. */
.rf-row {
    display: grid;
    grid-template-columns: repeat(3, calc(18 * var(--ch-text)));
    gap: var(--sp-16);
    align-items: start;
}

/* The label's entries are longer words („Externes Rollgeräusch in dB“): two wider columns, so no label wraps. */
.rf-row--label {
    grid-template-columns: repeat(2, calc(26 * var(--ch-text)));
}

.rf-size-preview {
    margin: 0;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--c-ink);
}

.rf-choice {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
}

/* A legend sits on the same edge as every other label. */
.rf-choice legend {
    padding: 0;
}

/* „Ja“ and „Nein“ side by side, as one answer. */
.rf-choice__options {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--sp-24);
}

.rf-choice__option {
    display: inline-flex;
    gap: var(--sp-8);
    align-items: center;
    min-height: 44px;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
}

/* The shop's own radio, as `.check` draws it: 18 px, in the accent. */
.rf-choice__option input {
    flex: none;
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--c-blue);
}

/* The fields, then the preview right beside them — no band of empty page between. */
.rf-label-grid {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: var(--sp-48);
    align-items: start;
}

.rf-preview {
    display: grid;
    gap: var(--sp-8);
    position: sticky;
    top: var(--sp-24);
}

/* A label like every field's, in sentence case (DIRECTION §3). */
.rf-preview__head {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-ink-2);
}

.rf-preview__empty {
    max-width: calc(30 * var(--ch-text));
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-3);
}

/* Below 1100 the preview goes under the fields rather than squeezing them. */
@media (max-width: 1099px) {
    .rf-label-grid {
        grid-template-columns: minmax(0, 1fr);
    }

    .rf-preview {
        position: static;
    }
}

@media (max-width: 767px) {
    /* A row as the tyre's wall prints it stays one row — 225 / 45 / 18 side by side —, its fields sharing the width. */
    .rf-row {
        grid-template-columns: none;
        grid-auto-columns: minmax(0, 1fr);
        grid-auto-flow: column;
    }

    /* The label's longer names stack before they squeeze. */
    .rf-row--label {
        grid-template-columns: minmax(0, 1fr);
        grid-auto-flow: row;
    }

    .rf-mid {
        max-width: none;
    }
}
</style>
