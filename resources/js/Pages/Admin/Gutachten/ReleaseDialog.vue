<script setup lang="ts">
/**
 * „Freigeben“: what goes live, and one button (D-485, the client's round of 18.11.2026, item 2). The two questions it
 * asked until then are gone:
 *   - whether every vehicle is entered is the switch „Alle Fahrzeuge dieses Gutachtens sind erfasst“ on the paper's page,
 *     off until someone turns it on — off, a car the paper does not name is „noch nicht bestätigt“, never „nicht freigegeben“;
 *   - whether the Verwendungsbereich asks for an Abnahme is said by the codes on each combination, never by an answer here.
 * Every other protection stays on the server (DocumentRelease::check()): an undescribed code still blocks the release.
 */
import { useForm } from '@inertiajs/vue3'
import { computed, nextTick } from 'vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import { focusRefused } from '../../../composables/admin/focusRefused'
import type { DocumentFacts } from '../../../types/admin/gutachten'

const props = defineProps<{
    document: DocumentFacts
    /** Rows of the document; a base without rows of its own reaches the shop through its Nachträge. */
    rows: number
    /** What the release does, said before it is pressed. */
    note?: string
}>()

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ done: [] }>()

const form = useForm({})

/* What the switch on the paper's page means for a car it does not name, said before the release, never asked. */
const unnamed = computed(() => props.rows === 0
    ? null
    : props.document.completeness === 'complete'
        ? 'Ein Fahrzeug, das hier nicht steht, ist im Shop „nicht freigegeben“ – so ist es auf der Seite des Gutachtens eingestellt („Alle Fahrzeuge dieses Gutachtens sind erfasst“).'
        : 'Ein Fahrzeug, das hier nicht steht, ist im Shop „noch nicht bestätigt“. Sind alle Fahrzeuge erfasst, kannst du das auf der Seite des Gutachtens einschalten.')

function submit(): void {
    form.post(`/admin/gutachten/${props.document.id}/freigeben`, {
        preserveScroll: true,
        onSuccess: () => {
            open.value = false
            emit('done')
            // A draft's five steps make way for the read view under the dialog: the keyboard lands on the page's title, never on nothing.
            void nextTick(() => {
                if (document.activeElement === null || document.activeElement === document.body) {
                    document.querySelector<HTMLElement>('.adm-page__title')?.focus({ preventScroll: true })
                }
            })
        },
        onError: () => focusRefused('.rd'),
    })
}

const errors = computed(() => form.errors as Record<string, string | undefined>)
</script>

<template>
    <Dialog
        v-model:open="open"
        title="Gutachten freigeben"
        :description="document.label"
        content-class="adm-dialog rd-dialog"
        initial-focus="#rd-go"
    >
        <form id="rd-form" class="rd" novalidate @submit.prevent="submit">
            <p v-if="note" class="adm-note">{{ note }}</p>
            <p v-if="unnamed" class="adm-note rd-unnamed">{{ unnamed }}</p>
            <p v-if="errors.release" class="adm-alert" role="alert">{{ errors.release }}</p>
        </form>
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Abbrechen</button>
            <button id="rd-go" class="btn btn--primary" type="submit" form="rd-form" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Freigeben</button>
        </template>
    </Dialog>
</template>

<style scoped>
.rd {
    display: grid;
    gap: var(--sp-16);
}
</style>
