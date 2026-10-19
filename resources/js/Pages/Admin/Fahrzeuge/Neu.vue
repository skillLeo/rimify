<script setup lang="ts">
/**
 * Fahrzeuge › Neues Fahrzeug (his admin items 1 and 3, D-296): a car typed by hand from its Zulassungsbescheinigung
 * Teil I, each field with the number it stands under in the papers. HSN and TSN are how a customer finds the car; field K
 * and the Fahrzeugtyp are how the Gutachten name it; the axle loads (8.1, 8.2) are what its tyres are answered from
 * (R-03). An axle load left empty costs what the dialog says before it saves, and the car waits under „Zur Prüfung“. The
 * top speed (T) is asked only where a released Gutachten needs it (D-287) — none names a car not yet saved, so it is
 * optional here and its page asks for it once one does.
 *
 * One column, as every admin form; what the papers print side by side stands side by side: 2.1 and 2.2, 8.1 and 8.2,
 * the start and the end of the build window.
 */

import { useForm } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import { afterDialogsClose, focusRefused } from '../../../composables/admin/focusRefused'
import AdminLayout from '../../../Layouts/AdminLayout.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

defineProps<{
    bodyForms: string[]
    drives: string[]
}>()

const form = useForm({
    make: '',
    model: '',
    variant: '',
    type_designation: '',
    hsn: '',
    tsn: '',
    eg_number: '',
    power_kw: '',
    build_from: '',
    build_to: '',
    body_form: '',
    drive_axle: '',
    axle_load_front_kg: '',
    axle_load_rear_kg: '',
    max_speed_kmh: '',
})

const errors = computed(() => form.errors as Record<string, string | undefined>)

/** The axle loads left empty, each on its own as the vehicle's page names them (D-291): the tyres wait for them (R-03). */
const missingAxles = computed(() => [
    ...(form.axle_load_front_kg.trim() === '' ? [{ id: 'fn-front', field: '8.1', name: 'Achslast vorn' }] : []),
    ...(form.axle_load_rear_kg.trim() === '' ? [{ id: 'fn-rear', field: '8.2', name: 'Achslast hinten' }] : []),
])

/** The question before saving, naming only what is missing. */
const warning = computed(() => {
    const both = missingAxles.value.length > 1
    const what = both ? 'Achslasten' : (missingAxles.value[0]?.name ?? '')
    const where = both ? 'aus den Feldern 8.1 und 8.2' : `aus Feld ${missingAxles.value[0]?.field ?? ''}`

    return {
        title: `Ohne ${what} anlegen?`,
        body:
            `Ohne die ${what} ${where} bestätigt der Shop für dieses Fahrzeug keine Reifen und verkauft kein Komplettrad. ` +
            'Eine Felge allein verkauft er nur, wo ihre Freigabe nicht an einer Achslast hängt. Das Fahrzeug steht unter „Zur Prüfung“, bis du die fehlenden Werte einträgst.',
        save: `Ohne ${what} anlegen`,
        enter: `${what} eintragen`,
    }
})

const warnOpen = ref(false)

/** Where the focus goes when the dialog closes on „… eintragen“: the first empty axle load, not the button that opened it. */
let enterAt: string | null = null

function submit(): void {
    if (form.processing) {
        return
    }

    if (missingAxles.value.length > 0) {
        warnOpen.value = true

        return
    }

    send()
}

function send(): void {
    warnOpen.value = false
    form.post('/admin/fahrzeuge', {
        preserveScroll: true,
        // After the question has closed: its closing hands the focus back to the button that opened it.
        onError: () => afterDialogsClose(() => focusRefused('.fn-form')),
    })
}

function enterAxles(): void {
    enterAt = missingAxles.value[0]?.id ?? null
    warnOpen.value = false
}

function onWarnClosed(event: Event): void {
    const field = enterAt === null ? null : document.getElementById(enterAt)
    enterAt = null

    if (field !== null) {
        event.preventDefault()
        field.focus()
    }
}
</script>

