<script setup lang="ts">
/**
 * The tyres of one car on one wheel combination (the client's change of 05.11.2026: „There should only be fields for tire size
 * combinations“): every line is vorne + hinten + codes, with a power band behind the line's „…“. Typing the front fills the rear
 * with the same size, where both wheels share a diameter, and the rear can be changed. A tyre whose rim is not its axle's wheel is
 * said at once. What is typed is saved as it is typed; what does not read yet is kept, said, and the release waits for it.
 * Warnings say, they never block.
 *
 * Nothing leaves this car unsaved (autosave.ts, entryStore): moving on sends what is owed and waits; a refusal or a lost connection
 * keeps the person here, with the reason in the bar beside the button they pressed. A car whose lines did not load cannot be
 * typed in: an empty list here would be saved over the stored one.
 */

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import DateField from '../../../../Components/Admin/DateField.vue'
import { stampHeaders } from '../../../../composables/admin/useDirtyForm'
import { createAutosave } from './autosave'
import CodeTags from './CodeTags.vue'
import CopyDialog from './CopyDialog.vue'
import { Refused, blankLine, duplicateKeys, misfit, refusedOf, send, toEditLine, typedFront, typedRear, useEntry, type CarDetail, type CarView, type CombinationView, type EditLine } from './entryStore'
import PasteDialog from './PasteDialog.vue'
import { parseKwBand, readTyre, tyreLabel, whyUnread } from './tyreInput'

const props = defineProps<{ car: CarView; wheelName: string; combination: CombinationView }>()

/* Both wheels one diameter: the same tyre fits behind, and the rear takes it as it is typed. */
const mirrors = computed(() => Math.abs(props.combination.frontDiameter - props.combination.rearDiameter) < 0.001)

const store = useEntry()
const { state } = store

const KW_UNREAD = 'Noch nicht gespeichert: Den kW-Bereich können wir nicht lesen. So geht es: 85-142, der kleinere Wert zuerst.'
const PAGE_UNREAD = 'Gib die Seite als ganze Zahl ab 1 an.'

const loading = ref(true)
const loadFailed = ref(false)
const lines = ref<EditLine[]>([])
const general = ref<string[]>([])
const notes = ref<Record<string, string | null>>({})
/* Who the general codes belong to (D-452), and what they were when this form loaded or last saved them. */
const codesFor = ref<CarDetail['codesFor'] | null>(null)
let codesLoaded = '[]'
/* A combination carried from the rows before the five steps keeps its own row's codes beside the car's (D-452): shown where it has any. */
const own = ref<string[]>([])
const ownNotes = ref<Record<string, string | null>>({})
const ownShown = ref(false)
const page = ref('')
const stamp = ref('')
const openLine = ref<number | null>(null)
const copyOpen = ref(false)
const pasteOpen = ref(false)
/* Why the last save did not go through, in the bar beside the buttons; what can be done about it beside that. */
const problem = ref('')
const stale = ref(false)
const retryable = ref(false)
const columns = reactive({ entry_note: '', entry_override: '', entry_override_reason: '', build_from: '', build_to: '', width_min: '', width_max: '', et_min: '', et_max: '', centre_bore: '' })
const columnsOpen = ref(false)

/* The page as it was loaded: what goes out while the field holds something that is no page. */
let storedPage: number | null = null
/* The row's own columns go out once someone has opened them, closed again or not. */
let columnsSeen = false
let ready = false

const duplicates = computed(() => duplicateKeys(lines.value))
const anyColumn = computed(() => Object.values(columns).some((value) => String(value ?? '').trim() !== ''))
const pageBad = computed(() => page.value.trim() !== '' && !/^[1-9]\d{0,3}$/.test(page.value.trim()))
const pageNumber = computed(() => (pageBad.value || page.value.trim() === '' ? (pageBad.value ? storedPage : null) : Number(page.value.trim())))

