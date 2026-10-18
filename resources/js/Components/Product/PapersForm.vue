<script setup lang="ts">
/**
 * The three figures the tyre half needs, from the customer's own papers (Block C, item 10): 8.1 and 8.2,
 * the permitted axle loads front and rear, and T, the top speed. Where the car's data has them, optional; where
 * it lacks them the wheel answer stands and the tyres are „Noch nicht bestätigt“ until they are in (D-286) — then
 * this form is the way on. With them the tyre answer is definite and shows its sum.
 *
 * It asks for what is missing, never for all three (D-291): a field the answer waits for is asked, a figure we already
 * know stands beside it with where it came from — our vehicle data, or the customer's own earlier entry —, and what
 * neither knows nor needs is not asked at all. The fields are text fields that take only digits (`inputmode`), so a
 * mouse wheel turning over them never changes a figure (D-290).
 *
 * A drawing rings where the fields stand, on the certificate issued since 2005 and on the older
 * Fahrzeugschein. The figures are kept with THIS car in the browser (a cookie keyed by the vehicle, so two
 * saved cars never overwrite each other) until customer accounts exist, and the server reads them for every
 * answer about this car.
 *
 * A photo of the papers fills the fields (`useOcr`, on the device, never uploaded): 8.1, 8.2 and T go into
 * the fields for the customer to check before anything is kept; P.2 is compared with the chosen variant's
 * power, because the wheel answer rests on the variant, and a mismatch is said at once.
 */

import { router } from '@inertiajs/vue3'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import PapersFacsimile from '../Art/PapersFacsimile.vue'
import Icon from '../Ui/Icon.vue'
import { useOcr } from '../../composables/useOcr'
import { withUnit } from '../../format'
import { parsePapers } from '../../lib/fahrzeugschein'
import { formatNumber } from '../../lib/num'
import { OFFLINE, refusal } from '../../lib/visitRefusal'
import type { PapersProp, VehicleFigures } from '../../types/rimify'

const props = defineProps<{
    vehicleId: number
    papers: PapersProp | null
    /** 8.1, 8.2 and T as our vehicle data holds them: shown, never asked again (D-291). */
    known?: VehicleFigures | null
    /** The chosen variant's power (kW), for the P.2 check; null when the vehicle data has none. */
    powerKw?: number | null
    /**
     * The fields the answer waits for — `8.1`, `8.2`, `T` — where the tyres are „Noch nicht bestätigt“ for want of them
     * (D-286). Then this form is the way on, not an option: open from the start. Which fields, the page above says — the
     * tyre lines in the panel, the listing's banner —, never the form a second time.
     */
    asked?: string[]
    /** Closed behind its button even where it is asked for: the listing, where it stands above every wheel. */
    startClosed?: boolean
}>()

const variant = ref<'neu' | 'alt'>('neu')
/* Closed until asked for: the fields are optional, and open by default they pushed the price and „In den
   Warenkorb“ below the first screen of the product page. Where the answer waits for them nothing is in the basket's
   way — there is no purchase until they are in —, and the form opens by itself (D-286), whatever was given before. */
const askedFields = computed(() => props.asked ?? [])
const waits = computed(() => askedFields.value.length > 0)
const open = ref(!props.startClosed && waits.value)

/* Where the answer comes to wait for the figures — another size, the figures deleted —, the form is the way on again. */
watch(waits, (now, before) => {
    if (now && !before && !props.startClosed) {
        open.value = true
    }
})

/* Where the figures are kept — said wherever the form asks for them. */
const KEPT = 'Wir speichern die Werte zu diesem Fahrzeug als Cookie in deinem Browser.'
const busy = ref(false)
const errors = ref<Record<string, string>>({})

/* Offline, an expired page, too many tries, a fault: said at the form, the page and what was typed kept (G-05). */
const failure = ref('')

/* The keyboard to the first of these that stands on the page: a form that closed must not drop it to the page's end. */
function focusFirst(...selectors: string[]): void {
    void nextTick(() => {
        for (const selector of selectors) {
            const target = document.querySelector<HTMLElement>(selector)

            if (target !== null) {
                target.focus()

                return
            }
        }
    })
}

