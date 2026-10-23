<script setup lang="ts">
/**
 * „Passwort bestätigen“ (sudo mode, EnsureSudo): the own password once more before a screen that
 * holds the shop's keys, the company data or the reset, and before a refund — `reason` says which.
 * It holds for `minutes`, then the question comes again.
 */

import { useForm } from '@inertiajs/vue3'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<{ minutes: number; weiter?: string | null; /** Why the password is asked, for where the person is going (F-12). */ reason: string }>()

// The way back travels with the answer (EnsureSudo), not only in the session a parallel request may overwrite.
const form = useForm({ password: '', weiter: props.weiter ?? null })

function confirm(): void {
    // Each try answers for itself: a refused seventh („Zu viele Versuche“) must not stand under the sixth's error.
    form.clearErrors()
    form.post('/admin/bestaetigen', { onFinish: () => form.reset('password') })
}
</script>

<template>
    <AdminPage title="Passwort bestätigen" :context="`${reason} Die Bestätigung gilt danach ${minutes} Minuten.`">
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
