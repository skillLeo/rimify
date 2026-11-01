<script setup lang="ts">
/**
 * The tyres of one car group on the paper's wheel size (the brief §6 level 4, §7 step 4): sizes the same on both axles,
 * pairs that differ front and rear, the row's general codes, and the page. A size is typed as the paper prints it and
 * split as it is typed; a power band or an axle restriction sits behind a line's „…". Warnings say, they never block.
 */

import { computed, nextTick, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { carCount, groupName, kwRange, type DemoGroup, type TyreLine } from '../gutachtenDemo'
import { cellDone, duplicateLines, lineId, pairWarnings, paperSizes, undescribedCodes } from '../gutachtenSketch'
import { useSketch } from '../gutachtenStore'
import { parseKwBand } from '../../Gutachten/rows'
import { readTyre, tyreLabel, whyUnread } from '../tyreInput'
import CodeTags from './CodeTags.vue'
import CopyDialog from './CopyDialog.vue'
import PasteDialog from './PasteDialog.vue'

const props = defineProps<{ group: DemoGroup; wheelName: string; sizeName: string }>()

const store = useSketch()
const { state } = store

const cell = computed(() => store.cellOf(props.group.id))
const copyOpen = ref(false)
const pasteOpen = ref(false)
const openLine = ref<number | null>(null)

const warnings = computed(() => pairWarnings(cell.value, paperSizes(state.cells)))
const twice = computed(() => duplicateLines(cell.value))
const open = computed(() => undescribedCodes([cell.value], state.codes))

function changed(): void {
    store.touched(props.group.id)
}

function parsed(line: { text: string }): { ok: boolean; text: string } {
    if (line.text.trim() === '') {
        return { ok: true, text: 'Größe wie im Gutachten, z. B. 225/40R18 88W' }
    }

    const tyre = readTyre(line.text)

    if (tyre === null) {
        return { ok: false, text: whyUnread(line.text) ?? 'Nicht lesbar. Schreib die Größe etwa so: 225/40 R18 88W, 245/45R18 100 oder 235/50R18.' }
    }

    const li = tyre.li === null ? 'ohne Lastindex' : `Lastindex ${tyre.li}`
    const si = tyre.si === null ? 'ohne Symbol' : `Symbol ${tyre.si}`

    return { ok: true, text: `${li} · ${si}` }
}

async function addTyre(after?: number): Promise<void> {
    const line: TyreLine = { id: lineId(), text: '', codes: [], kw: '', axle: 'ALL' }
    const at = after === undefined ? cell.value.tyres.length : cell.value.tyres.findIndex((l) => l.id === after) + 1

    cell.value.tyres.splice(at, 0, line)
    changed()
    await nextTick()
    document.getElementById(`sk-tyre-${line.id}`)?.focus()
}

function tidy(line: TyreLine): void {
    const tyre = readTyre(line.text)

    if (tyre !== null) {
        line.text = tyreLabel(tyre)
    }
}

/* A power band as the paper prints it, `85-142`; null where it does not read (rows.ts parseKwBand). */
function kwOk(line: TyreLine): boolean {
    return line.kw.trim() === '' || parseKwBand(line.kw) !== null
}

function sizeOk(text: string): boolean {
    return text.trim() === '' || readTyre(text) !== null
}

/* After a line goes, the focus stays in the editor: on the button that adds the next one. */
function focusAdd(): void {
    void nextTick(() => document.querySelector<HTMLElement>('.sk-editor__adds .btn')?.focus())
}

function removeTyre(id: number): void {
    cell.value.tyres = cell.value.tyres.filter((line) => line.id !== id)
    openLine.value = null
    changed()
    focusAdd()
}

async function addPair(): Promise<void> {
    const id = lineId()

    cell.value.pairs.push({ id, front: '', rear: '', codes: [] })
    changed()
    await nextTick()
    document.getElementById(`sk-pair-front-${id}`)?.focus()
}

function removePair(id: number): void {
    cell.value.pairs = cell.value.pairs.filter((pair) => pair.id !== id)
    changed()
    focusAdd()
}

function axleText(axle: TyreLine['axle']): string {
    return axle === 'FRONT' ? 'nur Vorderachse' : axle === 'REAR' ? 'nur Hinterachse' : ''
}

function takePage(): void {
    cell.value.page = String(state.pdfPage)
    changed()
}

/** The next cell still open, in the order of the to-do list; step 5 when none is. */
function saveAndNext(): void {
    const order = store.chosenGroups().map((group) => group.id)
    const from = order.indexOf(props.group.id)
    const next = [...order.slice(from + 1), ...order.slice(0, from)].find((id) => !cellDone(store.cellOf(id)))

    if (next === undefined) {
        store.go(4)
    } else {
        state.cell = next
    }
}
</script>

<template>
    <section class="sk-editor" aria-labelledby="sk-editor-h">
        <header class="sk-editor__head">
            <h3 id="sk-editor-h" class="sk-editor__title" tabindex="-1">{{ groupName(group) }}</h3>
            <p class="sk-editor__sub">
                Felge {{ wheelName }} · {{ sizeName }} · {{ carCount(store.carsOf(group).length) }}
                <span v-if="cell.copiedFrom" class="adm-tag adm-tag--neutral">kopiert von {{ cell.copiedFrom }}</span>
            </p>
        </header>

        <div class="sk-editor__block">
            <h4 class="sk-editor__label">Reifen · vorne und hinten gleich</h4>
            <ul class="sk-lines">
                <li v-for="line in cell.tyres" :key="line.id" class="sk-line">
                    <div class="sk-line__size">
                        <label class="visually-hidden" :for="`sk-tyre-${line.id}`">Reifengröße</label>
                        <input
                            :id="`sk-tyre-${line.id}`"
                            v-model="line.text"
                            class="input"
                            type="text"
                            spellcheck="false"
                            autocomplete="off"
                            :aria-invalid="parsed(line).ok ? undefined : 'true'"
                            @input="changed"
                            @blur="tidy(line)"
                            @keydown.enter.prevent="addTyre(line.id)"
                        >
                    </div>
                    <CodeTags :id="`sk-tyre-codes-${line.id}`" v-model="line.codes" :label="`Codes für ${line.text || 'diese Größe'}`" @changed="changed" />
                    <div class="sk-line__more">
                        <button class="sk-iconbtn" type="button" :aria-expanded="openLine === line.id" :aria-label="`Weitere Angaben zu ${line.text || 'dieser Größe'}`" @click="openLine = openLine === line.id ? null : line.id">
                            <Icon name="more" :size="20" />
                        </button>
                    </div>
                    <div class="sk-line__notes">
                        <span :class="parsed(line).ok ? 'sk-line__hint' : 'sk-line__error'">{{ parsed(line).text }}</span>
                        <span v-if="line.kw && kwOk(line)" class="adm-tag adm-tag--neutral">{{ kwRange(line.kw.replace('-', '–')) }}</span>
                        <span v-else-if="line.kw" class="sk-line__error">Der kW-Bereich ist nicht lesbar. So geht es: 85-142, der kleinere Wert zuerst.</span>
                        <span v-if="line.axle !== 'ALL'" class="adm-tag adm-tag--neutral">{{ axleText(line.axle) }}</span>
                        <span v-if="twice.includes(line.id)" class="sk-warn">Diese Größe steht schon in der Zeile.</span>
                    </div>
                    <div v-if="openLine === line.id" class="sk-line__extra">
                        <div class="form-field">
                            <label class="form-field__label" :for="`sk-kw-${line.id}`">kW-Bereich</label>
                            <input :id="`sk-kw-${line.id}`" v-model="line.kw" class="input sk-line__kw" type="text" placeholder="z. B. 85-142" :aria-invalid="kwOk(line) ? undefined : 'true'" @input="changed">
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" :for="`sk-axle-${line.id}`">Achse</label>
                            <select :id="`sk-axle-${line.id}`" v-model="line.axle" class="input" @change="changed">
                                <option value="ALL">Beide Achsen</option>
                                <option value="FRONT">Nur Vorderachse</option>
                                <option value="REAR">Nur Hinterachse</option>
                            </select>
                        </div>
                        <button class="btn btn--ghost sk-line__remove" type="button" @click="removeTyre(line.id)">
                            <Icon name="delete" :size="20" />
                            Zeile entfernen
                        </button>
                    </div>
                </li>
            </ul>
            <p v-if="cell.tyres.length === 0" class="sk-empty">Noch kein Reifen. Nutze „Reifen hinzufügen“ oder „Mehrere einfügen“.</p>
            <div class="sk-editor__adds">
                <button class="btn btn--secondary" type="button" @click="addTyre()"><Icon name="plus" :size="20" /> Reifen hinzufügen</button>
                <button class="btn btn--ghost" type="button" @click="pasteOpen = true">Mehrere einfügen</button>
            </div>
        </div>

        <div class="sk-editor__block">
            <h4 class="sk-editor__label">Kombinationen · vorne anders als hinten</h4>
            <ul class="sk-lines">
                <li v-for="pair in cell.pairs" :key="pair.id" class="sk-line sk-line--pair">
                    <div class="sk-pairfields">
                        <label class="sk-pairfields__field">
                            <span class="form-field__label">vorne</span>
                            <input :id="`sk-pair-front-${pair.id}`" v-model="pair.front" class="input" type="text" spellcheck="false" :aria-invalid="sizeOk(pair.front) ? undefined : 'true'" @input="changed">
                        </label>
                        <label class="sk-pairfields__field">
                            <span class="form-field__label">hinten</span>
                            <input v-model="pair.rear" class="input" type="text" spellcheck="false" :aria-invalid="sizeOk(pair.rear) ? undefined : 'true'" @input="changed">
                        </label>
                    </div>
                    <CodeTags :id="`sk-pair-codes-${pair.id}`" v-model="pair.codes" :label="`Codes für die Kombination ${pair.front} und ${pair.rear}`" @changed="changed" />
                    <div class="sk-line__more">
                        <button class="sk-iconbtn" type="button" :aria-label="`Kombination ${pair.front} und ${pair.rear} entfernen`" @click="removePair(pair.id)">
                            <Icon name="delete" :size="20" />
                        </button>
                    </div>
                    <p v-if="!sizeOk(pair.front) || !sizeOk(pair.rear)" class="sk-line__error sk-line__wide">{{ whyUnread(sizeOk(pair.front) ? pair.rear : pair.front) ?? 'Eine Größe der Kombination ist nicht lesbar. Schreib sie etwa so: 225/40 R18.' }}</p>
                    <p v-for="warning in warnings.filter((w) => w.id === pair.id)" :key="warning.text" class="sk-warn sk-line__wide">{{ warning.text }}</p>
                </li>
            </ul>
            <p v-if="cell.pairs.length === 0" class="sk-empty">Keine Kombination. Nennt das Gutachten vorne und hinten verschiedene Größen, trag das Paar hier ein.</p>
            <div class="sk-editor__adds">
                <button class="btn btn--secondary" type="button" @click="addPair"><Icon name="plus" :size="20" /> Kombination hinzufügen</button>
            </div>
        </div>

        <div class="sk-editor__block">
            <h4 id="sk-general-h" class="sk-editor__label">Allgemeine Codes dieser Zeile</h4>
            <CodeTags id="sk-general" v-model="cell.general" label="Allgemeine Codes dieser Zeile" @changed="changed" />
        </div>

        <div class="sk-editor__block sk-editor__page">
            <div class="form-field">
                <label class="form-field__label" for="sk-page">Seite im Gutachten <span class="sk-optional">(optional)</span></label>
                <input id="sk-page" v-model="cell.page" class="input sk-editor__pageinput" type="text" inputmode="numeric" @input="changed">
            </div>
            <button class="btn btn--ghost" type="button" @click="takePage">PDF-Seite {{ state.pdfPage }} übernehmen</button>
        </div>

        <p v-if="open.length" class="sk-warn">
            {{ open.length === 1 ? 'Ein Code ist' : `${open.length} Codes sind` }} noch ohne Beschreibung: {{ open.join(', ') }}. Klick beim Code auf „beschreiben“.
        </p>

        <div class="sk-actions">
            <button class="btn btn--secondary sk-actions__left" type="button" :disabled="!cellDone(cell)" @click="copyOpen = true">
                <Icon name="duplicate" :size="20" />
                Kopieren nach …
            </button>
            <button class="btn btn--primary" type="button" @click="saveAndNext">
                Weiter zur nächsten offenen Zeile
                <Icon name="arrow-right" :size="20" />
            </button>
        </div>

        <CopyDialog v-model:open="copyOpen" :from="group" />
        <PasteDialog v-model:open="pasteOpen" :group="group" />
    </section>
</template>

<style scoped>
.sk-editor {
    display: grid;
    gap: var(--sp-20);
    min-width: 0;
}

.sk-editor__title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    overflow-wrap: anywhere;
}

