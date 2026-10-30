<script setup lang="ts">
/**
 * The share block of /felgenrechner: a read-only field holding the page's own address with the
 * current comparison in `?rechner=`, and *Link kopieren* beside it.
 *
 * Before the component is mounted the field holds the relative address (the same on the server
 * and in the first client frame, so nothing mismatches); once mounted it holds `location.href`
 * with the parameter set, and follows every change of the figures. Copying is attempted with
 * the Clipboard API; when that is refused (an older browser, a page without HTTPS) the line
 * under the block says so and points at the address bar, where the link also is.
 */

import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

const props = withDefaults(defineProps<{ param: string; block?: boolean }>(), { block: false })

const COPIED = 'Link kopiert.'
const FAILED = 'Kopieren nicht möglich – der Link steht in der Adresszeile.'

const uid = useId()
const origin = ref<string | null>(null)
const status = ref<string>('')
const busy = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let delay = 200

const href = computed(() => {
    if (origin.value === null) {
        return `/felgenrechner?rechner=${props.param}`
    }

    const url = new URL(origin.value)
    url.searchParams.set('rechner', props.param)

    return url.toString()
})

/* A link describes one comparison; once the figures move, the old confirmation is stale. */
watch(() => props.param, () => {
    status.value = ''
})

function parseMs(value: string): number | null {
    const match = /^\s*([\d.]+)\s*(ms|s)\s*$/.exec(value)

    if (match === null || match[1] === undefined) {
        return null
    }

    const n = Number(match[1])

    return Number.isFinite(n) ? (match[2] === 's' ? n * 1000 : n) : null
}

async function copy(): Promise<void> {
    if (busy.value) {
        return
    }

    busy.value = true
    status.value = ''
    let next = FAILED

    try {
        await navigator.clipboard.writeText(href.value)
        next = COPIED
    } catch {
        next = FAILED
    }

    /* The button stays busy for one `--d-2`, so a click always visibly did something. */
    timer = setTimeout(() => {
        busy.value = false
        status.value = next
    }, delay)
}

onMounted(() => {
    origin.value = window.location.href
    delay = parseMs(getComputedStyle(document.documentElement).getPropertyValue('--d-2')) ?? delay
})

onBeforeUnmount(() => {
    if (timer !== undefined) {
        clearTimeout(timer)
    }
})
</script>

<template>
    <!-- One button and what it did (the look review of 29.10.2026): the address itself is the address bar's. -->
    <div class="share">
        <button :id="`${uid}-share`" class="btn btn--secondary share__button" :class="{ 'btn--block': block }" type="button" :data-href="href" :aria-busy="busy ? 'true' : undefined" @click="copy">
            Link zu dieser Berechnung kopieren
        </button>
        <p class="small quiet share__status" role="status" aria-live="polite">{{ status }}</p>
    </div>
</template>

<style scoped>
.share {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
}

.share__button {
    justify-self: start;
}

.share__button.btn--block {
    justify-self: stretch;
}

/* The line reserves its height, so a confirmation never pushes the page. */
.share__status {
    min-height: var(--lh-small);
    margin: 0;
}
</style>
