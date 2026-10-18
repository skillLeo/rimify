<script setup lang="ts">
/**
 * Karosserieform and Antriebsart, where the vehicle data has neither (the operator's last prompt §1.1).
 *
 * Derived first, asked second. What an unambiguous word of the car's name gives (`Touring` → Kombi) stands as a
 * filled answer with „stimmt das?“ and one click to change it. What the answer waits for and nothing gives is
 * asked, in plain words with small silhouettes: „Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und
 * wir prüfen sofort.“ — a choice is sent at once and the answer above is given again, with no button to find.
 * Kept with THIS car beside 8.1, 8.2 and T (`rmf_papiere`).
 */

import { router } from '@inertiajs/vue3'
import { computed, nextTick, ref } from 'vue'
import { OFFLINE, refusal } from '../../lib/visitRefusal'
import type { BuildProp } from '../../types/rimify'

type Fact = 'bodyForm' | 'driveAxle'

const props = defineProps<{
    vehicleId: number
    build: BuildProp | null
    /** What of the car the answer waits for (the verdict's `missing`). */
    missing: string[]
}>()

/* Side views on a 48 × 24 grid, the front to the left, drawn as the icon set is drawn (1,5 px, square ends, mitred
   corners). Each carries the one line that tells it apart at 48 px: the flat boot deck, the long roof, the steep
   short tail, the low roof in one long slope, the top folded at the back, the hoop behind the seats, the tall body,
   the single box. The wheels are drawn over the body (WHEELS). */
const BODIES: { value: string; label: string; path: string }[] = [
    { value: 'Limousine', label: 'Limousine', path: 'M2 19V14L4 12H13L18 7H30L35 12H45L46 13V19Z' },
    { value: 'Kombi', label: 'Kombi', path: 'M2 19V14L4 12H13L18 7H44L46 10V19Z' },
    { value: 'Schrägheck', label: 'Schrägheck', path: 'M4 19V14L6 12H14L19 7H32L41 11V19Z' },
    { value: 'Coupe', label: 'Coupé', path: 'M2 19V14L4 12H15L21 8.5H27L40 12H45L46 13V19Z' },
    { value: 'Cabrio', label: 'Cabrio', path: 'M2 19V14L4 12H45L46 13V19ZM15 12L18 8M31 12L32 10H38L39 12' },
    { value: 'Roadster', label: 'Roadster', path: 'M5 19V14L7 12H42L43 13V19ZM18 12L21 8M27 12V8.5H30V12' },
    { value: 'SUV', label: 'SUV', path: 'M2 19V11L4 9H12L17 4H42L45 8V19Z' },
    { value: 'Van', label: 'Van', path: 'M2 19V10L9 3H45V19Z' },
]

const WHEELS = [12, 36]

const DRIVES: { value: string; label: string }[] = [
    { value: 'Vorderachse', label: 'Frontantrieb' },
    { value: 'Hinterachse', label: 'Heckantrieb' },
    { value: 'Allrad', label: 'Allradantrieb' },
]

/* „Antriebsart“, not „Antrieb“: every car has a drive — what is missing is which kind. */
const NAMES: Record<Fact, string> = { bodyForm: 'Karosserieform', driveAxle: 'Antriebsart' }

const asked = computed<Fact[]>(() => (['bodyForm', 'driveAxle'] as const).filter((fact) => props.missing.includes(fact)))

/** „Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und wir prüfen sofort.“ */
const lead = computed(() =>
    asked.value.length === 2
        ? 'Für dieses Fahrzeug fehlen Karosserieform und Antriebsart. Trag sie ein und wir prüfen sofort.'
        : `Für dieses Fahrzeug fehlt die ${NAMES[asked.value[0] ?? 'bodyForm']}. Trag sie ein und wir prüfen sofort.`
)

/* The answers as the page reads them, with where each came from: shown where the owner gave them or a word of
   the name did — the vehicle data's own need no word here. */