type FigureKey = 'axle_front_kg' | 'axle_rear_kg' | 'top_speed_kmh'
type FieldKey = FigureKey | 'power_kw'

/* The three figures, each with the field of the papers it stands in and the prop that carries it. */
const FIGURES: { key: FigureKey; field: string; prop: keyof VehicleFigures; label: string; unit: string }[] = [
    { key: 'axle_front_kg', field: '8.1', prop: 'axleFrontKg', label: '8.1 · zulässige Achslast vorn', unit: 'kg' },
    { key: 'axle_rear_kg', field: '8.2', prop: 'axleRearKg', label: '8.2 · zulässige Achslast hinten', unit: 'kg' },
    { key: 'top_speed_kmh', field: 'T', prop: 'topSpeedKmh', label: 'T · Höchstgeschwindigkeit', unit: 'km/h' },
]

/* Where a figure we show came from. */
const FROM_DATA = 'aus unseren Fahrzeugdaten'
const FROM_THEM = 'von dir eingetragen'

type Row =
    | { kind: 'input'; key: FieldKey; label: string; unit: string; required: boolean }
    | { kind: 'known'; key: FigureKey; label: string; shown: string; source: string }

/* `1.160 kg`, `250 km/h`: a figure and its unit through the one helper (R-10). */
const figure = (n: number, unit: string): string => withUnit(formatNumber(n), unit)

/*
 * Each figure one of three things (D-291). Asked: the answer waits for it — a field, required. Known and not asked: shown
 * with where it came from — our data, or what the customer gave before —, never asked again. Neither: while the answer
 * asks for something, not shown at all; otherwise a field, voluntary. The customer's own figures stay theirs to change
 * where nothing is asked. P.2 is asked only where the vehicle data has no power — a car typed from a Gutachten —,
 * because a size's kW band is read against it (Block D); voluntary, like the rest. The unit sits in the field's frame;
 * the label keeps it for a screen reader.
 */
const rows = computed<Row[]>(() => {
    const asking = askedFields.value.length > 0
    const out: Row[] = []

    for (const f of FIGURES) {
        const ours = props.known?.[f.prop] ?? null
        const theirs = props.papers?.[f.prop] ?? null

        if (askedFields.value.includes(f.field)) {
            out.push({ kind: 'input', key: f.key, label: f.label, unit: f.unit, required: true })
        } else if (theirs !== null && asking) {
            out.push({ kind: 'known', key: f.key, label: f.label, shown: figure(theirs, f.unit), source: FROM_THEM })
        } else if (theirs === null && ours !== null) {
            out.push({ kind: 'known', key: f.key, label: f.label, shown: figure(ours, f.unit), source: FROM_DATA })
        } else if (!asking) {
            out.push({ kind: 'input', key: f.key, label: f.label, unit: f.unit, required: false })
        }
    }

    // Beside fields the answer waits for, the one that is voluntary says so (the look review of D-291).
    if (props.powerKw == null) {
        out.push({ kind: 'input', key: 'power_kw', label: asking ? 'P.2 · Leistung (erste Zahl, freiwillig)' : 'P.2 · Leistung (erste Zahl)', unit: 'kW', required: false })
    }

    return out
})

/* The fields this form shows: what it sends, and so sets; what it does not show stays as it was (D-291). */
const fieldKeys = computed(() => rows.value.flatMap((row) => (row.kind === 'input' ? [row.key] : [])))
/* Whether any of the three is a field: where all are known, only 15.1 and 15.2 are left to give. */
const asksFigures = computed(() => fieldKeys.value.some((key) => key !== 'power_kw'))

/* 15.1 and 15.2 are optional: folded, open where they were given or refused — or where they are all that is left. */
const moreOpen = ref(Boolean(props.papers?.index) || !asksFigures.value)