function take(detail: CarDetail & { stamp?: string }): void {
    lines.value = detail.lines.map(toEditLine)
    general.value = detail.codes.map((code) => code.code)
    notes.value = Object.fromEntries(detail.codes.map((code) => [code.code, code.note]))
    codesFor.value = detail.codesFor ?? null
    codesLoaded = JSON.stringify(detail.codes.map((code) => ({ code: code.code, note: code.note ?? null })))
    own.value = (detail.cellCodes ?? []).map((code) => code.code)
    ownNotes.value = Object.fromEntries((detail.cellCodes ?? []).map((code) => [code.code, code.note]))
    ownShown.value = own.value.length > 0
    page.value = detail.page === null ? '' : String(detail.page)
    storedPage = detail.page
    stamp.value = detail.stamp ?? ''

    for (const key of Object.keys(columns) as (keyof typeof columns)[]) {
        const value = detail.columns[key]

        columns[key] = value === null || value === undefined ? '' : String(value)
    }

    columnsOpen.value = anyColumn.value
    columnsSeen = anyColumn.value
}

function filled(line: EditLine): boolean {
    return line.front.trim() !== '' || line.rear.trim() !== ''
}

function fields(line: EditLine) {
    return { front: line.front, rear: line.rear, kw: line.kw, codes: line.codes }
}

const generalCodes = computed(() => general.value.map((code) => ({ code, note: notes.value[code] ?? null })))
const ownCodes = computed(() => own.value.map((code) => ({ code, note: ownNotes.value[code] ?? null })))

/* Whose they are (D-452): „Gilt für alle 3 Felgenkombinationen dieses Fahrzeugs in diesem Gutachten.“ */
const generalFor = computed(() => {
    const scope = codesFor.value
    const cells = scope?.cells ?? 1
    const combinations = cells > 1 ? `alle ${cells} Felgenkombinationen` : 'alle Felgenkombinationen'

    if (scope && scope.cars > 1 && !scope.car.startsWith('#')) {
        return `Gilt für ${combinations} der ${scope.cars} Fahrzeuge mit HSN/TSN ${scope.car} in diesem Gutachten.`
    }

    return `Gilt für ${combinations} dieses Fahrzeugs in diesem Gutachten.`
})

/* What a save would change on the server. A line's id is not in it, nor a line still empty: an answer or „+ Kombination“ is no change. */
const content = computed(() => JSON.stringify([lines.value.filter(filled).map(fields), generalCodes.value, ownCodes.value, pageNumber.value, columns]))

const autosave = createAutosave({
    content: () => content.value,
    write,
    delay: 600,
    clean: () => {
        problem.value = ''
        stale.value = false
        retryable.value = false
        state.save = 'saved'
    },
})

watch(content, () => {
    if (ready && state.editable) {
        autosave.changed()
    }
})

async function load(): Promise<void> {
    ready = false
    loading.value = true
    loadFailed.value = false

    try {
        take(await send<CarDetail & { stamp: string }>('GET', `${store.base}/fahrzeuge/${props.car.id}`))
        problem.value = ''
        stale.value = false
        retryable.value = false
        await nextTick()
        autosave.mark()
        ready = true
    } catch {
        loadFailed.value = true
    } finally {
        loading.value = false
    }
}

let letGo = (): void => {}

onMounted(async () => {
    letGo = store.hold(autosave)
    await load()

    if (state.focusEditor) {
        state.focusEditor = false
        await nextTick()
        document.getElementById('ef-editor-h')?.focus()
    }
})

/* Left another way than through the buttons, a car removed say: what is owed still goes. */
onBeforeUnmount(() => {
    letGo()

    if (autosave.owed()) {
        void autosave.flush()
    }
})

watch(columnsOpen, (now) => {
    columnsSeen = columnsSeen || now
})

