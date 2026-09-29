<script setup lang="ts">
/**
 * The question before something that cannot be undone (admin-shell.md §8.4).
 *
 * It names the object in the title, and on the live shop it says so first — `Das wirkt sofort im
 * Live-Shop.` — because the same button in a copy of the shop is a rehearsal. A count in the body is
 * real or the body does not mention one; that is the caller's sentence to write.
 *
 * With `confirmWord`, the action waits until that exact word is typed: for the few things whose
 * consequences reach past this screen (BRIEF-2 §2). The safe answer is always one Esc away.
 */

import { computed, ref, watch } from 'vue'
import Dialog from '../Ui/Dialog.vue'
import { useAdmin } from '../../composables/admin/useAdmin'

const props = withDefaults(
    defineProps<{
        title: string
        body: string
        confirmLabel?: string
        busy?: boolean
        confirmWord?: string
    }>(),
    { confirmLabel: 'Löschen', busy: false, confirmWord: undefined }
)

const emit = defineEmits<{ confirm: [] }>()

const open = defineModel<boolean>('open', { default: false })

const admin = useAdmin()

/** The environment badge is absent exactly when this is the live shop. */
const live = computed(() => admin.value.environment === null)

const typed = ref('')

watch(open, (value) => {
    if (value) {
        typed.value = ''
    }
})

const ready = computed(() => !props.confirmWord || typed.value.trim() === props.confirmWord)

function confirm(): void {
    if (ready.value && !props.busy) {
        emit('confirm')
    }
}
</script>

<template>
    <Dialog v-model:open="open" :title="title" content-class="adm-dialog adm-dialog--narrow">
        <p class="adm-confirm__body">
            <template v-if="live">Das wirkt sofort im Live-Shop. </template>{{ body }}
        </p>

        <div v-if="confirmWord" class="form-field adm-confirm__word">
            <label class="form-field__label" for="adm-confirm-word">Tippe „{{ confirmWord }}“, um zu bestätigen.</label>
            <input
                id="adm-confirm-word"
                v-model="typed"
                class="input"
                type="text"
                autocomplete="off"
                spellcheck="false"
                @keydown.enter.prevent="confirm"
            >
        </div>

        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Abbrechen</button>
            <button
                class="btn btn--secondary adm-btn--danger"
                type="button"
                :aria-disabled="ready ? undefined : 'true'"
                :aria-busy="busy ? 'true' : undefined"
                @click="confirm"
            >
                {{ confirmLabel }}
            </button>
        </template>
    </Dialog>
</template>
