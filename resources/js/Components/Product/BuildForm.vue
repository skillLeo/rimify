<script setup lang="ts">
/**
 * Karosserieform and Antrieb, where the vehicle data has neither (the operator's last prompt §1.1).
 *
 * Derived first, asked second. What an unambiguous word of the car's name gives (`Touring` → Kombi) stands as a
 * filled answer with „stimmt das?“ and one click to change it. What the answer waits for and nothing gives is
 * asked, in plain words with small silhouettes: „Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und
 * wir prüfen sofort.“ — a choice is sent at once and the answer above is given again, with no button to find.
 * Kept with THIS car beside 8.1, 8.2 and T (`rmf_papiere`).
 */

import { router } from '@inertiajs/vue3'
import { computed, nextTick, ref } from 'vue'
import type { BuildProp } from '../../types/rimify'

type Fact = 'bodyForm' | 'driveAxle'

const props = defineProps<{
    vehicleId: number
    build: BuildProp | null
    /** What of the car the answer waits for (the verdict's `missing`). */
    missing: string[]
}>()

/* Side views on a 48 × 24 grid, each with the one line that tells it apart: the boot's step, the long roof, the
   sloping hatch, the low fastback, no roof, a short open two-seater, the tall body, the single box. The wheels are
   drawn over the body (WHEELS). */
