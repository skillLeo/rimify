<script setup lang="ts">
/**
 * Which copy of the shop this is — said only where the answer is unusual.
 *
 * `Lokal` and `Staging` are copies where work does not count, and the badge exists so nobody
 * changes the real shop's prices believing it is one. Production renders nothing: a warning colour
 * that is on screen every day stops being a warning, and the absence of a badge is the least
 * ambiguous way to say "this is the real shop" (DIRECTION §8a). Decided on the server and present
 * in the first frame; nothing after hydration changes it.
 *
 * Not interactive — no hover, no focus, no menu. The environment is changed by deploying, not by
 * clicking.
 */

import { computed } from 'vue'
import { useAdmin } from '../../composables/admin/useAdmin'

const admin = useAdmin()

const label = computed(() => {
    switch (admin.value.environment) {
        case 'local':
            return 'Lokal'
        case 'staging':
            return 'Staging'
        default:
            return null
    }
})
</script>

<template>
    <!-- A plain span cannot carry aria-label; the words a screen reader needs are in the text itself. -->
    <span v-if="label" class="adm-env"><span class="visually-hidden">Umgebung: </span>{{ label }}</span>
</template>
