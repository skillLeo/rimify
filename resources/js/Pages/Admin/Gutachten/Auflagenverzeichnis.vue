<script setup lang="ts">
/**
 * Step 4 of the entry flow: this Gutachten's own Auflagenverzeichnis — the codes it prints, each with its
 * kind, its whole sentence and its page (the corrections memo §1).
 *
 * A code means what this document says and nothing else; rows of this document carry codes, and the
 * shop reads each sentence here. Nothing is classified by the machine: a pasted legend is split at its
 * codes for a person to correct, and every code gets its kind from that person — the kind decides what a
 * customer is told. A code a row still carries is not taken away (the server says so). A code a row
 * carries that is not defined here is listed on top: the row is UNKNOWN until it is.
 */

import { router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, nextTick, reactive, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import { MENU_ROOM } from '../../../composables/admin/menu'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import { formatNumber } from '../../../lib/num'
import type { ConditionChoices, DocumentConditionView, UnresolvedCode } from '../../../types/admin/gutachten'
import { splitLegend } from './legend'

const props = defineProps<{
    documentId: number
    conditions: DocumentConditionView[]
    choices: ConditionChoices
    unresolved: UnresolvedCode[]
    editable: boolean
    pageCount: number | null
    /** How loud each Auflage is in the shop (#23, D-104): chosen here, on a released document too. */
    levels?: { value: string; label: string }[]
    levelsEditable?: boolean
    levelFloorSentence?: string
}>()

/* ── How loud each Auflage is in the shop (#23, D-104) ─────────────────────────── */

function levelLabel(value: string | undefined): string {
    return props.levels?.find((l) => l.value === value)?.label ?? '–'
}

function setLevel(condition: DocumentConditionView, value: string): void {
    sent.value = true
    router.put(`${base.value}/${condition.id}/stufe`, { level: value }, { preserveScroll: true })
}

const page = usePage()
const focus = useFocusAfter()
const base = computed(() => `/admin/gutachten/${props.documentId}/auflagen`)
const busy = ref(false)
const sent = ref(false)

/*
 * This list's own error bag: the page carries other forms (the rows, Befestigung und Hinweise) whose
 * refusals use the same field names — a sentence about one never stands under another.
 */
const BAG = 'auflagen'

const bag = computed<Record<string, string>>(() => {
    const raw: unknown = (page.props.errors as Record<string, unknown> | undefined)?.[BAG]

    return raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})
const errors = computed(() => (sent.value ? bag.value : {}))
const listError = computed(() => bag.value.condition ?? '')
const levelError = computed(() => bag.value.level ?? '')

/* ── One entry: add or change ──────────────────────────────────────────────── */

interface Entry {
    code: string
    kind: string
    text_de: string
    source_page: number | ''
    body_forms: string[]
    drive: { mode: 'only' | 'not'; drive: string }
    max_axle_load_kg: number | ''
    axle: '' | 'FRONT' | 'REAR'
}

function blank(): Entry {
    return { code: '', kind: '', text_de: '', source_page: '', body_forms: [], drive: { mode: 'only', drive: '' }, max_axle_load_kg: '', axle: '' }
}

const form = reactive<Entry>(blank())
const editing = ref<number | null>(null)
const formOpen = ref(false)

interface EntryPayload {
    [key: string]: string | number | string[] | { mode: string; drive: string } | null
    code: string
    kind: string
    text_de: string
    source_page: number | null
    body_forms: string[] | null
    drive: { mode: string; drive: string } | null
    max_axle_load_kg: number | null
    axle: string | null
}

function payload(entry: Entry): EntryPayload {
    return {
        code: entry.code,
        kind: entry.kind,
        text_de: entry.text_de,
        source_page: entry.source_page === '' ? null : entry.source_page,
        body_forms: entry.kind === 'karosserieform' ? entry.body_forms : null,
        drive: entry.kind === 'antrieb' ? entry.drive : null,
        max_axle_load_kg: entry.kind === 'reifen_tragfaehigkeit' && entry.max_axle_load_kg !== '' ? entry.max_axle_load_kg : null,
        axle: entry.kind === 'reifen_achse' && entry.axle !== '' ? entry.axle : null,
    }
}

function openNew(): void {
    Object.assign(form, blank())
    editing.value = null
    sent.value = false
    formOpen.value = true
    focus.request('av-code', { scroll: true })
}

function openEdit(condition: DocumentConditionView): void {
    Object.assign(form, {
        code: condition.code,
        kind: condition.kind,
        text_de: condition.text,
        source_page: condition.page ?? '',
        body_forms: [...condition.bodyForms],
        drive: condition.drive ?? { mode: 'only', drive: '' },
        max_axle_load_kg: condition.maxAxleLoadKg ?? '',
        axle: condition.axle ?? '',
    })
    editing.value = condition.id
    sent.value = false
    formOpen.value = true
    focus.request('av-code', { scroll: true })
}

function closeForm(): void {
    const was = editing.value
    formOpen.value = false
    editing.value = null
    sent.value = false
    focus.request(was === null ? 'av-new' : [`av-more-${was}`, 'av-new'])
}

function save(): void {
    sent.value = true
    busy.value = true
    const target = editing.value

    const options = {
        preserveScroll: true,
        preserveState: true,
        errorBag: BAG,
        onSuccess: () => {
            const code = form.code.trim()
            formOpen.value = false
            editing.value = null
            sent.value = false
            const saved = props.conditions.find((c) => c.code === code)
            focus.request(saved ? [`av-more-${saved.id}`, 'av-new'] : ['av-new'])
        },
        // Refused: the keyboard goes to the first field the sentence is about, in the form's order.
        onError: (refused: Record<string, string>) => {
            const order: [string, string][] = [
                ['code', 'av-code'],
                ['kind', 'av-kind'],
                ['text_de', 'av-text'],
                ['source_page', 'av-page'],
                ['body_forms', 'av-body-0'],
                ['drive.drive', 'av-drive'],
                ['max_axle_load_kg', 'av-load'],
                ['axle', 'av-axle'],
            ]
            const first = order.find(([key]) => refused[key])?.[1]

            focus.request(first ? [first, 'av-code'] : ['av-code'])
        },
        onFinish: () => {
            busy.value = false
        },
    }

    if (target === null) {
        router.post(base.value, payload(form), options)
    } else {
        router.put(`${base.value}/${target}`, payload(form), options)
    }
}

/* ── Taking one away ───────────────────────────────────────────────────────── */

const removing = ref<DocumentConditionView | null>(null)
const confirmOpen = computed({
    get: () => removing.value !== null,
    set: (open: boolean) => {
        if (!open) {
            removing.value = null
        }
    },
})

function remove(): void {
    const condition = removing.value

    if (condition === null) {
        return
    }

    const index = props.conditions.findIndex((c) => c.id === condition.id)
    const neighbours = [props.conditions[index + 1]?.id, props.conditions[index - 1]?.id].filter((id): id is number => id !== undefined).map((id) => `av-more-${id}`)

    busy.value = true
    router.delete(`${base.value}/${condition.id}`, {
        preserveScroll: true,
        preserveState: true,
        errorBag: BAG,
        onSuccess: () => {
            removing.value = null
            focus.request([...neighbours, 'av-new'])
        },
        onError: () => {
            removing.value = null
            focus.request(`av-more-${condition.id}`)
        },
        onFinish: () => {
            busy.value = false
        },
    })
}

/* ── A pasted legend ───────────────────────────────────────────────────────── */

const pasteOpen = ref(false)
const pasted = ref('')
const split = ref<(Entry & { key: number })[]>([])
const pasteSent = ref(false)

function openPaste(): void {
    pasteOpen.value = true
    pasted.value = ''
    split.value = []
    pasteSent.value = false
    focus.request('av-paste', { scroll: true })
}

function doSplit(): void {
    split.value = splitLegend(pasted.value).map((entry, key) => ({ ...blank(), code: entry.code, text_de: entry.text, key }))
    focus.request(split.value.length ? ['av-split-kind-0'] : ['av-paste'])
}

function dropSplit(key: number): void {
    split.value = split.value.filter((entry) => entry.key !== key)
    // The server's sentences were counted by place: after a line goes, they would stand under the wrong one (B-03).
    pasteSent.value = false
}

const splitReady = computed(() => split.value.length > 0 && split.value.every((entry) => entry.kind !== '' && entry.code.trim() !== '' && entry.text_de.trim() !== ''))

function saveSplit(): void {
    pasteSent.value = true
    busy.value = true
    router.post(`${base.value}/stapel`, { entries: split.value.map(payload) }, {
        preserveScroll: true,
        preserveState: true,
        errorBag: BAG,
        onSuccess: () => {
            pasteOpen.value = false
            split.value = []
            pasteSent.value = false
            focus.request('av-new')
        },
        // Refused: the keyboard goes to the first line and field the sentence is about (B-03).
        onError: (refused: Record<string, string>) => {
            const first = Object.keys(refused).map((key) => /^entries\.(\d+)\.(code|kind|text_de)/.exec(key)).find((m) => m !== null)
            focus.request(first ? [`av-split-${first[2] === 'text_de' ? 'text' : first[2]}-${first[1]}`, 'av-paste'] : ['av-paste'])
        },
        onFinish: () => {
            busy.value = false
        },
    })
}

function splitError(index: number, field: string): string {
    return pasteSent.value ? (bag.value[`entries.${index}.${field}`] ?? '') : ''
}

/* ── Showing an entry ──────────────────────────────────────────────────────── */

function parameter(condition: DocumentConditionView): string {
    if (condition.kind === 'karosserieform') {
        return condition.bodyForms.length ? `Nur: ${condition.bodyForms.join(', ')}` : 'Karosserieformen fehlen'
    }

    if (condition.kind === 'antrieb' && condition.drive) {
        return `${condition.drive.mode === 'only' ? 'Nur mit' : 'Nicht mit'} ${condition.drive.drive}`
    }

    if (condition.kind === 'reifen_tragfaehigkeit' && condition.maxAxleLoadKg !== null) {
        return `Achslast bis ${formatNumber(condition.maxAxleLoadKg)} kg`
    }

    if (condition.kind === 'reifen_achse' && condition.axle) {
        return condition.axle === 'FRONT' ? 'Nur Vorderachse' : 'Nur Hinterachse'
    }

    return ''
}

function uses(condition: DocumentConditionView): string {
    return condition.uses === 0 ? '–' : formatNumber(condition.uses)
}

/* ── A load-index limit that differs from the table: confirmed as printed, with a reason ── */

const limitWarnings = computed(() => props.conditions.filter((condition) => Boolean(condition.limitWarning)))
const limitReasons = reactive<Record<number, string>>({})
const limitErrors = reactive<Record<number, string>>({})
/** The condition whose confirmation is on its way: its button shows it. */
const limitBusy = ref<number | null>(null)

function confirmLimit(condition: DocumentConditionView): void {
    // One confirmation on its way at a time: a double click sends it once (C-04; the server holds it too).
    if (limitBusy.value !== null) {
        return
    }

    limitBusy.value = condition.id
    router.post(`/admin/gutachten/${props.documentId}/auflagen/${condition.id}/grenze`, { reason: limitReasons[condition.id] ?? '' }, {
        preserveScroll: true,
        errorBag: 'auflagen',
        onError: (errors) => {
            limitErrors[condition.id] = (errors as Record<string, string>).reason ?? ''
            document.getElementById(`av-limit-${condition.id}`)?.focus()
        },
        onSuccess: () => {
            limitErrors[condition.id] = ''
            // The form gives way to the confirmed note: the keyboard goes there, never to the page (C-05).
            void nextTick(() => document.getElementById(`av-limit-done-${condition.id}`)?.focus())
        },
        onFinish: () => {
            limitBusy.value = null
        },
    })
}
</script>

<template>
    <div class="av">
        <p v-if="unresolved.length" class="adm-alert" role="alert">
            Nicht im Auflagenverzeichnis: {{ unresolved.map((u) => u.code).join(', ') }}. Zeilen mit diesen Codes bleiben „Noch nicht bestätigt“, bis der Code hier steht – und das
            Gutachten ist so lange nicht freigebbar.
        </p>
        <p v-if="listError" class="adm-alert" role="alert">{{ listError }}</p>

        <div v-if="conditions.length" class="adm-panel">
            <table class="adm-table av__table">
                <caption class="visually-hidden">Auflagenverzeichnis dieses Gutachtens</caption>
                <thead>
                    <tr>
                        <th scope="col">Code</th>
                        <th scope="col">Art</th>
                        <th scope="col">Satz aus dem Gutachten</th>
                        <th v-if="levels" scope="col">Im Shop</th>
                        <th scope="col" class="num">Seite</th>
                        <th scope="col" class="num">Verwendet</th>
                        <th v-if="editable" scope="col"><span class="visually-hidden">Aktionen</span></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="condition in conditions" :key="condition.id">
                        <td data-label="Code"><span class="adm-table__key av__code" translate="no">{{ condition.code }}</span></td>
                        <td data-label="Art">
                            {{ condition.kindLabel }}
                            <span v-if="parameter(condition)" class="adm-table__sub">{{ parameter(condition) }}</span>
                        </td>
                        <td data-label="Satz" class="av__text">{{ condition.text }}</td>
                        <td v-if="levels" data-label="Im Shop" class="av__level">
                            <template v-if="levelsEditable">
                                <label class="visually-hidden" :for="`av-level-${condition.id}`">So erscheint Code {{ condition.code }} im Shop</label>
                                <select
                                    :id="`av-level-${condition.id}`"
                                    class="input av__level-select"
                                    :value="condition.level"
                                    :disabled="busy"
                                    @change="setLevel(condition, ($event.target as HTMLSelectElement).value)"
                                >
                                    <option
                                        v-for="level in levels"
                                        :key="level.value"
                                        :value="level.value"
                                        :disabled="level.value === 'hinweis' && condition.levelFloor === 'auflage'"
                                    >
                                        {{ level.label }}
                                    </option>
                                </select>
                            </template>
                            <template v-else>{{ levelLabel(condition.level) }}</template>
                        </td>
                        <td data-label="Seite" class="num">{{ condition.page ?? '–' }}</td>
                        <td data-label="Verwendet" data-phone="hide" class="num">{{ uses(condition) }}</td>
                        <td v-if="editable" data-label="Aktionen" data-phone="menu">
                            <DropdownMenuRoot>
                                <DropdownMenuTrigger :data-focus="`av-more-${condition.id}`" class="adm-iconbtn" :disabled="busy" :aria-label="`Aktionen für Code ${condition.code}`">
                                    <Icon name="more" :size="20" />
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuContent class="adm-menu" align="end" :side-offset="4" :collision-padding="MENU_ROOM" @close-auto-focus="focus.onMenuClose">
                                        <DropdownMenuItem class="adm-menu__item" @select="openEdit(condition)">
                                            <Icon name="edit" :size="20" />
                                            Bearbeiten
                                        </DropdownMenuItem>
                                        <template v-if="condition.uses === 0">
                                            <DropdownMenuSeparator class="adm-menu__sep" />
                                            <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="removing = condition">
                                                <Icon name="delete" :size="20" />
                                                Entfernen
                                            </DropdownMenuItem>
                                        </template>
                                    </DropdownMenuContent>
                                </DropdownMenuPortal>
                            </DropdownMenuRoot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p v-else class="adm-note">Noch kein Code. Trag die Auflagen so ein, wie das Gutachten sie druckt – einzeln oder als ganze Legende.</p>

        <!-- „Im Shop“ (#23, D-104): what each level does there — the label of the answer, no colour of a sentence (D-247) —
             and the one rule that cannot be chosen away. -->
        <p v-if="levels && conditions.length" class="adm-note av__levels-note">
            „Im Shop“ entscheidet über das Etikett der Antwort: Sind alle ihre Auflagen Hinweise, ist keine Eintragung nötig und sind
            auch die Reifen ohne Auflagen bestätigt, steht „Freigegeben“ statt „Mit Auflagen“. Schon ein Code auf „Auflage“ oder
            „Nicht zulässig“ verhindert den Wechsel. Am Urteil des Gutachtens ändert das nichts.
            <template v-if="conditions.some((c) => c.levelFloor === 'auflage')"> {{ levelFloorSentence }}</template>
        </p>
        <p v-if="levelError" class="adm-alert" role="alert">{{ levelError }}</p>

        <!-- A load-index limit that is not twice its index's capacity: kept as printed, confirmed with a reason. -->
        <div v-for="condition in limitWarnings" :key="`limit-${condition.id}`" class="av-limit">
            <!-- Open, it is an alert; confirmed, it is a note on the record — no longer red. -->
            <p :class="condition.limitConfirmed ? 'adm-note' : 'adm-alert'" :role="condition.limitConfirmed ? undefined : 'alert'">
                <span translate="no">{{ condition.code }}</span>: {{ condition.limitWarning }}
            </p>
            <p v-if="condition.limitConfirmed" :id="`av-limit-done-${condition.id}`" class="adm-note av-limit__done" tabindex="-1">
                Bestätigt{{ condition.limitConfirmed.by ? ` von ${condition.limitConfirmed.by}` : '' }} am {{ condition.limitConfirmed.at }}: „{{ condition.limitConfirmed.reason }}“
            </p>
            <form v-else-if="editable" class="av-limit__form" novalidate @submit.prevent="confirmLimit(condition)">
                <div class="form-field">
                    <label class="form-field__label" :for="`av-limit-${condition.id}`">Warum steht die Zahl so im Gutachten?</label>
                    <textarea
                        :id="`av-limit-${condition.id}`"
                        v-model="limitReasons[condition.id]"
                        class="input"
                        rows="2"
                        maxlength="500"
                        :aria-invalid="limitErrors[condition.id] ? 'true' : undefined"
                        :aria-describedby="`av-limit-${condition.id}-err`"
                    />
                    <p :id="`av-limit-${condition.id}-err`" class="form-field__error">{{ limitErrors[condition.id] }}</p>
                </div>
                <div>
                    <button
                        class="btn btn--secondary btn--sm"
                        type="submit"
                        :disabled="busy || limitBusy === condition.id"
                        :aria-busy="limitBusy === condition.id ? 'true' : undefined"
                    >
                        Zahl bestätigen
                    </button>
                </div>
            </form>
        </div>

        <div v-if="editable && !formOpen && !pasteOpen" class="av__actions">
            <button id="av-new" class="btn btn--secondary" type="button" :disabled="busy" @click="openNew">
                <Icon name="plus" :size="20" />
                Code hinzufügen
            </button>
            <button class="btn btn--ghost" type="button" :disabled="busy" @click="openPaste">Legende einfügen</button>
        </div>

        <!-- One entry, added or changed. -->
        <div v-if="formOpen" class="av__form" role="group" :aria-label="editing === null ? 'Neuer Code' : `Code ${form.code} bearbeiten`">
            <div class="av__pair">
                <div class="form-field">
                    <label class="form-field__label" for="av-code">Code</label>
                    <input id="av-code" v-model="form.code" class="input av__code-input" type="text" maxlength="32" spellcheck="false" autocomplete="off" translate="no" :aria-invalid="errors.code ? 'true' : undefined" aria-describedby="av-code-err">
                    <p id="av-code-err" class="form-field__error" aria-live="polite">{{ errors.code }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="av-kind">Art</label>
                    <select id="av-kind" v-model="form.kind" class="input" :aria-invalid="errors.kind ? 'true' : undefined" aria-describedby="av-kind-help av-kind-err">
                        <option value="" disabled>Bitte wählen</option>
                        <option v-for="kind in choices.kinds" :key="kind.value" :value="kind.value">{{ kind.label }}</option>
                    </select>
                    <p id="av-kind-help" class="form-field__help">Die Art entscheidet, wo und wie laut der Satz im Shop steht.</p>
                    <p id="av-kind-err" class="form-field__error" aria-live="polite">{{ errors.kind }}</p>
                </div>
            </div>

            <div class="form-field">
                <label class="form-field__label" for="av-text">Satz aus dem Gutachten</label>
                <textarea id="av-text" v-model="form.text_de" class="input av__textarea" rows="3" maxlength="2000" :aria-invalid="errors.text_de ? 'true' : undefined" aria-describedby="av-text-err" />
                <p id="av-text-err" class="form-field__error" aria-live="polite">{{ errors.text_de }}</p>
            </div>

            <div class="form-field">
                <label class="form-field__label" for="av-page">Seite im Gutachten <span class="av__optional">(optional)</span></label>
                <input id="av-page" v-model.number="form.source_page" class="input av__narrow" type="number" min="1" :max="pageCount ?? undefined" inputmode="numeric" :aria-invalid="errors.source_page ? 'true' : undefined" aria-describedby="av-page-err">
                <p id="av-page-err" class="form-field__error">{{ errors.source_page }}</p>
            </div>

            <fieldset v-if="form.kind === 'karosserieform'" class="av__group">
                <legend class="form-field__label">Nur für diese Karosserieformen</legend>
                <label v-for="(bodyForm, i) in choices.bodyForms" :key="bodyForm" class="check">
                    <input :id="`av-body-${i}`" v-model="form.body_forms" type="checkbox" :value="bodyForm">
                    {{ bodyForm }}
                </label>
                <p class="form-field__error" aria-live="polite">{{ errors.body_forms }}</p>
            </fieldset>

            <div v-if="form.kind === 'antrieb'" class="av__pair">
                <div class="form-field">
                    <label class="form-field__label" for="av-drive-mode">Gilt</label>
                    <select id="av-drive-mode" v-model="form.drive.mode" class="input">
                        <option value="only">nur mit</option>
                        <option value="not">nicht mit</option>
                    </select>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="av-drive">Antrieb</label>
                    <select id="av-drive" v-model="form.drive.drive" class="input" :aria-invalid="errors['drive.drive'] ? 'true' : undefined" aria-describedby="av-drive-err">
                        <option value="" disabled>Bitte wählen</option>
                        <option v-for="drive in choices.drives" :key="drive" :value="drive">{{ drive }}</option>
                    </select>
                    <p id="av-drive-err" class="form-field__error">{{ errors['drive.drive'] ?? errors.drive }}</p>
                </div>
            </div>

            <div v-if="form.kind === 'reifen_tragfaehigkeit'" class="form-field">
                <label class="form-field__label" for="av-load">Gilt bis zur zulässigen Achslast (kg)</label>
                <input id="av-load" v-model.number="form.max_axle_load_kg" class="input av__narrow" type="number" min="200" max="4000" inputmode="numeric" :aria-invalid="errors.max_axle_load_kg ? 'true' : undefined" aria-describedby="av-load-help av-load-err">
                <p id="av-load-help" class="form-field__help">Die Zahl aus dem Satz, zum Beispiel 1120. Der Shop vergleicht sie mit Feld 8.1 und 8.2 der Zulassungsbescheinigung.</p>
                <p id="av-load-err" class="form-field__error">{{ errors.max_axle_load_kg }}</p>
            </div>

            <div v-if="form.kind === 'reifen_achse'" class="form-field">
                <label class="form-field__label" for="av-axle">Nur auf der</label>
                <select id="av-axle" v-model="form.axle" class="input av__narrow" :aria-invalid="errors.axle ? 'true' : undefined" aria-describedby="av-axle-err">
                    <option value="" disabled>Bitte wählen</option>
                    <option value="FRONT">Vorderachse</option>
                    <option value="REAR">Hinterachse</option>
                </select>
                <p id="av-axle-err" class="form-field__error">{{ errors.axle }}</p>
            </div>

            <div class="av__actions">
                <button class="btn btn--primary" type="button" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="save">{{ editing === null ? 'Code speichern' : 'Änderungen speichern' }}</button>
                <button class="btn btn--ghost" type="button" :disabled="busy" @click="closeForm">Abbrechen</button>
            </div>
        </div>

        <!-- A whole legend, pasted, split for a person to check and classify. -->
        <div v-if="pasteOpen" class="av__form">
            <div class="form-field">
                <label class="form-field__label" for="av-paste">Legende aus dem Gutachten</label>
                <textarea id="av-paste" v-model="pasted" class="input av__textarea" rows="6" aria-describedby="av-paste-help" />
                <p id="av-paste-help" class="form-field__help">Den Block mit den Auflagen und Hinweisen kopieren und einfügen. Er wird an den Codes geteilt; du prüfst jede Zeile und wählst ihre Art.</p>
            </div>
            <div class="av__actions">
                <button class="btn btn--secondary" type="button" :disabled="pasted.trim() === ''" @click="doSplit">Aufteilen</button>
                <button class="btn btn--ghost" type="button" :disabled="busy" @click="pasteOpen = false; focus.request('av-new')">Abbrechen</button>
            </div>

            <ol v-if="split.length" class="av__split">
                <li v-for="(entry, index) in split" :key="entry.key" class="av__split-item">
                    <div class="av__pair">
                        <div class="form-field">
                            <label class="form-field__label" :for="`av-split-code-${index}`">Code</label>
                            <input :id="`av-split-code-${index}`" v-model="entry.code" class="input av__code-input" type="text" maxlength="32" translate="no" :aria-invalid="splitError(index, 'code') ? 'true' : undefined">
                            <p class="form-field__error">{{ splitError(index, 'code') }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" :for="`av-split-kind-${index}`">Art</label>
                            <select :id="`av-split-kind-${index}`" v-model="entry.kind" class="input" :aria-invalid="splitError(index, 'kind') ? 'true' : undefined">
                                <option value="" disabled>Bitte wählen</option>
                                <option v-for="kind in choices.kinds" :key="kind.value" :value="kind.value">{{ kind.label }}</option>
                            </select>
                            <p class="form-field__error">{{ splitError(index, 'kind') }}</p>
                        </div>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" :for="`av-split-text-${index}`">Satz</label>
                        <textarea :id="`av-split-text-${index}`" v-model="entry.text_de" class="input av__textarea" rows="2" />
                        <p class="form-field__error">{{ splitError(index, 'text_de') }}</p>
                    </div>
                    <p v-if="['karosserieform', 'antrieb', 'reifen_tragfaehigkeit', 'reifen_achse'].includes(entry.kind)" class="form-field__help">
                        Diese Art braucht eine Angabe mehr. Speichere erst die anderen und trag diesen Code einzeln ein.
                    </p>
                    <div>
                        <button class="btn btn--ghost" type="button" @click="dropSplit(entry.key)">Diese Zeile weglassen</button>
                    </div>
                </li>
            </ol>
            <div v-if="split.length" class="av__actions">
                <button class="btn btn--primary" type="button" :disabled="busy || !splitReady" :aria-busy="busy ? 'true' : undefined" @click="saveSplit">{{ split.length === 1 ? '1 Code speichern' : `${split.length} Codes speichern` }}</button>
                <p v-if="!splitReady" class="form-field__help">Jede Zeile braucht ihre Art.</p>
            </div>
        </div>

        <AdminConfirm
            v-model:open="confirmOpen"
            :title="`Code ${removing?.code ?? ''} entfernen?`"
            body="Keine Zeile trägt ihn. Das Protokoll hält fest, wer ihn entfernt hat."
            confirm-label="Entfernen"
            :busy="busy"
            @confirm="remove"
        />
    </div>
</template>

<style scoped>
.av {
    display: grid;
    gap: var(--sp-16);
}

/* One column as wide as a form: the alert, the note and the reason line up on the same edges. */
.av-limit {
    display: grid;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
}

.av-limit .adm-alert,
.av-limit .adm-note {
    margin: 0;
    max-width: none;
}

.av-limit__form {
    display: grid;
    gap: var(--sp-8);
}

.av-limit__form .form-field__error:empty {
    display: none;
}

.av__code {
    font-variant-numeric: tabular-nums;
}

.av__text {
    max-width: 60ch;
    overflow-wrap: anywhere;
}

.av__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-16);
}

.av__form {
    display: grid;
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
}

.av__pair {
    display: grid;
    grid-template-columns: minmax(0, 12ch) minmax(0, 1fr);
    gap: var(--sp-16);
}

.av__narrow {
    max-width: 12ch;
}

/* A code as printed: `A01`, and the Nachtrag's `Schrägheck 2-türig` (up to 32 characters). */
.av__code-input {
    max-width: 22ch;
}

.av__textarea {
    height: auto;
    min-height: calc(var(--adm-control-h) * 2);
    resize: vertical;
}

.av__optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.av__group {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    border: 0;
}

/* Flush with the fields above: the browser indents a legend by default. */
.av__group legend {
    padding: 0;
}

.av__split {
    display: grid;
    gap: var(--sp-16);
    margin: 0;
    padding: 0;
    list-style: none;
}

.av__split-item {
    display: grid;
    gap: var(--sp-12);
    padding-block: var(--sp-12);
    border-top: 1px solid var(--c-line);
}

.av .form-field__error:empty {
    display: none;
}

@media (max-width: 767px) {
    .av__pair {
        grid-template-columns: minmax(0, 1fr);
    }

    .av__actions .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
