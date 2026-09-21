<script setup lang="ts">
/**
 * The compare tray (docs/design/sections/home-overhaul.md §2.4): the sticky bottom bar that holds
 * the wheels ticked for comparison — thumbnails, the count, *Alle entfernen* and *Vergleichen (n)*,
 * which opens `/vergleich` with the keys in the query so the comparison is a link.
 *
 * Rendered by both layouts, once. It shows whenever the list is non-empty, except on the routes
 * that are the tray (`/vergleich`) or must keep the bottom edge (`/warenkorb`, `/kasse`), and
 * never while a sticky action bar owns that edge. Everything hugs the left, so the cookie card
 * in the right corner never covers the primary button.
 *
 * The server renders no tray: the list lives in the browser and is read in `onMounted`, so the
 * first frame the client hydrates to is the frame the server sent. On the phone document one
 * button of thumbnails opens a sheet with the rows; on the desktop document the rows are the bar.
 */

import { Link } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BottomSheet from '../Mobile/BottomSheet.vue'
import ListRow from '../Mobile/ListRow.vue'
import Icon from '../Ui/Icon.vue'
import Picture from '../Ui/Picture.vue'
import WheelOutline from '../Ui/WheelOutline.vue'
import { useShared } from '../../composables/useShared'
import { COMPARE_CAP, compareKey, useCompare, type CompareEntry } from '../../stores/compare'

const props = withDefaults(
    defineProps<{
        /** A sticky action bar owns the bottom edge: the tray steps aside, its state kept. */
        hidden?: boolean
        /** Whether the phone's tab bar is under it (the phone layout passes its own flag). */
        bottomNav?: boolean
    }>(),
    { hidden: false, bottomNav: true }
)

/** Routes where the tray would be in the way, or is the page itself. */
const HIDDEN_ROUTES = new Set(['vergleich.index', 'warenkorb.index', 'kasse.index'])

const store = useCompare()
const shared = useShared()

const phone = computed(() => shared.value.isMobile)
const visible = computed(
    () => store.hydrated && store.count > 0 && !props.hidden && !HIDDEN_ROUTES.has(shared.value.routeName ?? '')
)
const href = computed(() => `/vergleich?f=${store.query}`)
const sheetOpen = ref(false)

const name = (item: CompareEntry): string => `${item.brandName} ${item.modelName}`

onMounted(() => {
    store.hydrate()
})

/* The page keeps clear of the tray while it is open (`html[data-tray]` in components.css). */
watch(visible, (on) => {
    if (typeof document === 'undefined') {
        return
    }

    if (on) {
        document.documentElement.dataset.tray = 'open'
    } else {
        delete document.documentElement.dataset.tray
    }
})

watch(
    () => store.count,
    (count) => {
        if (count === 0) {
            sheetOpen.value = false
        }
    }
)

onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.tray
    }
})

function remove(item: CompareEntry): void {
    store.remove(compareKey(item))
}
</script>

