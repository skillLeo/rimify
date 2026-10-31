<script setup lang="ts">
/**
 * „Auflagen dieses Gutachtens" (the brief §4.5, §7 step 4, changed in v2): every code of this paper with its text, kept
 * per paper — „68B" means what this paper prints, whatever another one says. Staff describe a code here as they come
 * across it in the PDF; the codes fields complete from this list.
 */

import { computed, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { KINDS, LEVELS } from '../gutachtenDemo'
import { undescribedCodes } from '../gutachtenSketch'
import { useSketch } from '../gutachtenStore'
import CodeDefine from './CodeDefine.vue'

const store = useSketch()
const { state } = store

const query = ref('')
const editing = ref<string | null>(null)
const adding = ref(false)

const open = computed(() => undescribedCodes(state.cells, state.codes))

const shown = computed(() => {
    const q = query.value.trim().toLowerCase()
    const list = [...state.codes].sort((a, b) => Number(a.text !== null) - Number(b.text !== null) || a.code.localeCompare(b.code, 'de', { numeric: true }))

    return q === '' ? list : list.filter((code) => `${code.code} ${code.text ?? ''}`.toLowerCase().includes(q))
})

function kindLabel(kind: string | null): string {
    return KINDS.find((k) => k.value === kind)?.label ?? ''
}

function levelLabel(level: string | null): string {
    return LEVELS.find((l) => l.value === level)?.label ?? ''
}
</script>

<template>
    <section class="sk-codespanel" aria-labelledby="sk-codes-h">
        <div class="sk-codespanel__head">
            <h3 id="sk-codes-h" class="sk-side__title">Auflagen dieses Gutachtens</h3>
            <span class="sk-count">{{ state.codes.length }} Codes<template v-if="open.length"> · {{ open.length }} ohne Beschreibung</template></span>
        </div>
        <label class="visually-hidden" for="sk-codes-q">Codes durchsuchen</label>
        <input id="sk-codes-q" v-model="query" class="input" type="search" placeholder="Code oder Wort im Text" autocomplete="off">

        <div v-if="adding" class="sk-codespanel__form">
            <CodeDefine code="" id-prefix="sk-new-code" @done="adding = false" @cancel="adding = false" />
        </div>
        <button v-else class="btn btn--ghost sk-codespanel__add" type="button" @click="adding = true"><Icon name="plus" :size="20" /> Code hinzufügen</button>

        <ul class="sk-codelist">
            <li v-for="code in shown" :key="code.code" class="sk-codeitem">
                <div class="sk-codeitem__head">
                    <span class="sk-code" :class="{ 'sk-code--open': code.text === null }">{{ code.code }}</span>
                    <span v-if="code.text !== null" class="sk-codeitem__kind">{{ kindLabel(code.kind) }}<template v-if="levelLabel(code.level) !== kindLabel(code.kind)"> · {{ levelLabel(code.level) }}</template></span>
                    <span v-else class="adm-tag adm-tag--warn">ohne Beschreibung</span>
                    <button v-if="editing !== code.code" class="sk-codeitem__edit" type="button" @click="editing = code.code">{{ code.text === null ? 'Beschreiben' : 'Ändern' }}</button>
                </div>
                <p v-if="code.text !== null && editing !== code.code" class="sk-codeitem__text" :title="code.text">{{ code.text }}</p>
                <div v-if="editing === code.code" class="sk-codespanel__form">
                    <CodeDefine :code="code.code" :id-prefix="`sk-edit-${code.code}`" @done="editing = null" @cancel="editing = null" />
                </div>
            </li>
        </ul>
    </section>
</template>

<style scoped>
.sk-codespanel {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
}

.sk-codespanel__head {
    display: grid;
    gap: var(--sp-4);
}

.sk-codespanel__add {
    justify-self: start;
}

.sk-codespanel__form {
    padding: var(--sp-12);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
}

.sk-codelist {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
}

.sk-codeitem {
    display: grid;
    gap: var(--sp-4);
    padding: var(--sp-8) 0;
    border-bottom: 1px solid var(--c-line);
}

.sk-codeitem__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
}

.sk-codeitem__kind {
    color: var(--c-ink-2);
    font-size: var(--fs-micro);
}

.sk-codeitem__edit {
    min-height: 32px;
    margin-left: auto;
    padding: 0;
    border: 0;
    background: none;
    color: var(--c-blue);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
}

.sk-codeitem__text {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
}
</style>
