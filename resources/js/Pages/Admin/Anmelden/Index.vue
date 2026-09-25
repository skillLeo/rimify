<script setup lang="ts">
/**
 * Anmelden — the one admin screen outside the panel frame, so it carries its own landmark.
 *
 * A split screen from 900px: a plain ink panel with the wordmark and one line saying what this
 * system is for, and the form. No artwork: the people who open this every morning need the fields,
 * not a backdrop. On a phone the panel goes and the wordmark sits above the form.
 *
 * The form starts empty — no pre-filled demo credentials — and there is no SSO button because no
 * SSO is configured. A button that leads nowhere is worse than no button.
 *
 * The second factor is part of this screen's design, not an interstitial added later: the Super
 * Admin's TOTP is mandatory, so the `totp` stage renders its own heading and field here.
 *
 * One page for every width.
 */

import { Head, useForm } from '@inertiajs/vue3'
import { computed } from 'vue'
import type { AdminAnmeldenProps } from '../../../types/pages'

defineOptions({ inheritAttrs: false })

defineProps<AdminAnmeldenProps>()

const form = useForm({ email: '', password: '', remember: false })

/*
 * One sentence, under both fields rather than under the one we suspect: the server never says which
 * half was wrong, because naming the address would turn a password guess into a way of finding out
 * which addresses exist. The same line carries the lockout wait.
 */
const failure = computed(() => form.errors.email ?? form.errors.password ?? '')
const busy = computed(() => form.processing)

function submit(): void {
    form.transform((data) => ({ ...data, password: data.password }))
    form.post('/admin/anmelden', {
        // The password never survives a failed attempt: the field is refilled by hand, so a shared
        // screen does not keep it in the DOM while the error is read.
        onFinish: () => form.reset('password'),
    })
}
</script>

<template>
    <Head title="Anmelden" />

    <main id="inhalt" class="login">
        <div class="login__brand">
            <span class="wordmark wordmark--light">RIMIFY</span>
            <p class="t-h2 login__line">Freigaben verwalten. Bestellungen abwickeln.</p>
        </div>

        <div class="login__pane">
            <div class="login__form">
                <span class="wordmark login__mark">RIMIFY</span>

                <template v-if="stage === 'totp'">
                    <h1 class="t-h1">Bestätigung in zwei Schritten</h1>
                    <p class="t-body login__sub">Gib den 6-stelligen Code aus deiner Authenticator-App ein.</p>

                    <form class="login__fields" @submit.prevent>
                        <div>
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
                            {{ busy ? 'Wird geprüft …' : 'Code bestätigen' }}
                        </button>
                    </form>
                </template>

                <template v-else>
                    <h1 class="t-h1">Anmelden</h1>
                    <p class="t-body login__sub">Melde dich mit deinem RIMIFY-Konto an.</p>

                    <form class="login__fields" @submit.prevent="submit">
                        <!-- The failure sits above the fields, where it is read before the retry
                             rather than after it, and is announced the moment it arrives. -->
                        <p v-if="failure" class="login__error" role="alert">{{ failure }}</p>

                        <div>
                            <label class="field-label" for="lg-mail">E-Mail</label>
                            <input
                                id="lg-mail"
                                v-model="form.email"
                                class="field"
                                :class="{ 'field--error': failure }"
                                type="email"
                                inputmode="email"
                                autocomplete="username"
                                required
                                :aria-invalid="failure ? 'true' : undefined"
                            />
                        </div>
                        <div>
                            <label class="field-label" for="lg-pass">Passwort</label>
                            <input
                                id="lg-pass"
                                v-model="form.password"
                                class="field"
                                :class="{ 'field--error': failure }"
                                type="password"
                                autocomplete="current-password"
                                required
                                :aria-invalid="failure ? 'true' : undefined"
                            />
                        </div>

                        <label class="login__check">
                            <input v-model="form.remember" type="checkbox" />
                            <span>Angemeldet bleiben</span>
                        </label>

                        <button class="btn btn--primary btn--block btn--lg" type="submit" :disabled="busy">
                            {{ busy ? 'Wird geprüft …' : 'Anmelden' }}
                        </button>
                    </form>
                </template>
            </div>
        </div>
    </main>
</template>

<style scoped>
.login {
    display: grid;
    min-height: 100vh;
    background: var(--surface);
}

.login__brand {
    display: none;
}

.login__pane {
    display: flex;
    align-items: flex-start;
    padding: var(--space-8) var(--gutter);
}

.login__form {
    width: 100%;
    max-width: 400px;
}

.login__mark {
    display: block;
    margin-bottom: var(--space-7);
}

.login__sub {
    margin-top: var(--space-2);
    color: var(--ink2);
}

/* The one failure sentence: the shop's own bad-news colour, on its wash, never a browser bubble. */
.login__error {
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--danger);
    border-radius: var(--radius-sm);
    background: var(--danger-w);
    color: var(--ink);
    font-size: var(--text-small);
    line-height: var(--lh-small);
}

.login__fields {
    display: grid;
    gap: var(--space-4);
    margin-top: var(--space-6);
}

.login__check {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 44px;
    cursor: pointer;
}

.login__check input {
    flex: none;
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--blue);
}

@media (min-width: 900px) {
    .login {
        grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    }

    .login__brand {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: var(--space-7) var(--space-7) var(--space-8);
        background: var(--ink);
    }

    .login__line {
        max-width: 22ch;
        color: var(--on-dark);
    }

    .login__pane {
        align-items: center;
        justify-content: center;
        padding: var(--space-8) var(--space-7);
    }

    /* The panel carries the wordmark on a wide screen; the form does not repeat it. */
    .login__mark {
        display: none;
    }
}
</style>
