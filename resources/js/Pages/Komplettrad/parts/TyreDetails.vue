<script setup lang="ts">
/**
 * „Details“ of one tyre (the Gutachten rework §9): its photographs large, or the neutral outline; what load index and speed symbol stand
 * for; the whole EU tyre label; price and availability; and „Auswählen“. One column at every width, and nothing runs past the dialog:
 * at 390 px the facts wrap, the label stays as wide as the dialog lets it.
 */

import { computed, reactive, ref, watch } from 'vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import Picture from '../../../Components/Ui/Picture.vue'
import SeasonMark from '../../../Components/Ui/SeasonMark.vue'
import TyreLabel from '../../../Components/Ui/TyreLabel.vue'
import TyreSilhouette from '../../../Components/Ui/TyreSilhouette.vue'
import type { TyreCardView } from '../komplettradFlow'

const props = defineProps<{ card: TyreCardView | null; chosen: boolean }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ choose: [] }>()

const view = ref(0)

watch(open, (value) => {
    if (value) {
        view.value = 0
    }
})

const title = computed(() => (props.card ? [props.card.brands.join(' · '), props.card.name].filter(Boolean).join(' ') : 'Reifen'))
/* A photograph that does not load leaves the row: the next one, or the neutral outline, never a broken image. */
const failed = reactive(new Set<string>())
const shots = computed(() => (props.card?.photos ?? []).filter((item) => !failed.has(item.name)))
const photo = computed(() => shots.value[view.value] ?? shots.value[0] ?? null)
const labels = computed(() => (props.card?.sides ?? []).filter((side) => side.eu !== null))
</script>

<template>
    <Dialog v-model:open="open" :title="title" content-class="tc-details" wide>
        <div v-if="card" class="td">
            <div class="td__gallery">
                <div class="td__picture" @error.capture="photo && failed.add(photo.name)">
                    <Picture v-if="photo" :key="photo.name" :image="photo" :alt="String(photo.alt ?? '')" sizes="(min-width: 768px) 560px, 90vw" />
                    <TyreSilhouette v-else />
                </div>
                <div v-if="shots.length > 1" class="td__thumbs" role="group" aria-label="Ansichten">
                    <button
                        v-for="(item, index) in shots"
                        :key="item.name"
                        class="td__thumb"
                        :class="{ 'td__thumb--on': index === view }"
                        type="button"
                        :aria-pressed="index === view"
                        :aria-label="String(item.alt ?? `Ansicht ${index + 1}`)"
                        @click="view = index"
                    >
                        <Picture :image="item" alt="" sizes="64px" />
                    </button>
                </div>
            </div>

            <div class="td__facts">
                <SeasonMark :season="card.season" />
                <dl class="td__list">
                    <div v-for="side in card.sides" :key="`${side.axle}-${side.size}`">
                        <dt>{{ side.axle === 'vorne' ? 'Vorne' : side.axle === 'hinten' ? 'Hinten' : side.axle === 'vorne und hinten' ? 'Vorne und hinten' : 'Größe' }}</dt>
                        <dd>
                            <span v-if="side.line" class="td__line" translate="no">{{ side.line }}</span>
                            <span class="td__size" translate="no">{{ side.size }}</span>
                            <span v-if="side.facts" class="td__meaning">{{ side.facts }}</span>
                        </dd>
                    </div>
                    <div>
                        <dt>Preis</dt>
                        <dd><span class="td__size" translate="no">{{ card.set }}</span><span class="td__meaning">{{ card.unit }} · {{ card.each }}</span></dd>
                    </div>
                    <div>
                        <dt>Verfügbarkeit</dt>
                        <dd>{{ card.isDemo ? 'Beispielsortiment' : 'Verfügbar' }}</dd>
                    </div>
                </dl>

                <TyreLabel v-for="side in labels" :key="side.eu!.eprelId" v-bind="side.eu!" class="td__label" />
            </div>
        </div>
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Schließen</button>
            <button v-if="!chosen" class="btn btn--primary" type="button" @click="emit('choose'); open = false">Auswählen</button>
        </template>
    </Dialog>
</template>

<style scoped>
.td {
    display: grid;
    gap: var(--sp-16);
    min-width: 0;
}

.td__gallery {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
}

.td__picture {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
    width: 100%;
    max-width: 100%;
    max-height: 40dvh;
    overflow: hidden;
    border-radius: var(--r-tile);
    background: var(--c-band);
}

.td__picture :deep(.tyre-silhouette) {
    width: 45%;
}

/* The picture fills the well, and the photograph shows whole in it: a square one sized to its content ran 25 % past a 4:3 well. */
.td__picture :deep(.picture) {
    position: absolute;
    inset: 0;
}

.td__picture :deep(.picture img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.td__thumbs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.td__thumb {
    width: 64px;
    height: 64px;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-band);
    cursor: pointer;
}

.td__thumb--on {
    border: 2px solid var(--c-blue);
}

.td__facts {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
}

.td__list {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
}

.td__list > div {
    display: grid;
    grid-template-columns: minmax(0, calc(12 * var(--ch-text))) minmax(0, 1fr);
    align-items: baseline;
    gap: var(--sp-8);
}

.td__list dt {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.td__list dd {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
    margin: 0;
    overflow-wrap: anywhere;
    font-variant-numeric: tabular-nums;
}

.td__size {
    font-weight: 600;
}

.td__meaning {
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.td__label {
    width: 100%;
    min-width: 0;
}
</style>

<style>
/*
 * The buttons stay in sight, however long a real tyre's label makes the dialog (over 1.000 px against 860 at 1440 × 900). Not scoped: the
 * dialog is portalled. A sticky box stops at the scroll box's padding, so it reaches past it to the edge.
 */
/* However long the name: the close button stays on the dialog, at 320 px too. */
.tc-details .dialog__head > :first-child {
    min-width: 0;
    overflow-wrap: anywhere;
}

.tc-details .dialog__actions {
    position: sticky;
    bottom: calc(-1 * var(--sp-32));
    margin: var(--sp-24) calc(-1 * var(--sp-32)) calc(-1 * var(--sp-32));
    padding: var(--sp-12) var(--sp-32) var(--sp-16);
    border-top: 1px solid var(--c-line);
    background: var(--c-surface);
}
</style>
