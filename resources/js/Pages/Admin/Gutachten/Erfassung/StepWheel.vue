<script setup lang="ts">
/**
 * Step 2, Felge (the Gutachten rework §7): one paper is for one wheel in one size, so the step asks for exactly one size —
 * listed by dimension, its colours as dots beneath. Colours are not chosen: every colour of the size is covered.
 *
 * Beside it what the paper itself prints for the wheel, typed by staff: its Radtyp next to the wheel's Radtypenbezeichnung, so
 * they can see the two match (the second real paper sells as Rotiform NUE and prints RC200 8,5x20), and its Raddaten, compared
 * with the chosen size. A difference is a warning, never a block (the operator's note of 06.11.2026).
 */

import { computed, onMounted, reactive, ref, watch } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { decimal } from '../../../../format'
import { Refused, send, useEntry } from './entryStore'

interface SizeHit {
    configId: number
    label: string
    colours: { name: string | null; hex: string | null }[]
}

interface ModelHit {
    model: string
    wheelType: string | null
    demo: boolean
    sizes: SizeHit[]
}

const store = useEntry()
const { state, go } = store

const sizes = computed(() => state.entry.wheelSizes)
const chosen = computed(() => sizes.value[0] ?? null)
const several = computed(() => sizes.value.length > 1)

const query = ref(chosen.value?.wheel ?? '')
const found = ref<ModelHit[]>([])
const more = ref(false)
const searching = ref(false)
const searched = ref(false)
const errors = ref<Record<string, string>>({})
const picked = ref<number | null>(chosen.value?.configId ?? null)

const printed = reactive({
    type: chosen.value?.printed.type ?? '',
    size: printedSize(),
    et: chosen.value?.printed.et === null || chosen.value?.printed.et === undefined ? '' : String(chosen.value.printed.et),
    bolts: printedBolts(),
})

function printedSize(): string {
    const p = chosen.value?.printed

    return p?.width && p.diameter ? `${decimal(p.width, Number.isInteger(p.width) ? 0 : 1)} × ${decimal(p.diameter, 0)}` : ''
}

function printedBolts(): string {
    const p = chosen.value?.printed

    return p?.holes && p.circle ? `${p.holes} × ${decimal(p.circle, Number.isInteger(p.circle) ? 0 : 1)}` : ''
}

let timer: ReturnType<typeof setTimeout> | undefined
/* The search on screen: a late answer to an older one never replaces it. */
let asked = 0

async function search(): Promise<void> {
    const mine = ++asked

    searching.value = true

    try {
        const answer = await send<{ groups: ModelHit[]; more: boolean }>('GET', `/admin/gutachten/suche/felgen?q=${encodeURIComponent(query.value.trim())}`)

        if (mine === asked) {
            found.value = answer.groups
            more.value = answer.more
            searched.value = true
        }
    } catch {
        if (mine === asked) {
            found.value = []
        }
    } finally {
        if (mine === asked) {
            searching.value = false
        }
    }
}

watch(query, () => {
    clearTimeout(timer)
    timer = setTimeout(() => void search(), 250)
})

onMounted(() => {
    if (query.value.trim() !== '') {
        void search()
    }
})

async function save(): Promise<void> {
    if (picked.value === null || several.value) {
        return
    }

    try {
        errors.value = {}
        await store.save('PUT', '/felge', {
            wheel_config_id: picked.value,
            printed_type: printed.type,
            printed_size: printed.size,
            printed_et: printed.et.trim() === '' ? null : printed.et.trim(),
            printed_bolts: printed.bolts,
        })
    } catch (failure) {
        if (failure instanceof Refused) {
            errors.value = Object.fromEntries(Object.entries(failure.errors).map(([key, list]) => [key, list[0] ?? '']))
        }
    }
}

function choose(configId: number): void {
    picked.value = configId
    void save()
}
</script>

