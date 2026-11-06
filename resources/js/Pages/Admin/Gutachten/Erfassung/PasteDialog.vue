<script setup lang="ts">
/**
 * „Mehrere einfügen“ (the Gutachten rework §4.4, §7 step 4, the client's change of 05.11.2026): several sizes or front/rear pairs
 * typed or pasted at once — one per line, or a paragraph of the paper split at each „Nr.“ — read into a preview first. A line with
 * one size is vorne = hinten, a pair a pair. What does not read is shown in red with the reason and left out; nothing is taken
 * over until staff confirm.
 */

import { computed, ref, watch } from 'vue'
import Dialog from '../../../../Components/Ui/Dialog.vue'
import type { CarView } from './entryStore'
import { pasteToSides, readPaste, tyreLabel } from './tyreInput'

defineProps<{ car: CarView }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ take: [sides: { front: string; rear: string }[]] }>()

const text = ref('')

watch(open, (value) => {
    if (value) {
        text.value = ''
    }
})

const lines = computed(() => readPaste(text.value))
const read = computed(() => lines.value.filter((line) => line.status !== 'unread'))
const count = computed(() => pasteToSides(read.value).length)
const confirmLabel = computed(() => (count.value === 0 ? 'Übernehmen' : count.value === 1 ? '1 Zeile übernehmen' : `${count.value} Zeilen übernehmen`))

function take(): void {
    emit('take', pasteToSides(read.value))
    open.value = false
}
</script>

<template>
    <Dialog v-model:open="open" :title="`Mehrere einfügen · ${car.label}`" description="Eine Größe oder ein Paar je Zeile. Ein Paar trennst du mit –, -, + oder →, auch in der Form „Nr. 1: 215/35R19 – 245/30R19“." content-class="adm-dialog" initial-focus="#ef-paste" wide>
        <div class="ef-paste">
            <div class="form-field">
                <label class="form-field__label" for="ef-paste">Text aus dem Gutachten</label>
                <textarea id="ef-paste" v-model="text" class="input ef-paste__box" rows="8" spellcheck="false" placeholder="225/40R18 88W&#10;255/35R18 90W&#10;225/40R18 – 255/35R18" />
            </div>

            <div class="ef-paste__preview" aria-live="polite">
                <p class="form-field__label">Vorschau</p>
                <p v-if="lines.length === 0" class="ef-count">Noch nichts eingefügt.</p>
                <ol v-else class="ef-paste__list">
                    <li v-for="line in lines" :key="`${line.line}-${line.text}`" class="ef-paste__line" :class="{ 'ef-paste__line--bad': line.status === 'unread' }">
                        <span class="ef-paste__n">Zeile {{ line.line }}<template v-if="line.number"> · Nr. {{ line.number }}</template></span>
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
            <button class="btn btn--primary" type="button" :disabled="count === 0" @click="take">{{ confirmLabel }}</button>
        </template>
    </Dialog>
</template>

<style scoped>
.ef-paste {
    display: grid;
    gap: var(--sp-16);
}

@media (min-width: 900px) {
    .ef-paste {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        align-items: start;
    }
}

.ef-paste__box {
    min-height: 200px;
    font-family: var(--mono);
    resize: vertical;
}

.ef-paste__list {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.ef-paste__line {
    display: grid;
    gap: var(--sp-4);
    padding: var(--sp-8);
    border-radius: var(--r-control);
    background: var(--c-band);
    font-variant-numeric: tabular-nums;
}

.ef-paste__line--bad {
    background: var(--c-bad-tint);
    color: var(--c-ink);
}

.ef-paste__n {
    color: var(--c-ink-3);
    font-size: var(--fs-micro);
}

</style>
