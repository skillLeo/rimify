<script setup lang="ts">
/**
 * „Passwort bestätigen“ (sudo mode, EnsureSudo): the own password once more before a screen that
 * holds the shop's keys. It holds for `minutes`, then the question comes again.
 */

import { useForm } from '@inertiajs/vue3'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

defineProps<{ minutes: number }>()

const form = useForm({ password: '' })

function confirm(): void {
    form.post('/admin/bestaetigen', { onFinish: () => form.reset('password') })
}
</script>

<template>
    <AdminPage title="Passwort bestätigen" :context="`Dieser Bereich verwaltet die Zugänge des Shops. Dein Passwort gilt danach ${minutes} Minuten lang.`">
        <form class="adm-form" novalidate @submit.prevent="confirm">
            <section class="adm-form__group" aria-labelledby="sudo-heading">
                <h2 id="sudo-heading" class="adm-form__heading">Bevor es weitergeht</h2>

                <div class="form-field">
                    <label class="form-field__label" for="sudo-password">Passwort</label>
                    <!-- eslint-disable-next-line vuejs-accessibility/no-autofocus -->
                    <input
                        id="sudo-password"
                        v-model="form.password"
                        class="input"
                        type="password"
                        autocomplete="current-password"
                        autofocus
                        :aria-invalid="form.errors.password ? 'true' : undefined"
                        aria-describedby="sudo-password-error"
                    >
                    <p id="sudo-password-error" class="form-field__error">{{ form.errors.password }}</p>
                </div>

                <div>
                    <button class="btn btn--primary" type="submit" :aria-busy="form.processing ? 'true' : undefined">Bestätigen</button>
                </div>
            </section>
        </form>
    </AdminPage>
</template>
