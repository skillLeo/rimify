<script setup lang="ts">
/**
 * Mein Konto › Anmelden (Block G §2). An account exists only for customers who opened one after an order; everyone
 * else orders as a guest, as before, and this page says so rather than invite a registration that does not exist.
 */

import { Head, Link, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const form = useForm({ email: '', password: '' })

function submit(): void {
    form.post('/konto/anmelden', { onFinish: () => form.reset('password') })
}
</script>

<template>
    <Head title="Anmelden" />

    <section class="section--tight">
        <div class="container">
            <div class="konto">
                <h1 class="h1">Mein Konto</h1>
                <p class="konto__lead">Ein Konto legst du nach deiner ersten Bestellung an. Bestellen kannst du auch ohne.</p>

                <form class="konto__form" novalidate @submit.prevent="submit">
                    <div class="form-field">
                        <label class="form-field__label" for="konto-mail">E-Mail</label>
                        <input id="konto-mail" v-model="form.email" class="input" type="email" inputmode="email" autocomplete="email" aria-describedby="konto-mail-err" :aria-invalid="form.errors.email ? 'true' : undefined">
                        <p id="konto-mail-err" class="form-field__error">{{ form.errors.email ?? '' }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="konto-pass">Passwort</label>
                        <input id="konto-pass" v-model="form.password" class="input" type="password" autocomplete="current-password" aria-describedby="konto-pass-err" :aria-invalid="form.errors.password ? 'true' : undefined">
                        <p id="konto-pass-err" class="form-field__error">{{ form.errors.password ?? '' }}</p>
                    </div>
                    <div>
                        <button class="btn btn--primary" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Anmelden</button>
                    </div>
                </form>

                <p class="konto__alt"><Link class="link" href="/konto/passwort-vergessen">Passwort vergessen?</Link></p>
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
