<script setup lang="ts">
/**
 * „Angaben korrigieren“ on a vehicle typed by hand that nothing refers to yet (the admin audit's F-17): the papers' own
 * details, each under the number it stands under in the Zulassungsbescheinigung, as „Neues Fahrzeug“ asks for them.
 * The axle loads and the top speed have their own form on the page. A save made from a page opened before another
 * change is refused (EditStamp), and what was typed stays.
 */

import { useForm } from '@inertiajs/vue3'
import { computed } from 'vue'
import { focusRefused } from '../../../composables/admin/focusRefused'
import { stampHeaders } from '../../../composables/admin/useDirtyForm'

const props = defineProps<{
    vehicleId: number
    /** The details as stored, as the form shows them (VehicleCorrection::form). */
    values: Record<string, string>
    bodyForms: string[]
    drives: string[]
    stamp: string | null
}>()

const emit = defineEmits<{ done: []; cancel: [] }>()

const form = useForm({
    make: props.values.make ?? '',
    model: props.values.model ?? '',
    variant: props.values.variant ?? '',
    type_designation: props.values.type_designation ?? '',
    hsn: props.values.hsn ?? '',
    tsn: props.values.tsn ?? '',
    eg_number: props.values.eg_number ?? '',
    power_kw: props.values.power_kw ?? '',
    build_from: props.values.build_from ?? '',
    build_to: props.values.build_to ?? '',
    body_form: props.values.body_form ?? '',
    drive_axle: props.values.drive_axle ?? '',
})

const errors = computed(() => form.errors as Record<string, string | undefined>)

function save(): void {
    if (form.processing) {
        return
    }

    form.put(`/admin/fahrzeuge/${props.vehicleId}/angaben`, {
        preserveScroll: true,
        headers: stampHeaders(props.stamp),
        onSuccess: () => emit('done'),
        onError: () => focusRefused('.fk-form'),
    })
}
</script>