const BODIES: { value: string; label: string; path: string }[] = [
    { value: 'Limousine', label: 'Limousine', path: 'M2 19v-5q0-2 3-2l8-1 5-5h12l5 5 9 1q2 0 2 2v5z' },
    { value: 'Kombi', label: 'Kombi', path: 'M2 19v-5q0-2 3-2l8-1 5-5h24l3 5v8z' },
    { value: 'Schrägheck', label: 'Schrägheck', path: 'M2 19v-5q0-2 3-2l8-1 5-5h15l11 6q2 .5 2 2v5z' },
    { value: 'Coupe', label: 'Coupé', path: 'M2 19v-4q0-2 3-2l9-1 6-5h9l8 5 7 1q2 0 2 2v4z' },
    { value: 'Cabrio', label: 'Cabrio', path: 'M2 19v-5q0-2 3-2h39q2 0 2 2v5zM17 12l3-5M30 12q3-3 6 0' },
    { value: 'Roadster', label: 'Roadster', path: 'M4 19v-4q0-2 3-2h34q3 0 3 2v4zM21 13l3-5' },
    { value: 'SUV', label: 'SUV', path: 'M2 19v-7q0-2 3-2l7-1 5-5h24l4 5v10z' },
    { value: 'Van', label: 'Van', path: 'M2 19V9l7-6h36v16z' },
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
const busy = ref(false)
const error = ref('')

const shown = computed<Fact[]>(() => (changing.value === null ? asked.value : [changing.value]))

function current(fact: Fact): string | null {
    return fact === 'bodyForm' ? (props.build?.bodyForm ?? null) : (props.build?.driveAxle ?? null)
}

function change(fact: Fact): void {
    changing.value = fact
    void nextTick(() => document.querySelector<HTMLElement>(`#bf-${fact} [aria-pressed="true"], #bf-${fact} button`)?.focus())
}

function choose(fact: Fact, value: string): void {
    busy.value = true
    error.value = ''
    router.post(`/fahrzeug/${props.vehicleId}/aufbau`, fact === 'bodyForm' ? { body_form: value } : { drive_axle: value }, {
        preserveScroll: true,
        errorBag: 'aufbau',
        onError: (bag) => {
            error.value = Object.values(bag as Record<string, string>)[0] ?? ''
        },
        onSuccess: () => {
            changing.value = null
        },
        onFinish: () => {
            busy.value = false
        },
    })
}
</script>

<template>
    <div v-if="asked.length || given.length" class="bf">
        <p v-if="asked.length && changing === null" class="bf__lead">{{ lead }}</p>

        <template v-if="changing === null">
            <p v-for="line in given" :key="line.fact" class="bf__given">
                <span>
                    {{ NAMES[line.fact] }}: <strong>{{ line.value }}</strong>
                    <template v-if="line.source === 'name'"> – erkannt an „{{ line.word }}“ im Fahrzeugnamen. Stimmt das?</template>
                    <template v-else> – nach deiner Angabe.</template>
                </span>
                <button class="btn btn--ghost btn--sm" type="button" :disabled="busy" :aria-label="`${NAMES[line.fact]} ändern`" @click="change(line.fact)">Ändern</button>
            </p>
        </template>

        <div v-for="fact in shown" :id="`bf-${fact}`" :key="fact" class="bf__group" role="group" :aria-labelledby="`bf-${fact}-h`">
            <p :id="`bf-${fact}-h`" class="bf__label">{{ NAMES[fact] }}</p>
            <div class="bf__options" :class="{ 'bf__options--drive': fact === 'driveAxle' }">
                <template v-if="fact === 'bodyForm'">
                    <button
                        v-for="body in BODIES"
                        :key="body.value"
                        class="bf__option"
                        type="button"
                        :aria-pressed="current(fact) === body.value ? 'true' : 'false'"
                        :disabled="busy"
                        @click="choose(fact, body.value)"
                    >
                        <svg class="bf__shape" viewBox="0 0 48 24" aria-hidden="true" focusable="false">
                            <path :d="body.path" />
                            <circle v-for="x in WHEELS" :key="x" :cx="x" cy="19" r="3.5" />
                        </svg>
                        <span>{{ body.label }}</span>
                    </button>
                </template>
                <template v-else>
                    <button
                        v-for="drive in DRIVES"
                        :key="drive.value"
                        class="bf__option bf__option--text"
                        type="button"
                        :aria-pressed="current(fact) === drive.value ? 'true' : 'false'"
                        :disabled="busy"
                        @click="choose(fact, drive.value)"
                    >
                        {{ drive.label }}
                    </button>
                </template>
            </div>
        </div>

        <button v-if="changing !== null" class="btn btn--ghost btn--sm bf__cancel" type="button" :disabled="busy" @click="changing = null">Abbrechen</button>
        <p v-if="error" class="form-field__error" role="alert">{{ error }}</p>
        <p v-if="busy" class="visually-hidden" role="status">Wird geprüft …</p>
    </div>
</template>

<style scoped>
/* The same room as the papers form beside it: laid out by the panel's width, never the window's. */
.bf {
    container-type: inline-size;
    display: grid;
    gap: var(--sp-12);
    margin-block: var(--sp-16);
}

.bf__lead {
    margin: 0;
    font-weight: 600;
}

.bf__given {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
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

/* Four across where there is room, two on a narrow panel: every option a finger's width. */
.bf__options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-8);
}

@container (min-width: 400px) {
    .bf__options {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .bf__options--drive {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

.bf__option {
    display: grid;
    justify-items: center;
    gap: var(--sp-4);
    min-height: 44px;
    padding: var(--sp-8);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    color: var(--c-ink);
    font: inherit;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    cursor: pointer;
}

.bf__option--text {
    align-content: center;
}

/* Pressed as every chip of the shop is pressed (components.css `.chip`). */
.bf__option[aria-pressed='true'] {
    background: var(--c-blue-tint);
    border-color: var(--c-blue);
    color: var(--c-blue);
}

.bf__option[aria-pressed='true'] .bf__shape circle {
    fill: var(--c-blue-tint);
}

@media (hover: hover) and (pointer: fine) {
    .bf__option:hover:not(:disabled) {
        border-color: var(--c-ink-2);
    }
}

.bf__option:disabled {
    cursor: default;
    opacity: 0.6;
}

.bf__shape {
    width: 64px;
    height: auto;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.bf__shape circle {
    fill: var(--c-surface);
}

.bf__cancel {
    justify-self: start;
}
</style>
