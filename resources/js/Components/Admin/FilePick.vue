<script setup lang="ts">
/**
 * Choosing a file, in German and in the panel's own type: the browser's file input says „Choose File /
 * No file chosen“ in the language of the browser, in its own font — so it is kept for what it does
 * (the picker, the keyboard, drop) and hidden, and a button and a line of text stand in for it.
 *
 * The label is the button: clicking it, or Enter and Space on it, opens the picker.
 */

import { computed } from 'vue'
import { decimal } from '../../format'

const props = withDefaults(
    defineProps<{
        id: string
        accept: string
        /** The button's words, e.g. „Datei auswählen“. */
        label?: string
        invalid?: boolean
        describedby?: string
        disabled?: boolean
    }>(),
    { label: 'Datei auswählen', invalid: false, describedby: undefined, disabled: false }
)

const file = defineModel<File | null>({ default: null })

const summary = computed(() => {
    const chosen = file.value

    if (chosen === null) {
        return 'Noch keine Datei gewählt'
    }

    const kb = chosen.size / 1024
    const size = kb < 1024 ? `${decimal(Math.max(1, Math.round(kb)), 0)} KB` : `${decimal(kb / 1024, 1)} MB`

    return `${chosen.name} · ${size}`
})

function pick(event: Event): void {
    file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

function open(event: KeyboardEvent): void {
    event.preventDefault()
    document.getElementById(props.id)?.click()
}
</script>

<template>
    <div class="adm-filepick">
        <input
            :id="id"
            class="visually-hidden"
            type="file"
            :accept="accept"
            :disabled="disabled"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-describedby="describedby ? `${id}-name ${describedby}` : `${id}-name`"
            tabindex="-1"
            @change="pick"
        >
        <label :for="id" class="btn btn--secondary adm-filepick__button" role="button" :tabindex="disabled ? -1 : 0" :aria-disabled="disabled ? 'true' : undefined" @keydown.enter="open" @keydown.space="open">
            {{ label }}
        </label>
        <span :id="`${id}-name`" class="adm-filepick__name" :class="{ 'adm-filepick__name--empty': file === null }">{{ summary }}</span>
    </div>
</template>

<style scoped>
.adm-filepick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
    min-width: 0;
}

.adm-filepick__button {
    cursor: pointer;
}

.adm-filepick__name {
    min-width: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink);
    overflow-wrap: anywhere;
}

.adm-filepick__name--empty {
    color: var(--c-ink-3);
}

@media (max-width: 767px) {
    .adm-filepick__button {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