<template>
    <form class="adm-form fk-form" novalidate @submit.prevent="save">
        <p v-if="errors._stamp" class="adm-alert" role="alert">{{ errors._stamp }}</p>
        <p v-if="errors._vehicle" class="adm-alert" role="alert">{{ errors._vehicle }}</p>

        <div class="fk-grid">
            <div class="form-field">
                <label class="form-field__label" for="fk-make">Hersteller <span class="fk-field">(Feld D.1)</span></label>
                <input id="fk-make" v-model="form.make" class="input" type="text" maxlength="60" :aria-invalid="errors.make ? 'true' : undefined" aria-describedby="fk-make-err">
                <p id="fk-make-err" class="form-field__error">{{ errors.make }}</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="fk-model">Handelsbezeichnung <span class="fk-field">(Feld D.3)</span></label>
                <input id="fk-model" v-model="form.model" class="input" type="text" maxlength="80" :aria-invalid="errors.model ? 'true' : undefined" aria-describedby="fk-model-err">
                <p id="fk-model-err" class="form-field__error">{{ errors.model }}</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="fk-variant">Variante</label>
                <input id="fk-variant" v-model="form.variant" class="input" type="text" maxlength="80" :aria-invalid="errors.variant ? 'true' : undefined" aria-describedby="fk-variant-err">
                <p id="fk-variant-err" class="form-field__error">{{ errors.variant }}</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="fk-type">Fahrzeugtyp <span class="fk-field">(Feld D.2, optional)</span></label>
                <input id="fk-type" v-model="form.type_designation" class="input fk-mid" type="text" maxlength="32" spellcheck="false" :aria-invalid="errors.type_designation ? 'true' : undefined" aria-describedby="fk-type-err">
                <p id="fk-type-err" class="form-field__error">{{ errors.type_designation }}</p>
            </div>
            <div class="fk-pair">
                <div class="form-field">
                    <label class="form-field__label" for="fk-hsn">HSN <span class="fk-field">(Feld 2.1)</span></label>
                    <input id="fk-hsn" v-model="form.hsn" class="input input--code" type="text" inputmode="numeric" spellcheck="false" autocomplete="off" :aria-invalid="errors.hsn ? 'true' : undefined" aria-describedby="fk-hsn-err">
                    <p id="fk-hsn-err" class="form-field__error">{{ errors.hsn }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fk-tsn">TSN <span class="fk-field">(Feld 2.2)</span></label>
                    <input id="fk-tsn" v-model="form.tsn" class="input input--code" type="text" spellcheck="false" autocomplete="off" autocapitalize="characters" :aria-invalid="errors.tsn ? 'true' : undefined" aria-describedby="fk-tsn-help fk-tsn-err">
                    <p id="fk-tsn-help" class="form-field__help">Die ersten drei Zeichen aus Feld 2.2.</p>
                    <p id="fk-tsn-err" class="form-field__error">{{ errors.tsn }}</p>
                </div>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="fk-eg">EG-Typgenehmigungsnummer <span class="fk-field">(Feld K)</span></label>
                <input id="fk-eg" v-model="form.eg_number" class="input num" type="text" maxlength="64" spellcheck="false" autocomplete="off" :aria-invalid="errors.eg_number ? 'true' : undefined" aria-describedby="fk-eg-err">
                <p id="fk-eg-err" class="form-field__error">{{ errors.eg_number }}</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="fk-kw">Leistung in kW <span class="fk-field">(Feld P.2)</span></label>
                <input id="fk-kw" v-model="form.power_kw" class="input fk-short num" type="text" inputmode="numeric" maxlength="4" autocomplete="off" :aria-invalid="errors.power_kw ? 'true' : undefined" aria-describedby="fk-kw-help fk-kw-err">
                <p id="fk-kw-help" class="form-field__help">Die erste Zahl in Feld P.2.</p>
                <p id="fk-kw-err" class="form-field__error">{{ errors.power_kw }}</p>
            </div>
            <div class="fk-window">
                <div class="fk-pair">
                    <div class="form-field">
                        <label class="form-field__label" for="fk-from">Gebaut ab</label>
                        <input id="fk-from" v-model="form.build_from" class="input num" type="text" inputmode="decimal" maxlength="7" autocomplete="off" placeholder="MM.JJJJ" :aria-invalid="errors.build_from ? 'true' : undefined" aria-describedby="fk-window-help fk-from-err">
                        <p id="fk-from-err" class="form-field__error">{{ errors.build_from }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fk-to">Gebaut bis <span class="fk-optional">(optional)</span></label>
                        <input id="fk-to" v-model="form.build_to" class="input num" type="text" inputmode="decimal" maxlength="7" autocomplete="off" placeholder="MM.JJJJ" :aria-invalid="errors.build_to ? 'true' : undefined" aria-describedby="fk-window-help fk-to-err">
                        <p id="fk-to-err" class="form-field__error">{{ errors.build_to }}</p>
                    </div>
                </div>
                <p id="fk-window-help" class="form-field__help">Monat und Jahr, von wann bis wann das Fahrzeug in dieser Variante gebaut wird – nicht die Erstzulassung aus Feld B. „Gebaut bis“ bleibt leer, wenn es noch gebaut wird.</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="fk-body">Karosserie <span class="fk-optional">(optional)</span></label>
                <select id="fk-body" v-model="form.body_form" class="input fk-mid" :aria-invalid="errors.body_form ? 'true' : undefined" aria-describedby="fk-body-err">
                    <option value="">Nicht angegeben</option>
                    <option v-for="body in bodyForms" :key="body" :value="body">{{ body }}</option>
                </select>
                <p id="fk-body-err" class="form-field__error">{{ errors.body_form }}</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="fk-drive">Antrieb <span class="fk-optional">(optional)</span></label>
                <select id="fk-drive" v-model="form.drive_axle" class="input fk-mid" :aria-invalid="errors.drive_axle ? 'true' : undefined" aria-describedby="fk-drive-err">
                    <option value="">Nicht angegeben</option>
                    <option v-for="drive in drives" :key="drive" :value="drive">{{ drive }}</option>
                </select>
                <p id="fk-drive-err" class="form-field__error">{{ errors.drive_axle }}</p>
            </div>
        </div>

        <div class="fk-actions">
            <button class="btn btn--primary" type="submit" :disabled="form.processing || !form.isDirty" :aria-busy="form.processing ? 'true' : undefined">Korrektur speichern</button>
            <button class="btn btn--secondary" type="button" :disabled="form.processing" @click="emit('cancel')">Abbrechen</button>
        </div>
    </form>
</template>

<style scoped>
.fk-form .form-field__error:empty {
    display: none;
}

.fk-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-16);
}

/* What the papers print side by side stands side by side, as on „Neues Fahrzeug“. */
.fk-pair {
    display: grid;
    grid-template-columns: repeat(2, calc(16 * var(--ch-text)));
    gap: var(--sp-16);
    align-items: start;
}

.fk-window {
    display: grid;
    gap: var(--sp-8);
}

.fk-short {
    max-width: calc(16 * var(--ch-text));
}

.fk-mid {
    max-width: calc(34 * var(--ch-text));
}

.fk-field,
.fk-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.fk-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

@media (max-width: 767px) {
    .fk-pair {
        grid-template-columns: minmax(0, 1fr);
    }

    .fk-short,
    .fk-mid {
        max-width: none;
    }
}
</style>
