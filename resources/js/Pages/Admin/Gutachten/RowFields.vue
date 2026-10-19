<script setup lang="ts">
/**
 * What one Verwendungsbereich entry says, typed as the Gutachten prints it: the tyre sizes (`225/40
 * R18`, per axle, each with its own codes), the row's codes (`A01 A12 K1c`) — their meaning is this
 * document's Auflagenverzeichnis, shown under them — the Eintragung, the page it stands on, and, folded
 * away because most rows need none of it, the document's own limits (build period, width and ET range,
 * centre bore).
 *
 * The Eintragung is not typed: it follows from an Abnahme among the codes (the corrections memo §2). A
 * person may set it otherwise only with the reason, which the customer reads as the Prüfer's.
 *
 * Used for adding rows and for changing one; the page owns the values.
 */

import { computed, nextTick, onMounted, ref, watch } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import DateField from '../../../Components/Admin/DateField.vue'
import type { AxleValue, DocumentConditionView, RowForm } from '../../../types/admin/gutachten'
import { SPEED_SYMBOLS, badCodes, derivedEntry, emptySize, loadIndex, parseCodes, parseKwBand, parseTyre, sentIndex, settleSize } from './rows'

const props = defineProps<{
    /** This document's own Auflagenverzeichnis. */
    conditions: DocumentConditionView[]
    errors: Record<string, string | undefined>
    idPrefix: string
    pageCount: number | null
}>()

const emit = defineEmits<{ 'sizes-changed': [] }>()

const form = defineModel<RowForm>('form', { required: true })

/*
 * A size is judged once its line is left, not from the first keystroke — or at once after a save was tried:
 * the page hands in a new errors object then, empty when it stopped the save itself (B-02).
 */
const left = ref(new Set<number>())

watch(
    () => props.errors,
    () => {
        left.value = new Set(form.value.tyre_sizes.map((_, index) => index))
    }
)

function leave(index: number): void {
    left.value = new Set([...left.value, index])
}

/*
 * A size or load index field left: a size pasted with its minimum — `245/35 R19 93Y`, as the PDF prints it — or a load
 * index typed with its symbol puts the two into their own fields (his admin item 9); a front-and-rear pair in one field
 * becomes two lines (settleSize).
 */
function leaveSize(index: number): void {
    const line = form.value.tyre_sizes[index]
    const settled = line === undefined ? [] : settleSize(line)

    if (line !== undefined && (settled.length > 1 || JSON.stringify(settled[0]) !== JSON.stringify(line))) {
        form.value.tyre_sizes.splice(index, 1, ...settled)

        if (settled.length > 1) {
            // The lines after it moved down by one: what was said of them moves with them.
            left.value = new Set([...left.value].map((i) => (i > index ? i + 1 : i)).concat([index + 1]))
            emit('sizes-changed')
        }
    }

    leave(index)
}

const AXLES: { value: AxleValue; label: string }[] = [
    { value: 'ALL', label: 'Alle Achsen' },
    { value: 'FRONT', label: 'Vorderachse' },
    { value: 'REAR', label: 'Hinterachse' },
]

const LIMITS = ['build_from', 'build_to', 'width_min', 'width_max', 'et_min', 'et_max', 'centre_bore'] as const

/*
 * Unfolded when the row has limits — and when one of them was refused, so the sentence is seen. Opened by
 * the page, never closed by it: a limit emptied while typing does not fold the section away (B-01).
 */
const limits = ref<HTMLDetailsElement | null>(null)
const limitRefused = computed(() => LIMITS.some((key) => Boolean(props.errors[key])))

function unfoldLimits(): void {
    if (limits.value) {
        limits.value.open = true
    }
}

onMounted(() => {
    if (LIMITS.some((key) => form.value[key] !== '') || limitRefused.value) {
        unfoldLimits()
    }
})

watch(limitRefused, (value) => {
    if (value) {
        unfoldLimits()
    }
}, { flush: 'pre' })

function id(name: string): string {
    return `${props.idPrefix}-${name}`
}

function err(key: string): string {
    return props.errors[key] ?? ''
}