const given = computed(() => {
    const build = props.build

    if (build === null) {
        return []
    }

    return ([
        ['bodyForm', build.bodyForm, build.bodySource, build.bodyWord],
        ['driveAxle', build.driveAxle, build.driveSource, build.driveWord],
    ] as const)
        .filter(([fact, value, source]) => value !== null && (source === 'name' || source === 'customer') && !asked.value.includes(fact))
        .map(([fact, value, source, word]) => ({ fact, value: labelOf(fact, value ?? ''), source, word }))
})

function labelOf(fact: Fact, value: string): string {
    return (fact === 'bodyForm' ? BODIES.find((b) => b.value === value)?.label : DRIVES.find((d) => d.value === value)?.label) ?? value
}

/* „Ändern“: the choice for that one fact opens in place, the current value pressed. */
const changing = ref<Fact | null>(null)
/* The option just chosen: pressed at once and turning while the answer is given again; the others step back. */
const sending = ref<{ fact: Fact; value: string } | null>(null)
const deleting = ref(false)
const error = ref('')

const shown = computed<Fact[]>(() => (changing.value === null ? asked.value : [changing.value]))

function current(fact: Fact): string | null {
    if (sending.value?.fact === fact) {
        return sending.value.value
    }

    return fact === 'bodyForm' ? (props.build?.bodyForm ?? null) : (props.build?.driveAxle ?? null)
}

function isSending(fact: Fact, value: string): boolean {
    return sending.value?.fact === fact && sending.value.value === value
}

function focusSoon(selector: string): void {
    void nextTick(() => document.querySelector<HTMLElement>(selector)?.focus())
}

function change(fact: Fact): void {
    changing.value = fact
    focusSoon(`#bf-${fact} [aria-pressed="true"], #bf-${fact} button`)
}

/* „Abbrechen“ or Esc: the choice closes and the keyboard goes back to the „Ändern“ it came from (G-04). */
function cancel(): void {
    const fact = changing.value

    if (fact === null || sending.value !== null) {
        return
    }

    changing.value = null
    focusSoon(`#bf-given-${fact} button`)
}

/* Offline, an expired page, too many tries, a fault: said at the question, the page and the choice kept (G-05). */
const visit = {
    preserveScroll: true,
    errorBag: 'aufbau',
    onError: (bag: Record<string, string>) => {
        error.value = Object.values(bag)[0] ?? ''
    },
    onHttpException: (response: { status: number }) => {
        error.value = refusal(response.status)

        return false
    },
    onNetworkError: () => {
        error.value = OFFLINE

        return false
    },
    onFinish: () => {
        sending.value = null
        deleting.value = false
    },
}

function choose(fact: Fact, value: string): void {
    if (sending.value !== null || deleting.value) {
        return
    }

    sending.value = { fact, value }
    error.value = ''
    router.post(`/fahrzeug/${props.vehicleId}/aufbau`, fact === 'bodyForm' ? { body_form: value } : { drive_axle: value }, {
        ...visit,
        onSuccess: () => {
            // Every answer about this car changed with it: a page fetched ahead on a hover would show the old one.
            router.flushAll()
            changing.value = null
            // The question has gone; the answer stands in its place, and focus with it.
            focusSoon(`#bf-given-${fact}`)
        },
    })
}

/* The owner's answers for this car, forgotten (G-12): the question comes back where the answer waits for it. */
const ownAnswers = computed(() => given.value.some((line) => line.source === 'customer'))

function forget(): void {
    if (sending.value !== null || deleting.value) {
        return
    }

    deleting.value = true
    error.value = ''
    router.delete(`/fahrzeug/${props.vehicleId}/aufbau`, {
        ...visit,
        onSuccess: () => {
            router.flushAll()
            focusSoon('.bf__lead, .bf__given')
        },
    })
}
</script>

