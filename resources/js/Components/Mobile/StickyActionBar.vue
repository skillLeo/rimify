<script setup lang="ts">
/**
 * The sticky action bar: the screen's one primary action, pinned to the bottom edge where the
 * thumb is — price plus "In den Warenkorb" on a product, "Zur Kasse · 1.234,00 €" in the cart,
 * "Weiter" in the checkout. It takes the tab bar's place while it is mounted and rides up with
 * the keyboard (`--kb-inset` from useVisualViewport), so the button is never under it.
 */

import { onBeforeUnmount, onMounted } from 'vue'
import { useMobileShell } from '../../composables/mobile/useMobileShell'

const shell = useMobileShell()

onMounted(() => {
    shell.stickyBar.value = true
})

onBeforeUnmount(() => {
    shell.stickyBar.value = false
})
</script>

<template>
    <div class="msticky">
        <div class="msticky__row">
            <div v-if="$slots.default" class="msticky__info">
                <slot />
            </div>
            <div class="msticky__action">
                <slot name="action" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.msticky {
    position: fixed;
    left: 0;
    right: 0;
    bottom: var(--kb-inset, 0px);
    z-index: var(--z-header);
    padding: var(--sp-12) var(--page-margin) calc(var(--sp-12) + env(safe-area-inset-bottom));
    background: var(--c-surface);
    border-top: 1px solid var(--c-line);
    view-transition-name: m-sticky;
}

/* With the keyboard up the safe area is covered anyway; the bar keeps its own padding only. */
.is-keyboard .msticky {
    padding-bottom: var(--sp-12);
}

.msticky__row {
    display: flex;
    align-items: center;
    gap: var(--sp-16);
    min-height: calc(var(--stickybar-h) - 2 * var(--sp-12));
}

.msticky__info {
    flex: 1;
    min-width: 0;
    font-variant-numeric: tabular-nums;
}

.msticky__action {
    flex: 1;
    display: grid;
}

/* Alone, the action is the whole width; beside a price it takes the larger half. */
.msticky__info + .msticky__action {
    flex: 1.4;
}
</style>
