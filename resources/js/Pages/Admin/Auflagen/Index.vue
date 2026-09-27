<script setup lang="ts">
/**
 * Gutachten › Auflagen-Katalog — every Auflage once, as the full German sentence customers read
 * (R-15), with its Einstufung and how many rows carry it. A change here changes every Gutachten row
 * that uses it, which is why the count stands beside each sentence; one still in use cannot be deleted.
 */

import { router, useForm } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
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
}

const props = defineProps<{
    codes: Code[]
    severities: { value: string; label: string }[]
    can: { create: boolean; edit: boolean }
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

function save(): void {
    const done = { preserveScroll: true, onSuccess: () => (dialogOpen.value = false) }

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

function destroy(): void {
    if (deleting.value) {
        router.delete(`/admin/auflagen/${deleting.value.id}`, { preserveScroll: true, onFinish: () => (deleting.value = null) })
    }
}

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

        <p class="adm-note al-intro">Jede Auflage steht hier einmal, als ganzer Satz, so wie Kundinnen und Kunden sie lesen. Eine Änderung gilt für jede Zeile, die sie trägt.</p>

        <AdminState v-if="codes.length === 0" kind="empty" text="Hier steht jede Auflage, sobald die erste angelegt ist." />

        <div v-else class="adm-panel">
            <table class="adm-table">
                <caption class="visually-hidden">Auflagen, {{ context }}</caption>
                <thead>
                    <tr>
                        <th scope="col">Auflage</th>
                        <th scope="col">Einstufung</th>
                        <th scope="col" class="num">Verwendet</th>
                        <th v-if="can.edit" scope="col"><span class="visually-hidden">Aktionen</span></th>
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
                        <td v-if="can.edit" data-label="Aktionen" class="al-actions">
                            <button class="adm-iconbtn" type="button" aria-label="Ändern" :aria-describedby="`al-text-${code.id}`" title="Ändern" @click="openEdit(code)">
                                <Icon name="edit" :size="20" />
                            </button>
                            <!-- Always drawn, so the column never shifts; a row in use says why it stays. -->
                            <button
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

        <Dialog v-model:open="dialogOpen" :title="editing ? 'Auflage ändern' : 'Neue Auflage'" :description="editing && editing.used ? `Die Änderung gilt für ${editing.used === 1 ? 'die Zeile' : `alle ${decimal(editing.used, 0)} Zeilen`}, die sie tragen.` : undefined" content-class="adm-dialog">
            <form class="al-form" novalidate @submit.prevent="save">
                <div class="form-field">
                    <label class="form-field__label" for="al-text">Wortlaut</label>
                    <textarea id="al-text" v-model="form.text" class="input al-area" rows="3" maxlength="600" :aria-invalid="errors.text ? 'true' : undefined" aria-describedby="al-text-help al-text-err" />
                    <p id="al-text-help" class="form-field__help">Ein ganzer Satz, so wie Kundinnen und Kunden ihn lesen: „Bördeln der Radläufe erforderlich.“</p>
                    <p id="al-text-err" class="form-field__error">{{ errors.text }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="al-severity">Einstufung</label>
                    <select id="al-severity" v-model="form.severity" class="input" aria-describedby="al-severity-help">
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
                    <input v-model="form.affects_tyre_choice" type="checkbox">
                    <span>Schränkt die Reifenwahl ein</span>
                </label>
                <label class="al-check">
                    <input v-model="form.requires_acknowledgement" type="checkbox">
                    <span>Wird vor dem Kauf bestätigt</span>
                </label>
            </form>
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="dialogOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="button" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined" @click="save">Speichern</button>
            </template>
        </Dialog>

        <AdminConfirm v-model:open="deleteOpen" title="Auflage löschen?" :body="deleting ? `„${deleting.text}“ wird aus dem Auflagen-Katalog gelöscht.` : ''" @confirm="destroy" />
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
