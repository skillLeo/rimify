<script setup lang="ts">
/**
 * The three figures the tyre half needs, from the customer's own papers (Block C, item 10): 8.1 and 8.2,
 * the permitted axle loads front and rear, and T, the top speed. Where the car's data has them, optional; where
 * it lacks them the wheel answer stands and the tyres are „Noch nicht bestätigt“ until they are in (D-286) — then
 * this form is the way on. With them the tyre answer is definite and shows its sum.
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
import type { PapersProp } from '../../types/rimify'

const props = defineProps<{
    vehicleId: number
    papers: PapersProp | null
    /** The chosen variant's power (kW), for the P.2 check; null when the vehicle data has none. */
    powerKw?: number | null
    /**
     * The fields the answer waits for — `8.1`, `8.2`, `T` — where the tyres are „Noch nicht bestätigt“ for want of them
     * (D-286). Then this form is the way on, not an option: open from the start, and it says what is missing.
     */
    asked?: string[]
    /** The host says what is missing, above the form (the listing, D-286): the form starts closed and does not repeat it. */
    askedAbove?: boolean
}>()

const variant = ref<'neu' | 'alt'>('neu')
/* Closed until asked for: the fields are optional, and open by default they pushed the price and „In den
   Warenkorb“ below the first screen of the product page. Where the answer waits for them nothing is in the basket's
   way — there is no purchase until they are in —, and the form opens by itself (D-286). */
const askedFields = computed(() => props.asked ?? [])
const open = ref(!props.askedAbove && askedFields.value.length > 0 && props.papers === null)

/* What the answer waits for, in a sentence: all three are asked either way — they stand side by side in the papers,
   and the figures are kept together. */
const askedLine = computed(() => {
    const speedOnly = askedFields.value.length === 1 && askedFields.value[0] === 'T'

    return speedOnly
        ? 'Trag die Höchstgeschwindigkeit aus Feld T ein und dazu die zulässigen Achslasten aus den Feldern 8.1 und 8.2 – alle drei stehen in deiner Zulassungsbescheinigung Teil I.'
        : 'Trag die zulässigen Achslasten aus den Feldern 8.1 und 8.2 und die Höchstgeschwindigkeit aus Feld T ein.'
})

/* Where the figures are kept — said wherever the form asks for them. */
const KEPT = 'Wir speichern die Werte zu diesem Fahrzeug als Cookie in deinem Browser.'
const busy = ref(false)
const errors = ref<Record<string, string>>({})

type FieldKey = 'axle_front_kg' | 'axle_rear_kg' | 'top_speed_kmh' | 'power_kw'

/*
 * The unit sits in the field's frame; the label keeps it for a screen reader. P.2 is asked only where the
 * vehicle data has no power — a car typed from a Gutachten — because a size's kW band is read against it
 * (Block D). Optional, like the rest.
 */
const FIELDS = computed<{ key: FieldKey; label: string; unit: string; min: number; max: number }[]>(() => [
    { key: 'axle_front_kg', label: '8.1 · zulässige Achslast vorn', unit: 'kg', min: 300, max: 4000 },
    { key: 'axle_rear_kg', label: '8.2 · zulässige Achslast hinten', unit: 'kg', min: 300, max: 4000 },
    { key: 'top_speed_kmh', label: 'T · Höchstgeschwindigkeit', unit: 'km/h', min: 60, max: 420 },
    ...(props.powerKw == null ? [{ key: 'power_kw' as const, label: 'P.2 · Leistung (erste Zahl)', unit: 'kW', min: 10, max: 1000 }] : []),
])

