<script setup lang="ts">
/**
 * „Fahrzeug aus diesem Gutachten anlegen“ (Block C, item 7): the car exactly as the document names it —
 * maker, trade name, the maker's Fahrzeugtyp, the EG type-approval number as printed, body style and drive
 * where the document says them, and the page. The document names no HSN or TSN, and none is made up: the
 * car stands without them until a vehicle dataset brings them (docs/specs/vehicles-and-tyres.md).
 *
 * Its axle loads and top speed are not in the document either: the car is saved „zur Prüfung“, and the
 * shop's tyre answer stays open until the customer's papers give them (R-03).
 *
 * Sent as JSON to the document's own endpoint; the new car comes back ready to tick in the list above.
 */

import { computed, reactive, ref } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import { xsrfToken } from '../../../composables/admin/preferences'
import type { VehicleHit } from '../../../types/admin/gutachten'

const props = defineProps<{
    documentId: number
    pageCount: number | null
    bodyForms: string[]
    drives: string[]
}>()

const emit = defineEmits<{ created: [vehicle: VehicleHit] }>()

const focus = useFocusAfter()
const open = ref(false)
const busy = ref(false)
const failed = ref('')
const errors = ref<Record<string, string>>({})

const blank = () => ({ make: '', model: '', variant: '', type_designation: '', eg_number: '', body_form: '', drive_axle: '', source_page: '' as number | '' })
const form = reactive(blank())

const DRIVE_AXLES = computed(() => props.drives.filter((d) => d !== 'Allradlenkung'))

function show(): void {
    open.value = true
    focus.request('vfd-make', { scroll: true })
}

function close(): void {
    open.value = false
    errors.value = {}
    failed.value = ''
    focus.request('vfd-open')
}

