<script setup lang="ts">
/**
 * What every sketch page says first (the Gutachten rework brief §11, Phase 1): a picture of a page to come, filled with
 * invented data, where nothing is saved, ordered or released. Said in words, at the top, before anything can be mistaken
 * for the shop or the admin as they are.
 */

withDefaults(defineProps<{ note?: string }>(), {
    note: 'Zum Anschauen und Durchklicken. Hier wird nichts gespeichert, nichts bestellt und nichts freigegeben.',
})
</script>

<template>
    <div class="sk-banner" role="note" data-sketch-banner>
        <strong class="sk-banner__title">Skizze – keine echten Daten</strong>
        <span class="sk-banner__note">{{ note }}</span>
    </div>
</template>

<style scoped>
.sk-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-4) var(--sp-12);
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-warn-tint);
    color: var(--c-ink);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.sk-banner__title {
    font-weight: 700;
}

.sk-banner__note {
    color: var(--c-ink-2);
}
</style>
