<script setup lang="ts">
/**
 * „Kopieren nach …" (the brief §7 step 4): the tyres of one car group copied to others on the same wheel size, replacing
 * theirs or added to them, with a count before anything happens. A copied cell says where it came from until edited.
 */

import { computed, ref, watch } from 'vue'
import Dialog from '../../../../Components/Ui/Dialog.vue'
import type { DemoGroup } from '../gutachtenDemo'
import { cellSummary, copyPreview } from '../gutachtenSketch'
import { useSketch } from '../gutachtenStore'

const props = defineProps<{ from: DemoGroup }>()
const open = defineModel<boolean>('open', { required: true })

const store = useSketch()
const targets = ref<string[]>([])
const mode = ref<'ersetzen' | 'hinzufuegen'>('ersetzen')

const others = computed(() => store.chosenGroups().filter((group) => group.id !== props.from.id))
const preview = computed(() => copyPreview(store.cellOf(props.from.id), targets.value.map((id) => store.cellOf(id)), mode.value))

watch(open, (value) => {
    if (value) {
        targets.value = others.value.filter((group) => cellSummary(store.cellOf(group.id)) === 'noch leer').map((group) => group.id)
        mode.value = 'ersetzen'
    }
})

function copy(): void {
    store.copy(props.from.id, targets.value, mode.value)
    open.value = false
}
</script>

<template>
    <Dialog v-model:open="open" :title="`Reifen von ${from.sales} kopieren`" description="Auf dieselbe Felgengröße, für andere Fahrzeuggruppen dieses Gutachtens." content-class="adm-dialog adm-dialog--narrow">
        <div class="adm-fields">
            <fieldset class="sk-fieldset">
                <legend class="form-field__label">Nach</legend>
                <label v-for="group in others" :key="group.id" class="check">
                    <input v-model="targets" type="checkbox" :value="group.id">
                    {{ group.sales }} ({{ group.type }}) · {{ cellSummary(store.cellOf(group.id)) }}
                </label>
                <p v-if="others.length === 0" class="adm-note">Es gibt keine andere Fahrzeuggruppe. Übernimm in Schritt 3 weitere Zeilen.</p>
            </fieldset>
            <fieldset class="sk-fieldset">
                <legend class="form-field__label">Was dort schon steht</legend>
                <label class="check"><input v-model="mode" type="radio" name="sk-copy-mode" value="ersetzen"> ersetzen</label>
                <label class="check"><input v-model="mode" type="radio" name="sk-copy-mode" value="hinzufuegen"> behalten und Fehlendes hinzufügen</label>
            </fieldset>
            <p class="sk-count" role="status">{{ targets.length ? preview : 'Wähl mindestens eine Fahrzeuggruppe.' }}</p>
        </div>
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Abbrechen</button>
            <button class="btn btn--primary" type="button" :disabled="targets.length === 0" @click="copy">Kopieren</button>
        </template>
    </Dialog>
</template>
