<script setup lang="ts">
/**
 * „Alle Fahrzeuge dieses Gutachtens sind erfasst“ (D-485, in place of D-227's question at release): optional, off until
 * someone turns it on, and never in the way of a release. On, a car the paper does not name is „nicht freigegeben“; off, it
 * is „noch nicht bestätigt“ — the safe answer. The server refuses „on“ while „Angaben“ still names missing Anlagen.
 */
import { router } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
    documentId: number
    completeness: string | null
    /** Who set it, and when: shown beside it where someone did. */
    by?: string | null
    at?: string | null
    /** `approvals` × publish (ApprovalDocumentPolicy::answerCompleteness); without it the state is only read. */
    can: boolean
    idPrefix?: string
}>()

const on = ref(props.completeness === 'complete')
const busy = ref(false)
const error = ref('')

watch(() => props.completeness, (now) => {
    on.value = now === 'complete'
})

const id = computed(() => `${props.idPrefix ?? 'cs'}-complete`)
const effect = computed(() => on.value
    ? 'Ein Fahrzeug, das hier nicht steht, ist im Shop „nicht freigegeben“.'
    : 'Ein Fahrzeug, das hier nicht steht, ist im Shop „noch nicht bestätigt“.')

function toggle(event: Event): void {
    const wanted = (event.target as HTMLInputElement).checked

    // Shown at once; back as it was where the server refuses.
    on.value = wanted
    busy.value = true
    error.value = ''
    router.post(`/admin/gutachten/${props.documentId}/vollstaendigkeit`, { complete: wanted }, {
        preserveScroll: true,
        preserveState: true,
        onError: (errors) => {
            error.value = (errors as Record<string, string>).complete ?? 'Das hat nicht geklappt.'
            on.value = !wanted
        },
        onFinish: () => {
            busy.value = false
        },
    })
}
</script>

<template>
    <div class="cs" :class="{ 'cs--on': on }">
        <label class="check cs__label" :for="id">
            <input
                :id="id"
                type="checkbox"
                role="switch"
                :checked="on"
                :disabled="!can || busy"
                :aria-busy="busy ? 'true' : undefined"
                :aria-describedby="`${id}-effect ${id}-err`"
                @change="toggle"
            >
            <span>Alle Fahrzeuge dieses Gutachtens sind erfasst</span>
        </label>
        <p :id="`${id}-effect`" class="adm-note cs__effect">
            {{ effect }}<template v-if="by || at"> · {{ [by, at].filter(Boolean).join(', ') }}</template>
        </p>
        <p :id="`${id}-err`" class="form-field__error" role="alert">{{ error }}</p>
    </div>
</template>

<style scoped>
.cs {
    display: grid;
    gap: var(--sp-4);
}

.cs__effect {
    margin: 0;
}

.cs .form-field__error:empty {
    display: none;
}
</style>
