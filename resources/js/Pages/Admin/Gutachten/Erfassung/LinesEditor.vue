<script setup lang="ts">
/**
 * The tyres of one car (the client's change of 05.11.2026: „There should only be fields for tire size combinations“): every line
 * is vorne + hinten + codes, with a power band behind the line's „…“. Typing the front fills the rear with the same size, and the
 * rear can be changed. What is typed is saved as it is typed; what does not read yet is kept, said, and the release waits for it.
 * Warnings say, they never block.
 */

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import DateField from '../../../../Components/Admin/DateField.vue'
import { stampHeaders } from '../../../../composables/admin/useDirtyForm'
import CodeTags from './CodeTags.vue'
import CopyDialog from './CopyDialog.vue'
import { Refused, blankLine, duplicateKeys, isPair, pairWarnings, refusedOf, send, toEditLine, typedFront, typedRear, useEntry, type CarDetail, type CarView, type EditLine } from './entryStore'
import PasteDialog from './PasteDialog.vue'
import { parseKwBand, readTyre, tyreLabel, whyUnread } from './tyreInput'

const props = defineProps<{ car: CarView; wheelName: string; sizeName: string }>()

const store = useEntry()
const { state } = store

const loading = ref(true)
const lines = ref<EditLine[]>([])
const general = ref<string[]>([])
const notes = ref<Record<string, string | null>>({})
const page = ref('')
const stamp = ref('')
const openLine = ref<number | null>(null)
const copyOpen = ref(false)
const pasteOpen = ref(false)
const refused = ref('')
const stale = ref(false)
const columns = reactive({ entry_note: '', entry_override: '', entry_override_reason: '', build_from: '', build_to: '', width_min: '', width_max: '', et_min: '', et_max: '', centre_bore: '' })
const columnsOpen = ref(false)

const duplicates = computed(() => duplicateKeys(lines.value))
const anyColumn = computed(() => Object.values(columns).some((value) => String(value ?? '').trim() !== ''))

let ready = false
let dirty = false
let saving: Promise<void> | null = null
let timer: ReturnType<typeof setTimeout> | undefined

function take(detail: CarDetail & { stamp?: string }): void {
    lines.value = detail.lines.map(toEditLine)
    general.value = detail.codes.map((code) => code.code)
    notes.value = Object.fromEntries(detail.codes.map((code) => [code.code, code.note]))
    page.value = detail.page === null ? '' : String(detail.page)
    stamp.value = detail.stamp ?? ''

    for (const key of Object.keys(columns) as (keyof typeof columns)[]) {
        const value = detail.columns[key]

        columns[key] = value === null || value === undefined ? '' : String(value)
    }

    columnsOpen.value = anyColumn.value
}

onMounted(async () => {
    try {
        take(await send<CarDetail & { stamp: string }>('GET', `${store.base}/fahrzeuge/${props.car.id}`))
    } finally {
        loading.value = false
        await nextTick()
        ready = true
    }
})

function changed(): void {
    if (!ready || !state.editable) {
        return
    }

    dirty = true
    clearTimeout(timer)
    timer = setTimeout(() => void flush(), 600)
}

watch([lines, general, page, columns], changed, { deep: true })

/* One save at a time; what changed meanwhile goes with the next. */
async function flush(): Promise<void> {
    clearTimeout(timer)

    if (saving !== null) {
        await saving
    }

    if (!dirty) {
        return
    }

    dirty = false
    saving = write().finally(() => {
        saving = null
    })
    await saving
}

async function write(): Promise<void> {
    const sent = lines.value.map((line) => line.key)

    try {
        const answer = await store.save<{ car: CarDetail; stamp: string }>('PUT', `/fahrzeuge/${props.car.id}`, {
            lines: lines.value.map((line) => ({
                id: line.id,
                front: line.front,
                rear: line.rear,
                kw: line.kw,
                codes: line.codes,
                front_on_rim: line.frontOnRim,
                rear_on_rim: line.rearOnRim,
            })),
            codes: general.value.map((code) => ({ code, note: notes.value[code] ?? null })),
            source_page: page.value.trim() === '' ? null : Number(page.value),
            ...(columnsOpen.value ? { ...columns, entry_override: columns.entry_override === '' ? null : columns.entry_override } : {}),
        }, stampHeaders(stamp.value))

        stamp.value = answer.stamp
        refused.value = ''

        // New lines learn their id, where the list is still the one that was sent. A line left empty was dropped by the server.
        const saved = answer.car.lines

        if (lines.value.length === sent.length && saved.length === sent.length) {
            lines.value.forEach((line, i) => {
                const server = saved[i]

                if (server !== undefined) {
                    line.id = server.id
                    line.refused = refusedOf(server)
                }
            })
        }
    } catch (failure) {
        if (failure instanceof Refused) {
            refused.value = failure.message
            stale.value = Object.keys(failure.errors).includes('_stamp')
        }
    }
}