<template>
    <AdminPage title="Neues Fahrzeug" context="Aus der Zulassungsbescheinigung Teil I, von Hand geprüft">
        <form class="adm-form fn-form" novalidate @submit.prevent="submit">
            <section class="adm-form__group" aria-labelledby="fn-h-car">
                <h2 id="fn-h-car" class="adm-form__heading">Das Fahrzeug</h2>
                <div class="fn-grid">
                    <div class="form-field">
                        <label class="form-field__label" for="fn-make">Hersteller <span class="fn-field">(Feld D.1)</span></label>
                        <input id="fn-make" v-model="form.make" class="input" type="text" maxlength="60" placeholder="BMW" :aria-invalid="errors.make ? 'true' : undefined" aria-describedby="fn-make-err">
                        <p id="fn-make-err" class="form-field__error">{{ errors.make }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fn-model">Handelsbezeichnung <span class="fn-field">(Feld D.3)</span></label>
                        <input id="fn-model" v-model="form.model" class="input" type="text" maxlength="80" placeholder="3er" :aria-invalid="errors.model ? 'true' : undefined" aria-describedby="fn-model-err">
                        <p id="fn-model-err" class="form-field__error">{{ errors.model }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fn-variant">Variante</label>
                        <input id="fn-variant" v-model="form.variant" class="input" type="text" maxlength="80" placeholder="320i Limousine" :aria-invalid="errors.variant ? 'true' : undefined" aria-describedby="fn-variant-help fn-variant-err">
                        <p id="fn-variant-help" class="form-field__help">So, wie Kunden das Fahrzeug in der Auswahl finden.</p>
                        <p id="fn-variant-err" class="form-field__error">{{ errors.variant }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fn-type">Fahrzeugtyp <span class="fn-field">(Feld D.2, optional)</span></label>
                        <input id="fn-type" v-model="form.type_designation" class="input fn-mid" type="text" maxlength="32" spellcheck="false" placeholder="3C" :aria-invalid="errors.type_designation ? 'true' : undefined" aria-describedby="fn-type-help fn-type-err">
                        <p id="fn-type-help" class="form-field__help">Die erste Angabe in Feld D.2 – so nennen die Gutachten den Typ.</p>
                        <p id="fn-type-err" class="form-field__error">{{ errors.type_designation }}</p>
                    </div>
                </div>
            </section>

            <section class="adm-form__group" aria-labelledby="fn-h-keys">
                <h2 id="fn-h-keys" class="adm-form__heading">Schlüsselnummern und Typgenehmigung</h2>
                <div class="fn-grid">
                    <div class="fn-pair">
                        <div class="form-field">
                            <label class="form-field__label" for="fn-hsn">HSN <span class="fn-field">(Feld 2.1)</span></label>
                            <input id="fn-hsn" v-model="form.hsn" class="input input--code" type="text" inputmode="numeric" spellcheck="false" autocomplete="off" placeholder="0005" :aria-invalid="errors.hsn ? 'true' : undefined" aria-describedby="fn-hsn-err">
                            <p id="fn-hsn-err" class="form-field__error">{{ errors.hsn }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="fn-tsn">TSN <span class="fn-field">(Feld 2.2)</span></label>
                            <input id="fn-tsn" v-model="form.tsn" class="input input--code" type="text" spellcheck="false" autocomplete="off" autocapitalize="characters" placeholder="AFD" :aria-invalid="errors.tsn ? 'true' : undefined" aria-describedby="fn-tsn-help fn-tsn-err">
                            <p id="fn-tsn-help" class="form-field__help">Die ersten drei Zeichen aus Feld 2.2.</p>
                            <p id="fn-tsn-err" class="form-field__error">{{ errors.tsn }}</p>
                        </div>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fn-eg">EG-Typgenehmigungsnummer <span class="fn-field">(Feld K)</span></label>
                        <input id="fn-eg" v-model="form.eg_number" class="input num" type="text" maxlength="64" spellcheck="false" autocomplete="off" placeholder="e1*2007/46*0316*12" :aria-invalid="errors.eg_number ? 'true' : undefined" aria-describedby="fn-eg-help fn-eg-err">
                        <p id="fn-eg-help" class="form-field__help">Bei älteren Fahrzeugen steht hier eine nationale ABE-Nummer. Über die Nummer und den Fahrzeugtyp findest du das Fahrzeug, wenn du die Zeilen eines Gutachtens erfasst.</p>
                        <p id="fn-eg-err" class="form-field__error">{{ errors.eg_number }}</p>
                    </div>
                </div>
            </section>

            <section class="adm-form__group" aria-labelledby="fn-h-build">
                <h2 id="fn-h-build" class="adm-form__heading">Leistung, Bauzeit, Karosserie und Antrieb</h2>
                <div class="fn-grid">
                    <div class="form-field">
                        <label class="form-field__label" for="fn-kw">Leistung in kW <span class="fn-field">(Feld P.2)</span></label>
                        <input id="fn-kw" v-model="form.power_kw" class="input fn-short num" type="text" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="135" :aria-invalid="errors.power_kw ? 'true' : undefined" aria-describedby="fn-kw-help fn-kw-err">
                        <p id="fn-kw-help" class="form-field__help">Die erste Zahl in Feld P.2.</p>
                        <p id="fn-kw-err" class="form-field__error">{{ errors.power_kw }}</p>
                    </div>
                    <div class="fn-window">
                        <div class="fn-pair">
                            <div class="form-field">
                                <label class="form-field__label" for="fn-from">Gebaut ab</label>
                                <input id="fn-from" v-model="form.build_from" class="input num" type="text" inputmode="decimal" maxlength="7" autocomplete="off" placeholder="MM.JJJJ" :aria-invalid="errors.build_from ? 'true' : undefined" aria-describedby="fn-window-help fn-from-err">
                                <p id="fn-from-err" class="form-field__error">{{ errors.build_from }}</p>
                            </div>
                            <div class="form-field">
                                <label class="form-field__label" for="fn-to">Gebaut bis <span class="fn-optional">(optional)</span></label>
                                <input id="fn-to" v-model="form.build_to" class="input num" type="text" inputmode="decimal" maxlength="7" autocomplete="off" placeholder="MM.JJJJ" :aria-invalid="errors.build_to ? 'true' : undefined" aria-describedby="fn-window-help fn-to-err">
                                <p id="fn-to-err" class="form-field__error">{{ errors.build_to }}</p>
                            </div>
                        </div>
                        <p id="fn-window-help" class="form-field__help">Monat und Jahr, von wann bis wann das Fahrzeug in dieser Variante gebaut wird – nicht die Erstzulassung aus Feld B. „Gebaut bis“ bleibt leer, wenn es noch gebaut wird.</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fn-body">Karosserie <span class="fn-optional">(optional)</span></label>
                        <select id="fn-body" v-model="form.body_form" class="input fn-mid" :aria-invalid="errors.body_form ? 'true' : undefined" aria-describedby="fn-body-err">
                            <option value="">Nicht angegeben</option>
                            <option v-for="body in bodyForms" :key="body" :value="body">{{ body }}</option>
                        </select>
                        <p id="fn-body-err" class="form-field__error">{{ errors.body_form }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fn-drive">Antrieb <span class="fn-optional">(optional)</span></label>
                        <select id="fn-drive" v-model="form.drive_axle" class="input fn-mid" :aria-invalid="errors.drive_axle ? 'true' : undefined" aria-describedby="fn-drive-err">
                            <option value="">Nicht angegeben</option>
                            <option v-for="drive in drives" :key="drive" :value="drive">{{ drive }}</option>
                        </select>
                        <p id="fn-drive-err" class="form-field__error">{{ errors.drive_axle }}</p>
                    </div>
                </div>
            </section>

            <section class="adm-form__group" aria-labelledby="fn-h-tyres">
                <h2 id="fn-h-tyres" class="adm-form__heading">Für die Reifen</h2>
                <div class="fn-grid">
                    <div class="fn-pair">
                        <div class="form-field">
                            <label class="form-field__label" for="fn-front">Achslast vorn in kg <span class="fn-field">(Feld 8.1)</span></label>
                            <input id="fn-front" v-model="form.axle_load_front_kg" class="input num" type="text" inputmode="numeric" maxlength="5" autocomplete="off" placeholder="1.160" :aria-invalid="errors.axle_load_front_kg ? 'true' : undefined" aria-describedby="fn-front-err">
                            <p id="fn-front-err" class="form-field__error">{{ errors.axle_load_front_kg }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="fn-rear">Achslast hinten in kg <span class="fn-field">(Feld 8.2)</span></label>
                            <input id="fn-rear" v-model="form.axle_load_rear_kg" class="input num" type="text" inputmode="numeric" maxlength="5" autocomplete="off" placeholder="1.240" :aria-invalid="errors.axle_load_rear_kg ? 'true' : undefined" aria-describedby="fn-rear-err">
                            <p id="fn-rear-err" class="form-field__error">{{ errors.axle_load_rear_kg }}</p>
                        </div>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fn-speed">Höchstgeschwindigkeit in km/h <span class="fn-field">(Feld T, optional)</span></label>
                        <input id="fn-speed" v-model="form.max_speed_kmh" class="input fn-short num" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="230" :aria-invalid="errors.max_speed_kmh ? 'true' : undefined" aria-describedby="fn-speed-help fn-speed-err">
                        <p id="fn-speed-help" class="form-field__help">Ohne sie steht das Fahrzeug unter „Zur Prüfung“. Nötig wird sie erst, wenn ein freigegebenes Gutachten dieses Fahrzeug nennt und sie für die Reifen braucht. Die Seite des Fahrzeugs nennt es dir dann.</p>
                        <p id="fn-speed-err" class="form-field__error">{{ errors.max_speed_kmh }}</p>
                    </div>
                </div>
            </section>

            <div class="fn-actions">
                <button class="btn btn--primary" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Fahrzeug anlegen</button>
            </div>
        </form>

        <!-- Not a confirmation of something that cannot be undone (AdminConfirm): a question with a way back to the field. -->
        <Dialog
            v-model:open="warnOpen"
            :title="warning.title"
            :description="warning.body"
            content-class="adm-dialog adm-dialog--narrow"
            initial-focus="#fn-warn-enter"
            @close-auto-focus="onWarnClosed"
        >
            <template #actions>
                <button class="btn btn--secondary adm-btn--danger" type="button" :aria-busy="form.processing ? 'true' : undefined" @click="send">{{ warning.save }}</button>
                <button id="fn-warn-enter" class="btn btn--primary" type="button" @click="enterAxles">{{ warning.enter }}</button>
            </template>
        </Dialog>
    </AdminPage>
</template>

<style scoped>
.fn-form .form-field__error:empty {
    display: none;
}

.fn-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-16);
}

/* What the papers print side by side: two fields of one width, their edges on one line. */
.fn-pair {
    display: grid;
    grid-template-columns: repeat(2, calc(16 * var(--ch-text)));
    gap: var(--sp-16);
    align-items: start;
}

.fn-window {
    display: grid;
    gap: var(--sp-8);
}

.fn-short {
    max-width: calc(16 * var(--ch-text));
}

.fn-mid {
    max-width: calc(34 * var(--ch-text));
}

/* The field's number in the papers, beside its name: what the person looks for on the Zulassungsbescheinigung. */
.fn-field,
.fn-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.fn-field {
    font-variant-numeric: tabular-nums;
}

.fn-actions {
    display: flex;
    gap: var(--sp-8);
}

@media (max-width: 767px) {
    .fn-pair {
        grid-template-columns: minmax(0, 1fr);
    }

    .fn-short,
    .fn-mid {
        max-width: none;
    }

    .fn-actions .btn {
        width: 100%;
        min-height: var(--adm-control-h-lg);
    }
}
</style>