async function save(): Promise<void> {
    if (busy.value) {
        return
    }

    busy.value = true
    failed.value = ''

    try {
        const response = await fetch(`/admin/gutachten/${props.documentId}/fahrzeuge`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': xsrfToken() },
            body: JSON.stringify({ ...form, source_page: form.source_page === '' ? null : form.source_page }),
        })

        if (response.status === 422) {
            const body = (await response.json()) as { errors?: Record<string, string[]> }
            errors.value = Object.fromEntries(Object.entries(body.errors ?? {}).map(([key, list]) => [key, list[0] ?? '']))
            const first = ['make', 'model', 'type_designation', 'eg_number', 'body_form', 'drive_axle', 'source_page'].find((key) => errors.value[key])
            focus.request(first ? `vfd-${first.replace(/_/g, '-')}` : 'vfd-make')

            return
        }

        if (!response.ok) {
            failed.value = response.status === 403 ? 'Dafür fehlt dir das Recht, oder das Gutachten ist schon freigegeben.' : 'Das Fahrzeug konnte nicht angelegt werden. Versuch es bitte gleich noch einmal.'
            focus.request('vfd-save')

            return
        }

        const vehicle = (await response.json()) as VehicleHit
        errors.value = {}
        Object.assign(form, blank())
        open.value = false
        emit('created', vehicle)
        // The form gives way to its button again: the keyboard goes there, never to the page (C-03).
        focus.request('vfd-open')
    } catch {
        failed.value = 'Keine Verbindung zum Server. Es wurde nichts gespeichert – prüf die Verbindung und versuch es noch einmal.'
        focus.request('vfd-save')
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="vfd">
        <button v-if="!open" id="vfd-open" class="btn btn--ghost" type="button" @click="show">
            <Icon name="plus" :size="20" />
            Fahrzeug aus diesem Gutachten anlegen
        </button>

        <form v-else class="vfd-form" novalidate aria-labelledby="vfd-h" @submit.prevent="save">
            <p id="vfd-h" class="vfd-title">Fahrzeug aus diesem Gutachten</p>
            <p class="form-field__help">So, wie das Gutachten es nennt. HSN und TSN stehen in keinem Gutachten und bleiben leer; Achslasten und Höchstgeschwindigkeit ebenso – das Fahrzeug kommt „zur Prüfung“.</p>
            <div class="vfd-grid">
                <div class="form-field">
                    <label class="form-field__label" for="vfd-make">Hersteller</label>
                    <input id="vfd-make" v-model="form.make" class="input" type="text" maxlength="60" placeholder="BMW" :aria-invalid="errors.make ? 'true' : undefined" aria-describedby="vfd-make-err">
                    <p id="vfd-make-err" class="form-field__error">{{ errors.make }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="vfd-model">Handelsbezeichnung</label>
                    <input id="vfd-model" v-model="form.model" class="input" type="text" maxlength="80" placeholder="4er Coupé" :aria-invalid="errors.model ? 'true' : undefined" aria-describedby="vfd-model-err">
                    <p id="vfd-model-err" class="form-field__error">{{ errors.model }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="vfd-type-designation">Fahrzeugtyp</label>
                    <input id="vfd-type-designation" v-model="form.type_designation" class="input" type="text" maxlength="32" spellcheck="false" placeholder="3C" :aria-invalid="errors.type_designation ? 'true' : undefined" aria-describedby="vfd-type-designation-err">
                    <p id="vfd-type-designation-err" class="form-field__error">{{ errors.type_designation }}</p>
                </div>
                <div class="form-field vfd-wide">
                    <label class="form-field__label" for="vfd-eg-number">EG-Typgenehmigungsnummer</label>
                    <input id="vfd-eg-number" v-model="form.eg_number" class="input" type="text" maxlength="64" spellcheck="false" placeholder="e1*2007/46*0316*.." :aria-invalid="errors.eg_number ? 'true' : undefined" aria-describedby="vfd-eg-number-help vfd-eg-number-err">
                    <p id="vfd-eg-number-help" class="form-field__help">Mit der Erweiterung, so wie gedruckt. Über sie findet der spätere Fahrzeugdaten-Import dieses Fahrzeug wieder.</p>
                    <p id="vfd-eg-number-err" class="form-field__error">{{ errors.eg_number }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="vfd-variant">Variante <span class="vfd-optional">(optional)</span></label>
                    <input id="vfd-variant" v-model="form.variant" class="input" type="text" maxlength="80" placeholder="leer: wie der Fahrzeugtyp">
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="vfd-body-form">Karosserie <span class="vfd-optional">(optional)</span></label>
                    <select id="vfd-body-form" v-model="form.body_form" class="input" :aria-invalid="errors.body_form ? 'true' : undefined" aria-describedby="vfd-body-form-err">
                        <option value="">Nennt das Gutachten nicht</option>
                        <option v-for="b in bodyForms" :key="b" :value="b">{{ b }}</option>
                    </select>
                    <p id="vfd-body-form-err" class="form-field__error">{{ errors.body_form }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="vfd-drive-axle">Antrieb <span class="vfd-optional">(optional)</span></label>
                    <select id="vfd-drive-axle" v-model="form.drive_axle" class="input" :aria-invalid="errors.drive_axle ? 'true' : undefined" aria-describedby="vfd-drive-axle-err">
                        <option value="">Nennt das Gutachten nicht</option>
                        <option v-for="d in DRIVE_AXLES" :key="d" :value="d">{{ d }}</option>
                    </select>
                    <p id="vfd-drive-axle-err" class="form-field__error">{{ errors.drive_axle }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="vfd-source-page">Seite im Gutachten</label>
                    <input id="vfd-source-page" v-model.number="form.source_page" class="input" type="number" min="1" :max="pageCount ?? undefined" inputmode="numeric" :aria-invalid="errors.source_page ? 'true' : undefined" aria-describedby="vfd-source-page-err">
                    <p id="vfd-source-page-err" class="form-field__error">{{ errors.source_page }}</p>
                </div>
            </div>
            <p v-if="failed" class="adm-alert" role="alert">{{ failed }}</p>
            <div class="vfd-actions">
                <button id="vfd-save" class="btn btn--primary" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">Fahrzeug anlegen</button>
                <button class="btn btn--ghost" type="button" :disabled="busy" @click="close">Abbrechen</button>
            </div>
        </form>
    </div>
</template>

<style scoped>
/* The form lives in half of „Zeilen hinzufügen“: its columns follow the room it has, not the window. */
.vfd {
    container-type: inline-size;
    margin-top: var(--sp-8);
}

.vfd-title {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
    color: var(--c-ink);
}

.vfd-form {
    display: grid;
    gap: var(--sp-12);
    max-width: var(--adm-form-max);
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.vfd-form > .form-field__help {
    margin: 0;
}

.vfd-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-12) var(--sp-16);
}

@container (max-width: 479px) {
    .vfd-grid {
        grid-template-columns: minmax(0, 1fr);
    }
}

.vfd-wide {
    grid-column: 1 / -1;
}

.vfd-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.vfd-form .form-field__error:empty {
    display: none;
}

.vfd-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

</style>
