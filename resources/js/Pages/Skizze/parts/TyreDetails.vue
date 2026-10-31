<script setup lang="ts">
/**
 * „Details" of one tyre (the brief §9): its pictures large — up to four per model, placeholders until the photographs
 * arrive — what load index and speed symbol mean, the whole EU tyre label, price and delivery, and „Auswählen".
 */

import { computed, ref, watch } from 'vue'
import SeasonMark from '../../../Components/Sketch/SeasonMark.vue'
import TyrePicture from '../../../Components/Sketch/TyrePicture.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import TyreLabel from '../../../Components/Ui/TyreLabel.vue'
import { withUnit } from '../../../format'
import { formatMoney } from '../../../lib/num'
import { setPrice, type Mode } from '../komplettradSketch'
import { deliveryText, type DemoTyre } from '../shopDemo'

const props = defineProps<{ tyre: DemoTyre | null; mode: Mode; chosen: boolean }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ choose: [] }>()

const VIEWS = ['Seitenansicht', 'Lauffläche', 'Profil', 'Schräg']
const view = ref(0)

watch(open, (value) => {
    if (value) {
        view.value = 0
    }
})

/* What a load index and a speed symbol stand for: the ETRTO tables, for the figures the sketch shows. */
const LOAD: Record<number, string> = { 92: withUnit(630, 'kg'), 94: withUnit(670, 'kg') }
const SPEED: Record<string, string> = { V: withUnit(240, 'km/h'), W: withUnit(270, 'km/h'), Y: withUnit(300, 'km/h') }

const views = computed(() => VIEWS.slice(0, Math.max(1, props.tyre?.photos ?? 1)))
</script>

<template>
    <Dialog v-model:open="open" :title="tyre ? `${tyre.brand} ${tyre.model}` : 'Reifen'" description="Bilder und Werte sind Beispiele und gehören zu keinem echten Reifen." wide>
        <div v-if="tyre" class="kr-det">
            <div class="kr-det__gallery">
                <TyrePicture :size="tyre.front.size" :px="240" :caption="`Beispielbild · ${views[view] ?? ''}`" />
                <div v-if="views.length > 1" class="kr-det__thumbs" role="group" aria-label="Ansichten">
                    <button v-for="(name, index) in views" :key="name" class="chip" type="button" :aria-pressed="index === view" @click="view = index">{{ name }}</button>
                </div>
                <p class="t-small quiet">Bis zu vier Fotos je Reifenmodell.</p>
            </div>

            <div class="kr-det__facts">
                <SeasonMark :season="tyre.season" />
                <dl class="kr-det__list">
                    <div>
                        <dt>{{ mode === 'mixed' && tyre.rear ? 'Vorne' : 'Größe' }}</dt>
                        <dd>{{ tyre.front.size }} {{ tyre.front.li }}{{ tyre.front.si }} · Lastindex {{ tyre.front.li }}: bis {{ LOAD[tyre.front.li] }} je Reifen · {{ tyre.front.si }}: bis {{ SPEED[tyre.front.si] }}</dd>
                    </div>
                    <div v-if="mode === 'mixed' && tyre.rear">
                        <dt>Hinten</dt>
                        <dd>{{ tyre.rear.size }} {{ tyre.rear.li }}{{ tyre.rear.si }} · Lastindex {{ tyre.rear.li }}: bis {{ LOAD[tyre.rear.li] }} je Reifen · {{ tyre.rear.si }}: bis {{ SPEED[tyre.rear.si] }}</dd>
                    </div>
                    <div>
                        <dt>Preis</dt>
                        <dd>{{ formatMoney(setPrice(tyre, mode)) }} für 4 Reifen<template v-if="mode !== 'mixed' || !tyre.rear"> · {{ formatMoney(tyre.front.priceCents) }} je Reifen</template></dd>
                    </div>
                    <div>
                        <dt>Lieferung</dt>
                        <dd>{{ deliveryText(tyre.delivery) }}</dd>
                    </div>
                </dl>

                <TyreLabel
                    :fuel="tyre.label.fuel"
                    :wet="tyre.label.wet"
                    :noise-db="tyre.label.noiseDb"
                    :noise-class="tyre.label.noiseClass"
                    :title="`${tyre.brand} ${tyre.model} · ${tyre.front.size} ${tyre.front.li}${tyre.front.si} · Beispielwerte`"
                    :snow-grip="tyre.label.snow"
                    :ice-grip="tyre.label.ice"
                />
            </div>
        </div>
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Schließen</button>
            <button class="btn btn--primary" type="button" @click="emit('choose'); open = false">{{ chosen ? 'Ausgewählt' : 'Diesen Reifen auswählen' }}</button>
        </template>
    </Dialog>
</template>

<style scoped>
/* One column at every width: the label is as wide as it is, and a picture beside it left the dialog too narrow for both. */
.kr-det {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-24);
}

.kr-det__gallery {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
}

.kr-det__thumbs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.kr-det__facts {
    display: grid;
    gap: var(--sp-16);
    min-width: 0;
}

.kr-det__list {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
}

.kr-det__list div {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: var(--sp-8);
}

.kr-det__list dt {
    color: var(--c-ink-2);
}

.kr-det__list dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
}
</style>
