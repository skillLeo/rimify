<script setup lang="ts">
/**
 * The draft in the real shop, beside the fields (BRIEF-2 §1: "live preview in a device frame,
 * rendered with the real storefront components").
 *
 * The frame loads the signed preview link, so what it shows is exactly what the link shows a
 * colleague: the storefront's own page with the SAVED draft. Desktop is laid out at 1280 px and
 * scaled to the column, so the composition is the real one, only smaller; Handy is the phone
 * document at 390 px. It reloads whenever `version` changes — after each save.
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
    urls: { desktop: string; handy: string }
    version: number
    /** The form holds changes the frame cannot show until they are saved. */
    unsaved: boolean
}>()

type Device = 'desktop' | 'handy'

const WIDTH: Record<Device, number> = { desktop: 1280, handy: 390 }

const device = ref<Device>('handy')
const stage = ref<HTMLElement | null>(null)
const stageWidth = ref(0)
const stageHeight = ref(640)
const loaded = ref(false)
const mounted = ref(false)

const scale = computed(() => (stageWidth.value > 0 ? Math.min(1, stageWidth.value / WIDTH[device.value]) : 1))

const frameStyle = computed(() => ({
    width: `${WIDTH[device.value]}px`,
    height: `${Math.round(stageHeight.value / scale.value)}px`,
    transform: `scale(${scale.value})`,
}))

/* Every answer from the server signs the link anew. The frame takes a new address only when it
   should reload — after a save, or on a device switch — never on a refused save or an unrelated
   answer, which would reload it for nothing and add an entry to the browser's history. */
const src = ref(props.urls[device.value])

watch([device, () => props.version], () => {
    src.value = props.urls[device.value]
    loaded.value = false
})

let observer: ResizeObserver | null = null

/* Below this the desktop page, scaled into the column, is too small to read: the frame opens on
   the phone document instead, at its own size. Desktop stays one click away for the composition. */
const READABLE_DESKTOP = 640

onMounted(() => {
    if (!stage.value) {
        return
    }

    const measure = (): void => {
        stageWidth.value = stage.value?.clientWidth ?? stageWidth.value
        stageHeight.value = stage.value?.clientHeight ?? stageHeight.value

        /*
         * The frame is created once it can be seen and its device is known: below 1280 px the
         * preview is not shown at all, and a hidden frame would load the whole shop for nobody.
         */
        if (!mounted.value && stageWidth.value > 0) {
            device.value = stageWidth.value < READABLE_DESKTOP ? 'handy' : 'desktop'
            mounted.value = true
        }
    }

    measure()

    observer = new ResizeObserver(measure)
    observer.observe(stage.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
    <section class="pg-preview" aria-labelledby="pg-preview-title">
        <div class="pg-preview__head">
            <h2 id="pg-preview-title" class="pg-preview__title">Vorschau</h2>
            <div class="pg-preview__devices" role="group" aria-label="Gerät">
                <button class="adm-chip" type="button" :aria-pressed="device === 'desktop'" @click="device = 'desktop'">Desktop</button>
                <button class="adm-chip" type="button" :aria-pressed="device === 'handy'" @click="device = 'handy'">Handy</button>
            </div>
        </div>

        <p class="pg-preview__note" role="status">
            {{ unsaved ? 'Speichere, damit die Vorschau deine letzten Änderungen zeigt.' : 'Zeigt den gespeicherten Stand im echten Shop.' }}
        </p>

        <div ref="stage" class="pg-preview__stage" :data-device="device">
            <div v-if="!loaded" class="pg-preview__loading">Vorschau wird geladen …</div>
            <iframe
                v-if="mounted"
                :key="`${device}-${version}`"
                class="pg-preview__frame"
                :class="{ 'pg-preview__frame--loaded': loaded }"
                :src="src"
                :style="frameStyle"
                :title="device === 'desktop' ? 'Vorschau der Seite am Desktop' : 'Vorschau der Seite am Handy'"
                tabindex="-1"
                @load="loaded = true"
            />
        </div>
    </section>
</template>

<style scoped>
/* The same hairline and air as each block beside it, so "Vorschau" and "Einstieg" share a line. */
.pg-preview {
    display: grid;
    gap: var(--sp-8);
    padding-top: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

.pg-preview__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
}

.pg-preview__title {
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.pg-preview__devices {
    display: flex;
    gap: var(--sp-4);
}

.pg-preview__note {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-3);
}

/* The stage is the device: a hairline edge and the page inside it, nothing decorative around it. */
.pg-preview__stage {
    position: relative;
    /* The viewport less the top bar, the save bar and the frame's own header. */
    height: calc(100dvh - 2 * var(--adm-topbar-h) - var(--sp-128));
    min-height: calc(3 * var(--sp-128));
    overflow: hidden;
    background: var(--c-band);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
}

.pg-preview__stage[data-device='handy'] {
    display: flex;
    justify-content: center;
}

/* Invisible until the page has painted, so the words "wird geladen" are never hidden behind an
   empty white frame. */
.pg-preview__frame {
    position: relative;
    display: block;
    flex: none;
    border: 0;
    background: var(--c-surface);
    opacity: 0;
    transform-origin: top left;
}

.pg-preview__frame--loaded {
    opacity: 1;
}

.pg-preview__stage[data-device='handy'] .pg-preview__frame {
    transform-origin: top center;
    border-inline: 1px solid var(--c-line);
}

.pg-preview__loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: var(--fs-small);
    color: var(--c-ink-3);
}
</style>
