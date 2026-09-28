<script setup lang="ts">
/**
 * Choosing a file, in German and in the panel's own type: the browser's file input says „Choose File /
 * No file chosen“ in the language of the browser, in its own font — so it is kept for what it does
 * (the picker, the keyboard) and hidden, and a button and a line of text stand in for it.
 *
 * The label is the button: clicking it, or Enter and Space on it, opens the picker. A file dragged onto the
 * button or its line is taken when it is of a kind the field accepts; any other file is refused there and
 * never opens in the browser's tab, which would leave the admin page (K2-08).
 */

import { computed, ref } from 'vue'
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

/** A file is being dragged over the field. */
const hovering = ref(false)

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

/** Whether a file is of a kind `accept` names: an extension (`.csv`), a type (`image/png`) or a family (`image/*`). */
function accepts(candidate: File): boolean {
    const name = candidate.name.toLowerCase()
    const type = candidate.type.toLowerCase()

    return props.accept
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry !== '')
        .some((entry) => (entry.startsWith('.') ? name.endsWith(entry) : entry.endsWith('/*') ? type.startsWith(entry.slice(0, -1)) : type === entry))
}

function carriesFiles(event: DragEvent): boolean {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files')
}

function dragOver(event: DragEvent): void {
    if (!carriesFiles(event)) {
        return
    }

    event.preventDefault()
    hovering.value = !props.disabled

    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = props.disabled ? 'none' : 'copy'
    }
}

function drop(event: DragEvent): void {
    if (!carriesFiles(event)) {
        return
    }

    event.preventDefault()
    hovering.value = false
    const dropped = event.dataTransfer?.files?.[0]

    if (!props.disabled && dropped !== undefined && accepts(dropped)) {
        file.value = dropped
    }
}
</script>

<template>
    <div class="adm-filepick" :class="{ 'adm-filepick--over': hovering }" @dragover="dragOver" @dragleave="hovering = false" @drop="drop">
        <input
            :id="id"
            class="visually-hidden"
            type="file"
            :accept="accept"
            :disabled="disabled"
            aria-hidden="true"
            tabindex="-1"
            @change="pick"
        >
        <!-- The button is what takes the focus, so it carries the file's name, the error and its state. -->
        <label
            :id="`${id}-button`"
            :for="id"
            class="btn btn--secondary adm-filepick__button"
            role="button"
            :tabindex="disabled ? -1 : 0"
            :aria-disabled="disabled ? 'true' : undefined"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-describedby="describedby ? `${id}-name ${describedby}` : `${id}-name`"
            @keydown.enter="open"
            @keydown.space="open"
        >
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
    border-radius: var(--r-control);
}

/* A file held over the field: the field says it will take it. */
.adm-filepick--over {
    outline: 2px dashed var(--c-blue);
    outline-offset: var(--sp-4);
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
