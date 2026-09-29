<script setup lang="ts">
/**
 * The save bar (admin-shell.md §8.3) and the question asked before a change is lost (§8.4).
 *
 * Always rendered on a form page, from the first frame: it never appears or disappears, so its
 * disabled state is legible and a change never shifts the layout under the pointer. Only its words
 * and buttons change. A role that may not edit gets no bar at all — the page says it is read-only.
 *
 * *Speichern* is `aria-disabled` rather than `disabled` while there is nothing to save, so it stays
 * in the tab order and a keyboard can still find out why it does nothing.
 */

import { computed } from 'vue'
import Dialog from '../Ui/Dialog.vue'
import type { DirtyFormState } from '../../composables/admin/useDirtyForm'

const props = defineProps<{ editor: DirtyFormState }>()

const dirty = computed(() => props.editor.dirty.value)
const saving = computed(() => props.editor.saving.value)
const failed = computed(() => props.editor.failed.value)

const status = computed(() => {
    if (saving.value) {
        return 'Wird gespeichert …'
    }

    if (failed.value) {
        return 'Die Änderungen konnten nicht gespeichert werden.'
    }

    return dirty.value ? 'Nicht gespeicherte Änderungen' : 'Keine Änderungen'
})

const leaving = computed({
    get: () => props.editor.leaving.value,
    set: (open: boolean) => {
        if (!open) {
            props.editor.stay()
        }
    },
})

function save(): void {
    if (dirty.value && !saving.value) {
        props.editor.save()
    }
}
</script>

<template>
    <div class="adm-savebar" :data-state="saving ? 'saving' : failed ? 'failed' : dirty ? 'dirty' : 'clean'">
        <p class="adm-savebar__status" role="status">{{ status }}</p>

        <div class="adm-savebar__actions">
            <button class="btn btn--secondary" type="button" :disabled="!dirty || saving" @click="editor.discard">Verwerfen</button>
            <button
                class="btn btn--primary adm-savebar__save"
                type="button"
                :aria-disabled="dirty ? undefined : 'true'"
                :aria-busy="saving ? 'true' : undefined"
                @click="save"
            >
                Speichern
            </button>
        </div>
    </div>

    <Dialog
        v-model:open="leaving"
        title="Änderungen nicht gespeichert"
        description="Du hast Änderungen an dieser Seite, die noch nicht gespeichert sind."
        content-class="adm-dialog adm-dialog--narrow"
    >
        <template #actions>
            <button class="btn btn--secondary adm-btn--danger" type="button" @click="editor.leave">Änderungen verwerfen</button>
            <button class="btn btn--primary" type="button" @click="editor.stay">Weiter bearbeiten</button>
        </template>
    </Dialog>
</template>