<template>
    <div v-if="asked.length || given.length" class="bf" @keydown.esc="cancel">
        <p v-if="asked.length && changing === null" class="bf__lead" tabindex="-1">{{ lead }}</p>

        <template v-if="changing === null">
            <p v-for="line in given" :id="`bf-given-${line.fact}`" :key="line.fact" class="bf__given" tabindex="-1">
                <span>
                    {{ NAMES[line.fact] }}: <strong>{{ line.value }}</strong>
                    <template v-if="line.source === 'name'"> – erkannt an „{{ line.word }}“ im Fahrzeugnamen. Stimmt das?</template>
                    <template v-else> – nach deiner Angabe.</template>
                </span>
                <button class="link" type="button" :disabled="sending !== null || deleting" :aria-label="`${NAMES[line.fact]} ändern`" @click="change(line.fact)">Ändern</button>
            </p>
            <button v-if="ownAnswers" class="link bf__forget" type="button" :disabled="sending !== null || deleting" :aria-busy="deleting ? 'true' : undefined" @click="forget">
                Meine Angaben zu Karosserieform und Antriebsart löschen
            </button>
        </template>

        <div v-for="fact in shown" :id="`bf-${fact}`" :key="fact" class="bf__group" role="group" :aria-labelledby="`bf-${fact}-h`" :aria-describedby="fact === 'bodyForm' ? 'bf-bodyForm-hint' : undefined">
            <p :id="`bf-${fact}-h`" class="bf__label">{{ NAMES[fact] }}</p>
            <!-- The papers name a body style in their own words: the drawing is the one to go by (G-11). -->
            <p v-if="fact === 'bodyForm'" id="bf-bodyForm-hint" class="bf__hint">
                Wähle die Form, die dein Auto hat. In der Zulassungsbescheinigung heißt auch manches Schrägheck „Kombilimousine“.
            </p>
            <div class="bf__options" :class="fact === 'bodyForm' ? 'bf__options--body' : 'bf__options--drive'">
                <template v-if="fact === 'bodyForm'">
                    <button
                        v-for="body in BODIES"
                        :key="body.value"
                        class="bf__option"
                        type="button"
                        :aria-pressed="current(fact) === body.value ? 'true' : 'false'"
                        :aria-busy="isSending(fact, body.value) ? 'true' : undefined"
                        :disabled="sending !== null && !isSending(fact, body.value)"
                        @click="choose(fact, body.value)"
                    >
                        <!-- While it is sent, the turning mark takes the drawing's place: the word never moves. -->
                        <span class="bf__art" aria-hidden="true">
                            <span v-if="isSending(fact, body.value)" class="spinner bf__spinner" />
                            <svg v-else class="bf__shape" viewBox="0 0 48 24" focusable="false">
                                <path :d="body.path" />
                                <circle v-for="x in WHEELS" :key="x" :cx="x" cy="19" r="3.5" />
                            </svg>
                        </span>
                        <span class="bf__word">{{ body.label }}</span>
                    </button>
                </template>
                <template v-else>
                    <button
                        v-for="drive in DRIVES"
                        :key="drive.value"
                        class="bf__option bf__option--text"
                        type="button"
                        :aria-pressed="current(fact) === drive.value ? 'true' : 'false'"
                        :aria-busy="isSending(fact, drive.value) ? 'true' : undefined"
                        :disabled="sending !== null && !isSending(fact, drive.value)"
                        @click="choose(fact, drive.value)"
                    >
                        <span class="bf__word">{{ drive.label }}</span>
                        <span v-if="isSending(fact, drive.value)" class="spinner bf__spinner" aria-hidden="true" />
                    </button>
                </template>
            </div>
        </div>

        <button v-if="changing !== null" class="link bf__cancel" type="button" :disabled="sending !== null" @click="cancel">Abbrechen</button>
        <p v-if="error" class="form-field__error" role="alert">{{ error }}</p>
        <p class="visually-hidden" role="status">{{ sending ? 'Wird geprüft …' : '' }}</p>
    </div>
</template>

<style scoped>
/* The same room as the papers form beside it: laid out by the panel's width, never the window's. Spaced by what
   belongs together: 8 inside a group, 16 from the question to its first choice, 24 between the groups. */
