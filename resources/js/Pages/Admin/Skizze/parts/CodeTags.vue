<script setup lang="ts">
/**
 * Codes typed beside a tyre, a pair or a row, as short tags (the brief §7 step 4): the paper's own list completes them,
 * the text shows on hover, never printed in full in a row (screen 11). A code the list does not describe yet stays amber
 * and offers „… definieren" in place — one click, a small popover, no page change.
 */

import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { KINDS } from '../gutachtenDemo'
import { useSketch } from '../gutachtenStore'
import CodeDefine from './CodeDefine.vue'

const props = defineProps<{
    id: string
    /** What the codes belong to, for a screen reader: „Codes für 225/40 R18". */
    label: string
}>()

const codes = defineModel<string[]>({ required: true })
const emit = defineEmits<{ changed: [] }>()

const store = useSketch()
const typed = ref('')
const defining = ref<string | null>(null)

function hint(code: string): string {
    const entry = store.codeOf(code)

    if (entry === undefined || entry.text === null) {
        return `${code}: noch ohne Beschreibung`
    }

    const kind = KINDS.find((k) => k.value === entry.kind)?.label ?? ''
    const text = entry.text.length > 280 ? `${entry.text.slice(0, 280)} …` : entry.text

    return `${code} · ${kind}\n${text}`
}

/* A code typed in another case is the paper's code: „11a" is 11A. */
function spelled(code: string): string {
    return store.state.codes.find((c) => c.code.toLowerCase() === code.toLowerCase())?.code ?? code
}

function add(text: string): void {
    const fresh = [...new Set(text.split(/[\s,;]+/).map((code) => spelled(code.trim())).filter((code) => code !== ''))].filter((code) => !codes.value.includes(code))

    if (fresh.length) {
        codes.value = [...codes.value, ...fresh]
        emit('changed')
    }

    typed.value = ''
}

function remove(code: string): void {
    codes.value = codes.value.filter((c) => c !== code)
    emit('changed')
}

function key(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',' || event.key === ';' || (event.key === ' ' && typed.value.trim() !== '')) {
        event.preventDefault()
        add(typed.value)
    } else if (event.key === 'Backspace' && typed.value === '' && codes.value.length) {
        remove(codes.value[codes.value.length - 1] ?? '')
    }
}
</script>

<template>
    <div class="sk-tags" role="group" :aria-label="props.label">
        <template v-for="code in codes" :key="code">
            <span v-if="store.described(code)" class="sk-code" :title="hint(code)">
                {{ code }}
                <button class="sk-tags__x" type="button" :aria-label="`${code} entfernen`" @click="remove(code)"><Icon name="close" :size="16" /></button>
            </span>
            <PopoverRoot v-else :open="defining === code" @update:open="(open: boolean) => (defining = open ? code : null)">
                <span class="sk-code sk-code--open">
                    {{ code }}
                    <PopoverTrigger class="sk-tags__define">beschreiben</PopoverTrigger>
                    <button class="sk-tags__x" type="button" :aria-label="`${code} entfernen`" @click="remove(code)"><Icon name="close" :size="16" /></button>
                </span>
                <PopoverPortal>
                    <PopoverContent class="adm-menu sk-popover" side="bottom" align="start" :side-offset="8" :collision-padding="16">
                        <p class="sk-popover__title">{{ code }} beschreiben</p>
                        <CodeDefine :code="code" :id-prefix="`${id}-def-${code}`" @done="defining = null" @cancel="defining = null" />
                    </PopoverContent>
                </PopoverPortal>
            </PopoverRoot>
        </template>
        <input
            :id="id"
            v-model="typed"
            class="sk-tags__input"
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
            <option v-for="entry in store.state.codes" :key="entry.code" :value="entry.code">{{ entry.text ? KINDS.find((k) => k.value === entry.kind)?.label : 'noch ohne Beschreibung' }}</option>
        </datalist>
    </div>
</template>

<style scoped>
.sk-tags {
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

.sk-tags:focus-within {
    border-color: var(--c-blue);
}

.sk-tags:has(:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.sk-tags__input {
    flex: 1 1 80px;
    min-width: 80px;
    height: 28px;
    border: 0;
    background: transparent;
    color: var(--c-ink);
    font: inherit;
    font-size: var(--fs-small);
}

.sk-tags__input:focus {
    outline: none;
}

/* Below 16 px a phone zooms into the field on focus. */
@media (max-width: 767px) {
    .sk-tags__input {
        font-size: var(--fs-body);
    }
}

.sk-tags__x {
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

.sk-tags__define {
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
.sk-popover {
    width: min(420px, calc(100vw - 32px));
    max-height: min(560px, calc(100vh - 32px));
    padding: var(--sp-16);
    overflow-y: auto;
}

.sk-popover .btn,
.sk-popover .input,
.sk-popover .adm-chip {
    min-height: var(--adm-control-h);
    font-size: var(--fs-small);
}

.sk-popover .input {
    height: auto;
}

.sk-popover__title {
    margin: 0 0 var(--sp-12);
    font-weight: 600;
}
</style>