<template>
    <section class="ef-step" aria-labelledby="ef-wheel-h">
        <h2 id="ef-wheel-h" class="adm-section__title" tabindex="-1">Für welche Felge gilt das Gutachten?</h2>
        <p class="adm-note">Wähl für dieses Gutachten genau eine Felgengröße. Der Eintrag gilt im Shop für jede Farbe dieser Größe, auch für eine, die später dazukommt.</p>

        <div v-if="several" class="ef-wheel">
            <p class="adm-note">Bei diesem Gutachten sind aus der früheren Erfassung mehrere Felgengrößen hinterlegt. Sie bleiben, wie sie sind:</p>
            <ul class="ef-wheel__list">
                <li v-for="size in sizes" :key="size.id"><strong>{{ size.wheel }}</strong> · {{ size.label }}</li>
            </ul>
        </div>

        <div v-else class="ef-wheel">
            <fieldset class="ef-fieldset ef-printed">
                <legend class="form-field__label">Trag die Felge so ein, wie sie im Gutachten steht <span class="ef-optional">(optional)</span></legend>
                <p class="form-field__help">Zum Vergleich mit der gewählten Größe. Weicht etwas ab, sagen wir es dir; freigeben kannst du trotzdem.</p>
                <div class="ef-printed__grid">
                    <div class="form-field">
                        <label class="form-field__label" for="ef-printed-type">Radtyp</label>
                        <input id="ef-printed-type" v-model="printed.type" class="input" type="text" maxlength="64" spellcheck="false" placeholder="z. B. RC200 8,5x20" :disabled="!state.editable" @change="save">
                        <p v-if="chosen" class="form-field__help">Bei der Felge hinterlegt: {{ chosen.wheelType || 'keine Radtypenbezeichnung' }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-printed-size">Radgröße</label>
                        <input id="ef-printed-size" v-model="printed.size" class="input" type="text" maxlength="32" spellcheck="false" placeholder="z. B. 8 1/2 J X 18 H2" :aria-invalid="errors.printed_size ? 'true' : undefined" :disabled="!state.editable" @change="save">
                        <p class="form-field__error">{{ errors.printed_size }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-printed-et">Einpresstiefe</label>
                        <input id="ef-printed-et" v-model="printed.et" class="input" type="text" inputmode="numeric" maxlength="4" placeholder="z. B. 35" :aria-invalid="errors.printed_et ? 'true' : undefined" :disabled="!state.editable" @change="save">
                        <p class="form-field__error">{{ errors.printed_et }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ef-printed-bolts">Lochkreis</label>
                        <input id="ef-printed-bolts" v-model="printed.bolts" class="input" type="text" maxlength="16" spellcheck="false" placeholder="z. B. 120/5" :aria-invalid="errors.printed_bolts ? 'true' : undefined" :disabled="!state.editable" @change="save">
                        <p class="form-field__error">{{ errors.printed_bolts }}</p>
                    </div>
                </div>
                <div v-if="chosen && chosen.mismatch.length" class="ef-mismatch" role="status">
                    <p class="ef-warn">Die gewählte Größe passt nicht zu dem, was du aus dem Gutachten eingetragen hast. Prüf, ob du die richtige Größe gewählt hast.</p>
                    <ul class="ef-mismatch__list">
                        <li v-for="line in chosen.mismatch" :key="line">{{ line }}</li>
                    </ul>
                </div>
            </fieldset>

            <p v-if="chosen" class="ef-wheel__chosen"><strong>Gewählt:</strong> {{ chosen.wheel }} · {{ chosen.label }}</p>

            <div class="form-field ef-wheel__search">
                <label class="form-field__label" for="ef-wheel-q">Felge suchen</label>
                <input id="ef-wheel-q" v-model="query" class="input" type="search" placeholder="Marke, Modell oder Radtyp" autocomplete="off" :disabled="!state.editable">
            </div>

            <fieldset v-for="wheel in found" :key="wheel.model" class="ef-fieldset ef-wheel__model">
                <legend class="ef-wheel__name">
                    {{ wheel.model }}
                    <span v-if="wheel.demo" class="adm-tag adm-tag--neutral">Demodaten</span>
                </legend>
                <label v-for="size in wheel.sizes" :key="size.configId" class="ef-size" :class="{ 'ef-size--on': picked === size.configId }">
                    <input class="ef-size__radio" type="radio" name="ef-size" :checked="picked === size.configId" :disabled="!state.editable" @change="choose(size.configId)">
                    <span class="ef-size__text">
                        <span class="ef-size__dim">{{ size.label }}</span>
                        <span class="ef-size__colours">
                            <span v-for="colour in size.colours" :key="colour.name ?? ''" class="ef-size__colour">
                                <span class="ef-dot" data-qa-ignore :style="colour.hex ? { '--swatch': colour.hex } : undefined" />
                                {{ colour.name }}
                            </span>
                            <span v-if="size.colours.length === 1" class="ef-size__only">nur in dieser Farbe</span>
                        </span>
                    </span>
                </label>
            </fieldset>

            <p v-if="searched && !searching && found.length === 0" class="adm-note">Keine Felge gefunden. Felgen legst du unter Katalog › Felgen an.</p>
            <p v-if="more" class="adm-note">Es gibt mehr Treffer. Grenz die Suche ein.</p>
            <p v-if="errors.wheel_config_id" class="adm-alert" role="alert">{{ errors.wheel_config_id }}</p>
        </div>

        <div class="ef-actions">
            <button class="btn btn--secondary ef-actions__left" type="button" @click="go(0)">Zurück</button>
            <button class="btn btn--primary" type="button" :disabled="sizes.length === 0" @click="go(2)">
                Weiter: Fahrzeuge
                <Icon name="arrow-right" :size="20" />
            </button>
        </div>
    </section>
</template>

<style scoped>
.ef-wheel {
    display: grid;
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
    margin-top: var(--sp-20);
}

.ef-wheel__search .input {
    max-width: calc(40 * var(--ch-text));
}

.ef-wheel__paper {
    margin: 0;
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.ef-wheel__model {
    display: grid;
    gap: 0;
}

.ef-wheel__name {
    margin-bottom: var(--sp-8);
    font-weight: 600;
}

/* Rows, as the cars of step 3 and the to-do list of step 4: the chosen one tinted, with the rail's bar on its left. */
.ef-size {
    display: flex;
    gap: var(--sp-12);
    align-items: flex-start;
    padding: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
    cursor: pointer;
}

.ef-size--on {
    background: var(--c-blue-tint);
    box-shadow: var(--adm-row-focus);
}

@media (hover: hover) and (pointer: fine) {
    .ef-size:not(.ef-size--on):hover {
        background: var(--c-band);
    }
}

.ef-size__radio {
    flex: none;
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: var(--c-blue);
}

.ef-size__text {
    display: grid;
    gap: var(--sp-4);
}

.ef-size__dim {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.ef-size__colours {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4) var(--sp-12);
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.ef-size__colour {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
}

.ef-size__only {
    color: var(--c-ink-3);
}

.ef-dot {
    width: 12px;
    height: 12px;
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-round);
    background: var(--swatch, var(--c-ink-2));
}

.ef-wheel__chosen {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}
</style>
