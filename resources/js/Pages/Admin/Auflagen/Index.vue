<script setup lang="ts">
/**
 * Gutachten › Auflagen-Katalog — every Auflage once, as the full German sentence customers read
 * (R-15), with its Einstufung and how many rows carry it. A change here changes every Gutachten row
 * that uses it, which is why the count stands beside each sentence; one still in use cannot be deleted.
 */

import { router, useForm } from '@inertiajs/vue3'
import { computed, nextTick, ref, watch } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { afterDialogsClose, focusRefused } from '../../../composables/admin/focusRefused'
import { decimal } from '../../../format'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface Code {
    id: number
    code: string
    severity: string
    severityLabel: string
    text: string
    affectsTyreChoice: boolean
    requiresAcknowledgement: boolean
    used: number
    /** A freigegebenes Gutachten carries it: only its key may still change. */
    released: boolean
}

const props = defineProps<{
    codes: Code[]
    /** `acknowledged`: this Einstufung is always confirmed before the purchase, whatever the box says. */
    severities: { value: string; label: string; acknowledged: boolean }[]
    can: { create: boolean; edit: boolean; delete: boolean }
}>()

const context = computed(() => (props.codes.length === 1 ? '1 Auflage' : `${decimal(props.codes.length, 0)} Auflagen`))

const editing = ref<Code | null>(null)
const dialogOpen = ref(false)
const form = useForm({ code: '', severity: 'INFO', text: '', affects_tyre_choice: false, requires_acknowledgement: false })
const errors = computed(() => form.errors as Record<string, string | undefined>)

function openNew(): void {
    editing.value = null
    form.defaults({ code: '', severity: 'INFO', text: '', affects_tyre_choice: false, requires_acknowledgement: false })
    form.reset()
    form.clearErrors()
    dialogOpen.value = true
}

function openEdit(code: Code): void {
    editing.value = code
    form.defaults({ code: code.code, severity: code.severity, text: code.text, affects_tyre_choice: code.affectsTyreChoice, requires_acknowledgement: code.requiresAcknowledgement })
    form.reset()
    form.clearErrors()
    dialogOpen.value = true
}

/** The meaning of a released Auflage is fixed; the dialog then offers the key alone. */
const fixed = computed(() => editing.value?.released === true)

/** An Einstufung that is always confirmed: the box shows it ticked and cannot be unticked. */
const forcedAck = computed(() => props.severities.find((s) => s.value === form.severity)?.acknowledged === true)

watch(forcedAck, (forced) => {
    if (forced) {
        form.requires_acknowledgement = true
    }
})

function save(): void {
    if (form.processing) {
        return
    }

    const done = { preserveScroll: true, onSuccess: () => (dialogOpen.value = false), onError: () => focusRefused('.adm-dialog') }

    if (editing.value) {
        form.put(`/admin/auflagen/${editing.value.id}`, done)
    } else {
        form.post('/admin/auflagen', done)
    }
}

const deleting = ref<Code | null>(null)
const deleteOpen = computed({
    get: () => deleting.value !== null,
    set: (open: boolean) => {
        if (!open) {
            deleting.value = null
        }
    },
})

const deleteBusy = ref(false)

/* One request, however often „Löschen“ is pressed; then the keyboard goes to the Auflage now in its place. */
function destroy(): void {
    const code = deleting.value

    if (!code || deleteBusy.value) {
        return
    }

    // Closed first, sent once it is gone: a dialog still closing while its row leaves the table never
    // finished its exit. deleteBusy stops a second press in between.
    const place = props.codes.findIndex((c) => c.id === code.id)
    deleteBusy.value = true
    deleting.value = null
    afterDialogsClose(() => {
        router.delete(`/admin/auflagen/${code.id}`, {
            preserveScroll: true,
            onFinish: () => {
                deleteBusy.value = false
                void nextTick(() => {
                    const next = props.codes[Math.min(place, props.codes.length - 1)]
                    const target = next ? document.querySelector<HTMLElement>(`[data-code-edit="${next.id}"]`) : null
                    ;(target ?? document.querySelector<HTMLElement>('.adm-page__title'))?.focus()
                })
            },
        })
    })
}

/* The confirm's sentence outlives `deleting`, so it does not go blank while the dialog fades out. */
const deleteBody = ref('')

