<script setup lang="ts">
/**
 * „Freigeben“ and „Ist alles erfasst?“ (D-227, D-228): what the person releasing reads off the PDF, asked every time and
 * never defaulted — a question someone skips must stop the release, not pass it. Only the type speaks first: a
 * Teilegutachten is usually one Anlage of a longer report and always needs an Abnahme, so it starts at „Teilweise“ and
 * „Ja“. The server counts the same things in the rows and refuses on any difference.
 */
import { useForm } from '@inertiajs/vue3'
import { computed, watch } from 'vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import { focusRefused } from '../../../composables/admin/focusRefused'
import type { DocumentFacts } from '../../../types/admin/gutachten'

const props = defineProps<{
    document: DocumentFacts
    /** Rows of the document; a base without rows of its own is asked the first question only. */
    rows: number
    mode: 'release' | 'answer'
    /** What the release does, said before it is pressed. */
    note?: string
}>()

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ done: [] }>()

const partOfReport = computed(() => props.document.kind === 'TEILEGUTACHTEN')
const counts = computed(() => props.mode === 'release' && props.rows > 0)

const form = useForm({
    completeness: '' as '' | 'complete' | 'partial' | 'unknown',
    missing: '',
    codes: '' as string | number,
    sizes: '' as string | number,
    axle_limit_kg: '' as string | number,
    abnahme: '' as '' | 'all' | 'some' | 'none',
})

function preset(): void {
    form.reset()
    form.clearErrors()

    if (props.mode === 'answer') {
        form.completeness = props.document.completeness ?? (partOfReport.value ? 'partial' : '')
        form.missing = props.document.missingAnnexes ?? ''
    } else if (partOfReport.value) {
        // A Teilegutachten: one Anlage of a longer report, and an Änderungsabnahme for whatever it approves (§ 19 Abs. 3 StVZO).
        form.completeness = 'partial'
        form.abnahme = 'all'
    }
}

watch(open, (now) => {
    if (now) {
        preset()
    }
}, { immediate: true })

const number = (value: string | number): number | null => (value === '' || value === null ? null : Number(value))

function submit(): void {
    form.transform((data) => ({
        completeness: data.completeness === '' ? null : data.completeness,
        missing: data.completeness === 'partial' ? data.missing : null,
        ...(counts.value
            ? { codes: number(data.codes), sizes: number(data.sizes), axle_limit_kg: number(data.axle_limit_kg), abnahme: data.abnahme === '' ? null : data.abnahme }
            : {}),
    })).post(`/admin/gutachten/${props.document.id}/${props.mode === 'release' ? 'freigeben' : 'vollstaendigkeit'}`, {
        preserveScroll: true,
        onSuccess: () => {
            open.value = false
            emit('done')
        },
        onError: () => focusRefused('.rd'),
    })
}

const errors = computed(() => form.errors as Record<string, string | undefined>)
</script>