/* „Wir konnten 8.1, 8.2 und T nicht lesen.“ — the fields the form asks, by their names in the papers. */
const FIELD_NAMES: Record<FieldKey, string> = { axle_front_kg: '8.1', axle_rear_kg: '8.2', top_speed_kmh: 'T', power_kw: 'P.2' }
const unread = computed(() => {
    const names = fieldKeys.value.map((key) => FIELD_NAMES[key])
    const last = names.pop() ?? ''
    const list = names.length ? `${names.join(', ')} und ${last}` : last

    return names.length ? `Wir konnten ${list} nicht lesen. Trag sie bitte von Hand ein.` : `Wir konnten ${list} nicht lesen. Trag den Wert bitte von Hand ein.`
})

/* Digits as typed; the server reads `1.160` as the thousands it is (D-290). */
const typed = (n: number | null | undefined): string => (n == null ? '' : String(n))

const form = reactive<Record<FieldKey, string>>({
    axle_front_kg: typed(props.papers?.axleFrontKg),
    axle_rear_kg: typed(props.papers?.axleRearKg),
    top_speed_kmh: typed(props.papers?.topSpeedKmh),
    power_kw: typed(props.papers?.powerKw),
})

/*
 * 15.1 and 15.2, optional and together (D-242): the tyres the papers name, typed as printed. The answer takes the
 * stricter of these and its own sum — never the weaker — and never without 8.1, 8.2 and T (R-03).
 */
type IndexKey = 'index_front' | 'index_rear'

const INDEX_FIELDS: { key: IndexKey; label: string }[] = [
    { key: 'index_front', label: '15.1 · Reifen vorn' },
    { key: 'index_rear', label: '15.2 · Reifen hinten' },
]

const index = reactive<Record<IndexKey, string>>({
    index_front: props.papers?.index?.front ?? '',
    index_rear: props.papers?.index?.rear ?? '',
})

const entered = computed(() => props.papers !== null)

/* „Nach deinen Angaben: …“ — what the customer gave, and only that: asked for T alone, T alone (D-291). */
const summary = computed(() => {
    const p = props.papers

    if (p === null) {
        return ''
    }

    return [
        p.axleFrontKg == null ? null : `8.1 ${figure(p.axleFrontKg, 'kg')}`,
        p.axleRearKg == null ? null : `8.2 ${figure(p.axleRearKg, 'kg')}`,
        p.topSpeedKmh == null ? null : `T ${figure(p.topSpeedKmh, 'km/h')}`,
        p.powerKw ? `P.2 ${figure(p.powerKw, 'kW')}` : null,
        p.index ? `15.1 ${p.index.front} · 15.2 ${p.index.rear}` : null,
    ].filter((part): part is string => part !== null).join(' · ')
})

/** The form as the kept figures say, nothing typed since — for „Ändern“ and „Abbrechen“. */
function fromPapers(): void {
    form.axle_front_kg = typed(props.papers?.axleFrontKg)
    form.axle_rear_kg = typed(props.papers?.axleRearKg)
    form.top_speed_kmh = typed(props.papers?.topSpeedKmh)
    form.power_kw = typed(props.papers?.powerKw)
    index.index_front = props.papers?.index?.front ?? ''
    index.index_rear = props.papers?.index?.rear ?? ''
    errors.value = {}
}

// Figures kept or removed on the server (this tab or another): the closed form follows them.
watch(
    () => props.papers,
    () => {
        if (!open.value || props.papers === null) {
            fromPapers()
        }
    }
)

/** „Ändern“: the form opens on the kept figures, and the keyboard is in its first field (C-02). */
function change(): void {
    fromPapers()
    open.value = true

    // Where our data holds every figure, 15.1 and 15.2 are what is left to give: unfolded, the keyboard in them (D-291).
    if (!asksFigures.value) {
        moreOpen.value = true
    }

    focusFirst('[data-pp-field]', '#pp-index_front')
}

/** „Abbrechen“: back to the summary, nothing kept of what was typed (C-06). Not while the figures are on their way. */
function cancel(): void {
    if (busy.value) {
        return
    }

    fromPapers()
    failure.value = ''
    open.value = false
    focusFirst('#pp-change', '#pp-open')
}

