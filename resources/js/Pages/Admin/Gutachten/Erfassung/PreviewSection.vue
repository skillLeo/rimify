<script setup lang="ts">
/**
 * „Vorschau im Shop“: what the shop will answer for one of the paper's cars, computed by the same check every customer gets.
 * Lazy: computed when a car is chosen, and only for it. Used by step 5 and by the read view of a released paper.
 */

import { useGutachtenPage } from './entryStore'
import { router } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import ConditionGroups from '../../../../Components/Fitment/ConditionGroups.vue'
import { sizesByAxle } from '../../../../fitment/axles'

const page = useGutachtenPage()
const props = computed(() => page.props)

const draft = computed(() => props.value.document.status === 'draft')
const vehicle = ref<number | null>(props.value.previewVehicle ?? props.value.vehicles[0]?.id ?? null)
const busy = ref(false)

watch(
    () => props.value.vehicles,
    (vehicles) => {
        if (vehicle.value === null || !vehicles.some((v) => v.id === vehicle.value)) {
            vehicle.value = props.value.previewVehicle ?? vehicles[0]?.id ?? null
        }
    },
)

/** The vehicle the verdicts on screen were computed for: named above them, so they are never read as another's. */
const previewFor = computed(() => props.value.vehicles.find((v) => v.id === props.value.previewVehicle)?.label ?? null)

function load(): void {
    if (vehicle.value === null) {
        return
    }

    busy.value = true
    router.reload({
        only: ['preview', 'previewVehicle', 'flash'],
        data: { fahrzeug: vehicle.value },
        onFinish: () => (busy.value = false),
    })
}

/** The preview's entry line, as the shop's panel says it. */
const ENTRY_LINE = 'Eintragung in die Fahrzeugpapiere erforderlich.'

const TONE: Record<string, string | null> = {
    PERMITTED: null,
    CONDITIONAL: 'adm-tag adm-tag--warn',
    NOT_PERMITTED: 'adm-tag adm-tag--bad',
    UNKNOWN: 'adm-tag adm-tag--neutral',
}
</script>

<template>
    <section v-if="props.vehicles.length" class="adm-section gs-preview" aria-labelledby="gs-preview-h">
        <div class="adm-section__head">
            <h2 id="gs-preview-h" class="adm-section__title">Vorschau im Shop</h2>
        </div>
        <p class="adm-note">So antwortet der Shop{{ draft ? ' nach der Freigabe' : '' }} für dieses Fahrzeug. Dahinter steht dieselbe Prüfung, die auch Kundinnen und Kunden bekommen.</p>
        <form class="gs-preview-pick" @submit.prevent="load">
            <label class="visually-hidden" for="gs-preview-vehicle">Fahrzeug für die Vorschau</label>
            <select id="gs-preview-vehicle" v-model="vehicle" class="input" @change="load">
                <option v-for="car in props.vehicles" :key="car.id" :value="car.id">{{ car.label }}</option>
            </select>
            <button class="btn btn--secondary" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">Vorschau zeigen</button>
        </form>

        <p v-if="props.preview && previewFor" class="gs-preview-for">Vorschau für {{ previewFor }}</p>
        <ul v-if="props.preview && props.preview.length" class="gs-verdicts" aria-live="polite">
            <li v-for="verdict in props.preview" :key="verdict.config" class="gs-verdict">
                <div class="gs-verdict__head">
                    <span class="gs-verdict__wheel">{{ verdict.wheel }}</span>
                    <span v-if="!verdict.notesOnly && TONE[verdict.status]" :class="TONE[verdict.status]">{{ verdict.statusLabel }}</span>
                    <span v-else class="gs-verdict__ok">{{ verdict.statusLabel }}</span>
                </div>
                <p v-if="verdict.reason" class="gs-verdict__line">{{ verdict.reason }}</p>
                <p v-if="verdict.front.length" class="gs-verdict__line">Reifen: {{ sizesByAxle(verdict.front, verdict.rear) }}</p>
                <p v-if="verdict.requiresEntry" class="gs-verdict__line">{{ verdict.entryLine ?? ENTRY_LINE }}<template v-if="verdict.entryNote">{{ ' ' + verdict.entryNote }}</template></p>
                <p v-if="verdict.papersLine" class="gs-verdict__line">{{ verdict.papersLine }}</p>
                <!-- As the shop will show them: the combination's once, each tyre size's with that size (ConditionGroups).
                     An Auflage that repeats the entry line word for word is not said twice. -->
                <ConditionGroups v-if="verdict.conditionGroups && verdict.conditions.length" class="gs-verdict__groups" :groups="verdict.conditionGroups" :omit="verdict.requiresEntry ? [ENTRY_LINE] : []" />
                <template v-else>
                    <p v-for="(sentence, i) in verdict.conditions.filter((s) => !(verdict.requiresEntry && s === ENTRY_LINE))" :key="i" class="gs-verdict__line">{{ sentence }}</p>
                </template>
            </li>
        </ul>
        <p v-else-if="props.preview" class="adm-note">Für dieses Fahrzeug ist zu diesem Gutachten keine Zeile hinterlegt.</p>
    </section>
</template>

<style scoped>
.gs-preview-for {
    margin: var(--sp-12) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
}

.gs-preview-pick {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
    margin-block: var(--sp-12) var(--sp-16);
}

.gs-preview-pick .input {
    flex: 1 1 24ch;
    min-width: 0;
}

.gs-verdicts {
    display: grid;
    gap: 0;
    max-width: var(--adm-form-max);
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.gs-verdict {
    display: grid;
    gap: var(--sp-4);
    padding-block: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
}

.gs-verdict__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8);
}

.gs-verdict__wheel {
    font-weight: 500;
}

.gs-verdict__ok {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.gs-verdict__groups {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.gs-verdict__line {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

@media (max-width: 767px) {
    .gs-preview-pick .btn {
        width: 100%;
        min-height: var(--adm-control-h-lg);
    }
}
</style>
