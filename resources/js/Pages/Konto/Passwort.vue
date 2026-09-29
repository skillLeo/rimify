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

    <section class="section-dense">
        <div class="wrap konto">
            <h1 class="t-h1">Passwort festlegen</h1>

            <template v-if="props.refusal">
                <p class="t-body konto__lead" role="alert">{{ props.refusal }}</p>
                <p class="t-small konto__alt"><Link href="/konto/passwort-vergessen">Neuen Link anfordern</Link></p>
            </template>

            <template v-else>
                <p class="t-body konto__lead">Für dein Konto <strong>{{ props.email }}</strong>. Mindestens 10 Zeichen.</p>

                <form class="konto__form" novalidate @submit.prevent="form.post(props.action)">
                    <!-- The address, for the password manager: it saves the pair under the right name. -->
                    <input class="visually-hidden" type="email" autocomplete="username" :value="props.email" tabindex="-1" aria-hidden="true" readonly>
                    <div>
                        <label class="field-label" for="konto-pass">Neues Passwort</label>
                        <input id="konto-pass" v-model="form.password" class="field" type="password" autocomplete="new-password" aria-describedby="konto-pass-err" :aria-invalid="form.errors.password ? 'true' : undefined">
                        <span id="konto-pass-err" class="field-error">{{ form.errors.password ?? '' }}</span>
                    </div>
                    <div>
                        <label class="field-label" for="konto-pass2">Passwort wiederholen</label>
                        <input id="konto-pass2" v-model="form.password_confirmation" class="field" type="password" autocomplete="new-password">
                    </div>
                    <button class="btn btn--primary btn--lg" type="submit" :disabled="form.processing">Passwort speichern</button>
                </form>
            </template>
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
