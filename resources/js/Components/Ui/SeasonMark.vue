<script setup lang="ts">
/**
 * A tyre's season as a small sign and its word — Sommer, Winter, Ganzjahr — so a long list reads at a glance. In the ink of the text
 * around it: green, amber and blue speak of verdicts and actions here, never of a season (DIRECTION §2).
 */

import Icon from './Icon.vue'

defineProps<{ season: string }>()
</script>

<template>
    <span class="season-mark">
        <Icon v-if="season !== 'winter'" name="sun" :size="20" class="season-mark__sign" />
        <Icon v-if="season !== 'sommer'" name="snowflake" :size="20" class="season-mark__sign" />
        {{ season === 'sommer' ? 'Sommer' : season === 'winter' ? 'Winter' : 'Ganzjahr' }}
    </span>
</template>

<style scoped>
.season-mark {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    vertical-align: top;
}

.season-mark__sign {
    flex: none;
}
</style>
