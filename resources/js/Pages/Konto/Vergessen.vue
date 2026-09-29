<script setup lang="ts">
/**
 * Mein Konto › Passwort vergessen: a new link to the address, if it has an account — the page says the same either
 * way, so it never tells anyone which addresses are customers.
 */

import { Head, Link, useForm } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const form = useForm({ email: '' })
</script>

<template>
    <Head title="Passwort vergessen" />

    <section class="section-dense">
        <div class="wrap konto">
            <h1 class="t-h1">Passwort vergessen</h1>
            <p class="t-body konto__lead">Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.</p>

            <form class="konto__form" novalidate @submit.prevent="form.post('/konto/passwort-vergessen')">
                <div>
                    <label class="field-label" for="konto-mail">E-Mail</label>
                    <input id="konto-mail" v-model="form.email" class="field" type="email" inputmode="email" autocomplete="email" aria-describedby="konto-mail-err" :aria-invalid="form.errors.email ? 'true' : undefined">
                    <span id="konto-mail-err" class="field-error">{{ form.errors.email ?? '' }}</span>
                </div>
                <button class="btn btn--primary btn--lg" type="submit" :disabled="form.processing">Link schicken</button>
            </form>

            <p class="t-small konto__alt"><Link href="/konto/anmelden">Zurück zur Anmeldung</Link></p>
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