/* What a visit that never reached an answer says, the typed figures kept and the keyboard on the button it came from. */
const unreached = {
    onHttpException: (response: { status: number }) => {
        failure.value = refusal(response.status)
        focusFirst('#pp-save')

        return false
    },
    onNetworkError: () => {
        failure.value = OFFLINE
        focusFirst('#pp-save')

        return false
    },
}

function save(): void {
    // One send at a time: a second press while the first is on its way does nothing.
    if (busy.value) {
        return
    }

    busy.value = true
    failure.value = ''
    // Every field the form shows, emptied or not, and what the answer asked for: the server sets what is sent and keeps
    // what is not — a figure we know is never sent as the customer's (D-291). 15.1 and 15.2 always: emptied, they go.
    router.post(`/fahrzeug/${props.vehicleId}/papiere`, {
        asked: askedFields.value,
        ...Object.fromEntries(fieldKeys.value.map((key) => [key, form[key].trim()])),
        index_front: index.index_front,
        index_rear: index.index_rear,
    }, {
        preserveScroll: true,
        errorBag: 'papiere',
        ...unreached,
        onError: (bag) => {
            errors.value = bag as Record<string, string>
            const first = ['axle_front_kg', 'axle_rear_kg', 'top_speed_kmh', 'power_kw', 'index_front', 'index_rear'].find((key) => errors.value[key])
            // A refused 15.1 or 15.2 is not left folded away.
            moreOpen.value = moreOpen.value || first === 'index_front' || first === 'index_rear'
            focusFirst(first ? `#pp-${first}` : '#pp-save')
        },
        onSuccess: () => {
            // Every answer about this car changed with its figures: a page fetched ahead on a hover would show the old one.
            router.flushAll()
            errors.value = {}
            open.value = false
            // The form gives way to the summary: focus goes where the reader can change it again.
            focusFirst('#pp-change')
        },
        onFinish: () => {
            busy.value = false
        },
    })
}

/* ── The photo ─────────────────────────────────────────────────────────────── */

const ocr = useOcr()
const fileInput = ref<HTMLInputElement | null>(null)
const scan = ref<'idle' | 'busy' | 'read' | 'failed'>('idle')
const readPowerKw = ref<number | null>(null)

const powerMismatch = computed(() => readPowerKw.value !== null && props.powerKw != null && readPowerKw.value !== props.powerKw)

async function onPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    // Cleared at once, so the same photo can be taken again after a failure.
    input.value = ''

    if (file === undefined) {
        return
    }

    scan.value = 'busy'
    readPowerKw.value = null

    try {
        const found = parsePapers(await ocr.read(file))
        // Only the fields the form shows: a figure we know is not replaced by a reading (D-291).
        const read: Partial<Record<FieldKey, number | null>> = {
            axle_front_kg: found.axleFrontKg,
            axle_rear_kg: found.axleRearKg,
            top_speed_kmh: found.topSpeedKmh,
            power_kw: found.powerKw,
        }
        const filled = fieldKeys.value.filter((key) => read[key] != null)

        // P.2 is checked against the variant where the data knows it, whatever else was read.
        readPowerKw.value = found.powerKw

        if (filled.length === 0) {
            scan.value = 'failed'
            ocr.dispose()

            return
        }

        // Only what was read replaces what is in a field; nothing is kept until "Werte übernehmen". P.2 fills its field
        // where it is asked.
        for (const key of fieldKeys.value) {
            form[key] = typed(read[key]) || form[key]
        }
        scan.value = 'read'
        focusFirst('[data-pp-field]')
    } catch {
        scan.value = 'failed'
        ocr.dispose()
    }
}

function clear(): void {
    if (busy.value) {
        return
    }

    busy.value = true
    failure.value = ''
    router.delete(`/fahrzeug/${props.vehicleId}/papiere`, {
        preserveScroll: true,
        ...unreached,
        onSuccess: () => {
            router.flushAll()
            form.axle_front_kg = ''
            form.axle_rear_kg = ''
            form.top_speed_kmh = ''
            form.power_kw = ''
            index.index_front = ''
            index.index_rear = ''
            // What was wrong with figures that are gone is no longer said (C-07).
            errors.value = {}
            // Where the answer now waits for them, the form stays the way on (D-286); else its button comes back. Where
            // the whole block goes with them (the listing), the keyboard goes to the page's heading, never its end.
            open.value = waits.value && !props.startClosed
            focusFirst('[data-pp-field]', '#pp-open', '[data-focus-after-papers]')
        },
        onFinish: () => {
            busy.value = false
        },
    })
}
</script>