watch(deleting, (code) => {
    if (code) {
        deleteBody.value = `„${code.text}“ wird aus dem Auflagen-Katalog gelöscht.`
    }
})

/** What the dialog says about where a change lands. */
const dialogNote = computed(() => {
    const code = editing.value

    if (!code) {
        return undefined
    }

    if (code.released) {
        return 'Ein freigegebenes Gutachten trägt diese Auflage. Dort ändert sie sich nicht mehr – hier lässt sich nur noch der Schlüssel ändern.'
    }

    return code.used === 0 ? undefined : code.used === 1 ? 'Die Änderung gilt für die Zeile, die sie trägt.' : `Die Änderung gilt für alle ${decimal(code.used, 0)} Zeilen, die sie tragen.`
})

/** `927 Zeilen`, or as the reason a row in use stays: `Wird in 927 Zeilen verwendet`. */
function usedIn(code: Code, sentence = false): string {
    const rows = code.used === 1 ? '1 Zeile' : `${decimal(code.used, 0)} Zeilen`

    return sentence ? `Wird in ${code.used === 1 ? 'einer Zeile' : rows} verwendet` : rows
}

/** What the Auflage does beyond its sentence; the import key stays in the edit dialog. */
function subLine(code: Code): string {
    return [code.affectsTyreChoice ? 'Schränkt die Reifenwahl ein' : null, code.requiresAcknowledgement ? 'Wird vor dem Kauf bestätigt' : null]
        .filter((part): part is string => part !== null)
        .join(' · ')
}

/** Only the exception is tagged: a Hinweis is ordinary, anything heavier changes what a customer must do. */
function severityTag(severity: string): string | null {
    return severity === 'INFO' ? null : severity === 'RESTRICTION' ? 'adm-tag adm-tag--warn' : 'adm-tag adm-tag--neutral'
}
</script>