/** What is wrong with a size line's size itself — shown under the line, marked on the size field. */
function textError(index: number): string {
    const size = form.value.tyre_sizes[index]
    const text = size?.text ?? ''

    if (text.trim() !== '' && parseTyre(text) === null) {
        return left.value.has(index) ? 'Diese Reifengröße können wir nicht lesen. Schreib sie bitte so: 225/40 R18 oder 225/40 R18 92Y.' : ''
    }

    // Codes without their size would be dropped: said, not lost.
    if (text.trim() === '' && (size?.codes ?? '').trim() !== '') {
        return left.value.has(index) ? 'Zu diesen Codes fehlt die Reifengröße.' : ''
    }

    // The server counts only the sizes it was sent.
    const sent = sentIndex(form.value, index)

    return sent === null ? '' : (['width_mm', 'aspect', 'diameter', 'axle'].map((f) => err(`tyre_sizes.${sent}.${f}`)).find(Boolean) ?? '')
}

/** What is wrong with a size line's load index — marked on its own field (his admin item 9). */
function loadIndexError(index: number): string {
    const size = form.value.tyre_sizes[index]

    if (size !== undefined && loadIndex(size.min_load_index) === undefined) {
        return left.value.has(index) ? 'Diesen Lastindex können wir nicht lesen. Trag nur die ganze Zahl ein, etwa 93; das Geschwindigkeitssymbol hat ein eigenes Feld.' : ''
    }

    const sent = sentIndex(form.value, index)

    return sent === null ? '' : err(`tyre_sizes.${sent}.min_load_index`)
}

/** What the server said of a size line's speed symbol — marked on its own field. */
function symbolError(index: number): string {
    const sent = sentIndex(form.value, index)

    return sent === null ? '' : err(`tyre_sizes.${sent}.min_speed_symbol`)
}

/** What is wrong with a size line's kW band — marked on its field (Block D). */
function kwError(index: number): string {
    const size = form.value.tyre_sizes[index]

    if (size !== undefined && parseKwBand(size.kw ?? '') === null) {
        return left.value.has(index) ? 'Den kW-Bereich bitte so, wie das Gutachten ihn druckt: 85-195 – der kleinere Wert zuerst.' : ''
    }

    const sent = sentIndex(form.value, index)

    return sent === null ? '' : (err(`tyre_sizes.${sent}.kw_min`) || err(`tyre_sizes.${sent}.kw_max`))
}

/** What is wrong with a size line's codes — marked on the codes field. */
function sizeCodesError(index: number): string {
    const sent = sentIndex(form.value, index)
    const server = sent === null ? undefined : (err(`tyre_sizes.${sent}.codes`) || Object.entries(props.errors).find(([key, message]) => message && key.startsWith(`tyre_sizes.${sent}.codes.`))?.[1])

    return server || codeWords(form.value.tyre_sizes[index]?.codes ?? '')
}

function sizeError(index: number): string {
    return textError(index) || loadIndexError(index) || symbolError(index) || kwError(index) || sizeCodesError(index)
}

/* ── Codes ─────────────────────────────────────────────────────────────────── */

const byCode = computed(() => new Map(props.conditions.map((c) => [c.code, c])))

/** A code that is not a code at all, said before the server has to. */
function codeWords(text: string): string {
    const bad = badCodes(text)

    return bad.length === 0 ? '' : `${bad.map((c) => `„${c}“`).join(', ')} ${bad.length === 1 ? 'ist kein Code' : 'sind keine Codes'}: Buchstaben und Ziffern, höchstens 32 Zeichen, so wie im Gutachten.`
}

const rowCodes = computed(() => parseCodes(form.value.codes).filter((code) => badCodes(code).length === 0))

const codesError = computed(() => {
    const server = err('conditions') || (Object.entries(props.errors).find(([key, message]) => message && /^conditions\.\d+\./.test(key))?.[1] ?? '')

    return server || codeWords(form.value.codes)
})

/** A size's codes, each with what the document calls it: `T88 · Reifen: Tragfähigkeit`. */
function sizeMeaning(text: string): { code: string; label: string; defined: boolean }[] {
    return parseCodes(text)
        .filter((code) => badCodes(code).length === 0)
        .map((code) => {
            const c = byCode.value.get(code)

            return { code, label: c ? c.kindLabel : 'Nicht im Auflagenverzeichnis', defined: c !== undefined }
        })
}

