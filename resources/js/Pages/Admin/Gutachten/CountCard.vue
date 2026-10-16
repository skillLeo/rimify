<script setup lang="ts">
/**
 * The count of a Gutachten's Verwendungsbereich (ADMIN-GEFUNDEN 511): read off the PDF before the rows are entered,
 * each figure with the page it stands on — „6 Auflagen-Codes, Seite 3“. The release compares the entry with it in the
 * sentences D-228 has always used; a count taken after the entry says so here and in the Protokoll.
 *
 * Saved into its own error bag (`zaehlung`): the release dialog on the same page asks other questions.
 */

import { useForm, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import type { DocumentCount } from '../../../types/admin/gutachten'

const props = defineProps<{
    documentId: number
    count: DocumentCount | null
    editable: boolean
    pageCount: number | null
    /** Rows already entered: a count taken now is taken after the entry, and says so. */
    rows: number
}>()

const BAG = 'zaehlung'
const focus = useFocusAfter()
const page = usePage()

type Abnahme = '' | 'all' | 'some' | 'none'

function initial() {
    return {
        codes: (props.count?.codes ?? '') as number | '',
        codes_page: (props.count?.codesPage ?? '') as number | '',
        sizes: (props.count?.sizes ?? '') as number | '',
        sizes_page: (props.count?.sizesPage ?? '') as number | '',
        axle_limit_kg: (props.count?.axleLimitKg ?? '') as number | '',
        axle_limit_page: (props.count?.axleLimitPage ?? '') as number | '',
        abnahme: (props.count?.abnahme ?? '') as Abnahme,
        abnahme_page: (props.count?.abnahmePage ?? '') as number | '',
    }
}

const form = useForm(initial())
// Nothing counted yet, on a draft someone may enter: the form stands open — counting comes before the rows.
const editing = ref(props.count === null && props.editable)
const errors = computed(() => ((page.props.errors ?? {}) as Record<string, Record<string, string> | undefined>)[BAG] ?? {})
const abnahmePaged = computed(() => form.abnahme === 'all' || form.abnahme === 'some')
const number = (value: number | ''): number | null => (value === '' ? null : Number(value))

function start(): void {
    form.defaults(initial())
    form.reset()
    form.clearErrors()
    editing.value = true
    focus.request('zl-codes')
}

function cancel(): void {
    form.reset()
    form.clearErrors()
    editing.value = false
    focus.request('zl-edit')
}

function save(): void {
    form.transform((data) => ({
        codes: number(data.codes),
        codes_page: number(data.codes_page),
        sizes: number(data.sizes),
        sizes_page: number(data.sizes_page),
        axle_limit_kg: number(data.axle_limit_kg),
        axle_limit_page: data.axle_limit_kg === '' ? null : number(data.axle_limit_page),
        abnahme: data.abnahme === '' ? null : data.abnahme,
        abnahme_page: data.abnahme === 'all' || data.abnahme === 'some' ? number(data.abnahme_page) : null,
    })).post(`/admin/gutachten/${props.documentId}/zaehlung`, {
        preserveScroll: true,
        errorBag: BAG,
        onSuccess: () => {
            editing.value = false
            focus.request('zl-edit')
        },
        onError: () => {
            const first = Object.keys(errors.value)[0] ?? ''
            focus.request(first === 'abnahme' ? 'zl-abnahme-all' : first === '' ? 'zl-save' : `zl-${first.replace(/_/g, '-')}`)
        },
    })
}
</script>

<template>
    <div class="zl">
        <template v-if="!editing">
            <template v-if="count">
                <ul class="zl-lines">
                    <li v-for="line in count.lines" :key="line">{{ line }}</li>
                </ul>
                <p class="adm-note">
                    Gezählt<template v-if="count.by"> von {{ count.by }}</template> am {{ count.at }} –
                    {{ count.beforeEntry ? 'bevor die erste Zeile stand.' : 'als schon Zeilen standen.' }}
                    Die Freigabe vergleicht die Zeilen mit dieser Zählung.
                </p>
                <button v-if="editable" id="zl-edit" class="btn btn--ghost" type="button" @click="start">
                    <Icon name="edit" :size="20" />
                    Zählung ändern
                </button>
            </template>
            <p v-else class="adm-note">Noch nicht gezählt.</p>
        </template>

        <form v-else class="zl-form" novalidate aria-labelledby="zl-form-h" @submit.prevent="save">
            <p id="zl-form-h" class="form-field__label">Was der Verwendungsbereich druckt</p>
            <p class="form-field__help">
                <template v-if="rows === 0">Bevor du Zeilen erfasst: Zähl im PDF, was der Verwendungsbereich für die Fahrzeuge druckt, die du erfassen willst, und schreib zu jeder Zahl die Seite. Die Freigabe vergleicht deine Zeilen später mit dieser Zählung.</template>
                <template v-else>Zähl im PDF, was der Verwendungsbereich für alle Fahrzeuge druckt, die erfasst sind oder noch erfasst werden, und schreib zu jeder Zahl die Seite. Es stehen schon Zeilen – festgehalten wird, dass erst danach gezählt wurde.</template>
                <template v-if="count"> Eine Änderung hält das Protokoll mit dem vorherigen Stand fest.</template>
            </p>

            <div class="zl-pair">
                <div class="form-field">
                    <label class="form-field__label" for="zl-codes">Auflagen-Codes</label>
                    <input id="zl-codes" v-model.number="form.codes" class="input" type="number" min="0" inputmode="numeric" :aria-invalid="errors.codes ? 'true' : undefined" aria-describedby="zl-codes-err">
                    <p id="zl-codes-err" class="form-field__error">{{ errors.codes }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="zl-codes-page">Seite</label>
                    <input id="zl-codes-page" v-model.number="form.codes_page" class="input" type="number" min="1" :max="pageCount ?? undefined" inputmode="numeric" :aria-invalid="errors.codes_page ? 'true' : undefined" aria-describedby="zl-codes-page-err">
                    <p id="zl-codes-page-err" class="form-field__error">{{ errors.codes_page }}</p>
                </div>
            </div>

            <div class="zl-pair">
                <div class="form-field">
                    <label class="form-field__label" for="zl-sizes">Reifengrößen</label>
                    <input id="zl-sizes" v-model.number="form.sizes" class="input" type="number" min="1" inputmode="numeric" :aria-invalid="errors.sizes ? 'true' : undefined" aria-describedby="zl-sizes-err">
                    <p id="zl-sizes-err" class="form-field__error">{{ errors.sizes }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="zl-sizes-page">Seite</label>
                    <input id="zl-sizes-page" v-model.number="form.sizes_page" class="input" type="number" min="1" :max="pageCount ?? undefined" inputmode="numeric" :aria-invalid="errors.sizes_page ? 'true' : undefined" aria-describedby="zl-sizes-page-err">
                    <p id="zl-sizes-page-err" class="form-field__error">{{ errors.sizes_page }}</p>
                </div>
            </div>

            <div class="zl-pair">
                <div class="form-field">
                    <label class="form-field__label" for="zl-axle-limit-kg">Achslastgrenze in kg</label>
                    <input id="zl-axle-limit-kg" v-model.number="form.axle_limit_kg" class="input" type="number" min="200" inputmode="numeric" :aria-invalid="errors.axle_limit_kg ? 'true' : undefined" aria-describedby="zl-axle-limit-help zl-axle-limit-kg-err">
                    <p id="zl-axle-limit-help" class="form-field__help">Nur, wenn der Verwendungsbereich eine nennt – etwa „nur für Fahrzeuge mit maximaler Achslast 1160 kg“. Sonst leer lassen.</p>
                    <p id="zl-axle-limit-kg-err" class="form-field__error">{{ errors.axle_limit_kg }}</p>
                </div>
                <div v-if="form.axle_limit_kg !== ''" class="form-field">
                    <label class="form-field__label" for="zl-axle-limit-page">Seite</label>
                    <input id="zl-axle-limit-page" v-model.number="form.axle_limit_page" class="input" type="number" min="1" :max="pageCount ?? undefined" inputmode="numeric" :aria-invalid="errors.axle_limit_page ? 'true' : undefined" aria-describedby="zl-axle-limit-page-err">
                    <p id="zl-axle-limit-page-err" class="form-field__error">{{ errors.axle_limit_page }}</p>
                </div>
            </div>

            <fieldset class="zl-group">
                <legend class="form-field__label">Verlangt der Verwendungsbereich eine Abnahme?</legend>
                <label class="check">
                    <input id="zl-abnahme-all" v-model="form.abnahme" type="radio" name="zl-abnahme" value="all" aria-describedby="zl-abnahme-err">
                    <span>Ja, bei jeder Kombination</span>
                </label>
                <label class="check">
                    <input v-model="form.abnahme" type="radio" name="zl-abnahme" value="some" aria-describedby="zl-abnahme-err">
                    <span>Ja, bei einigen Kombinationen</span>
                </label>
                <label class="check">
                    <input v-model="form.abnahme" type="radio" name="zl-abnahme" value="none" aria-describedby="zl-abnahme-err">
                    <span>Nein</span>
                </label>
                <p id="zl-abnahme-err" class="form-field__error">{{ errors.abnahme }}</p>
            </fieldset>

            <div v-if="abnahmePaged" class="form-field zl-page">
                <label class="form-field__label" for="zl-abnahme-page">Seite der Abnahme</label>
                <input id="zl-abnahme-page" v-model.number="form.abnahme_page" class="input" type="number" min="1" :max="pageCount ?? undefined" inputmode="numeric" :aria-invalid="errors.abnahme_page ? 'true' : undefined" aria-describedby="zl-abnahme-page-err">
                <p id="zl-abnahme-page-err" class="form-field__error">{{ errors.abnahme_page }}</p>
            </div>

            <div class="zl-actions">
                <button id="zl-save" class="btn btn--primary" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Zählung speichern</button>
                <button v-if="count" class="btn btn--ghost" type="button" :disabled="form.processing" @click="cancel">Abbrechen</button>
            </div>
        </form>
    </div>
</template>

<style scoped>
.zl,
.zl-form {
    display: grid;
    gap: var(--sp-12);
}

.zl-form {
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.zl-form > .form-field__label,
.zl-form > .form-field__help {
    margin: 0;
}

.zl-form .form-field__error:empty {
    display: none;
}

.zl-lines {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding-left: var(--sp-20);
}

.zl-pair {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: var(--sp-16);
    max-width: 32rem;
}

.zl-page {
    max-width: 10rem;
}

.zl-group {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    border: 0;
}

.zl-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

@media (max-width: 767px) {
    .zl-pair {
        grid-template-columns: minmax(0, 1fr) minmax(0, 7rem);
    }
}
</style>
