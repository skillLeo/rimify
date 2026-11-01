<script setup lang="ts">
/**
 * „Mehrere einfügen" (the brief §4.4, §7 step 4): several sizes or front/rear pairs typed or pasted at once — one per
 * line, or a paragraph of the paper split at each „Nr." — read into a preview first. What does not read is shown in red
 * with the reason and left out; nothing is taken over until staff confirm.
 */

import { computed, ref, watch } from 'vue'
import Dialog from '../../../../Components/Ui/Dialog.vue'
import { PASTE_EXAMPLES, type DemoGroup } from '../gutachtenDemo'
import { applyPaste } from '../gutachtenSketch'
import { useSketch } from '../gutachtenStore'
import { readPaste, tyreLabel } from '../tyreInput'

const props = defineProps<{ group: DemoGroup }>()
const open = defineModel<boolean>('open', { required: true })

const store = useSketch()
const text = ref('')

watch(open, (value) => {
    if (value) {
        text.value = ''
    }
})

const lines = computed(() => readPaste(text.value))
const read = computed(() => lines.value.filter((line) => line.status !== 'unread'))
const sizes = computed(() => read.value.reduce((n, line) => n + (line.sizes?.length ?? 0), 0))
const pairs = computed(() => read.value.reduce((n, line) => n + (line.pairs?.length ?? 0), 0))

const confirmLabel = computed(() => {
    const parts = [sizes.value ? `${sizes.value} Reifen` : '', pairs.value ? `${pairs.value} ${pairs.value === 1 ? 'Kombination' : 'Kombinationen'}` : ''].filter(Boolean)

    return parts.length ? `${parts.join(' und ')} übernehmen` : 'Übernehmen'
})

function take(): void {
    const cell = store.cellOf(props.group.id)

    Object.assign(cell, applyPaste(cell, read.value))
    store.touched(props.group.id)
    open.value = false
}
</script>

<template>
    <Dialog v-model:open="open" :title="`Mehrere einfügen · ${group.sales}`" description="Eine Größe oder ein Paar je Zeile. Ein Paar trennst du mit –, -, + oder →, auch in der Form „Nr. 1: 215/35R19 – 245/30R19“." content-class="adm-dialog" initial-focus="#sk-paste" wide>
        <div class="sk-paste">
            <div class="form-field">
                <label class="form-field__label" for="sk-paste">Text aus dem Gutachten</label>
                <textarea id="sk-paste" v-model="text" class="input sk-paste__box" rows="8" spellcheck="false" placeholder="225/40R18 88W&#10;255/35R18 90W&#10;225/40R18 – 255/35R18" />
                <p class="form-field__help">
                    <button class="sk-link" type="button" @click="text = PASTE_EXAMPLES[group.id] ?? PASTE_EXAMPLES.m3 ?? ''">Beispiel aus der Skizze einsetzen</button>
                </p>
            </div>

            <div class="sk-paste__preview" aria-live="polite">
                <p class="form-field__label">Vorschau</p>
                <p v-if="lines.length === 0" class="sk-count">Noch nichts eingefügt.</p>
                <ol v-else class="sk-paste__list">
                    <li v-for="line in lines" :key="`${line.line}-${line.text}`" class="sk-paste__line" :class="{ 'sk-paste__line--bad': line.status === 'unread' }">
                        <span class="sk-paste__n">Zeile {{ line.line }}<template v-if="line.number"> · Nr. {{ line.number }}</template></span>
                        <span v-if="line.status === 'single'">{{ line.sizes?.map(tyreLabel).join(', ') }} · vorne und hinten gleich</span>
                        <span v-else-if="line.status === 'pair'">
                            <template v-for="(pair, index) in line.pairs" :key="index">vorne {{ tyreLabel(pair.front) }} + hinten {{ tyreLabel(pair.rear) }}<template v-if="index < (line.pairs?.length ?? 0) - 1">; </template></template>
                        </span>
                        <span v-else>„{{ line.text }}“ – {{ line.reason }}</span>
                    </li>
                </ol>
            </div>
        </div>
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Abbrechen</button>
            <button class="btn btn--primary" type="button" :disabled="read.length === 0" @click="take">{{ confirmLabel }}</button>
        </template>
    </Dialog>
</template>

<style scoped>
.sk-paste {
    display: grid;
    gap: var(--sp-16);
}

@media (min-width: 900px) {
    .sk-paste {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: start;
    }
}

.sk-paste__box {
    min-height: 200px;
    font-family: var(--mono);
    resize: vertical;
}

.sk-paste__list {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.sk-paste__line {
    display: grid;
    gap: var(--sp-4);
    padding: var(--sp-8);
    border-radius: var(--r-control);
    background: var(--c-band);
    font-variant-numeric: tabular-nums;
}

.sk-paste__line--bad {
    background: var(--c-bad-tint);
    color: var(--c-ink);
}

.sk-paste__n {
    color: var(--c-ink-3);
    font-size: var(--fs-micro);
}

</style>