const form = reactive<Record<FieldKey, number | ''>>({
    axle_front_kg: (props.papers?.axleFrontKg ?? '') as number | '',
    axle_rear_kg: (props.papers?.axleRearKg ?? '') as number | '',
    top_speed_kmh: (props.papers?.topSpeedKmh ?? '') as number | '',
    power_kw: (props.papers?.powerKw ?? '') as number | '',
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

/** The form as the kept figures say, nothing typed since — for „Ändern“ and „Abbrechen“. */
function fromPapers(): void {
    form.axle_front_kg = props.papers?.axleFrontKg ?? ''
    form.axle_rear_kg = props.papers?.axleRearKg ?? ''
    form.top_speed_kmh = props.papers?.topSpeedKmh ?? ''
    form.power_kw = props.papers?.powerKw ?? ''
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
    void nextTick(() => document.getElementById('pp-axle_front_kg')?.focus())
}

/** „Abbrechen“: back to the summary, nothing kept of what was typed (C-06). */
function cancel(): void {
    fromPapers()
    open.value = false
    void nextTick(() => document.getElementById(props.papers ? 'pp-change' : 'pp-open')?.focus())
}

/* `1.160 kg`: a figure and its unit through the one helper (R-10). */
const kg = (n: number): string => withUnit(formatNumber(n), 'kg')

function save(): void {
    busy.value = true
    // P.2 goes only where it was asked; empty, it is not sent. 15.1 and 15.2 go where either was typed.
    const { power_kw: power, ...figures } = form
    const typed = index.index_front.trim() !== '' || index.index_rear.trim() !== ''
    router.post(`/fahrzeug/${props.vehicleId}/papiere`, {
        ...figures,
        ...(props.powerKw == null && power !== '' ? { power_kw: power } : {}),
        ...(typed ? { index_front: index.index_front, index_rear: index.index_rear } : {}),
    }, {
        preserveScroll: true,
        errorBag: 'papiere',
        onError: (bag) => {
            errors.value = bag as Record<string, string>
            const first = ['axle_front_kg', 'axle_rear_kg', 'top_speed_kmh', 'power_kw', 'index_front', 'index_rear'].find((key) => errors.value[key])
            document.getElementById(first ? `pp-${first}` : 'pp-save')?.focus()
        },
        onSuccess: () => {
            errors.value = {}
            open.value = false
            // The form gives way to the summary: focus goes where the reader can change it again.
            void nextTick(() => document.getElementById('pp-change')?.focus())
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

        if (found.axleFrontKg === null && found.axleRearKg === null && found.topSpeedKmh === null) {
            scan.value = 'failed'
            ocr.dispose()

            return
        }

        // Only what was read replaces what is in a field; nothing is kept until "Werte übernehmen".
        form.axle_front_kg = found.axleFrontKg ?? form.axle_front_kg
        form.axle_rear_kg = found.axleRearKg ?? form.axle_rear_kg
        form.top_speed_kmh = found.topSpeedKmh ?? form.top_speed_kmh
        // P.2 fills its field where it is asked, and is checked against the variant where the data knows it.
        if (props.powerKw == null) {
            form.power_kw = found.powerKw ?? form.power_kw
        }
        readPowerKw.value = found.powerKw
        scan.value = 'read'
        await nextTick()
        document.getElementById('pp-axle_front_kg')?.focus()
    } catch {
        scan.value = 'failed'
        ocr.dispose()
    }
}

function clear(): void {
    busy.value = true
    router.delete(`/fahrzeug/${props.vehicleId}/papiere`, {
        preserveScroll: true,
        onSuccess: () => {
            form.axle_front_kg = ''
            form.axle_rear_kg = ''
            form.top_speed_kmh = ''
            form.power_kw = ''
            index.index_front = ''
            index.index_rear = ''
            // What was wrong with figures that are gone is no longer said (C-07).
            errors.value = {}
            open.value = false
            void nextTick(() => document.getElementById('pp-open')?.focus())
        },
        onFinish: () => {
            busy.value = false
        },
    })
}
</script>

<template>
    <div class="pp">
        <template v-if="papers && !open">
            <p class="pp__summary">
                <span>Nach deinen Angaben: 8.1 {{ kg(papers.axleFrontKg) }} · 8.2 {{ kg(papers.axleRearKg) }} · T {{ withUnit(papers.topSpeedKmh, 'km/h') }}<template v-if="papers.powerKw"> · P.2 {{ withUnit(papers.powerKw, 'kW') }}</template><template v-if="papers.index"> · 15.1 {{ papers.index.front }} · 15.2 {{ papers.index.rear }}</template></span>
                <button id="pp-change" class="btn btn--ghost btn--sm" type="button" @click="change">Ändern</button>
            </p>
            <p v-for="note in papers.notes" :key="note" class="pp__help">{{ note }}</p>
        </template>

        <!-- Nothing typed yet: one button, the form opens in place. -->
        <button v-else-if="!open" id="pp-open" class="btn btn--secondary btn--sm pp__open" type="button" @click="change">
            Werte aus der Zulassungsbescheinigung eintragen
        </button>

        <form v-else class="pp__form" novalidate aria-labelledby="pp-h" @submit.prevent="save">
            <div class="pp__head">
                <p id="pp-h" class="pp__title">Werte aus deiner Zulassungsbescheinigung</p>
                <p v-if="askedFields.length && askedAbove" class="pp__help">{{ KEPT }}</p>
                <p v-else-if="askedFields.length" class="pp__help pp__asked" data-asked>{{ askedLine }} {{ KEPT }}</p>
                <p v-else class="pp__help">
                    Freiwillig: Mit den zulässigen Achslasten und der Höchstgeschwindigkeit zeigen wir dir, welche Reifen du fahren darfst. {{ KEPT }}
                </p>
            </div>

            <div class="pp__scan">
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
                    <span>Wir konnten 8.1, 8.2 und T nicht lesen. Trag sie bitte von Hand ein.</span>
                </p>
                <p v-if="powerMismatch" class="notice notice--warn" role="alert">
                    <Icon name="warning" :size="20" />
                    <span>
                        Laut Foto hat dein Fahrzeug {{ withUnit(readPowerKw ?? '', 'kW') }} (Feld P.2), gewählt ist eine Variante mit {{ withUnit(powerKw ?? '', 'kW') }}. Prüf bitte, ob du die
                        richtige Variante gewählt hast – davon hängt ab, welche Felgen freigegeben sind.
                    </span>
                </p>
            </div>

            <div class="pp__grid">
                <div v-for="field in FIELDS" :key="field.key" class="form-field">
                    <label class="form-field__label" :for="`pp-${field.key}`">{{ field.label }}<span class="visually-hidden"> ({{ field.unit }})</span></label>
                    <div class="input-group">
                        <input
                            :id="`pp-${field.key}`"
                            v-model.number="form[field.key]"
                            class="input"
                            type="number"
                            :min="field.min"
                            :max="field.max"
                            inputmode="numeric"
                            :aria-invalid="errors[field.key] ? 'true' : undefined"
                            :aria-describedby="`pp-${field.key}-err`"
                        >
                        <span class="input-group__suffix" aria-hidden="true" translate="no">{{ field.unit }}</span>
                    </div>
                    <p :id="`pp-${field.key}-err`" class="form-field__error">{{ errors[field.key] }}</p>
                </div>
            </div>

            <!-- 15.1 and 15.2, optional (D-242): the stricter of these and our own sum governs, never the weaker. -->
            <div class="pp__index">
                <p class="pp__help">
                    Freiwillig, vorn und hinten zusammen: die Reifen aus Feld 15.1 und 15.2, so wie sie dort stehen. Verlangen sie mehr
                    als unsere Rechnung, gilt das Strengere.
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

            <div class="pp__actions">
                <!-- Secondary: „In den Warenkorb“ stays the page's one primary action. -->
                <button id="pp-save" class="btn btn--secondary btn--sm" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">Werte übernehmen</button>
                <button class="btn btn--ghost btn--sm" type="button" :disabled="busy" @click="cancel">Abbrechen</button>
                <button v-if="entered" class="btn btn--ghost btn--sm" type="button" :disabled="busy" @click="clear">Werte löschen</button>
            </div>
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

/* What the answer waits for is not a side note: in ink (D-286). */
.pp__asked {
    color: var(--c-ink);
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
    .pp__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        row-gap: var(--sp-4);
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