.bf {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    margin-block: var(--sp-16);
}

.bf > * {
    margin: 0;
}

.bf > * + * {
    margin-top: var(--sp-16);
}

.bf > .bf__group + .bf__group {
    margin-top: var(--sp-24);
}

.bf > .bf__given + .bf__given {
    margin-top: var(--sp-8);
}

.bf__lead {
    max-width: 54ch;
}

.bf__given {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: var(--sp-12);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.bf__given:focus {
    outline: none;
}

.bf__group {
    display: grid;
    gap: var(--sp-8);
}

.bf__label {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.bf__hint {
    max-width: 60ch;
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-3);
}

.bf__lead:focus {
    outline: none;
}

.bf > .bf__given + .bf__forget {
    margin-top: var(--sp-8);
}

.bf__forget {
    align-self: flex-start;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

/* A narrow panel: rows a thumb's height, the drawing beside its word — two across for the body styles, the three
   drives one under the other, so none stands alone at half width. */
.bf__options {
    display: grid;
    gap: var(--sp-8);
}

.bf__options--body {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bf__option {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    min-height: 44px;
    padding: var(--sp-8) var(--sp-12);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    color: var(--c-ink);
    font: inherit;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    text-align: start;
    cursor: pointer;
    transition: background-color var(--d-1) var(--ease-std), border-color var(--d-1) var(--ease-std), color var(--d-1) var(--ease-std);
}

/* From 400 px of panel: the body styles as four tiles, drawing above word, the drives three across. */
@container (min-width: 400px) {
    .bf__options--body {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .bf__options--drive {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .bf__options--body .bf__option {
        flex-direction: column;
        justify-content: center;
        gap: var(--sp-4);
        text-align: center;
    }

    .bf__option--text {
        justify-content: center;
        text-align: center;
    }
}

/* Hover and press as every chip of the shop has them (components.css `.chip`, `.btn--secondary:active`). */
@media (hover: hover) and (pointer: fine) {
    .bf__option:hover:not(:disabled) {
        border-color: var(--c-ink-3);
    }
}

.bf__option:active:not(:disabled) {
    background: var(--c-band);
}

.bf__option[aria-pressed='true'] {
    background: var(--c-blue-tint);
    border-color: var(--c-blue);
    color: var(--c-blue);
}

/* While one choice is sent, the others step back — a band fill and quieter words, never faded (components.css,
   `.btn:disabled`); the one chosen keeps its press and turns. */
.bf__option:disabled {
    background: var(--c-band);
    color: var(--c-ink-3);
    cursor: not-allowed;
}

.bf__option[aria-busy='true'] {
    cursor: progress;
}

.bf__spinner {
    width: 16px;
    height: 16px;
}

/* A drive has no drawing: its mark sits at the row's end, or in the tile's corner. */
.bf__option--text .bf__spinner {
    margin-inline-start: auto;
}

@container (min-width: 400px) {
    .bf__option--text .bf__spinner {
        position: absolute;
        inset-block-start: calc(50% - 8px);
        inset-inline-end: var(--sp-12);
        margin: 0;
    }
}

.bf__art {
    flex: none;
    display: grid;
    place-items: center;
    width: 48px;
    height: 24px;
}

.bf__shape {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: square;
    stroke-linejoin: miter;
}

.bf__shape path,
.bf__shape circle {
    vector-effect: non-scaling-stroke;
}

@container (min-width: 400px) {
    .bf__art {
        width: 64px;
        height: 32px;
    }
}

/* The wheels cover the body's floor line, on whatever fill the option has. */
.bf__shape circle {
    fill: var(--c-surface);
}

.bf__option[aria-pressed='true'] .bf__shape circle {
    fill: var(--c-blue-tint);
}

.bf__option:disabled .bf__shape circle {
    fill: var(--c-band);
}

.bf__cancel {
    align-self: flex-start;
}

@media (prefers-reduced-motion: reduce) {
    .bf__option {
        transition: none;
    }
}
</style>
