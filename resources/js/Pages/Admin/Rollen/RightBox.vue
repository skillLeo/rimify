<script setup lang="ts">
/**
 * One answer in the Rollen & Rechte grid: a checkbox where this viewer may change it, a tick or a
 * dash where they may only read it.
 *
 * The checkbox is not bound to anything: it reports the click, the page asks the server, and the
 * server's answer is what the box shows next — a refused change springs back rather than leaving a
 * tick on screen that the server never stored.
 *
 * The box is 18 px with a 44 px target (the touch floor), in the panel's blue.
 */

import Icon from '../../../Components/Ui/Icon.vue'

withDefaults(
    defineProps<{
        /** The whole question, for the screen reader: "Katalog: Bestellungen – Ansehen". */
        label: string
        allowed: boolean
        /** Draw a checkbox rather than a tick or a dash. */
        editable: boolean
        /** Part of the module is allowed: the "Alle" box shows the mixed state. */
        mixed?: boolean
        /** Saving this very cell: a second click waits. */
        busy?: boolean
    }>(),
    { mixed: false, busy: false }
)

const emit = defineEmits<{ change: [event: Event] }>()
</script>

<template>
    <label v-if="editable" class="rol-box">
        <input
            type="checkbox"
            :checked="allowed"
            :indeterminate.prop="mixed"
            :disabled="busy"
            :aria-busy="busy ? 'true' : undefined"
            @change="emit('change', $event)"
        >
        <span class="visually-hidden">{{ label }}</span>
    </label>
    <span v-else-if="allowed" class="rol-box rol-box--yes">
        <Icon name="check" :size="20" />
        <span class="visually-hidden">{{ label }}: erlaubt</span>
    </span>
    <span v-else class="rol-box rol-box--no">
        <span aria-hidden="true">–</span>
        <span class="visually-hidden">{{ label }}: nicht erlaubt</span>
    </span>
</template>

<style scoped>
/* The admin's row control from 768 px (the grid keeps its 40 px rows); the 44 px touch floor below. */
.rol-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--adm-control-h);
    min-height: var(--adm-control-h);
    vertical-align: middle;
}

@media (max-width: 767px) {
    .rol-box {
        min-width: var(--adm-control-h-lg);
        min-height: var(--adm-control-h-lg);
    }
}

label.rol-box {
    cursor: pointer;
}

.rol-box input {
    width: var(--sp-16);
    height: var(--sp-16);
    margin: 0;
    accent-color: var(--c-blue);
    cursor: pointer;
}

.rol-box input:disabled {
    cursor: progress;
}

.rol-box--yes {
    color: var(--c-ink);
}

.rol-box--no {
    color: var(--c-ink-3);
}
</style>
