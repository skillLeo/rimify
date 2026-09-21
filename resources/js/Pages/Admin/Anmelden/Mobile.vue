<script setup lang="ts">
/** Anmelden on a phone: one column, full-width action, no backdrop. */

import { Head } from '@inertiajs/vue3'
import { ref } from 'vue'
import type { AdminAnmeldenProps } from '../../../types/pages'

defineProps<AdminAnmeldenProps>()

const busy = ref(false)
</script>

<template>
    <Head title="Anmelden" />

    <main id="inhalt" class="mlogin">
        <span class="wordmark wordmark--ink mlogin__mark">RIMIFY</span>
        <h1 class="t-h2">Anmelden</h1>
        <p class="t-body">Zugang zum Verwaltungsbereich.</p>

        <form class="stack-4 mlogin__fields" @submit.prevent>
            <div>
                <label class="field-label" for="mlg-mail">E-Mail</label>
                <input id="mlg-mail" class="field" type="email" autocomplete="username" />
            </div>
            <div>
                <label class="field-label" for="mlg-pass">Passwort</label>
                <input id="mlg-pass" class="field" type="password" autocomplete="current-password" />
            </div>
            <div v-if="stage === 'totp'">
                <label class="field-label" for="mlg-totp">Bestätigungscode</label>
                <input
                    id="mlg-totp"
                    class="field field--key"
                    inputmode="numeric"
                    maxlength="6"
                    autocomplete="one-time-code"
                />
            </div>
            <button class="btn btn--primary btn--block btn--lg" type="submit" :disabled="busy">
                {{ busy ? 'Wird geprüft …' : 'Anmelden' }}
            </button>
        </form>
    </main>
</template>

<style scoped>
.mlogin {
    min-height: 100vh;
    padding: var(--s8) var(--gutter-m);
    background: var(--surface);
}

.mlogin__mark {
    display: block;
    margin-bottom: var(--s7);
}

.mlogin__fields {
    margin-top: var(--s5);
}
</style>