/* A note is what this row adds to the document's sentence: opened per code, kept by code. */
const noting = ref(new Set<string>(Object.keys(form.value.notes)))

/* The pressed „Zusatz“ goes away with the field it opens, so the keyboard moves into that field (D-06). */
async function openNote(code: string): Promise<void> {
    noting.value = new Set([...noting.value, code])
    await nextTick()
    document.getElementById(id(`note-${code}`))?.focus()
}

function setNote(code: string, event: Event): void {
    form.value.notes = { ...form.value.notes, [code]: (event.target as HTMLInputElement).value }
}

/* ── Eintragung ────────────────────────────────────────────────────────────── */

const entry = computed(() => derivedEntry(form.value, props.conditions))

/* A note about an Eintragung that is no longer needed is not kept behind the form's back. */
watch(() => entry.value.required, (required) => {
    if (!required) {
        form.value.entry_note = ''
    }
})

/** What the codes alone say, whatever the override. */
const fromCodes = computed(() => derivedEntry({ ...form.value, entry_override: '' }, props.conditions))

const overriding = computed({
    get: () => form.value.entry_override !== '',
    set: (on: boolean) => {
        // Switched on, it starts at the other answer: an override that says what the codes say is none.
        form.value.entry_override = on ? (fromCodes.value.required ? 'not_required' : 'required') : ''
    },
})

const entryLine = computed(() => {
    const derived = fromCodes.value
    const sizes = form.value.tyre_sizes.filter((s) => parseTyre(s.text) !== null)
    const partly = derived.required && derived.sizes.length > 0 && derived.sizes.length < sizes.length
        ? ` – für ${derived.sizes.map((i) => form.value.tyre_sizes[i]?.text.trim()).filter(Boolean).join(', ')}`
        : ''

    return derived.required
        ? `Erforderlich${partly}. Folgt aus ${derived.sources.join(' und ')}.`
        : 'Nicht erforderlich: Kein Code dieser Zeile ist eine Abnahme.'
})

function addSize(): void {
    const last = form.value.tyre_sizes[form.value.tyre_sizes.length - 1]
    form.value.tyre_sizes.push(emptySize(last?.axle ?? 'ALL'))
}

/* A removed line takes its sentences with it: the line now in its place was not what they were about. */
function removeSize(index: number): void {
    form.value.tyre_sizes.splice(index, 1)
    left.value = new Set([...left.value].filter((i) => i < index).concat([...left.value].filter((i) => i > index).map((i) => i - 1)))
    emit('sizes-changed')
}

</script>