<template>
    <AdminPage title="Auflagen-Katalog" :context="context">
        <template v-if="can.create" #primary>
            <button class="btn btn--primary" type="button" @click="openNew">
                <Icon name="plus" :size="20" />
                Neue Auflage
            </button>
        </template>

        <p class="adm-note al-intro">Jede Auflage steht hier einmal, als ganzer Satz, so wie Kundinnen und Kunden sie lesen. Eine Änderung gilt für jeden Entwurf, der sie trägt; in freigegebenen Gutachten bleibt sie, wie sie ist.</p>

        <AdminState v-if="codes.length === 0" kind="empty" text="Hier steht jede Auflage, sobald die erste angelegt ist." />

        <div v-else class="adm-panel">
            <table class="adm-table">
                <caption class="visually-hidden">Auflagen, {{ context }}</caption>
                <thead>
                    <tr>
                        <th scope="col">Auflage</th>
                        <th scope="col">Einstufung</th>
                        <th scope="col" class="num">Verwendet</th>
                        <th v-if="can.edit || can.delete" scope="col"><span class="visually-hidden">Aktionen</span></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="code in codes" :key="code.id">
                        <td data-label="Auflage">
                            <span :id="`al-text-${code.id}`" class="al-text">{{ code.text }}</span>
                            <span v-if="code.affectsTyreChoice || code.requiresAcknowledgement" class="al-sub">{{ subLine(code) }}</span>
                        </td>
                        <td data-label="Einstufung" data-phone="status">
                            <span v-if="severityTag(code.severity)" :class="severityTag(code.severity)">{{ code.severityLabel }}</span>
                            <template v-else>{{ code.severityLabel }}</template>
                        </td>
                        <td data-label="Verwendet" class="num al-used">{{ usedIn(code) }}</td>
                        <td v-if="can.edit || can.delete" data-label="Aktionen" class="al-actions">
                            <button v-if="can.edit" class="adm-iconbtn" type="button" :data-code-edit="code.id" aria-label="Ändern" :aria-describedby="`al-text-${code.id}`" title="Ändern" @click="openEdit(code)">
                                <Icon name="edit" :size="20" />
                            </button>
                            <!-- Always drawn, so the column never shifts; a row in use says why it stays. -->
                            <button
                                v-if="can.delete"
                                class="adm-iconbtn"
                                type="button"
                                :aria-label="code.used === 0 ? 'Löschen' : `Löschen nicht möglich: ${usedIn(code, true)}`"
                                :aria-describedby="`al-text-${code.id}`"
                                :aria-disabled="code.used === 0 ? undefined : 'true'"
                                :title="code.used === 0 ? 'Löschen' : usedIn(code, true)"
                                @click="code.used === 0 && (deleting = code)"
                            >
                                <Icon name="delete" :size="20" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <Dialog v-model:open="dialogOpen" :title="editing ? 'Auflage ändern' : 'Neue Auflage'" :description="dialogNote" content-class="adm-dialog" :initial-focus="fixed ? '#al-code' : '#al-text'">
            <form id="al-form" class="al-form" novalidate @submit.prevent="save">
                <div class="form-field">
                    <label class="form-field__label" for="al-text">Wortlaut</label>
                    <textarea id="al-text" v-model="form.text" class="input al-area" rows="3" maxlength="600" :readonly="fixed" :aria-invalid="errors.text ? 'true' : undefined" aria-describedby="al-text-help al-text-err" />
                    <p id="al-text-help" class="form-field__help">Ein ganzer Satz, so wie Kundinnen und Kunden ihn lesen: „Bördeln der Radläufe erforderlich.“</p>
                    <p id="al-text-err" class="form-field__error">{{ errors.text }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="al-severity">Einstufung</label>
                    <select id="al-severity" v-model="form.severity" class="input" :disabled="fixed" aria-describedby="al-severity-help">
                        <option v-for="option in severities" :key="option.value" :value="option.value">{{ option.label }}</option>
                    </select>
                    <p id="al-severity-help" class="form-field__help">Alles außer einem Hinweis macht aus „Passt“ ein „Passt mit Auflagen“.</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="al-code">Schlüssel</label>
                    <input id="al-code" v-model="form.code" class="input al-code" type="text" maxlength="64" spellcheck="false" :aria-invalid="errors.code ? 'true' : undefined" aria-describedby="al-code-help al-code-err">
                    <p id="al-code-help" class="form-field__help">Für die Zuordnung beim Import, nie im Shop zu sehen – zum Beispiel RADLAUF_BOERDELN.</p>
                    <p id="al-code-err" class="form-field__error">{{ errors.code }}</p>
                </div>
                <label class="al-check">
                    <input v-model="form.affects_tyre_choice" type="checkbox" :disabled="fixed">
                    <span>Schränkt die Reifenwahl ein</span>
                </label>
                <label class="al-check">
                    <input v-model="form.requires_acknowledgement" type="checkbox" :disabled="fixed || forcedAck" aria-describedby="al-ack-help">
                    <span>Wird vor dem Kauf bestätigt</span>
                </label>
                <p v-if="forcedAck && !fixed" id="al-ack-help" class="form-field__help al-ack-help">Bei dieser Einstufung immer: Kundinnen und Kunden bestätigen sie vor dem Kauf.</p>
            </form>
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="dialogOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="submit" form="al-form" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Speichern</button>
            </template>
        </Dialog>

        <AdminConfirm v-model:open="deleteOpen" title="Auflage löschen?" :body="deleteBody" :busy="deleteBusy" @confirm="destroy" />
    </AdminPage>
</template>

<style scoped>
.al-intro {
    margin-bottom: var(--sp-24);
}

.al-text {
    display: block;
    overflow-wrap: anywhere;
}

.al-sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.al-actions {
    white-space: nowrap;
    text-align: right;
}

/* On a phone the two buttons sit at the end of the „Verwendet“ line, not on a line of their own. */
@media (max-width: 767px) {
    .adm-table td.al-used {
        grid-column: 1;
        align-self: center;
    }

    .adm-table td.al-actions {
        grid-column: 2;
        align-self: center;
        padding: 0;
    }
}

.al-form {
    display: grid;
    gap: var(--sp-16);
}

.al-form .form-field__error:empty {
    display: none;
}

.al-area {
    height: auto;
    padding-block: var(--sp-8);
    resize: vertical;
}

.al-code {
    max-width: 32ch;
}

.al-check {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    min-height: var(--adm-control-h);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    cursor: pointer;
}

.al-check input {
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--c-ink);
}
</style>
