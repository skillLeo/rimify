<script setup lang="ts">
/**
 * The cookie notice: a small sheet at the bottom edge, never a wall. No scroll lock, no focus
 * theft — the page behind it works as before. Reopened from the footer.
 *
 * The shop sets only the cookies it needs, and no statistics service is configured, so the sheet
 * asks for nothing: it says what is set, links the Datenschutzerklärung, and one button closes it.
 * No "Alle akzeptieren" and no statistics switch for a purpose that does not exist (ACCURACY D7).
 * Any wording beyond this sentence is the Kanzlei's to supply, together with the service.
 */

import { computed } from 'vue'
import Dialog from '../Ui/Dialog.vue'
import { useConsent } from '../../composables/useConsent'

const consent = useConsent()

const sheetVisible = computed(() => consent.decided.value === null)
</script>

<template>
    <section v-if="sheetVisible" class="consent" aria-labelledby="consent-title">
        <h2 id="consent-title" class="h4">Cookies bei RIMIFY</h2>
        <p class="consent__text">
            Wir verwenden Cookies, die für den Shop nötig sind – für den Warenkorb und dein gewähltes
            Fahrzeug.
            <a href="/rechtliches/datenschutz">Mehr in der Datenschutzerklärung</a>
        </p>
        <div class="consent__actions">
            <button class="btn btn--secondary" type="button" @click="consent.acknowledge()">Verstanden</button>
        </div>
    </section>

    <Dialog
        v-model:open="consent.settingsOpen.value"
        title="Cookie-Einstellungen"
        description="Wir verwenden nur Cookies, die für den Shop nötig sind."
    >
        <ul class="consent__list">
            <li class="consent__row">
                <div>
                    <p class="consent__name">Notwendig</p>
                    <p class="small muted">Warenkorb, gewähltes Fahrzeug, Sitzung, deine Cookie-Auswahl.</p>
                </div>
                <span class="small quiet consent__state">Immer aktiv</span>
            </li>
        </ul>
        <template #actions>
            <button class="btn btn--primary" type="button" @click="consent.acknowledge()">Verstanden</button>
        </template>
    </Dialog>
</template>

<style scoped>
.consent {
    position: fixed;
    left: var(--sp-16);
    right: var(--sp-16);
    bottom: calc(var(--sp-16) + env(safe-area-inset-bottom));
    z-index: var(--z-toast);
    display: grid;
    gap: var(--sp-12);
    max-height: 45dvh;
    overflow-y: auto;
    padding: var(--sp-20);
    border-radius: var(--r-tile);
    background: var(--c-surface);
    color: var(--c-ink);
    box-shadow: var(--e-3);
}

/* The bottom bar is shown by width, so the clearance above it is decided by width too. */
@media (max-width: 1023px) {
    .consent {
        bottom: calc(var(--bottomnav-h) + var(--sp-12) + env(safe-area-inset-bottom));
    }
}

.consent__text {
    max-width: 52ch;
    color: var(--c-ink-2);
}

.consent__actions {
    display: flex;
}

/* On a desktop it sits in the corner over the photograph, never over the vehicle selector. */
@media (min-width: 1024px) {
    .consent {
        left: auto;
        right: var(--sp-24);
        bottom: var(--sp-24);
        width: 440px;
        max-height: 360px;
        padding: var(--sp-24);
    }
}

.consent__list {
    display: grid;
    gap: var(--sp-16);
}

.consent__state {
    flex: none;
    white-space: nowrap;
}

.consent__row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-16);
    padding-top: var(--sp-16);
    border-top: 1px solid var(--c-line);
}

.consent__name {
    font-weight: 500;
}
</style>
