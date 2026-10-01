<script setup lang="ts">
/**
 * The test environment's one line: above the header, on the staging copy only, saying what the page is — slim and in
 * the flow, so it covers nothing and the design under it is the one being judged. „Ausblenden" puts it away at once and
 * remembers that in the browser (`rmf_vorschau`); the server reads it, so the next page's first frame has no ribbon
 * either (App\Support\PreviewRibbon, R-08). The live shop never shows it.
 */

import { ref } from 'vue'
import { useShared } from '../../composables/useShared'

/** App\Support\PreviewRibbon::COOKIE — thirty days, this site only. */
const PREVIEW_RIBBON_COOKIE = 'rmf_vorschau'

const shared = useShared()
const away = ref(false)

function putAway(): void {
    away.value = true

    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${PREVIEW_RIBBON_COOKIE}=aus; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax${secure}`
}
</script>

<template>
    <div v-if="shared.previewRibbon && !away" class="preview-ribbon" role="note" aria-label="Hinweis zur Vorschau">
        <p class="preview-ribbon__text"><strong>Vorschau</strong> — Testumgebung. Es werden keine echten Bestellungen ausgeführt.</p>
        <button class="preview-ribbon__away" type="button" @click="putAway">Ausblenden</button>
    </div>
</template>

<style scoped>
.preview-ribbon {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    min-height: 32px;
    padding-inline: var(--space-4);
    background: var(--field);
    border-bottom: 1px solid var(--line);
    color: var(--ink2);
    font-size: var(--text-small);
    line-height: 1.3;
}

.preview-ribbon__text {
    margin: 0;
    min-width: 0;
}

.preview-ribbon__text strong {
    color: var(--ink);
}

/* A text button, 32 px tall inside the line and 44 px wide at least: a thumb finds it without the line growing. */
.preview-ribbon__away {
    flex: none;
    min-width: 44px;
    min-height: 32px;
    padding: 0 var(--space-2);
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
}

.preview-ribbon__away:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: -2px;
}
</style>