onBeforeUnmount(() => {
    clearTimeout(timer)

    if (dirty && !stale.value) {
        dirty = false
        void write()
    }
})

async function reload(): Promise<void> {
    ready = false
    take(await send<CarDetail & { stamp: string }>('GET', `${store.base}/fahrzeuge/${props.car.id}`))
    refused.value = ''
    stale.value = false
    await nextTick()
    ready = true
}

function focusLine(line: EditLine): void {
    void nextTick(() => document.getElementById(`ef-front-${line.key}`)?.focus())
}

function addLine(after?: EditLine): void {
    const line = blankLine()
    const at = after === undefined ? lines.value.length : lines.value.indexOf(after) + 1

    lines.value.splice(at, 0, line)
    focusLine(line)
}

function removeLine(line: EditLine): void {
    lines.value = lines.value.filter((l) => l !== line)
    openLine.value = null
    void nextTick(() => document.querySelector<HTMLElement>('.ef-editor__adds .btn')?.focus())
}

/*
 * A size as the shop writes it, once the field is left. Tabbing from front to rear selects the rear for typing over: changing the
 * rear's text at that moment would drop the selection, and what is typed would be added behind it. So the rear stays as it is
 * until it is left itself.
 */
function tidy(line: EditLine, side: 'front' | 'rear', event?: FocusEvent): void {
    const tyre = readTyre(line[side])

    if (tyre !== null) {
        const label = tyreLabel(tyre)

        if (side === 'front') {
            const movingIntoRear = (event?.relatedTarget as HTMLElement | null)?.id === `ef-rear-${line.key}`

            if (movingIntoRear) {
                line.front = label
            } else {
                typedFront(line, label)
            }
        } else {
            line.rear = label
            line.follows = line.rear === line.front
        }
    } else if (side === 'rear' && line.rear.trim() === '' && !line.oneSided) {
        // A rear left empty is the front's again: every line names both axles.
        line.rear = line.front
        line.follows = true
    }
}

function sideHint(line: EditLine, side: 'front' | 'rear'): { ok: boolean; text: string } {
    const text = line[side]

    if (text.trim() === '') {
        return { ok: true, text: '' }
    }

    const tyre = readTyre(text)

    if (tyre === null) {
        return { ok: false, text: whyUnread(text) ?? 'Nicht lesbar. Schreib die Größe etwa so: 225/40 R18 88W, 245/45R18 100 oder 235/50R18.' }
    }

    const refused = line.refused[side]

    if (refused !== null && refused.text === text) {
        return { ok: false, text: refused.why }
    }

    return { ok: true, text: `${tyre.li === null ? 'ohne Lastindex' : `Lastindex ${tyre.li}`} · ${tyre.si === null ? 'ohne Symbol' : `Symbol ${tyre.si}`}` }
}

function kwOk(line: EditLine): boolean {
    return parseKwBand(line.kw) !== null
}

function takePage(): void {
    page.value = String(state.pdfPage)
}

const readable = computed(() => lines.value.some((line) => readTyre(line.front) !== null || readTyre(line.rear) !== null))

/** The next car with nothing entered, in the order of the list; step 5 when none is left. */
async function next(): Promise<void> {
    await flush()

    const open = store.nextOpen(props.car.id)

    if (open === undefined) {
        store.go(4)
    } else {
        state.carId = open.id
    }
}

defineExpose({ flush })
</script>

