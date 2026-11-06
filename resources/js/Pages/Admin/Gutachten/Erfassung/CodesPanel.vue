<script setup lang="ts">
/**
 * „Auflagen dieses Gutachtens“ (the Gutachten rework §4.5, §7 step 4): every code of this paper with its text, kept per paper —
 * „68B“ means what this paper prints, whatever another one says. Staff describe a code here as they come across it in the PDF;
 * the codes fields complete from this list.
 */

import { computed, nextTick, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import CodeDefine from './CodeDefine.vue'
import { useEntry, useGutachtenPage } from './entryStore'
import LegendDialog from './LegendDialog.vue'

const { state } = useEntry()
const page = useGutachtenPage()

const query = ref('')
const editing = ref<string | null>(null)
const adding = ref(false)
const legendOpen = ref(false)

const described = computed(() => new Set(page.props.conditions.map((c) => c.code)))
/* A list from just before a code was described may still name it: it stands here once. */
const open = computed(() => state.entry.undescribed.filter((code) => !described.value.has(code)))
const total = computed(() => page.props.conditions.length + open.value.length)

const shown = computed(() => {
    const q = query.value.trim().toLowerCase()
    const list = [
        ...open.value.map((code) => ({ code, kindLabel: '', text: null as string | null, level: null as string | null })),
        ...[...page.props.conditions]
            .sort((a, b) => a.code.localeCompare(b.code, 'de', { numeric: true }))
            .map((c) => ({ code: c.code, kindLabel: c.kindLabel, text: c.text as string | null, level: c.level ?? null })),
    ]

    // The code being described stays, whatever the search says: its form holds what was typed.
    return q === '' ? list : list.filter((code) => code.code === editing.value || `${code.code} ${code.text ?? ''}`.toLowerCase().includes(q))
})

const panel = ref<HTMLElement | null>(null)

/* The form is gone with what opened it: the keyboard goes back to the button that did. */
function closed(selector: string): void {
    void nextTick(() => panel.value?.querySelector<HTMLElement>(selector)?.focus())
}

function closeNew(): void {
    adding.value = false
    closed('.ef-codespanel__add')
}

function closeEdit(code: string): void {
    editing.value = null
    closed(`[data-code="${CSS.escape(code)}"]`)
}
</script>

<template>
    <section ref="panel" class="ef-codespanel" aria-labelledby="ef-panel-h">
        <div class="ef-codespanel__head">
            <h3 id="ef-panel-h" class="ef-side__title">Auflagen dieses Gutachtens</h3>
            <span class="ef-count">{{ total === 1 ? '1 Code' : `${total} Codes` }}<template v-if="open.length"> · {{ open.length }} ohne Beschreibung</template></span>
        </div>
        <label class="visually-hidden" for="ef-panel-q">Codes durchsuchen</label>
        <input id="ef-panel-q" v-model="query" class="input" type="search" placeholder="Code oder Wort im Text" autocomplete="off">

        <div v-if="adding" class="ef-codespanel__form">
            <CodeDefine code="" id-prefix="ef-new-code" @done="closeNew" @cancel="closeNew" />
        </div>
        <div v-else-if="state.editable" class="ef-codespanel__adds">
            <button class="btn btn--ghost ef-codespanel__add" type="button" @click="adding = true"><Icon name="plus" :size="20" /> Code hinzufügen</button>
            <button class="btn btn--ghost ef-codespanel__add" type="button" @click="legendOpen = true">Ganze Legende einfügen</button>
        </div>

        <ul class="ef-codelist">
            <li v-for="code in shown" :key="code.code" class="ef-codeitem">
                <div class="ef-codeitem__head">
                    <span class="ef-code" :class="{ 'ef-code--open': code.text === null }">{{ code.code }}</span>
                    <span v-if="code.text !== null" class="ef-codeitem__kind">{{ code.kindLabel }}</span>
                    <span v-else class="adm-tag adm-tag--warn">ohne Beschreibung</span>
                    <button v-if="state.editable && editing !== code.code" class="ef-codeitem__edit" type="button" :data-code="code.code" @click="editing = code.code">{{ code.text === null ? 'Beschreiben' : 'Ändern' }}</button>
                </div>
                <p v-if="code.text !== null && editing !== code.code" class="ef-codeitem__text" :title="code.text">{{ code.text }}</p>
                <div v-if="editing === code.code" class="ef-codespanel__form">
                    <CodeDefine :code="code.code" :id-prefix="`ef-edit-${code.code}`" @done="closeEdit(code.code)" @cancel="closeEdit(code.code)" />
                </div>
            </li>
        </ul>

        <LegendDialog v-if="state.editable" v-model:open="legendOpen" />
    </section>
</template>

<style scoped>
.ef-codespanel {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
}

.ef-codespanel__head {
    display: grid;
    gap: var(--sp-4);
}

.ef-codespanel__adds {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4);
}

/* The first button's words start at the search field's edge. */
.ef-codespanel__add:first-child {
    margin-left: calc(var(--sp-16) * -1);
}

.ef-codespanel__form {
    padding: var(--sp-12);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
}

.ef-codelist {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
}

.ef-codeitem {
    display: grid;
    gap: var(--sp-4);
    padding: var(--sp-8) 0;
    border-bottom: 1px solid var(--c-line);
}

.ef-codeitem__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
}

.ef-codeitem__kind {
    color: var(--c-ink-2);
    font-size: var(--fs-micro);
}

@media (hover: hover) and (pointer: fine) {
    .ef-codeitem__edit:hover {
        text-decoration: underline;
    }
}

.ef-codeitem__edit {
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

.ef-codeitem__text {
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
