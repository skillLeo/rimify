<script setup lang="ts">
/**
 * The four states that are not "here is your data" (admin-shell.md §9), rendered where the content
 * would be: left-aligned on the page's reading line, never a centred poster in an empty warehouse.
 *
 *   empty     — nothing exists yet. The page says what will appear and who puts it there, and
 *               repeats its primary action in the slot.
 *   filtered  — things exist, the filters exclude them all. Never the same words as `empty`: telling
 *               somebody with 12.000 orders that there are none is the most common panel bug.
 *   error     — the list did not load. A load failure is never a toast; it stays until it is fixed.
 *   forbidden — a pasted link or a role changed mid-session. The rail never leads here.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from './AdminIcon.vue'
import { decimal } from '../../format'
import type { AdminIconName } from '../../icons/admin'

const props = withDefaults(
    defineProps<{
        kind: 'empty' | 'filtered' | 'error' | 'forbidden'
        /** empty: the page's own sentence — what will appear here, and who puts it there. */
        text?: string
        /** filtered: how many there are before the filters. */
        total?: number
        /** forbidden: the module's German name, as the Rollen & Rechte grid writes it. */
        module?: string
    }>(),
    { text: undefined, total: 0, module: undefined }
)

const emit = defineEmits<{ reset: []; retry: [] }>()

const icon = computed<AdminIconName | null>(() => ({ empty: null, filtered: 'filter', error: 'warning', forbidden: 'lock' })[props.kind] as AdminIconName | null)

const heading = computed(
    () =>
        ({
            empty: 'Hier ist noch nichts.',
            filtered: 'Kein Treffer für diese Filter.',
            error: 'Die Liste konnte nicht geladen werden.',
            forbidden: 'Dafür fehlt dir die Berechtigung.',
        })[props.kind]
)

const sentence = computed(() => {
    switch (props.kind) {
        case 'empty':
            return props.text ?? null
        case 'filtered':
            return `${decimal(props.total, 0)} ${props.total === 1 ? 'Eintrag' : 'Einträge'} insgesamt — die Filter schließen ${props.total === 1 ? 'ihn' : 'sie alle'} aus.`
        case 'error':
            return 'Der Server hat nicht geantwortet.'
        case 'forbidden':
            return props.module
                ? `Diese Seite gehört zum Bereich „${props.module}“. Bitte wende dich an eine Person, die Rollen und Rechte verwaltet.`
                : 'Bitte wende dich an eine Person, die Rollen und Rechte verwaltet.'
    }

    return null
})
</script>

<template>
    <section class="adm-state" :class="`adm-state--${kind}`" :role="kind === 'error' ? 'alert' : undefined">
        <Icon v-if="icon" class="adm-state__icon" :name="icon" :size="20" />
        <h2 class="adm-state__heading">{{ heading }}</h2>
        <p v-if="sentence" class="adm-state__text">{{ sentence }}</p>

        <div v-if="kind === 'filtered'" class="adm-state__action">
            <button class="btn btn--secondary" type="button" @click="emit('reset')">Filter zurücksetzen</button>
        </div>
        <div v-else-if="kind === 'error'" class="adm-state__action">
            <button class="btn btn--secondary" type="button" @click="emit('retry')">Erneut laden</button>
        </div>
        <div v-else-if="kind === 'forbidden'" class="adm-state__action">
            <Link href="/admin" class="btn btn--secondary">Zur Übersicht</Link>
        </div>
        <div v-else-if="$slots.default" class="adm-state__action">
            <slot />
        </div>
    </section>
</template>
