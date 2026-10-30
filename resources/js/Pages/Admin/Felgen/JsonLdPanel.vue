<script setup lang="ts">
/**
 * „JSON-LD anzeigen“ (his admin item 14; the operator's brief of 29.10.2026, §3): the structured data this rim's page
 * gives search engines, read-only, with a button that copies it. The preview is closed to crawlers, so Google's Rich
 * Results Test cannot fetch the page itself — pasted into its „Code“ tab, the same text can be tested. A demo rim's
 * page carries none; the panel shows what a real rim's would, and says so. Nothing here is saved.
 */

import { ref } from 'vue'
import type { JsonLdProp } from '../../../types/admin/felgen'

const props = defineProps<{ jsonLd: JsonLdProp }>()

const open = ref(false)
const copied = ref<'' | 'ok' | 'failed'>('')

async function copy(): Promise<void> {
    if (props.jsonLd.code === null) {
        return
    }

    try {
        await navigator.clipboard.writeText(props.jsonLd.code)
        copied.value = 'ok'
    } catch {
        copied.value = 'failed'
    }
}

const TEST_URL = 'https://search.google.com/test/rich-results'
</script>

<template>
    <section class="adm-section jl" aria-labelledby="fe-h-jsonld">
        <div class="adm-section__head">
            <h2 id="fe-h-jsonld" class="adm-section__title">Strukturierte Daten (JSON-LD)</h2>
        </div>
        <p class="adm-note jl__lead">
            Was Suchmaschinen von dieser Felge lesen: Name, Marke, Größen, Preise und Verfügbarkeit. Die Vorschau ist für
            Suchmaschinen gesperrt, deshalb prüfst du den Code hier.
        </p>

        <p v-if="jsonLd.code === null" class="adm-note">Sobald die Felge eine Größe hat, steht hier ihr JSON-LD.</p>

        <template v-else>
            <p v-if="jsonLd.demo" class="adm-note jl__state">
                Beispielfelge (Demodaten): Ihre Seite im Shop gibt Suchmaschinen keine strukturierten Daten. So sähen sie
                für eine echte Felge aus.
            </p>
            <p v-else-if="!jsonLd.published" class="adm-note jl__state">
                Die Felge ist noch nicht veröffentlicht. Sobald sie es ist, steht dieser Code im Kopf ihrer Seite.
            </p>

            <div class="jl__actions">
                <button class="btn btn--secondary" type="button" :aria-expanded="open ? 'true' : 'false'" aria-controls="fe-jsonld-code" @click="open = !open">
                    {{ open ? 'JSON-LD ausblenden' : 'JSON-LD anzeigen' }}
                </button>
                <button class="btn btn--secondary" type="button" @click="copy">Code kopieren</button>
                <span class="adm-note jl__copied" role="status">{{
                    copied === 'ok' ? 'Kopiert.' : copied === 'failed' ? 'Kopieren ging nicht – blende den Code ein, markier ihn und kopier ihn selbst.' : ''
                }}</span>
            </div>

            <pre v-show="open" id="fe-jsonld-code" class="jl__code" translate="no"><code>{{ jsonLd.code }}</code></pre>

            <ol class="jl__steps">
                <li>Öffne den <a :href="TEST_URL" target="_blank" rel="noopener noreferrer">Test für Rich-Suchergebnisse</a> von Google.</li>
                <li>Wähl dort „Code“, füg den kopierten Text ein und drück „Code testen“.</li>
            </ol>
        </template>
    </section>
</template>

<style scoped>
.jl {
    display: grid;
    gap: var(--sp-12);
}

.jl__lead,
.jl__state {
    max-width: calc(75 * var(--ch-text));
    margin: 0;
}

.jl__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
}

.jl__code {
    max-height: 480px;
    margin: 0;
    padding: var(--sp-16);
    overflow: auto;
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-band);
    font-size: var(--fs-micro);
    line-height: var(--lh-small);
    white-space: pre;
}

.jl__steps {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding-left: var(--sp-20);
}
</style>
