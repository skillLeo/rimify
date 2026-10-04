<script setup lang="ts">
/**
 * „Demodaten entfernen“ while the set cannot go (DemoCatalogue::blockers): said before anyone confirms, not after —
 * the reason in one sentence, and, for the Super-Admin on a test environment, the way that does work: resetting the
 * shop's data as a whole (System › Zurücksetzen). Never an empty promise and never a command to type.
 */

import { Link } from '@inertiajs/vue3'
import Dialog from '../Ui/Dialog.vue'

defineProps<{
    reason: string
    /** System › Zurücksetzen, where this person may open it; null elsewhere. */
    resetHref: string | null
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
    <Dialog v-model:open="open" title="Die Demodaten lassen sich gerade nicht entfernen" content-class="adm-dialog adm-dialog--narrow">
        <p class="adm-confirm__body">{{ reason }}</p>
        <p v-if="resetHref" class="adm-confirm__body">Unter System › Zurücksetzen setzt du stattdessen alle Shopdaten zurück. Vorher wird die ganze Datenbank gesichert, und du kannst es sieben Tage lang rückgängig machen.</p>
        <p v-else class="adm-confirm__body">Alle Shopdaten zurücksetzen kann nur der Super-Admin, unter System › Zurücksetzen.</p>

        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Schließen</button>
            <Link v-if="resetHref" :href="resetHref" class="btn btn--primary" @click="open = false">Zum Zurücksetzen</Link>
        </template>
    </Dialog>
</template>
