<script setup lang="ts">
/**
 * Anmelden. A split screen: the form on the left, an engineering drawing on the right.
 *
 * The backdrop is a wheel in orthographic projection with bolt-circle construction lines and the
 * ET dimension — an engineering drawing, not decoration. It is the one piece of artwork on the
 * site whose subject is the measurement rather than the product, which is exactly right for the
 * door the compliance team walks through every morning.
 */

import { Head } from '@inertiajs/vue3'
import { ref } from 'vue'
import Svg from '../../../Components/Art/Svg.vue'
import { adminBackdropSVG } from '../../../art'
import type { AdminAnmeldenProps } from '../../../types/pages'

defineProps<AdminAnmeldenProps>()

const backdrop = adminBackdropSVG(1000)
const busy = ref(false)
</script>

<template>
    <Head title="Anmelden" />

    <!-- The one admin screen outside the panel frame, so it carries its own landmark. -->
    <main id="inhalt" class="login">
        <div class="login__form">
            <span class="wordmark wordmark--ink login__mark">RIMIFY</span>
            <h1 class="t-h2">Anmelden</h1>
            <p class="t-body">Zugang zum Verwaltungsbereich.</p>

            <form class="stack-4 login__fields" @submit.prevent>
                <div>
                    <label class="field-label" for="lg-mail">E-Mail</label>
                    <input id="lg-mail" class="field" type="email" autocomplete="username" />
                </div>
                <div>
                    <label class="field-label" for="lg-pass">Passwort</label>
                    <input id="lg-pass" class="field" type="password" autocomplete="current-password" />
                </div>

                <!-- Present in the markup rather than bolted on later: the Super Admin's second
                     factor is mandatory, so the field is part of this screen's design, not an
                     interstitial somebody adds afterwards. -->
                <div v-if="stage === 'totp'">
                    <label class="field-label" for="lg-totp">Bestätigungscode</label>
                    <input
                        id="lg-totp"
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
        </div>

        <div class="login__art" aria-hidden="true">
            <Svg :markup="backdrop" />
        </div>
    </main>
</template>

<style scoped>
.login {
    display: grid;
    grid-template-columns: 480px minmax(0, 1fr);
    min-height: 100vh;
    background: var(--ground);
}

.login__form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--s8) var(--s7);
    background: var(--surface);
}

.login__mark {
    margin-bottom: var(--s7);
}

.login__fields {
    margin-top: var(--s5);
}

.login__art {
    position: relative;
    background: var(--black);
    overflow: hidden;
}

.login__art :deep(svg) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

@media (max-width: 1000px) {
    .login {
        grid-template-columns: 1fr;
    }

    .login__art {
        display: none;
    }
}
</style>