<template>
    <section class="ef-editor" aria-labelledby="ef-editor-h">
        <header class="ef-editor__head">
            <h3 id="ef-editor-h" class="ef-editor__title" tabindex="-1">{{ car.label }}</h3>
            <p class="ef-editor__sub">
                Felge {{ wheelName }} · {{ sizeName }}
                <span v-if="car.finish" class="adm-tag adm-tag--neutral">nur {{ car.finish }}</span>
                <span v-if="car.axle !== 'ALL'" class="adm-tag adm-tag--neutral">{{ car.axle === 'FRONT' ? 'nur Vorderachse' : 'nur Hinterachse' }}</span>
                <span v-if="car.copiedFrom" class="adm-tag adm-tag--neutral">kopiert von {{ car.copiedFrom }}</span>
            </p>
            <p v-if="car.k" class="ef-editor__sub">Feld K {{ car.k }}</p>
        </header>

        <p v-if="refused" class="adm-alert" role="alert">
            {{ refused }}
            <button v-if="stale" class="ef-link" type="button" @click="reload">Neu laden</button>
        </p>

        <p v-if="car.conflict" class="ef-warn" role="status">
            Dieses Fahrzeug teilt seine Betriebserlaubnis mit mindestens einem anderen, und die Kombinationen unterscheiden sich. Welche Kombination es ist, steht in Schritt 5. Trag sie bei allen betroffenen Fahrzeugen ein oder bei keinem.
        </p>

        <p v-if="loading" class="adm-note">Wird geladen …</p>

        <template v-else>
            <div class="ef-editor__block">
                <h4 class="ef-editor__label">Reifenkombinationen</h4>
                <ul class="ef-lines">
                    <li v-for="(line, i) in lines" :key="line.key" class="ef-line">
                        <div class="ef-pairfields">
                            <label class="ef-pairfields__field">
                                <span class="form-field__label" :class="{ 'visually-hidden': i > 0 }">Vorne</span>
                                <input
                                    :id="`ef-front-${line.key}`"
                                    class="input"
                                    type="text"
                                    spellcheck="false"
                                    autocomplete="off"
                                    :value="line.front"
                                    :disabled="!state.editable"
                                    :placeholder="line.oneSided ? 'keine' : 'z. B. 225/40R18 88W'"
                                    :aria-invalid="sideHint(line, 'front').ok ? undefined : 'true'"
                                    @input="typedFront(line, ($event.target as HTMLInputElement).value)"
                                    @blur="tidy(line, 'front', $event)"
                                    @keydown.enter.prevent="addLine(line)"
                                >
                                <span :class="sideHint(line, 'front').ok ? 'ef-line__hint' : 'ef-line__error'">{{ sideHint(line, 'front').text }}</span>
                            </label>
                            <label class="ef-pairfields__field">
                                <span class="form-field__label" :class="{ 'visually-hidden': i > 0 }">Hinten</span>
                                <input
                                    :id="`ef-rear-${line.key}`"
                                    class="input"
                                    type="text"
                                    spellcheck="false"
                                    autocomplete="off"
                                    :value="line.rear"
                                    :disabled="!state.editable"
                                    :placeholder="line.oneSided ? 'keine' : 'wie vorne'"
                                    :aria-invalid="sideHint(line, 'rear').ok ? undefined : 'true'"
                                    @focus="line.follows && ($event.target as HTMLInputElement).select()"
                                    @input="typedRear(line, ($event.target as HTMLInputElement).value)"
                                    @blur="tidy(line, 'rear')"
                                    @keydown.enter.prevent="addLine(line)"
                                >
                                <span :class="sideHint(line, 'rear').ok ? 'ef-line__hint' : 'ef-line__error'">{{ sideHint(line, 'rear').text }}</span>
                            </label>
                        </div>
                        <CodeTags :id="`ef-codes-${line.key}`" v-model="line.codes" :label="`Codes für ${line.front || 'diese Zeile'}`" :disabled="!state.editable" />
                        <div class="ef-line__more">
                            <button class="ef-iconbtn" type="button" :aria-expanded="openLine === line.key" :aria-label="`Weitere Angaben zu ${line.front || 'dieser Zeile'}`" @click="openLine = openLine === line.key ? null : line.key">
                                <Icon name="more" :size="20" />
                            </button>
                        </div>
                        <div class="ef-line__notes">
                            <span v-if="line.kw && kwOk(line)" class="adm-tag adm-tag--neutral">{{ line.kw.replace('-', '–') }} kW</span>
                            <span v-else-if="line.kw" class="ef-line__error">Den kW-Bereich können wir nicht lesen. So geht es: 85-142, der kleinere Wert zuerst.</span>
                            <span v-if="line.oneSided" class="adm-tag adm-tag--neutral">{{ line.front.trim() ? 'nur vorne' : 'nur hinten' }}, aus der bisherigen Eingabe</span>
                            <span v-if="line.outsideList" class="adm-tag adm-tag--neutral">nicht in der Kombinationsliste, aus der bisherigen Eingabe</span>
                            <span v-if="duplicates.includes(line.key)" class="ef-warn">Diese Zeile steht schon einmal da.</span>
                        </div>
                        <p v-for="warning in pairWarnings(line, lines)" :key="warning" class="ef-warn ef-line__wide">{{ warning }}</p>
                        <div v-if="openLine === line.key" class="ef-line__extra">
                            <div class="form-field">
                                <label class="form-field__label" :for="`ef-kw-${line.key}`">kW-Bereich</label>
                                <input :id="`ef-kw-${line.key}`" v-model="line.kw" class="input ef-line__kw" type="text" placeholder="z. B. 85-142" :disabled="!state.editable" :aria-invalid="kwOk(line) ? undefined : 'true'">
                            </div>
                            <fieldset v-if="isPair(line)" class="ef-fieldset ef-line__rims">
                                <legend class="form-field__label">Steht nur in dieser Kombination im Gutachten</legend>
                                <label class="check"><input v-model="line.frontOnRim" type="checkbox" :disabled="!state.editable"> die vordere Größe</label>
                                <label class="check"><input v-model="line.rearOnRim" type="checkbox" :disabled="!state.editable"> die hintere Größe</label>
                            </fieldset>
                            <button v-if="state.editable" class="btn btn--ghost ef-line__remove" type="button" @click="removeLine(line)">
                                <Icon name="delete" :size="20" />
                                Zeile entfernen
                            </button>
                        </div>
                    </li>
                </ul>
                <p v-if="lines.length === 0" class="ef-empty">Noch keine Reifen. Trag die Größen ein, die das Gutachten für dieses Fahrzeug nennt. Ist vorne und hinten dieselbe Größe erlaubt, genügt vorne.</p>
                <div v-if="state.editable" class="ef-editor__adds">
                    <button class="btn btn--secondary" type="button" @click="addLine()"><Icon name="plus" :size="20" /> Kombination</button>
                    <button class="btn btn--ghost" type="button" @click="pasteOpen = true">Mehrere einfügen</button>
                </div>
            </div>

            <div class="ef-editor__block">
                <h4 id="ef-general-h" class="ef-editor__label">Allgemeine Codes dieses Fahrzeugs</h4>
                <CodeTags id="ef-general" v-model="general" label="Allgemeine Codes dieses Fahrzeugs" :disabled="!state.editable" />
            </div>

            <div class="form-field">
                <label class="form-field__label" for="ef-page">Seite im Gutachten <span class="ef-optional">(optional)</span></label>
                <div class="adm-inline">
                    <input id="ef-page" v-model="page" class="input ef-editor__pageinput" type="text" inputmode="numeric" :disabled="!state.editable">
                    <button v-if="state.editable" class="btn btn--ghost" type="button" @click="takePage">PDF-Seite {{ state.pdfPage }} übernehmen</button>
                </div>
            </div>

            <details class="ef-more" :open="columnsOpen" @toggle="columnsOpen = ($event.target as HTMLDetailsElement).open">
                <summary class="ef-more__summary"><Icon class="ef-more__marker" name="chevron-right" :size="16" /> <span>Weitere Angaben zu diesem Fahrzeug <span class="ef-optional">(optional)</span></span></summary>
                <div class="ef-more__body ef-columns">
                    <div class="form-field">
                        <label class="form-field__label" for="ef-col-note">Hinweis zur Eintragung</label>
                        <input id="ef-col-note" v-model="columns.entry_note" class="input" type="text" maxlength="500" :disabled="!state.editable">
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-col-override">Eintragung laut Prüfer</label>
                        <select id="ef-col-override" v-model="columns.entry_override" class="input" :disabled="!state.editable">
                            <option value="">Aus den Codes abgeleitet</option>
                            <option value="required">Erforderlich</option>
                            <option value="not_required">Nicht erforderlich</option>
                        </select>
                    </div>
                    <div v-if="columns.entry_override" class="form-field ef-columns__wide">
                        <label class="form-field__label" for="ef-col-reason">Warum weicht das von den Codes ab?</label>
                        <input id="ef-col-reason" v-model="columns.entry_override_reason" class="input" type="text" maxlength="500" :disabled="!state.editable">
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-col-from">Bauzeitraum von</label>
                        <DateField id="ef-col-from" v-model="columns.build_from" />
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-col-to">Bauzeitraum bis</label>
                        <DateField id="ef-col-to" v-model="columns.build_to" />
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-col-wmin">Breite von (Zoll)</label>
                        <input id="ef-col-wmin" v-model="columns.width_min" class="input" type="text" inputmode="decimal" :disabled="!state.editable">
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-col-wmax">Breite bis (Zoll)</label>
                        <input id="ef-col-wmax" v-model="columns.width_max" class="input" type="text" inputmode="decimal" :disabled="!state.editable">
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-col-etmin">ET von</label>
                        <input id="ef-col-etmin" v-model="columns.et_min" class="input" type="text" inputmode="numeric" :disabled="!state.editable">
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-col-etmax">ET bis</label>
                        <input id="ef-col-etmax" v-model="columns.et_max" class="input" type="text" inputmode="numeric" :disabled="!state.editable">
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-col-bore">Mittenlochbohrung (mm)</label>
                        <input id="ef-col-bore" v-model="columns.centre_bore" class="input" type="text" inputmode="decimal" :disabled="!state.editable">
                    </div>
                </div>
            </details>

            <div class="ef-actions">
                <button v-if="state.editable" class="btn btn--secondary ef-actions__left" type="button" :disabled="!readable" @click="flush().then(() => (copyOpen = true))">
                    <Icon name="duplicate" :size="20" />
                    Kopieren nach …
                </button>
                <button class="btn btn--primary" type="button" @click="next">
                    {{ store.nextOpen(car.id) ? 'Speichern und weiter' : 'Speichern, weiter zur Freigabe' }}
                    <Icon name="arrow-right" :size="20" />
                </button>
            </div>

            <CopyDialog v-model:open="copyOpen" :from="car" />
            <PasteDialog v-model:open="pasteOpen" :car="car" @take="(sides) => { lines = [...lines, ...sides.map((side) => blankLine(side.front, side.rear))] }" />
        </template>
    </section>
