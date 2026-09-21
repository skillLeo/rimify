<script setup lang="ts">
/**
 * A tab-bar icon in its two states: the set's stroked glyph at rest, a filled version of the
 * same glyph when the tab is current. The filled shapes are drawn on the same 24 grid as
 * `resources/js/icons`, so the two states sit on the same optical centre and the switch reads as
 * a state change, not as a different picture.
 */

import { computed } from 'vue'
import { iconPaths, type IconName } from '../../icons'

export type TabIconName = 'home' | 'wheel' | 'check-circle' | 'cart' | 'user'

const props = defineProps<{
    name: TabIconName
    active: boolean
}>()

/* Filled variants. Rings are punched with `evenodd`; a cut-out stroke uses the bar's surface. */
const FILLED: Readonly<Record<TabIconName, string>> = {
    home: '<path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4Z"/>',
    wheel: '<path fill-rule="evenodd" d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 1 0 0-17Zm0 5.5a3 3 0 1 0 0 6 3 3 0 1 0 0-6Z"/><path class="ticon__cut" d="M12 3.5v5.5M12 15v5.5M3.5 12H9M15 12h5.5"/>',
    'check-circle': '<circle cx="12" cy="12" r="8.5"/><path class="ticon__cut" d="m8 12.3 2.8 2.7 5.2-5.7"/>',
    cart: '<path d="M5.4 4H3v2h1.6l2.2 11h11.7l2.7-9.8H6.6Z"/><circle cx="9.5" cy="19" r="1.6"/><circle cx="17.5" cy="19" r="1.6"/>',
    user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0Z"/>',
}

const markup = computed(() => (props.active ? FILLED[props.name] : iconPaths(props.name as IconName)))
</script>

<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        :fill="active ? 'currentColor' : 'none'"
        :stroke="active ? 'none' : 'currentColor'"
        stroke-width="1.5"
        stroke-linecap="square"
        stroke-linejoin="miter"
        aria-hidden="true"
        focusable="false"
        class="ticon"
        v-html="markup"
    />
</template>

<style scoped>
.ticon {
    flex: none;
    display: block;
}

/* The tick and the spokes are drawn in the bar's own surface, so they read as cut out. */
.ticon :deep(.ticon__cut) {
    fill: none;
    stroke: var(--c-surface);
    stroke-width: 1.5;
}
</style>
