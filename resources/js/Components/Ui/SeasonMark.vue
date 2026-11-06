<script setup lang="ts">
/**
 * A tyre's season as a small sign and its word — Sommer, Winter, Ganzjahr — so a long list reads at a glance. In the ink of the text
 * around it: green, amber and blue speak of verdicts and actions here, never of a season (DIRECTION §2).
 */

defineProps<{ season: string }>()
</script>

<template>
    <span class="season-mark">
        <svg v-if="season !== 'winter'" class="season-mark__sign" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
            <circle cx="10" cy="10" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <svg v-if="season !== 'sommer'" class="season-mark__sign" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M10 2.5v15M3.5 6.25l13 7.5M16.5 6.25l-13 7.5M8 4l2 1.5L12 4M8 16l2-1.5 2 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </svg>
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
}

.season-mark__sign {
    flex: none;
}
</style>