<template>
    <div class="pp">
        <!-- Given, and nothing more asked: what was given, one press from changing. Asked for more, the form says both. -->
        <template v-if="papers && !open && !askedFields.length">
            <p class="pp__summary">
                <span>Nach deinen Angaben: {{ summary }}</span>
                <button id="pp-change" class="btn btn--ghost btn--sm" type="button" @click="change">Ändern</button>
            </p>
            <p v-for="note in papers.notes" :key="note" class="pp__help">{{ note }}</p>
        </template>

        <!-- Nothing typed yet, or more asked for: one button, the form opens in place. -->
        <button v-else-if="!open" id="pp-open" class="btn btn--secondary btn--sm pp__open" type="button" @click="change">
            Werte aus der Zulassungsbescheinigung eintragen
        </button>

        <form v-else class="pp__form" novalidate aria-labelledby="pp-h" @submit.prevent="save">
            <div class="pp__head">
                <p id="pp-h" class="pp__title">Werte aus deiner Zulassungsbescheinigung</p>
                <!-- Asked for: which fields, the page says above the form (the tyre lines, the listing's banner, D-286). -->
                <p v-if="askedFields.length" class="pp__help" data-asked>{{ KEPT }}</p>
                <p v-else-if="asksFigures" class="pp__help">
                    Freiwillig: Mit den zulässigen Achslasten und der Höchstgeschwindigkeit zeigen wir dir, welche Reifen du fahren darfst. {{ KEPT }}
                </p>
                <p v-else class="pp__help">
                    Die Achslasten und die Höchstgeschwindigkeit stehen schon in unseren Fahrzeugdaten. Die Reifen aus den Feldern 15.1 und 15.2 kannst du freiwillig ergänzen. {{ KEPT }}
                </p>
                <p v-for="note in papers?.notes ?? []" :key="note" class="pp__help">{{ note }}</p>
            </div>

            <!-- The three figures first: what the answer waits for, and beside it what we know, with where it came from. -->
            <div v-if="rows.length" class="pp__grid">
                <template v-for="row in rows" :key="row.key">
                    <div v-if="row.kind === 'input'" class="form-field">
                        <label class="form-field__label" :for="`pp-${row.key}`">{{ row.label }}<span class="visually-hidden"> ({{ row.unit }})</span></label>
                        <div class="input-group">
                            <!-- Text, digits only: a mouse wheel over it never changes the figure (D-290). -->
                            <input
                                :id="`pp-${row.key}`"
                                v-model="form[row.key]"
                                class="input"
                                type="text"
                                inputmode="numeric"
                                autocomplete="off"
                                spellcheck="false"
                                data-pp-field
                                :aria-required="row.required ? 'true' : undefined"
                                :aria-invalid="errors[row.key] ? 'true' : undefined"
                                :aria-describedby="`pp-${row.key}-err`"
                            >
                            <span class="input-group__suffix" aria-hidden="true" translate="no">{{ row.unit }}</span>
                        </div>
                        <p :id="`pp-${row.key}-err`" class="form-field__error">{{ errors[row.key] }}</p>
                    </div>
                    <!-- Known: shown, never asked again — with where it came from (D-291). -->
                    <div v-else class="form-field pp__known" :data-pp-known="row.key">
                        <span class="form-field__label">{{ row.label }}</span>
                        <span class="pp__value">{{ row.shown }}</span>
                        <span class="pp__source">{{ row.source }}</span>
                    </div>
                </template>
            </div>

            <!-- Where they stand in the papers, one press away: open, the drawing made the form taller than the panel's answer. -->
            <details class="pp__fold">
                <summary class="pp__toggle">Wo stehen die Werte?</summary>
                <figure class="pp__figure">
                    <div class="pp__variants" role="group" aria-label="Welches Dokument hast du?">
                        <button class="chip" type="button" :aria-pressed="variant === 'neu' ? 'true' : 'false'" @click="variant = 'neu'">Zulassungsbescheinigung Teil I</button>
                        <button class="chip" type="button" :aria-pressed="variant === 'alt' ? 'true' : 'false'" @click="variant = 'alt'">Alter Fahrzeugschein</button>
                    </div>
                    <PapersFacsimile
                        :variant="variant"
                        :width="360"
                        :title="variant === 'neu' ? 'Zulassungsbescheinigung Teil I: die Felder 8.1, 8.2, T und P.2 sind markiert' : 'Alter Fahrzeugschein: die Ziffern 6, 7 und 16 sind markiert'"
                    />
                    <figcaption class="pp__caption">
                        {{ variant === 'neu' ? 'Die Achslasten stehen in 8.1 und 8.2, die Höchstgeschwindigkeit in T.' : 'Im alten Fahrzeugschein: Achslasten in Ziffer 16, Höchstgeschwindigkeit in Ziffer 6.' }}
                    </figcaption>
                </figure>
            </details>

            <!-- The photo fills the fields the form asks; where it asks none of them, there is nothing for it to fill. -->
            <div v-if="fieldKeys.length" class="pp__scan">
                <label for="pp-photo" class="visually-hidden">Foto der Zulassungsbescheinigung Teil I</label>
                <input id="pp-photo" ref="fileInput" class="visually-hidden" type="file" accept="image/*" capture="environment" tabindex="-1" @change="onPhoto">
                <button class="btn btn--secondary btn--sm" type="button" :disabled="scan === 'busy'" :aria-busy="scan === 'busy' ? 'true' : undefined" @click="fileInput?.click()">
                    <Icon name="camera" :size="20" />
                    Zulassungsbescheinigung fotografieren
                </button>
                <p class="pp__help">Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.</p>
                <p v-if="scan === 'busy'" class="pp__help" role="status">Erkennung läuft …</p>
                <p v-else-if="scan === 'read'" class="pp__help" role="status">Aus dem Foto gelesen. Prüf die Werte, bevor du sie übernimmst.</p>
                <p v-else-if="scan === 'failed'" class="notice notice--warn" role="alert">
                    <Icon name="warning" :size="20" />
                    <span>{{ unread }}</span>
                </p>
                <p v-if="powerMismatch" class="notice notice--warn" role="alert">
                    <Icon name="warning" :size="20" />
                    <span>
                        Laut Foto hat dein Fahrzeug {{ withUnit(readPowerKw ?? '', 'kW') }} (Feld P.2), gewählt ist eine Variante mit {{ withUnit(powerKw ?? '', 'kW') }}. Prüf bitte, ob du die
                        richtige Variante gewählt hast – davon hängt ab, welche Felgen freigegeben sind.
                    </span>
                </p>
            </div>

            <!-- 15.1 and 15.2, optional (D-242): the stricter of these and our own sum governs, never the weaker. Folded, open
                 where they were given or refused. -->
            <details class="pp__fold" :open="moreOpen" @toggle="moreOpen = ($event.target as HTMLDetailsElement).open">
                <summary class="pp__toggle">Reifen aus den Feldern 15.1 und 15.2 eintragen (freiwillig)</summary>
                <div class="pp__index">
                    <p class="pp__help">
                        Trag beide ein, vorn und hinten, so wie sie dort stehen. Verlangen sie mehr als unsere Berechnung, gilt das Strengere.
                    </p>
                    <div class="pp__pair">
                        <div v-for="field in INDEX_FIELDS" :key="field.key" class="form-field">
                            <label class="form-field__label" :for="`pp-${field.key}`">{{ field.label }}</label>
                            <input
                                :id="`pp-${field.key}`"
                                v-model="index[field.key]"
                                class="input"
                                type="text"
                                autocomplete="off"
                                spellcheck="false"
                                placeholder="z. B. 225/45 R17 91W"
                                :aria-invalid="errors[field.key] ? 'true' : undefined"
                                :aria-describedby="`pp-${field.key}-err`"
                            >
                            <p :id="`pp-${field.key}-err`" class="form-field__error">{{ errors[field.key] }}</p>
                        </div>
                    </div>
                </div>
            </details>

            <div class="pp__actions">
                <!-- Secondary: „In den Warenkorb“ stays the page's one primary action. Busy, never disabled, while it sends:
                     a disabled button drops the keyboard to the page (#16); a second press does nothing (save, clear). -->
                <button id="pp-save" class="btn btn--secondary btn--sm" type="submit" :aria-busy="busy ? 'true' : undefined">Werte übernehmen</button>
                <button class="btn btn--ghost btn--sm" type="button" :aria-disabled="busy ? 'true' : undefined" @click="cancel">Abbrechen</button>
                <button v-if="entered" class="btn btn--ghost btn--sm" type="button" :aria-busy="busy ? 'true' : undefined" @click="clear">Werte löschen</button>
            </div>
            <p v-if="failure" class="form-field__error pp__failure" role="alert">{{ failure }}</p>
        </form>
    </div>
</template>

<style scoped>
/* The panel is narrow on a phone AND in the desktop purchase column: the layout follows the room the
   form has, never the window (C-01). */
.pp {
    container-type: inline-size;
    margin-block: var(--sp-16);
}

.pp__summary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

/* A surface, not a band: the chips, the notices and a disabled button are drawn in --c-band and
   would vanish on it. */
.pp__form {
    display: grid;
    gap: var(--sp-16);
    padding: var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
}

.pp__head {
    display: grid;
    gap: var(--sp-4);
}

.pp__title {
    margin: 0;
    font-weight: 600;
}

.pp__help,
.pp__caption {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

/* What is optional, or only help, one press away: the form stays as short as what the answer waits for (D-286). */
.pp__fold {
    display: grid;
    gap: var(--sp-8);
}

.pp__fold[open] {
    gap: var(--sp-12);
}

.pp__toggle {
    cursor: pointer;
    width: fit-content;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-blue);
    text-decoration: underline;
    text-underline-offset: 2px;
}

.pp__toggle:focus-visible {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

/* Under a finger the toggle is a 44 px row, as every other control. */
@media (pointer: coarse) {
    .pp__toggle {
        display: flex;
        align-items: center;
        min-height: 44px;
    }
}

.pp__failure {
    margin: 0;
}

.pp__scan {
    display: grid;
    justify-items: start;
    gap: var(--sp-8);
}

.pp__scan p {
    margin: 0;
}

.pp__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-16);
}

.pp .input-group .input {
    padding-right: var(--sp-48);
}

/* A figure we know: plain text on the field's line, never a locked field — shown, not asked (D-291). */
.pp__value {
    display: flex;
    align-items: center;
    min-height: 44px;
    font-variant-numeric: tabular-nums;
}

.pp__source {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.pp__index {
    display: grid;
    gap: var(--sp-8);
}

.pp__pair {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-16);
}

/* Two side by side once the form has room for a full designation in each. */
@container (min-width: 480px) {
    .pp__pair {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

.pp__form .form-field__error:empty {
    display: none;
}

.pp__figure {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    max-width: 360px;
}

.pp__figure :deep(svg) {
    width: 100%;
    height: auto;
}

.pp__variants,
.pp__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

/* A button's label wraps rather than widen the column past the screen. */
.pp__open,
.pp__scan .btn {
    max-width: 100%;
    white-space: normal;
    text-wrap: balance;
}

/* Narrow: the button takes the full width. */
@container (max-width: 479px) {
    .pp__scan {
        justify-items: stretch;
    }
}

/* Only where the form is wide enough for „Höchstgeschwindigkeit“ in a third of it: three fields side by
   side, label, field and error each on one line across the three, however many lines a label takes. */
@container (min-width: 560px) {
    /* The rows of fields keep the grid's own gap between them; inside a field, its label, field and line keep theirs
       (`.form-field`'s gap, which a subgrid uses for its own tracks). */
    .pp__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .pp__grid .form-field {
        grid-row: span 3;
        grid-template-rows: subgrid;
    }

    .pp__grid .form-field__label {
        align-self: end;
    }
}
</style>
