<script setup lang="ts">
/**
 * How far a long piece of work is, as a bar and the words beside it (Fahrzeuge › Import, D-462): the bar for a glance,
 * the text — „12,4 MB von 100,0 MB gelesen“ — for what it means. The text names the bar for a screen reader.
 */
import { computed } from 'vue'

const props = defineProps<{
    id: string
    /** 0 to 100. */
    percent: number
    text: string
}>()

const shown = computed(() => Math.max(0, Math.min(100, Math.floor(props.percent))))
</script>

<template>
    <div class="adm-progress">
        <div class="adm-progress__bar" role="progressbar" :aria-labelledby="`${id}-text`" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="shown">
            <span class="adm-progress__fill" :style="{ width: `${shown}%` }" />
        </div>
        <p :id="`${id}-text`" class="adm-progress__text">{{ text }} · {{ shown }} %</p>
    </div>
</template>

<style scoped>
.adm-progress {
    display: grid;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
}

.adm-progress__bar {
    height: var(--sp-8);
    overflow: hidden;
    background: var(--c-line);
    border-radius: var(--r-round);
}

.adm-progress__fill {
    display: block;
    height: 100%;
    background: var(--c-blue);
    border-radius: inherit;
    transition: width var(--d-2) var(--ease-out);
}

.adm-progress__text {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
    .adm-progress__fill {
        transition: none;
    }
}
</style>
