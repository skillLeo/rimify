<script setup lang="ts">
/**
 * „Kopieren nach …“ (the client's change of 05.11.2026, the operator's brief): one car's lines copied to other cars, many at once,
 * replacing theirs or added to them, with the count from the server before anything happens. A copied car says where its lines
 * came from until someone edits them.
 */

import { computed, ref, watch } from 'vue'
import Dialog from '../../../../Components/Ui/Dialog.vue'
import { carSummary, send, useEntry, type CarView } from './entryStore'

const props = defineProps<{ from: CarView }>()
const open = defineModel<boolean>('open', { required: true })

const store = useEntry()
const { state } = store
const targets = ref<number[]>([])
const mode = ref<'ersetzen' | 'hinzufuegen'>('ersetzen')
const query = ref('')
const preview = ref<{ cars: number; lines: number } | null>(null)
const failure = ref('')
const busy = ref(false)

/* Only the same wheel combination: another's tyres may not fit its wheels (the operator's brief of 07.11.2026, §3). */
const others = computed(() => state.entry.cars.filter((car) => car.id !== props.from.id && car.combinationId === props.from.combinationId))
const shown = computed(() => {
    const q = query.value.trim().toLowerCase()

    return q === '' ? others.value : others.value.filter((car) => `${car.label} ${car.k ?? ''}`.toLowerCase().includes(q))
})
const allShown = computed(() => shown.value.length > 0 && shown.value.every((car) => targets.value.includes(car.id)))

watch(open, (value) => {
    if (value) {
        targets.value = others.value.filter((car) => !car.done).map((car) => car.id)
        mode.value = 'ersetzen'
        query.value = ''
        failure.value = ''
    }
})

function toggleAll(): void {
    const ids = shown.value.map((car) => car.id)

    targets.value = allShown.value ? targets.value.filter((id) => !ids.includes(id)) : [...new Set([...targets.value, ...ids])]
}

let asked = 0

watch([targets, mode, open], async () => {
    preview.value = null

    if (!open.value || targets.value.length === 0) {
        return
    }

    const mine = ++asked
    const answer = await send<{ preview: { cars: number; lines: number } }>('POST', `${store.base}/fahrzeuge/${props.from.id}/kopieren`, { ziele: targets.value, modus: mode.value, vorschau: true }).catch(() => null)

    if (answer !== null && mine === asked) {
        preview.value = answer.preview
    }
}, { deep: true })

/* Ticked and filtered out of view: they are copied to as well, and that is said. */
const hiddenTicks = computed(() => targets.value.filter((id) => !shown.value.some((car) => car.id === id)).length)

const previewText = computed(() => {
    if (targets.value.length === 0) {
        return 'Wähl mindestens ein Fahrzeug.'
    }

    if (preview.value === null) {
        return ''
    }

    const { cars, lines } = preview.value
    const onCars = cars === 1 ? 'bei 1 Fahrzeug' : `bei ${cars} Fahrzeugen`

    if (mode.value === 'ersetzen') {
        return `Danach ${lines === 1 ? 'steht' : 'stehen'} ${onCars} insgesamt ${lines} ${lines === 1 ? 'Zeile' : 'Zeilen'}.`
    }

    return lines === 0 ? 'Nichts kommt hinzu: Alles steht dort schon.' : `Hinzu ${lines === 1 ? 'kommt' : 'kommen'} insgesamt ${lines} ${lines === 1 ? 'Zeile' : 'Zeilen'} ${onCars}.`
})

async function copy(): Promise<void> {
    busy.value = true
    failure.value = ''

    try {
        await store.save('POST', `/fahrzeuge/${props.from.id}/kopieren`, { ziele: targets.value, modus: mode.value })
        open.value = false
    } catch (error) {
        failure.value = error instanceof Error ? error.message : 'Das hat nicht geklappt.'
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <Dialog v-model:open="open" :title="`Reifen von ${from.label} kopieren`" description="Kopiert Zeilen und allgemeine Codes auf andere Fahrzeuge derselben Felgenkombination. Die Angabe „Seite im Gutachten“ bleibt dort, wie sie ist." content-class="adm-dialog" wide>
        <div class="adm-fields">
            <fieldset class="ef-fieldset">
                <legend class="form-field__label">Nach</legend>
                <template v-if="others.length">
                    <div class="ef-copy__tools">
                        <label class="visually-hidden" for="ef-copy-q">Fahrzeuge durchsuchen</label>
                        <input id="ef-copy-q" v-model="query" class="input" type="search" placeholder="Modell oder Betriebserlaubnis" autocomplete="off">
                        <button class="btn btn--ghost" type="button" @click="toggleAll">{{ query.trim() ? (allShown ? 'Alle Treffer abwählen' : 'Alle Treffer auswählen') : (allShown ? 'Alle abwählen' : 'Alle auswählen') }}</button>
                    </div>
                    <div class="ef-copy__list">
                        <label v-for="car in shown" :key="car.id" class="check">
                            <input v-model="targets" type="checkbox" :value="car.id">
                            {{ car.label }} · {{ carSummary(car) }}
                        </label>
                    </div>
                </template>
                <p v-else class="adm-note">Bei dieser Felgenkombination steht kein anderes Fahrzeug. Hak in Schritt 3 weitere an.</p>
            </fieldset>
            <fieldset class="ef-fieldset">
                <legend class="form-field__label">Was dort schon steht</legend>
                <label class="check"><input v-model="mode" type="radio" name="ef-copy-mode" value="ersetzen"> Ersetzen</label>
                <label class="check"><input v-model="mode" type="radio" name="ef-copy-mode" value="hinzufuegen"> Behalten und Fehlendes hinzufügen</label>
            </fieldset>
            <p class="ef-count" role="status">{{ previewText }}<template v-if="hiddenTicks > 0"> Davon {{ hiddenTicks === 1 ? 'ist 1 Fahrzeug' : `sind ${hiddenTicks} Fahrzeuge` }} gerade ausgeblendet.</template></p>
            <p v-if="failure" class="adm-alert" role="alert">{{ failure }}</p>
        </div>
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Abbrechen</button>
            <button class="btn btn--primary" type="button" :disabled="targets.length === 0 || busy" :aria-busy="busy ? 'true' : undefined" @click="copy">Kopieren</button>
        </template>
    </Dialog>
</template>

<style scoped>
.ef-copy__tools {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin-block: var(--sp-8);
}

.ef-copy__tools .input {
    flex: 1 1 calc(20 * var(--ch-text));
    min-width: 0;
}

.ef-copy__list {
    display: grid;
    gap: var(--sp-4);
    max-height: 40vh;
    overflow-y: auto;
    overflow-wrap: anywhere;
}
</style>
