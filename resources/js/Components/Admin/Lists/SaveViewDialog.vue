<script setup lang="ts">
/**
 * Saving a Gespeicherte Ansicht, or changing one's name and who it is shared with.
 *
 * A name, and „Teilen“: for the person alone, or for everybody in a role that may open the list —
 * only those roles are offered (ListViews). „Spalten mitspeichern“, off unless ticked: a view answers
 * a question with its filters, and leaves everyone's columns alone — ticked, it keeps the columns on
 * screen and shows them to whoever opens it. The server refuses what this does not, in its own words
 * under the field (SavedViewStoreRequest, SavedViewUpdateRequest); a refused name takes focus again,
 * so the sentence is heard and the fix starts there.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, nextTick, ref, watch } from 'vue'
import Dialog from '../../Ui/Dialog.vue'
import type { ListViewItem } from '../../../types/admin/lists'

const props = defineProps<{
    list: string
    /** The filters on screen, as the server wrote them: what a new view keeps. */
    query: Record<string, string>
    /** The columns on screen: what the view keeps when „Spalten mitspeichern“ is ticked. */
    columns: string[]
    shareOptions: { id: number; label: string }[]
    /** A view to change; none to save a new one. */
    view: ListViewItem | null
}>()

const open = defineModel<boolean>('open', { default: false })

/** Saved: the bar puts the focus on the view, since the button that opened this is gone with it. */
const emit = defineEmits<{ saved: [] }>()

let justSaved = false

/* Closed after a save: the focus is the bar's to place (on the view), not the opener's to take back. */
function onClosed(event: Event): void {
    if (justSaved) {
        justSaved = false
        event.preventDefault()
        emit('saved')
    }
}

const page = usePage()
const name = ref('')
const role = ref('')
const keepColumns = ref(false)
const busy = ref(false)
const sent = ref(false)

const editing = computed(() => props.view !== null)
const title = computed(() => (editing.value ? 'Ansicht umbenennen und teilen' : 'Als Ansicht speichern'))

watch(open, (value) => {
    if (value) {
        name.value = props.view?.name ?? ''
        role.value = props.view?.roleId ? String(props.view.roleId) : ''
        keepColumns.value = props.view?.storesColumns ?? false
        sent.value = false
    }
})

const errors = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return sent.value && raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

const nameError = computed(() => errors.value.name ?? errors.value.query ?? errors.value.list ?? '')
const roleError = computed(() => errors.value.role_id ?? '')
const columnsError = computed(() => errors.value.columns ?? errors.value.stores_columns ?? '')

function save(): void {
    if (busy.value) {
        return
    }

    busy.value = true
    sent.value = true

    const roleId = role.value === '' ? null : Number(role.value)
    const options = {
        preserveScroll: true,
        onSuccess: () => {
            justSaved = true
            open.value = false
        },
        onError: () => void nextTick(() => document.getElementById('sv-name')?.focus()),
        onFinish: () => {
            busy.value = false
        },
    }

    if (props.view === null) {
        router.post(
            '/admin/ansichten',
            { list: props.list, name: name.value, query: props.query, role_id: roleId, stores_columns: keepColumns.value, columns: keepColumns.value ? props.columns : null },
            options
        )

        return
    }

    // Only what changed: a rename does not re-share, a new role does not rename.
    const changes: { name?: string; role_id?: number | null; stores_columns?: boolean; columns?: string[] } = {}

    if (name.value.trim() !== props.view.name) {
        changes.name = name.value
    }

    if (roleId !== props.view.roleId) {
        changes.role_id = roleId
    }

    // Ticked now: the columns on screen go with it; unticked: the view lets everyone's columns be.
    if (keepColumns.value !== props.view.storesColumns) {
        changes.stores_columns = keepColumns.value

        if (keepColumns.value) {
            changes.columns = props.columns
        }
    }

    if (Object.keys(changes).length === 0) {
        busy.value = false
        open.value = false

        return
    }

    router.patch(`/admin/ansichten/${props.view.id}`, changes, options)
}
</script>

<template>
    <Dialog v-model:open="open" :title="title" content-class="adm-dialog adm-dialog--narrow" initial-focus="#sv-name" @close-auto-focus="onClosed">
        <form id="sv-form" class="adm-fields" novalidate @submit.prevent="save">
            <div class="form-field">
                <label class="form-field__label" for="sv-name">Name</label>
                <input
                    id="sv-name"
                    v-model="name"
                    class="input"
                    type="text"
                    maxlength="60"
                    autocomplete="off"
                    aria-required="true"
                    aria-describedby="sv-name-help sv-name-err"
                    :aria-invalid="nameError ? 'true' : undefined"
                >
                <p id="sv-name-help" class="form-field__help">Zum Beispiel „Bezahlt, noch nicht versendet“.</p>
                <p id="sv-name-err" class="form-field__error">{{ nameError }}</p>
            </div>

            <div class="form-field">
                <label class="form-field__label" for="sv-role">Teilen</label>
                <select
                    id="sv-role"
                    v-model="role"
                    class="input"
                    aria-describedby="sv-role-help sv-role-err"
                    :aria-invalid="roleError ? 'true' : undefined"
                >
                    <option value="">Nur für mich</option>
                    <option v-for="option in shareOptions" :key="option.id" :value="String(option.id)">Für alle mit der Rolle „{{ option.label }}“</option>
                </select>
                <p id="sv-role-help" class="form-field__help">Geteilte Ansichten sehen alle mit der gewählten Rolle. Ändern kannst nur du sie.</p>
                <p id="sv-role-err" class="form-field__error">{{ roleError }}</p>
            </div>

            <div class="form-field">
                <label class="check">
                    <input
                        id="sv-columns"
                        v-model="keepColumns"
                        type="checkbox"
                        aria-describedby="sv-columns-help sv-columns-err"
                        :aria-invalid="columnsError ? 'true' : undefined"
                    >
                    Spalten mitspeichern
                </label>
                <p id="sv-columns-help" class="form-field__help">Wer die Ansicht öffnet, sieht dann diese Spalten statt der eigenen.</p>
                <p id="sv-columns-err" class="form-field__error">{{ columnsError }}</p>
            </div>
        </form>

        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Abbrechen</button>
            <!-- Busy, not disabled: a disabled button greys its own spinner out; save() refuses a second press. -->
            <button class="btn btn--primary" type="submit" form="sv-form" :aria-busy="busy ? 'true' : undefined">
                Speichern
            </button>
        </template>
    </Dialog>
</template>
