<script setup lang="ts">
/**
 * Mein Konto › Passwort festlegen, by the mailed link: the first password after „Konto anlegen“, or a new one. A used
 * or expired link says so and points to „Passwort vergessen“.
 */

import { Head, Link, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<{ email: string | null; refusal: string | null; action: string }>()

const form = useForm({ password: '', password_confirmation: '' })
</script>

<template>
    <Head title="Passwort festlegen" />

    <section class="section--tight">
        <div class="container">
            <div class="konto">
                <h1 class="h1">Passwort festlegen</h1>

                <template v-if="props.refusal">
                    <p class="konto__lead" role="alert">{{ props.refusal }}</p>
                    <p class="konto__alt"><Link class="link" href="/konto/passwort-vergessen">Neuen Link anfordern</Link></p>
                </template>

                <template v-else>
                    <p class="konto__lead">Für dein Konto <strong>{{ props.email }}</strong>. Mindestens 10 Zeichen.</p>

                    <form class="konto__form" novalidate @submit.prevent="form.post(props.action)">
                        <!-- The address, for the password manager: it saves the pair under the right name. -->
                        <input class="visually-hidden" type="email" autocomplete="username" :value="props.email" tabindex="-1" aria-hidden="true" readonly>
                        <div class="form-field">
                            <label class="form-field__label" for="konto-pass">Neues Passwort</label>
                            <input id="konto-pass" v-model="form.password" class="input" type="password" autocomplete="new-password" aria-describedby="konto-pass-err" :aria-invalid="form.errors.password ? 'true' : undefined">
                            <p id="konto-pass-err" class="form-field__error">{{ form.errors.password ?? '' }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="konto-pass2">Passwort wiederholen</label>
                            <input id="konto-pass2" v-model="form.password_confirmation" class="input" type="password" autocomplete="new-password">
                        </div>
                        <div>
                            <button class="btn btn--primary" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Passwort speichern</button>
                        </div>
                    </form>
                </template>
            </div>
        </div>
    </section>
</template>

<style scoped>
.konto {
    max-width: 54ch;
}

.konto__lead {
    margin-top: var(--sp-8);
    color: var(--c-ink-2);
}

.konto__form {
    display: grid;
    gap: var(--sp-16);
    margin-top: var(--sp-24);
}

.konto__alt {
    margin-top: var(--sp-16);
}

.konto__alt a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
}
</style>