.sk-editor__sub {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: var(--sp-4) 0 0;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.sk-editor__block {
    display: grid;
    gap: var(--sp-8);
}

.sk-editor__label {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
}

.sk-lines {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
}

/* A line is a row, not a box: one hairline above it, the fields inside it the only frames (admin-shell §2.5). */
.sk-line {
    display: grid;
    grid-template-columns: minmax(150px, 190px) minmax(0, 1fr) auto;
    gap: var(--sp-4) var(--sp-8);
    align-items: start;
    padding: var(--sp-12) 0;
    border-top: 1px solid var(--c-line);
}

.sk-line:last-child {
    border-bottom: 1px solid var(--c-line);
}

.sk-line__notes {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
    grid-column: 1 / -1;
}

.sk-line__notes:empty {
    display: none;
}

.sk-line--pair {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto;
}

.sk-line__size {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.sk-line__hint,
.sk-line__error {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
}

.sk-line__hint {
    color: var(--c-ink-3);
}

.sk-line__error {
    color: var(--c-bad);
}

.sk-line__scope {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4);
}

.sk-line__extra,
.sk-line__wide {
    grid-column: 1 / -1;
}

.sk-line__extra {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--sp-12);
    padding-top: var(--sp-8);
    border-top: 1px solid var(--c-line);
}

.sk-line__kw {
    max-width: calc(14 * var(--ch-text));
}

.sk-line__remove {
    margin-left: auto;
}

.sk-iconbtn {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: var(--r-control);
    background: none;
    color: var(--c-ink-2);
    cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
    .sk-iconbtn:hover {
        background: var(--c-band);
        color: var(--c-ink);
    }
}

.sk-pairfields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-8);
}

.sk-pairfields__field {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}


.sk-editor__adds {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.sk-editor__page {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--sp-12);
}

.sk-editor__pageinput {
    max-width: calc(10 * var(--ch-text));
}

.sk-empty {
    margin: 0;
    padding: var(--sp-12);
    border: 1px dashed var(--c-line-2);
    border-radius: var(--r-control);
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

@media (max-width: 599px) {
    .sk-line,
    .sk-line--pair {
        grid-template-columns: minmax(0, 1fr) auto;
    }

    .sk-line > :nth-child(2) {
        grid-column: 1 / -1;
        grid-row: 2;
    }
}
</style>
