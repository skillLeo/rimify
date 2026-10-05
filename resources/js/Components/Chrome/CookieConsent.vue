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
import { COOKIES } from '../../legal/cookies'

const consent = useConsent()

/** The functional cookies by name, each with what it stores and how to clear it (Block G). */
const FUNCTIONAL = COOKIES.filter((cookie) => cookie.category === 'Funktional')

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
        description="Wir verwenden nur Cookies, die der Shop braucht oder die du selbst anlegst."
    >
        <ul class="consent__list">
            <li class="consent__row">
                <p class="consent__name">Notwendig</p>
                <span class="small quiet consent__state">Immer aktiv</span>
                <p class="small muted consent__what">Warenkorb, gewähltes Fahrzeug, Sitzung und deine Cookie-Auswahl.</p>
            </li>
            <li class="consent__row">
                <p class="consent__name">Funktional</p>
                <span class="small quiet consent__state">Einzeln erklärt</span>
                <dl class="consent__cookies">
                    <div v-for="cookie in FUNCTIONAL" :key="cookie.name" class="consent__cookie">
                        <dt class="small consent__cookie-name">{{ cookie.name }} <span class="quiet">· {{ cookie.lifetime }}</span></dt>
                        <dd class="small muted">{{ cookie.stores }}</dd>
                        <dd class="small muted"><span class="consent__clear">Löschen:</span> {{ cookie.clear }}</dd>
                    </div>
                </dl>
            </li>
        </ul>
        <p class="small muted">
            Alle Cookies mit Laufzeit stehen in der <a href="/rechtliches/datenschutz#cookies">Datenschutzerklärung</a>.
        </p>
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

/* In Archivo's characters, not `ch`: the text keeps its lines when the font arrives, and the sheet — anchored at the
   bottom — does not move its top edge (0,027 at 768 px before, tokens.css --ch-*). */
.consent__text {
    max-width: calc(52 * var(--ch-text));
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

/* Name and state on one baseline, the description beneath across the full width: every row keeps the
   same right edge, however long its description. */
.consent__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: baseline;
    gap: var(--sp-4) var(--sp-16);
    padding-top: var(--sp-16);
    border-top: 1px solid var(--c-line);
}

.consent__what {
    grid-column: 1 / -1;
}

.consent__name {
    font-weight: 500;
}

.consent__cookies {
    grid-column: 1 / -1;
    display: grid;
    gap: var(--sp-12);
    margin: 0;
}

.consent__cookie {
    display: grid;
    gap: var(--sp-4);
}

.consent__cookie dd {
    margin: 0;
}

.consent__cookie-name {
    font-weight: 500;
}

.consent__clear {
    font-weight: 500;
    color: var(--c-ink);
}
</style>