<template>
    <div class="rf">
        <div class="rf-pair">
            <div class="form-field">
                <label class="form-field__label" :for="id('axle')">Achse</label>
                <select :id="id('axle')" v-model="form.axle" class="input" :aria-invalid="err('axle') ? 'true' : undefined" :aria-describedby="`${id('axle')}-err`">
                    <option v-for="axle in AXLES" :key="axle.value" :value="axle.value">{{ axle.label }}</option>
                </select>
                <p :id="`${id('axle')}-err`" class="form-field__error">{{ err('axle') }}</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" :for="id('page')">Seite im Gutachten <span class="rf-optional">(optional)</span></label>
                <input
                    :id="id('page')"
                    v-model.number="form.source_page"
                    class="input"
                    type="number"
                    min="1"
                    :max="pageCount ?? undefined"
                    inputmode="numeric"
                    :aria-invalid="err('source_page') ? 'true' : undefined"
                    :aria-describedby="`${id('page')}-err`"
                >
                <p :id="`${id('page')}-err`" class="form-field__error">{{ err('source_page') }}</p>
            </div>
        </div>

        <fieldset class="rf-group">
            <legend class="form-field__label">Reifengrößen</legend>
            <p v-if="err('tyre_sizes')" class="form-field__error">{{ err('tyre_sizes') }}</p>
            <!-- The columns named once, above the lines; each field keeps its own label for a screen reader. -->
            <div class="rf-sizes-head" aria-hidden="true">
                <span>Größe</span>
                <span>Lastindex</span>
                <span>Symbol</span>
                <span>kW-Bereich</span>
                <span>Achse</span>
                <span>Codes nur dieser Größe</span>
            </div>
            <div v-for="(size, index) in form.tyre_sizes" :key="index" class="rf-size">
                <div class="form-field rf-size__text">
                    <label class="visually-hidden" :for="id(`size-${index}`)">Reifengröße {{ index + 1 }}</label>
                    <input
                        :id="id(`size-${index}`)"
                        v-model="size.text"
                        class="input"
                        type="text"
                        placeholder="225/40 R18"
                        spellcheck="false"
                        autocomplete="off"
                        :aria-invalid="textError(index) ? 'true' : undefined"
                        :aria-describedby="`${id(`size-${index}`)}-err`"
                        @blur="leaveSize(index)"
                    >
                </div>
                <!-- The document's minimum for this size, in two fields of its own (his admin item 9): `93` and `Y`. -->
                <div class="form-field rf-size__li">
                    <label class="visually-hidden" :for="id(`size-${index}-li`)">Mindest-Lastindex der Reifengröße {{ index + 1 }}</label>
                    <input
                        :id="id(`size-${index}-li`)"
                        v-model="size.min_load_index"
                        class="input num"
                        type="text"
                        inputmode="numeric"
                        maxlength="3"
                        placeholder="Lastindex"
                        autocomplete="off"
                        :aria-invalid="loadIndexError(index) ? 'true' : undefined"
                        :aria-describedby="`${id(`size-${index}`)}-err`"
                        @blur="leaveSize(index)"
                    >
                </div>
                <div class="form-field rf-size__symbol">
                    <label class="visually-hidden" :for="id(`size-${index}-symbol`)">Mindest-Geschwindigkeitssymbol der Reifengröße {{ index + 1 }}</label>
                    <select
                        :id="id(`size-${index}-symbol`)"
                        v-model="size.min_speed_symbol"
                        class="input"
                        :aria-invalid="symbolError(index) ? 'true' : undefined"
                        :aria-describedby="`${id(`size-${index}`)}-err`"
                    >
                        <!-- Stacked on a phone, the field names itself: no column head stands over it there. -->
                        <option value="">Symbol</option>
                        <option v-for="symbol in SPEED_SYMBOLS" :key="symbol" :value="symbol">{{ symbol }}</option>
                    </select>
                </div>
                <!-- The kW band the document prints beside the size (Block D): `85-195`, or empty. -->
                <div class="form-field rf-size__kw">
                    <label class="visually-hidden" :for="id(`size-${index}-kw`)">kW-Bereich der Reifengröße {{ index + 1 }}</label>
                    <input
                        :id="id(`size-${index}-kw`)"
                        v-model="size.kw"
                        class="input"
                        type="text"
                        inputmode="numeric"
                        placeholder="kW, z. B. 85-195"
                        spellcheck="false"
                        autocomplete="off"
                        :aria-invalid="kwError(index) ? 'true' : undefined"
                        :aria-describedby="`${id(`size-${index}`)}-err`"
                        @blur="leave(index)"
                    >
                </div>
                <div class="form-field rf-size__axle">
                    <label class="visually-hidden" :for="id(`size-${index}-axle`)">Achse der Reifengröße {{ index + 1 }}</label>
                    <select :id="id(`size-${index}-axle`)" v-model="size.axle" class="input">
                        <option v-for="axle in AXLES" :key="axle.value" :value="axle.value">{{ axle.label }}</option>
                    </select>
                </div>
                <div class="form-field rf-size__codes">
                    <label class="visually-hidden" :for="id(`size-${index}-codes`)">Codes der Reifengröße {{ index + 1 }}</label>
                    <input
                        :id="id(`size-${index}-codes`)"
                        v-model="size.codes"
                        class="input"
                        type="text"
                        placeholder="Codes, z. B. T88"
                        spellcheck="false"
                        autocomplete="off"
                        :aria-invalid="sizeCodesError(index) ? 'true' : undefined"
                        :aria-describedby="`${id(`size-${index}`)}-err ${id(`size-${index}`)}-codes`"
                    >
                </div>
                <button v-if="form.tyre_sizes.length > 1" class="adm-iconbtn" type="button" :aria-label="`Reifengröße ${index + 1} entfernen`" @click="removeSize(index)">
                    <Icon name="close" :size="20" />
                </button>
                <p v-if="sizeMeaning(size.codes).length" :id="`${id(`size-${index}`)}-codes`" class="rf-size__meaning">
                    <span v-for="m in sizeMeaning(size.codes)" :key="m.code" :class="{ 'rf-undefined': !m.defined }"><b>{{ m.code }}</b> {{ m.label }}</span>
                </p>
                <p :id="`${id(`size-${index}`)}-err`" class="form-field__error rf-size__err">{{ sizeError(index) }}</p>
            </div>
            <p class="form-field__help">Mindest-Lastindex und Geschwindigkeitssymbol, die das Gutachten zur Größe nennt, trägst du in ihre eigenen Felder ein: 93 und Y. Fügst du die Größe so ein, wie das Gutachten sie druckt – 245/35 R19 93Y –, verteilt das Formular die Angaben, sobald du das Feld verlässt. Ein Paar für vorne und hinten – 225/40 R18 92Y / 255/35 R18 94Y – wird zu zwei Zeilen. Druckt das Gutachten neben der Größe einen kW-Bereich, trägst du ihn ins kW-Feld ein, etwa 85-195; die Größe gilt dann nur für Fahrzeuge in diesem Bereich. Codes, die das Gutachten nur bei dieser Größe druckt, trägst du ins Feld für die Codes ein.</p>
            <div>
                <button class="btn btn--ghost" type="button" @click="addSize">
                    <Icon name="plus" :size="20" />
                    Reifengröße hinzufügen
                </button>
            </div>
        </fieldset>

        <div class="rf-group">
            <div class="form-field">
                <label class="form-field__label" :for="id('codes')">Auflagen dieser Zeile <span class="rf-optional">(Codes)</span></label>
                <input
                    :id="id('codes')"
                    v-model="form.codes"
                    class="input"
                    type="text"
                    placeholder="A01 A12 K1c"
                    spellcheck="false"
                    autocomplete="off"
                    :aria-invalid="codesError ? 'true' : undefined"
                    :aria-describedby="`${id('codes')}-help ${id('codes')}-err`"
                >
                <p :id="`${id('codes')}-help`" class="form-field__help">So, wie das Gutachten sie druckt, mit Leerzeichen getrennt; ein Eintrag aus mehreren Wörtern in Anführungszeichen: „Nicht 330D“. Was ein Code bedeutet, steht im Auflagenverzeichnis dieses Gutachtens.</p>
                <p :id="`${id('codes')}-err`" class="form-field__error">{{ codesError }}</p>
            </div>
            <ul v-if="rowCodes.length" class="rf-codes">
                <li v-for="code in rowCodes" :key="code" class="rf-code">
                    <div class="rf-code__line">
                        <b class="rf-code__code">{{ code }}</b>
                        <span v-if="byCode.get(code)" class="rf-code__text">{{ byCode.get(code)!.text }}<span class="rf-code__meta"> · {{ byCode.get(code)!.kindLabel }}<template v-if="byCode.get(code)!.page"> · S. {{ byCode.get(code)!.page }}</template></span></span>
                        <span v-else class="rf-code__text rf-undefined">Nicht im Auflagenverzeichnis. Die Zeile bleibt „Noch nicht bestätigt“ und das Gutachten nicht freigebbar, bis der Code dort steht.</span>
                        <button v-if="!noting.has(code)" class="btn btn--ghost rf-code__add" type="button" :aria-label="`Zusatz zu ${code}`" @click="openNote(code)">Zusatz</button>
                    </div>
                    <div v-if="noting.has(code)" class="form-field rf-code__note">
                        <label class="form-field__label" :for="id(`note-${code}`)">Zusatz zu {{ code }} aus diesem Gutachten <span class="rf-optional">(optional)</span></label>
                        <input :id="id(`note-${code}`)" :value="form.notes[code] ?? ''" class="input" type="text" maxlength="300" placeholder="z. B. Nur an der Hinterachse." @input="setNote(code, $event)">
                    </div>
                </li>
            </ul>
        </div>

        <div class="rf-group">
            <p class="form-field__label rf-entry__label">Eintragung in die Fahrzeugpapiere</p>
            <p class="rf-entry" :class="{ 'rf-entry--struck': overriding }">{{ entryLine }}</p>
            <label class="check">
                <input v-model="overriding" type="checkbox">
                <span>Abweichend festlegen – laut Prüfer</span>
            </label>
            <div v-if="overriding" class="rf-override">
                <div class="rf-radios" role="radiogroup" :aria-label="'Eintragung laut Prüfer'">
                    <label class="check"><input v-model="form.entry_override" type="radio" value="required" :name="id('override')"> <span>Erforderlich</span></label>
                    <label class="check"><input v-model="form.entry_override" type="radio" value="not_required" :name="id('override')"> <span>Nicht erforderlich</span></label>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('override-reason')">Warum?</label>
                    <textarea
                        :id="id('override-reason')"
                        v-model="form.entry_override_reason"
                        class="input rf-reason"
                        rows="2"
                        maxlength="500"
                        :aria-invalid="err('entry_override_reason') ? 'true' : undefined"
                        :aria-describedby="`${id('override-reason')}-help ${id('override-reason')}-err`"
                    />
                    <p :id="`${id('override-reason')}-help`" class="form-field__help">Steht im Protokoll und beim Kunden als „Laut Prüfer: …“.</p>
                    <p :id="`${id('override-reason')}-err`" class="form-field__error">{{ err('entry_override_reason') || err('entry_override') }}</p>
                </div>
            </div>
            <div v-if="entry.required" class="form-field">
                <label class="form-field__label" :for="id('entry')">Hinweis zur Eintragung <span class="rf-optional">(optional)</span></label>
                <input :id="id('entry')" v-model="form.entry_note" class="input" type="text" maxlength="500" placeholder="z. B. Abnahme nach § 19 Abs. 3 StVZO." :aria-invalid="err('entry_note') ? 'true' : undefined" :aria-describedby="`${id('entry')}-err`">
                <p :id="`${id('entry')}-err`" class="form-field__error">{{ err('entry_note') }}</p>
            </div>
        </div>

        <details ref="limits" class="rf-more">
            <summary class="rf-more__summary">Grenzen aus dem Gutachten</summary>
            <p class="form-field__help">Nur ausfüllen, wenn das Gutachten sie für diese Zeile nennt. Leer heißt: keine eigene Grenze.</p>
            <div class="rf-pair">
                <div class="form-field">
                    <label class="form-field__label" :for="id('from')">Baujahr ab</label>
                    <DateField :id="id('from')" v-model="form.build_from" :invalid="Boolean(err('build_from'))" :describedby="`${id('from')}-err`" />
                    <p :id="`${id('from')}-err`" class="form-field__error">{{ err('build_from') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('to')">Baujahr bis</label>
                    <DateField :id="id('to')" v-model="form.build_to" :invalid="Boolean(err('build_to'))" :describedby="`${id('to')}-err`" />
                    <p :id="`${id('to')}-err`" class="form-field__error">{{ err('build_to') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('wmin')">Breite von (Zoll)</label>
                    <input :id="id('wmin')" v-model="form.width_min" class="input" type="text" inputmode="decimal" placeholder="8" :aria-invalid="err('width_min') ? 'true' : undefined" :aria-describedby="`${id('wmin')}-err`">
                    <p :id="`${id('wmin')}-err`" class="form-field__error">{{ err('width_min') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('wmax')">Breite bis (Zoll)</label>
                    <input :id="id('wmax')" v-model="form.width_max" class="input" type="text" inputmode="decimal" placeholder="9" :aria-invalid="err('width_max') ? 'true' : undefined" :aria-describedby="`${id('wmax')}-err`">
                    <p :id="`${id('wmax')}-err`" class="form-field__error">{{ err('width_max') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('emin')">ET von (mm)</label>
                    <input :id="id('emin')" v-model="form.et_min" class="input" type="text" inputmode="numeric" placeholder="30" :aria-invalid="err('et_min') ? 'true' : undefined" :aria-describedby="`${id('emin')}-err`">
                    <p :id="`${id('emin')}-err`" class="form-field__error">{{ err('et_min') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('emax')">ET bis (mm)</label>
                    <input :id="id('emax')" v-model="form.et_max" class="input" type="text" inputmode="numeric" placeholder="45" :aria-invalid="err('et_max') ? 'true' : undefined" :aria-describedby="`${id('emax')}-err`">
                    <p :id="`${id('emax')}-err`" class="form-field__error">{{ err('et_max') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('bore')">Mittenlochbohrung laut Gutachten (mm)</label>
                    <input :id="id('bore')" v-model="form.centre_bore" class="input" type="text" inputmode="decimal" placeholder="66,6" :aria-invalid="err('centre_bore') ? 'true' : undefined" :aria-describedby="`${id('bore')}-err`">
                    <p :id="`${id('bore')}-err`" class="form-field__error">{{ err('centre_bore') }}</p>
                </div>
            </div>
        </details>
    </div>
</template>

<style scoped>
.rf {
    display: grid;
    gap: var(--sp-24);
}

.rf .form-field__error:empty {
    display: none;
}

.rf-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.rf-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-16);
}

.rf-group {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
}

.rf-group legend {
    margin-bottom: var(--sp-8);
    padding: 0;
}

.rf-size,
.rf-sizes-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, calc(9 * var(--ch-text))) minmax(0, calc(10 * var(--ch-text))) minmax(0, 12ch) minmax(0, 14ch) minmax(0, 16ch) auto;
    align-items: center;
    gap: var(--sp-8);
}

.rf-size__err,
.rf-size__meaning {
    grid-column: 1 / -1;
}

.rf-sizes-head {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.rf-size__meaning {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4) var(--sp-12);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

/* A code the document's list does not hold: the row stays UNKNOWN until it does. */
.rf-undefined {
    color: var(--c-bad);
}

.rf-codes {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.rf-code {
    display: grid;
    gap: var(--sp-8);
    padding-block: var(--sp-8);
    border-bottom: 1px solid var(--c-line);
}

.rf-code__line {
    display: grid;
    grid-template-columns: 6ch minmax(0, 1fr) auto;
    align-items: baseline;
    gap: var(--sp-12);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.rf-code__code {
    font-variant-numeric: tabular-nums;
}

.rf-code__text {
    overflow-wrap: anywhere;
}

.rf-code__meta {
    color: var(--c-ink-3);
}

.rf-code__note {
    padding-left: calc(6ch + var(--sp-12));
}

.rf-entry__label {
    margin: 0;
}

.rf-entry {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

/* Overridden: what the codes say stays readable, set aside. */
.rf-entry--struck {
    color: var(--c-ink-3);
    text-decoration: line-through;
}

.rf-override {
    display: grid;
    gap: var(--sp-8);
}

.rf-radios {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4) var(--sp-24);
}

.rf-reason {
    min-height: calc(var(--adm-control-h) * 2);
    resize: vertical;
}

.rf-more {
    display: grid;
    gap: var(--sp-12);
}

.rf-more__summary {
    min-height: var(--adm-control-h);
    padding-block: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    cursor: pointer;
}

.rf-more[open] .rf-pair {
    margin-top: var(--sp-12);
}

/* A finger needs the larger target. */
@media (pointer: coarse) {
    .rf-more__summary {
        min-height: var(--adm-control-h-lg);
    }
}

@media (max-width: 767px) {
    .rf-pair {
        grid-template-columns: minmax(0, 1fr);
    }

    /* Stacked, each field shows its own placeholder: a column head would stand over nothing. */
    .rf-sizes-head {
        display: none;
    }

    .rf-size {
        grid-template-columns: minmax(0, 1fr) auto;
    }

    .rf-size__li,
    .rf-size__symbol,
    .rf-size__kw,
    .rf-size__axle,
    .rf-size__codes {
        grid-column: 1;
    }

    .rf-code__line {
        grid-template-columns: minmax(0, 1fr) auto;
    }

    .rf-code__code {
        grid-column: 1 / -1;
    }

    .rf-code__note {
        padding-left: 0;
    }

}
</style>
