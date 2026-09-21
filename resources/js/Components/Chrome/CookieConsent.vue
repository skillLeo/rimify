<script setup lang="ts">
/**
 * The cookie choice: a small sheet at the bottom edge, never a wall. Two choices of equal weight,
 * a link to the settings, no scroll lock, no focus theft — the page behind it works as before.
 * Nothing non-essential loads before a choice is made. Reopened from the footer.
 */

import { computed, ref } from 'vue'
import Dialog from '../Ui/Dialog.vue'
import { useConsent } from '../../composables/useConsent'

const consent = useConsent()
const statistics = ref(false)

const sheetVisible = computed(() => consent.decided.value === null)
</script>

<template>
    <section v-if="sheetVisible" class="consent" aria-labelledby="consent-title">
        <h2 id="consent-title" class="h4">Cookies bei RIMIFY</h2>
        <p class="consent__text">
            Wir verwenden Cookies, die für den Shop nötig sind – für den Warenkorb und dein gewähltes
            Fahrzeug. Statistik-Cookies setzen wir nur, wenn du zustimmst.
            <a href="/rechtliches/datenschutz">Mehr in der Datenschutzerklärung</a>
        </p>
        <div class="consent__actions">
            <button class="btn btn--secondary" type="button" @click="consent.decide(true)">Alle akzeptieren</button>
            <button class="btn btn--secondary" type="button" @click="consent.decide(false)">Nur notwendige</button>
            <button class="link consent__settings" type="button" @click="consent.openSettings()">Einstellungen</button>
        </div>
    </section>

    <Dialog
        v-model:open="consent.settingsOpen.value"
        title="Cookie-Einstellungen"
        description="Notwendige Cookies halten den Shop am Laufen. Alles andere entscheidest du."
    >
        <ul class="consent__list">
            <li class="consent__row">
                <div>
                    <p class="consent__name">Notwendig</p>
                    <p class="small muted">Warenkorb, gewähltes Fahrzeug, Sitzung, deine Cookie-Auswahl.</p>
                </div>
                <span class="small quiet consent__state">Immer aktiv</span>
            </li>
            <li class="consent__row">
                <label for="consent-statistics">
                    <p class="consent__name">Statistik</p>
                    <p class="small muted">Anonyme Nutzungsstatistik, um den Shop zu verbessern. Derzeit wird kein Statistik-Dienst eingesetzt.</p>
                </label>
                <label class="check consent__switch">
                    <input id="consent-statistics" v-model="statistics" type="checkbox" />
                    <span class="visually-hidden">Statistik erlauben</span>
                </label>
            </li>
        </ul>
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="consent.decide(false)">Nur notwendige</button>
            <button class="btn btn--primary" type="button" @click="consent.decide(statistics)">Auswahl speichern</button>
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
    display: grid;
    gap: var(--sp-8);
}

.consent__settings {
    justify-self: start;
    min-height: 44px;
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

    /* Two equal buttons in one row, the settings link under them: the labels never truncate,
       and the card stays well clear of the selector panel to its left. */
    .consent__actions {
        grid-template-columns: 1fr 1fr;
        align-items: center;
    }

    .consent__settings {
        grid-column: 1 / -1;
        min-height: 32px;
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

.consent__switch {
    flex: none;
    min-height: 24px;
}
</style>