</template>

<style scoped>
.ef-editor {
    display: grid;
    gap: var(--sp-20);
    min-width: 0;
}

.ef-editor__title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    overflow-wrap: anywhere;
}

.ef-editor__sub {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: var(--sp-4) 0 0;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.ef-editor__block {
    display: grid;
    gap: var(--sp-8);
}

.ef-editor__label {
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
}

.ef-lines {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
}

/* A line is a row, not a box: one hairline above it, the fields inside it the only frames (admin-shell §2.5). The sizes take the
   width, the codes the line beneath: „HL 255/35 R20 100“ must fit without a scroll. */
.ef-line {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--sp-8);
    align-items: start;
    padding: var(--sp-12) 0;
    border-top: 1px solid var(--c-line);
}

.ef-line:last-child {
    border-bottom: 1px solid var(--c-line);
}

.ef-line > .ef-tags {
    grid-column: 1;
    grid-row: 2;
}

.ef-line__more {
    grid-column: 2;
    grid-row: 1;
    padding-top: var(--sp-24);
}

/* „Vorne“ and „Hinten“ head the first line only: from the second on the menu has no label to clear. */
.ef-line + .ef-line .ef-line__more {
    padding-top: 0;
}

.ef-line__notes {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
    grid-column: 1 / -1;
}

.ef-line__notes:empty {
    display: none;
}

.ef-line__hint,
.ef-line__error {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
}

.ef-line__hint {
    color: var(--c-ink-3);
}

.ef-line__error {
    color: var(--c-bad);
}

.ef-line__extra,
.ef-line__wide {
    grid-column: 1 / -1;
}

.ef-line__extra {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--sp-12);
    padding-top: var(--sp-8);
    border-top: 1px solid var(--c-line);
}

.ef-line__kw {
    max-width: calc(14 * var(--ch-text));
}

.ef-line__remove {
    margin-left: auto;
}

.ef-iconbtn {
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
    .ef-iconbtn:hover {
        background: var(--c-band);
        color: var(--c-ink);
    }
}

.ef-pairfields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-8);
}

.ef-pairfields__field {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.ef-editor__adds {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.ef-editor__pageinput {
    max-width: calc(10 * var(--ch-text));
}

.ef-empty {
    margin: 0;
    padding: var(--sp-12);
    border-radius: var(--r-control);
    background: var(--c-band);
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

</style>
