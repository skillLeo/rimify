<script setup lang="ts">
/**
 * Profil — your own account: who the panel thinks you are, and your password.
 *
 * Name and address are shown, not edited here: they are how the team recognises an account in the
 * Protokoll, so they are changed by whoever manages users, and the page says so instead of offering
 * a field that would be refused. Two-factor sign-in is not mentioned until it can be set up.
 *
 * The password is the page's one form. After a save its fields are emptied — a password is never
 * left on screen — and the toast is the confirmation.
 */

import { onMounted } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSaveBar from '../../../Components/Admin/AdminSaveBar.vue'
import { useDirtyForm } from '../../../composables/admin/useDirtyForm'
import type { AdminProfilProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminProfilProps>()

const context = [props.profile.role ?? props.profile.email, props.profile.lastLogin ? `zuletzt angemeldet am ${props.profile.lastLogin}` : null]
    .filter(Boolean)
    .join(' · ')

const editor = useDirtyForm(
    { current_password: '', password: '', password_confirmation: '' },
    { method: 'put', url: '/admin/profil/passwort', resetOnSuccess: true }
)
const form = editor.form

// Arriving from *Passwort ändern* means the next thing typed is the current password.
onMounted(() => {
    if (window.location.hash === '#passwort') {
        document.getElementById('pw-current')?.focus()
    }
})
</script>

<template>
    <AdminPage title="Profil" :context="context">
        <!-- Enter in a field saves through the save bar's own rules: nothing is sent while clean. -->
        <form class="adm-form" novalidate @submit.prevent="editor.save" @keydown.enter.prevent="editor.save">
            <section class="adm-form__group" aria-labelledby="profil-konto">
                <h2 id="profil-konto" class="adm-form__heading">Konto</h2>

                <dl class="adm-facts">
                    <div class="adm-facts__row">
                        <dt>Name</dt>
                        <dd>{{ profile.name }}</dd>
                    </div>
                    <div class="adm-facts__row">
                        <dt>E-Mail</dt>
                        <dd>{{ profile.email }}</dd>
                    </div>
                    <div v-if="profile.role" class="adm-facts__row">
                        <dt>Rolle</dt>
                        <dd>{{ profile.role }}</dd>
                    </div>
                </dl>

                <p class="adm-form__note">Name, E-Mail-Adresse und Rolle ändert eine Person, die im Admin die Benutzer verwaltet.</p>
            </section>

            <section id="passwort" class="adm-form__group" aria-labelledby="profil-passwort">
                <h2 id="profil-passwort" class="adm-form__heading">Passwort</h2>

                <div class="form-field">
                    <label class="form-field__label" for="pw-current">Aktuelles Passwort</label>
                    <input
                        id="pw-current"
                        v-model="form.current_password"
                        class="input"
                        type="password"
                        autocomplete="current-password"
                        :aria-invalid="form.errors.current_password ? 'true' : undefined"
                        :aria-describedby="form.errors.current_password ? 'pw-current-error' : undefined"
                    >
                    <p id="pw-current-error" class="form-field__error">{{ form.errors.current_password }}</p>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="pw-new">Neues Passwort</label>
                    <input
                        id="pw-new"
                        v-model="form.password"
                        class="input"
                        type="password"
                        autocomplete="new-password"
                        :aria-invalid="form.errors.password ? 'true' : undefined"
                        aria-describedby="pw-new-help pw-new-error"
                    >
                    <p id="pw-new-help" class="form-field__help">Mindestens 12 Zeichen.</p>
                    <p id="pw-new-error" class="form-field__error">{{ form.errors.password }}</p>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="pw-repeat">Neues Passwort wiederholen</label>
                    <input
                        id="pw-repeat"
                        v-model="form.password_confirmation"
                        class="input"
                        type="password"
                        autocomplete="new-password"
                    >
                </div>
            </section>
        </form>

        <AdminSaveBar :editor="editor" />
    </AdminPage>
</template>