async function write(): Promise<boolean> {
    const unread = lines.value.find((line) => parseKwBand(line.kw) === null)

    if (unread !== undefined) {
        openLine.value = unread.key
        problem.value = KW_UNREAD
        stale.value = false
        retryable.value = false

        return false
    }

    // The list as it goes out: the server drops an empty line, so its answer is in the order of these.
    const sent = lines.value.filter(filled)
    // The car's general codes go only where this form changed them (D-452): its other combinations may have, meanwhile.
    const codesNow = JSON.stringify(generalCodes.value)

    try {
        const answer = await store.save<{ car: CarDetail; stamp: string }>('PUT', `/fahrzeuge/${props.car.id}`, {
            lines: lines.value.map((line) => ({ id: line.id, ...fields(line) })),
            codes: generalCodes.value,
            codes_changed: codesNow !== codesLoaded,
            ...(ownShown.value ? { cell_codes: ownCodes.value } : {}),
            source_page: pageNumber.value,
            ...(columnsSeen ? { ...columns, entry_override: columns.entry_override === '' ? null : columns.entry_override } : {}),
        }, stampHeaders(stamp.value))

        stamp.value = answer.stamp
        codesLoaded = codesNow
        problem.value = ''
        stale.value = false
        retryable.value = false

        if (answer.car.lines.length === sent.length) {
            sent.forEach((line, i) => {
                const server = answer.car.lines[i]

                if (server !== undefined) {
                    line.id = server.id
                    line.refused = refusedOf(server)
                }
            })
        }

        return true
    } catch (failure) {
        problem.value = failure instanceof Error ? failure.message : 'Das wurde nicht gespeichert.'
        stale.value = failure instanceof Refused && Object.keys(failure.errors).includes('_stamp')
        retryable.value = !(failure instanceof Refused)

        return false
    }
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
 * until it is left itself. A side left empty is the other's again, on screen as on the server: every line names both axles.
 */
function tidy(line: EditLine, side: 'front' | 'rear', event?: FocusEvent): void {
    const tyre = readTyre(line[side])
    const movingIntoRear = (event?.relatedTarget as HTMLElement | null)?.id === `ef-rear-${line.key}`

    if (tyre !== null) {
        const label = tyreLabel(tyre)

        if (side === 'front') {
            if (movingIntoRear) {
                line.front = label
            } else {
                typedFront(line, label, mirrors.value)
            }
        } else {
            line.rear = label
            line.follows = line.rear === line.front
        }
    } else if (mirrors.value && line[side].trim() === '' && !line.oneSided && !movingIntoRear) {
        line[side] = side === 'front' ? line.rear : line.front
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

    const wrong = misfit(text, side === 'front' ? props.combination.frontDiameter : props.combination.rearDiameter, side)

    if (wrong !== null) {
        return { ok: false, text: wrong }
    }

    return { ok: true, text: `${tyre.li === null ? 'ohne Lastindex' : `Lastindex ${tyre.li}`} · ${tyre.si === null ? 'ohne Symbol' : `Symbol ${tyre.si}`}` }
}

function kwOk(line: EditLine): boolean {
    return parseKwBand(line.kw) !== null
}

/* The band as the paper means it, whichever way it was typed: `170 kW`, `85–142 kW`. */
function kwTag(line: EditLine): string {
    const band = parseKwBand(line.kw)

    if (band === null || band === undefined) {
        return ''
    }

    return band.kw_min === band.kw_max ? `${band.kw_min} kW` : `${band.kw_min}–${band.kw_max} kW`
}

function takePage(): void {
    page.value = String(state.pdfPage)
}

const readable = computed(() => lines.value.some((line) => readTyre(line.front) !== null || readTyre(line.rear) !== null))

/** The next car with nothing entered, in the order of the list; step 5 when none is left. */
async function next(): Promise<void> {
    if (!(await autosave.flush())) {
        return
    }

    const open = store.nextOpen(props.car.id)

    if (open === undefined) {
        await store.go(4)
    } else {
        await store.openCar(open.id)
    }
}

/* What is shown is what gets copied: only once the server holds every line on screen. */
async function copy(): Promise<void> {
    if (await autosave.flush()) {
        copyOpen.value = true
    }
}
</script>

<template>
    <section class="ef-editor" aria-labelledby="ef-editor-h">
        <header class="ef-editor__head">
            <h3 id="ef-editor-h" class="ef-editor__title" tabindex="-1">{{ car.label }}</h3>
            <p class="ef-editor__sub">
                <span data-editor-wheel>Felge {{ wheelName }} · {{ combination.label }}</span>
                <span v-if="car.finish" class="adm-tag adm-tag--neutral">nur {{ car.finish }}</span>
                <span v-if="car.axle !== 'ALL'" class="adm-tag adm-tag--neutral">{{ car.axle === 'FRONT' ? 'nur Vorderachse' : 'nur Hinterachse' }}</span>
                <span v-if="car.copiedFrom" class="adm-tag adm-tag--neutral">kopiert von {{ car.copiedFrom }}</span>
            </p>
            <p v-if="car.k" class="ef-editor__sub">Feld K {{ car.k }}</p>
        </header>

        <p v-if="car.conflict" class="ef-warn" role="status">
            Hier stehen die Größen einer Reifenkombination, die bei diesem Fahrzeug nur bei einer anderen Felgenkombination mit denselben Durchmessern eingetragen ist. Der Shop würde sie deshalb auch hier anbieten. Welche es ist und was du tun kannst, steht in Schritt 5.
        </p>

        <p v-if="loading" class="adm-note">Wird geladen …</p>

        <p v-else-if="loadFailed" class="adm-alert" role="alert">
            Die Reifen dieses Fahrzeugs konnten nicht geladen werden, darum lässt sich hier gerade nichts eintragen. Was gespeichert ist, bleibt, wie es ist.
            <button class="ef-link" type="button" @click="load">Noch einmal laden</button>
        </p>

        <template v-else>
            <div class="ef-editor__block">
                <h4 class="ef-editor__label">Reifenkombinationen</h4>
                <ul class="ef-lines">
                    <li v-for="(line, i) in lines" :key="line.key" class="ef-line">
                        <div class="ef-pairfields">
                            <label class="ef-pairfields__field">
                                <span class="form-field__label" :class="{ 'ef-pairfields__label--rest': i > 0 }">Vorne</span>
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
                                    @input="typedFront(line, ($event.target as HTMLInputElement).value, mirrors)"
                                    @blur="tidy(line, 'front', $event)"
                                    @keydown.enter.prevent="addLine(line)"
                                >
                                <span :class="sideHint(line, 'front').ok ? 'ef-line__hint' : 'ef-line__error'">{{ sideHint(line, 'front').text }}</span>
                            </label>
                            <label class="ef-pairfields__field">
                                <span class="form-field__label" :class="{ 'ef-pairfields__label--rest': i > 0 }">Hinten</span>
                                <input
                                    :id="`ef-rear-${line.key}`"
                                    class="input"
                                    type="text"
                                    spellcheck="false"
                                    autocomplete="off"
                                    :value="line.rear"
                                    :disabled="!state.editable"
                                    :placeholder="line.oneSided ? 'keine' : mirrors ? 'wie vorne' : `z. B. 255/35R${combination.rearDiameter} 96Y`"
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
                            <span v-if="line.kw && kwOk(line)" class="adm-tag adm-tag--neutral">{{ kwTag(line) }}</span>
                            <span v-else-if="line.kw" class="ef-line__error">Den kW-Bereich können wir nicht lesen. So geht es: 85-142, der kleinere Wert zuerst.</span>
                            <span v-if="line.oneSided" class="adm-tag adm-tag--neutral">{{ line.front.trim() ? 'nur vorne' : 'nur hinten' }}, aus der bisherigen Eingabe</span>
                            <span v-if="line.outsideList" class="adm-tag adm-tag--neutral">nicht in der Kombinationsliste, aus der bisherigen Eingabe</span>
                            <span v-if="duplicates.includes(line.key)" class="ef-warn">Diese Zeile steht schon einmal da.</span>
                        </div>
                        <div v-if="openLine === line.key" class="ef-line__extra">
                            <div class="form-field">
                                <label class="form-field__label" :for="`ef-kw-${line.key}`">kW-Bereich</label>
                                <input :id="`ef-kw-${line.key}`" v-model="line.kw" class="input ef-line__kw" type="text" placeholder="z. B. 85-142" :disabled="!state.editable" :aria-invalid="kwOk(line) ? undefined : 'true'">
                            </div>
                            <button v-if="state.editable" class="btn btn--ghost ef-line__remove" type="button" @click="removeLine(line)">
                                <Icon name="delete" :size="20" />
                                Zeile entfernen
                            </button>
                        </div>
                    </li>
                </ul>
                <p v-if="lines.length === 0" class="ef-empty">Noch keine Reifen. Trag die Kombinationen ein, die das Gutachten für dieses Fahrzeug nennt.{{ mirrors ? ' Die hintere Größe übernimmt die vordere, bis du sie änderst.' : ' Vorne und hinten haben verschiedene Durchmesser: Trag beide Größen ein.' }}</p>
                <div v-if="state.editable" class="ef-editor__adds">
                    <button class="btn btn--secondary" type="button" @click="addLine()"><Icon name="plus" :size="20" /> Kombination</button>
                    <button class="btn btn--ghost" type="button" @click="pasteOpen = true">Mehrere einfügen</button>
                </div>
            </div>

            <div class="ef-editor__block">
                <h4 id="ef-general-h" class="ef-editor__label">Allgemeine Codes dieses Fahrzeugs</h4>
                <!-- The car's (D-452): one set for every wheel combination of it, and for every car with its HSN/TSN in this Gutachten. -->
                <p id="ef-general-for" class="ef-count">{{ generalFor }}</p>
                <CodeTags id="ef-general" v-model="general" label="Allgemeine Codes dieses Fahrzeugs" :disabled="!state.editable" />
            </div>

            <div v-if="ownShown" class="ef-editor__block">
                <h4 id="ef-own-h" class="ef-editor__label">Codes dieser Felgenkombination</h4>
                <p class="ef-count">Aus den Zeilen vor der Erfassung: Dort standen sie bei dieser Felgenkombination, nicht bei allen des Fahrzeugs.</p>
                <CodeTags id="ef-own" v-model="own" label="Codes dieser Felgenkombination" :disabled="!state.editable" />
            </div>

            <div class="form-field">
                <label class="form-field__label" for="ef-page">Seite im Gutachten <span class="ef-optional">(optional)</span></label>
                <div class="adm-inline">
                    <input id="ef-page" v-model="page" class="input ef-editor__pageinput" type="text" inputmode="numeric" :aria-invalid="pageBad ? 'true' : undefined" aria-describedby="ef-page-err" :disabled="!state.editable">
                    <button v-if="state.editable" class="btn btn--ghost" type="button" @click="takePage">PDF-Seite {{ state.pdfPage }} übernehmen</button>
                </div>
                <p id="ef-page-err" class="form-field__error">{{ pageBad ? PAGE_UNREAD : '' }}</p>
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
                <p v-if="problem" class="adm-alert ef-actions__problem" role="alert">
                    {{ problem }}
                    <button v-if="stale" class="ef-link" type="button" @click="load">Neu laden</button>
                    <button v-else-if="retryable" class="ef-link" type="button" @click="autosave.flush()">Noch einmal versuchen</button>
                </p>
                <button v-if="state.editable" class="btn btn--secondary ef-actions__left" type="button" :disabled="!readable" @click="copy">
                    <Icon name="duplicate" :size="20" />
                    Kopieren nach …
                </button>
                <button class="btn btn--primary" type="button" @click="next">
                    {{ store.nextOpen(car.id) ? 'Speichern und weiter' : 'Speichern, weiter zur Freigabe' }}
                    <Icon name="arrow-right" :size="20" />
                </button>
            </div>

            <CopyDialog v-model:open="copyOpen" :from="car" />
            <PasteDialog v-model:open="pasteOpen" :car="car" :combination="combination" @take="(sides) => { lines = [...lines, ...sides.map((side) => ({ ...blankLine(side.front, side.rear), codes: side.codes }))] }" />
        </template>
    </section>
</template>

<style scoped>
.ef-editor {
    display: grid;
    gap: var(--sp-20);
    min-width: 0;
}

/* The answer to why the page did not move on, beside what was pressed. */
.ef-actions__problem {
    flex-basis: 100%;
    margin: 0;
}

.ef-editor__title {
    scroll-margin-top: calc(var(--adm-topbar-h) + var(--sp-16));
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
[data-editor-wheel] {
    overflow-wrap: anywhere;
}

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

/* Beside each other where „HL 255/35 R20 100“ fits in a field, one above the other where it would be cut. */
.ef-pairfields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(18 * var(--ch-text))), 1fr));
    gap: var(--sp-8);
}

/* Under the first line the columns name the fields; one above the other on a phone, every line names its own. */
@media (min-width: 768px) {
    .ef-pairfields__label--rest {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }
}

/* A hint that wraps in one of them never moves the field in the other. */
.ef-pairfields__field {
    display: grid;
    align-content: start;
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
