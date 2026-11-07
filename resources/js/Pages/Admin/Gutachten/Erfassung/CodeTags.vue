<script setup lang="ts">
/**
 * Codes typed beside a tyre or a car, as short tags (the Gutachten rework §7 step 4): the paper's own list completes them, the
 * text shows on hover and is never printed in full in a row (screen 11). A code the list does not describe yet stays amber and
 * offers „… beschreiben“ in place — one click, a small popover, no page change.
 */

import { readCodes, isCodeWord } from './codes'
import { useGutachtenPage } from './entryStore'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed, nextTick, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import type { DocumentConditionView } from '../../../../types/admin/gutachten'
import CodeDefine from './CodeDefine.vue'

const props = defineProps<{
    id: string
    /** What the codes belong to, for a screen reader: „Codes für 225/40 R18“. */
    label: string
    disabled?: boolean
}>()

const codes = defineModel<string[]>({ required: true })

const page = useGutachtenPage()
const list = computed<DocumentConditionView[]>(() => page.props.conditions)
const typed = ref('')
const defining = ref<string | null>(null)

function entry(code: string): DocumentConditionView | undefined {
    return list.value.find((c) => c.code === code)
}

function hint(code: string): string {
    const found = entry(code)

    if (found === undefined) {
        return `${code}: noch ohne Beschreibung`
    }

    return `${code} · ${found.kindLabel}\n${found.text.length > 280 ? `${found.text.slice(0, 280)} …` : found.text}`
}

function add(text: string): void {
    const fresh = readCodes(text, list.value.map((c) => c.code)).filter((code) => !codes.value.includes(code))

    if (fresh.length) {
        codes.value = [...codes.value, ...fresh]
    }

    typed.value = ''
}

function focusField(): void {
    void nextTick(() => document.getElementById(props.id)?.focus())
}

/* The cross is gone with its tag: the keyboard goes on from the field beside it. */
function remove(code: string): void {
    codes.value = codes.value.filter((c) => c !== code)
    focusField()
}

/*
 * A space ends a code only where the word before it is one by itself: „11A“ is, „Nicht“ of „Nicht 330D“ is not, and no listed
 * code goes on with it.
 */
function endsCode(): boolean {
    const word = typed.value.trim().split(/\s+/).pop() ?? ''
    const start = `${typed.value.trim().toLowerCase()} `

    return isCodeWord(word) && !list.value.some((c) => c.code.toLowerCase().startsWith(start))
}

function key(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';' || (event.key === ' ' && typed.value.trim() !== '' && endsCode())) {
        event.preventDefault()
        add(typed.value)
    } else if (event.key === 'Backspace' && typed.value === '' && codes.value.length) {
        remove(codes.value[codes.value.length - 1] ?? '')
    }
}
</script>

<template>
    <div class="ef-tags" role="group" :aria-label="props.label">
        <template v-for="code in codes" :key="code">
            <span v-if="entry(code)" class="ef-code" :title="hint(code)">
                {{ code }}
                <button v-if="!disabled" class="ef-tags__x" type="button" :aria-label="`${code} entfernen`" @click="remove(code)"><Icon name="close" :size="16" /></button>
            </span>
            <PopoverRoot v-else :open="defining === code" @update:open="(open: boolean) => (defining = open ? code : null)">
                <span class="ef-code ef-code--open">
                    {{ code }}
                    <PopoverTrigger v-if="!disabled" class="ef-tags__define">beschreiben</PopoverTrigger>
                    <button v-if="!disabled" class="ef-tags__x" type="button" :aria-label="`${code} entfernen`" @click="remove(code)"><Icon name="close" :size="16" /></button>
                </span>
                <PopoverPortal>
                    <PopoverContent class="adm-menu ef-popover" side="bottom" align="start" :side-offset="8" :collision-padding="16" @close-auto-focus="(event: Event) => { event.preventDefault(); focusField() }">
                        <p class="ef-popover__title">{{ code }} beschreiben</p>
                        <CodeDefine :code="code" :id-prefix="`${id}-def-${code}`" @done="defining = null" @cancel="defining = null" />
                    </PopoverContent>
                </PopoverPortal>
            </PopoverRoot>
        </template>
        <input
            v-if="!disabled"
            :id="id"
            v-model="typed"
            class="ef-tags__input"
            type="text"
            :list="`${id}-list`"
            :placeholder="codes.length ? '' : 'Codes, z. B. 11A 68B'"
            :aria-label="`${props.label}: Code eingeben`"
            spellcheck="false"
            autocomplete="off"
            @keydown="key"
            @blur="add(typed)"
        >
        <datalist :id="`${id}-list`">
            <option v-for="c in list" :key="c.code" :value="c.code">{{ c.kindLabel }}</option>
        </datalist>
    </div>
</template>

<style scoped>
.ef-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4);
    min-height: var(--adm-control-h);
    padding: var(--sp-4) var(--sp-8);
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
    background: var(--c-surface);
}

.ef-tags:focus-within {
    border-color: var(--c-blue);
}

.ef-tags:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 0;
}

.ef-tags__input {
    flex: 1 1 80px;
    min-width: 80px;
    height: 26px;
    border: 0;
    background: transparent;
    color: var(--c-ink);
    font: inherit;
    font-size: var(--fs-small);
}

.ef-tags__input:focus {
    outline: none;
}

/* Below 16 px a phone zooms into the field on focus. */
@media (max-width: 767px) {
    .ef-tags__input {
        font-size: var(--fs-body);
    }
}

@media (hover: hover) and (pointer: fine) {
    .ef-tags__x:hover {
        color: var(--c-ink);
    }
}

.ef-tags__x {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-right: calc(var(--sp-4) * -1);
    padding: 0;
    border: 0;
    background: none;
    color: var(--c-ink-3);
    cursor: pointer;
}

.ef-tags__define {
    min-height: 24px;
    padding: 0 var(--sp-4);
    border: 0;
    background: none;
    color: var(--c-blue);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
}
</style>

<style>
/* Portalled out of the component and out of the admin's frame, so it carries its own prefix — and the admin's control
   sizes, which the shop's 44 px would otherwise give its fields and buttons. */
.ef-popover {
    width: min(420px, calc(100vw - 32px));
    /* Never past the window's edge, where „Speichern“ could not be reached: what is left on its side, and its own scroll beyond that. */
    max-height: min(560px, var(--reka-popover-content-available-height, calc(100vh - 32px)));
    padding: var(--sp-16);
    overflow-y: auto;
}

.ef-popover .btn,
.ef-popover .input,
.ef-popover .adm-chip {
    min-height: var(--adm-control-h);
    font-size: var(--fs-small);
}

.ef-popover .input {
    height: auto;
}

.ef-popover__title {
    margin: 0 0 var(--sp-12);
    font-weight: 600;
}
</style>
