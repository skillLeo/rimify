<script setup lang="ts">
/**
 * Mein Konto › Passwort vergessen: a new link to the address, if it has an account — the page says the same either
 * way, so it never tells anyone which addresses are customers. Once sent, the sentence stands in the form's place.
 */

import { Head, Link, useForm } from '@inertiajs/vue3'
import { ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const form = useForm({ email: '' })
const sent = ref(false)

function submit(): void {
    form.post('/konto/passwort-vergessen', { preserveScroll: true, onSuccess: () => (sent.value = true) })
}
</script>

<template>
    <Head title="Passwort vergessen" />

    <section class="section--tight">
        <div class="container">
            <div class="konto">
                <h1 class="h1">Passwort vergessen</h1>

                <p v-if="sent" class="konto__lead" role="status">
                    Wenn es zu {{ form.email }} ein Konto gibt, ist ein Link zum neuen Passwort unterwegs. Er gilt einen Tag.
                </p>

                <template v-else>
                    <p class="konto__lead">Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.</p>

                    <form class="konto__form" novalidate @submit.prevent="submit">
                        <div class="form-field">
                            <label class="form-field__label" for="konto-mail">E-Mail</label>
                            <input id="konto-mail" v-model="form.email" class="input" type="email" inputmode="email" autocomplete="email" aria-describedby="konto-mail-err" :aria-invalid="form.errors.email ? 'true' : undefined">
                            <p id="konto-mail-err" class="form-field__error">{{ form.errors.email ?? '' }}</p>
                        </div>
                        <div>
                            <button class="btn btn--primary" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Link schicken</button>
                        </div>
                    </form>
                </template>

                <p class="konto__alt"><Link class="link" href="/konto/anmelden">Zurück zur Anmeldung</Link></p>
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
