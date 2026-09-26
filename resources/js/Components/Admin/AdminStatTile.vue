<script setup lang="ts">
/**
 * One figure (BRIEF.md §5: one value is a tile, never a one-bar chart). A label above, the number
 * at the dashboard's one large size, tabular and already German-formatted by the server.
 *
 * With `href` the whole tile is the link to the list the figure came from; without, it is plain —
 * a tile that looks clickable and goes nowhere is the dead link in a nicer frame.
 */

import { Link } from '@inertiajs/vue3'
import Icon from '../Ui/Icon.vue'

defineProps<{ label: string; value: string; href?: string | null }>()
</script>

<template>
    <Link v-if="href" :href="href" class="adm-stat adm-stat--link">
        <span class="adm-stat__label">
            {{ label }}
            <Icon class="adm-stat__go" name="arrow-right" :size="16" />
        </span>
        <span class="adm-stat__value">{{ value }}</span>
    </Link>
    <div v-else class="adm-stat">
        <span class="adm-stat__label">{{ label }}</span>
        <span class="adm-stat__value">{{ value }}</span>
    </div>
</template>