<template>
    <Transition name="tray">
        <section v-if="visible" class="tray" :class="{ 'tray--flush': !bottomNav, 'tray--phone': phone }" role="region" aria-label="Vergleich">
            <div class="container tray__row">
                <!-- The desktop document: the rows are the bar. -->
                <template v-if="!phone">
                    <ul class="tray__thumbs" aria-label="Felgen im Vergleich">
                        <li v-for="item in store.items" :key="compareKey(item)" class="tray__thumb">
                            <span class="tray__img">
                                <Picture v-if="item.image" :image="item.image" :alt="`${name(item)} in ${item.finishName}`" sizes="48px" />
                                <WheelOutline v-else />
                            </span>
                            <button class="icon-btn tray__remove" type="button" :aria-label="`${name(item)} aus dem Vergleich entfernen`" @click="remove(item)">
                                <Icon name="close" :size="16" />
                            </button>
                        </li>
                    </ul>

                    <div class="tray__count">
                        <span class="small num muted">{{ store.count }} von {{ COMPARE_CAP }}</span>
                        <span v-if="!store.canCompare" class="small muted">Wähle mindestens 2 Felgen.</span>
                    </div>

                    <div class="tray__actions">
                        <button class="btn btn--ghost btn--sm tray__clear" type="button" aria-label="Alle entfernen" @click="store.clear()">
                            <!-- A wrapper, not the icon itself: the icon's own (unlayered) style would beat the layer. -->
                            <span class="tray__clear-icon" aria-hidden="true"><Icon name="trash" :size="20" /></span>
                            <span class="tray__clear-label">Alle entfernen</span>
                        </button>
                        <Link v-if="store.canCompare" :href="href" class="btn btn--primary tray__go">Vergleichen ({{ store.count }})</Link>
                        <button v-else class="btn btn--primary tray__go" type="button" aria-disabled="true">Vergleichen ({{ store.count }})</button>
                    </div>
                </template>

                <!-- The phone document: the thumbnails open the sheet; the primary sits at the edge. -->
                <template v-else>
                    <button class="tray__thumbs-btn" type="button" :aria-label="`Deinen Vergleich anzeigen, ${store.count} von ${COMPARE_CAP}`" @click="sheetOpen = true">
                        <span v-for="item in store.items" :key="compareKey(item)" class="tray__img tray__thumb">
                            <Picture v-if="item.image" :image="item.image" alt="" sizes="36px" />
                            <WheelOutline v-else />
                        </span>
                    </button>

                    <span class="tray__count small num muted">{{ store.count }} von {{ COMPARE_CAP }}</span>

                    <Link v-if="store.canCompare" :href="href" class="btn btn--primary btn--sm tray__go">Vergleichen ({{ store.count }})</Link>
                    <button v-else class="btn btn--primary btn--sm tray__go" type="button" aria-disabled="true">Vergleichen ({{ store.count }})</button>
                </template>
            </div>
        </section>
    </Transition>

    <BottomSheet v-if="phone && store.count > 0" id="vergleich" v-model:open="sheetOpen" snap="half" :title="`Dein Vergleich (${store.count} von ${COMPARE_CAP})`">
        <div class="tray__sheet-rows">
            <ListRow v-for="item in store.items" :key="compareKey(item)" static :title="name(item)" :sub="item.finishName">
                <template #leading>
                    <span class="tray__img">
                        <Picture v-if="item.image" :image="item.image" alt="" sizes="48px" />
                        <WheelOutline v-else />
                    </span>
                </template>
                <template #trailing>
                    <button class="icon-btn" type="button" :aria-label="`${name(item)} entfernen`" @click="remove(item)">
                        <Icon name="trash" :size="20" />
                    </button>
                </template>
            </ListRow>
        </div>

        <div class="tray__sheet-foot">
            <p v-if="!store.canCompare" class="small muted">Wähle mindestens 2 Felgen.</p>
            <button class="btn btn--ghost btn--block" type="button" @click="store.clear()">Alle entfernen</button>
            <Link v-if="store.canCompare" :href="href" class="btn btn--primary btn--block">Vergleichen ({{ store.count }})</Link>
            <button v-else class="btn btn--primary btn--block" type="button" aria-disabled="true">Vergleichen ({{ store.count }})</button>
        </div>
    </BottomSheet>
</template>

<!--
    Unscoped on purpose: the page keeps clear of the tray while it is open. The layouts' own
    padding rules are scoped (and therefore unlayered), so this must be unlayered too to win.
-->
<style>
html[data-tray='open'] main#inhalt {
    padding-bottom: calc(var(--stickybar-h) + var(--sp-16));
}

@media (max-width: 1023px) {
    html[data-tray='open'] main#inhalt {
        padding-bottom: calc(var(--bottomnav-h) + var(--stickybar-h) + var(--sp-16) + env(safe-area-inset-bottom));
    }
}
</style>