<template>
    <Dialog
        v-model:open="open"
        :title="mode === 'release' ? 'Gutachten freigeben' : 'Ist alles erfasst?'"
        :description="document.label"
        content-class="adm-dialog rd-dialog"
        initial-focus="#rd-c-complete"
        wide
    >
        <form id="rd-form" class="rd" novalidate @submit.prevent="submit">
            <p v-if="note" class="adm-note">{{ note }}</p>

            <fieldset class="rd-group">
                <legend class="form-field__label">Sind alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst?</legend>
                <label class="check">
                    <input id="rd-c-complete" v-model="form.completeness" type="radio" name="rd-c" value="complete" aria-describedby="rd-c-err">
                    <span>Ja, alle – dann sagt der Shop zu jedem Fahrzeug, das hier nicht steht, „nicht freigegeben“.</span>
                </label>
                <label class="check">
                    <input v-model="form.completeness" type="radio" name="rd-c" value="partial" aria-describedby="rd-c-err">
                    <span>Teilweise – Anlagen oder Bereiche fehlen. Fahrzeuge, die hier nicht stehen, sind im Shop „noch nicht bestätigt“.</span>
                </label>
                <label class="check">
                    <input v-model="form.completeness" type="radio" name="rd-c" value="unknown" aria-describedby="rd-c-err">
                    <span>Weiß ich nicht – Fahrzeuge, die hier nicht stehen, sind im Shop „noch nicht bestätigt“.</span>
                </label>
                <p v-if="partOfReport" class="form-field__help">Ein Teilegutachten ist meist eine Anlage eines längeren Prüfberichts – deshalb steht „Teilweise“ schon da.</p>
                <p id="rd-c-err" class="form-field__error">{{ errors.completeness }}</p>
            </fieldset>

            <div v-if="form.completeness === 'partial'" class="form-field">
                <label class="form-field__label" for="rd-missing">Welche Anlagen oder Bereiche fehlen?</label>
                <input id="rd-missing" v-model="form.missing" class="input" type="text" maxlength="255" placeholder="z. B. Anlagen 1–15" :aria-invalid="errors.missing ? 'true' : undefined" aria-describedby="rd-missing-err">
                <p id="rd-missing-err" class="form-field__error">{{ errors.missing }}</p>
            </div>

            <template v-if="counts">
                <p class="adm-note">Zähl im PDF, was der Verwendungsbereich für die erfassten Fahrzeuge nennt. Der Shop zählt dasselbe in deinen Zeilen und gibt nur frei, wenn beides übereinstimmt.</p>
                <div class="rd-pair">
                    <div class="form-field">
                        <label class="form-field__label" for="rd-codes">Auflagen-Codes</label>
                        <input id="rd-codes" v-model="form.codes" class="input" type="number" min="0" inputmode="numeric" :aria-invalid="errors.codes ? 'true' : undefined" aria-describedby="rd-codes-err">
                        <p id="rd-codes-err" class="form-field__error">{{ errors.codes }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="rd-sizes">Reifengrößen</label>
                        <input id="rd-sizes" v-model="form.sizes" class="input" type="number" min="1" inputmode="numeric" :aria-invalid="errors.sizes ? 'true' : undefined" aria-describedby="rd-sizes-err">
                        <p id="rd-sizes-err" class="form-field__error">{{ errors.sizes }}</p>
                    </div>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="rd-limit">Achslastgrenze in kg</label>
                    <input id="rd-limit" v-model="form.axle_limit_kg" class="input" type="number" min="200" inputmode="numeric" :aria-invalid="errors.axle_limit_kg ? 'true' : undefined" aria-describedby="rd-limit-help rd-limit-err">
                    <p id="rd-limit-help" class="form-field__help">Nur, wenn der Verwendungsbereich eine nennt – etwa „nur für Fahrzeuge mit maximaler Achslast 1160 kg“. Sonst leer lassen.</p>
                    <p id="rd-limit-err" class="form-field__error">{{ errors.axle_limit_kg }}</p>
                </div>
                <fieldset class="rd-group">
                    <legend class="form-field__label">Verlangt der Verwendungsbereich eine Abnahme?</legend>
                    <label class="check">
                        <input v-model="form.abnahme" type="radio" name="rd-a" value="all" aria-describedby="rd-a-err">
                        <span>Ja, bei jeder Kombination</span>
                    </label>
                    <label class="check">
                        <input v-model="form.abnahme" type="radio" name="rd-a" value="some" aria-describedby="rd-a-err">
                        <span>Ja, bei einigen Kombinationen</span>
                    </label>
                    <label class="check">
                        <input v-model="form.abnahme" type="radio" name="rd-a" value="none" aria-describedby="rd-a-err">
                        <span>Nein</span>
                    </label>
                    <p id="rd-a-err" class="form-field__error">{{ errors.abnahme }}</p>
                </fieldset>
            </template>

            <p v-if="errors.release" class="adm-alert" role="alert">{{ errors.release }}</p>
        </form>
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Abbrechen</button>
            <button class="btn btn--primary" type="submit" form="rd-form" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">
                {{ mode === 'release' ? 'Freigeben' : 'Speichern' }}
            </button>
        </template>
    </Dialog>
</template>

<style scoped>
.rd {
    display: grid;
    gap: var(--sp-16);
}

.rd .form-field__error:empty {
    display: none;
}

.rd-group {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    border: 0;
}

.rd-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-16);
}

@media (max-width: 767px) {
    .rd-pair {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
