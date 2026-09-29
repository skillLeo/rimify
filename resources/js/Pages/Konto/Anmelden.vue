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

    <section class="section-dense">
        <div class="wrap konto">
            <h1 class="t-h1">Mein Konto</h1>
            <p class="t-body konto__lead">
                Ein Konto legst du nach deiner ersten Bestellung mit einem Klick an. Bestellen kannst du auch ohne.
            </p>

            <form class="konto__form" novalidate @submit.prevent="submit">
                <div>
                    <label class="field-label" for="konto-mail">E-Mail</label>
                    <input id="konto-mail" v-model="form.email" class="field" type="email" inputmode="email" autocomplete="email" aria-describedby="konto-mail-err" :aria-invalid="form.errors.email ? 'true' : undefined">
                    <span id="konto-mail-err" class="field-error">{{ form.errors.email ?? '' }}</span>
                </div>
                <div>
                    <label class="field-label" for="konto-pass">Passwort</label>
                    <input id="konto-pass" v-model="form.password" class="field" type="password" autocomplete="current-password" aria-describedby="konto-pass-err" :aria-invalid="form.errors.password ? 'true' : undefined">
                    <span id="konto-pass-err" class="field-error">{{ form.errors.password ?? '' }}</span>
                </div>
                <button class="btn btn--primary btn--lg" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Anmelden</button>
            </form>

            <p class="t-small konto__alt"><Link href="/konto/passwort-vergessen">Passwort vergessen?</Link></p>
        </div>
    </section>
</template>

<style scoped>
.konto {
    max-width: 30rem;
}

.konto__lead {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.konto__form {
    display: grid;
    gap: var(--space-4);
    margin-top: var(--space-5);
}

.konto__alt a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
}
</style>
