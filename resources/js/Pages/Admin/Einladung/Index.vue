<script setup lang="ts">
/**
 * The invitation link — outside the panel frame, like Anmelden, and drawn the same way: a plain ink
 * panel with the wordmark from 900px, and the form. On a phone the panel goes and the wordmark sits
 * above the form.
 *
 * An open link asks for two things: the name the team will see (prefilled from the invitation) and
 * a password, typed twice. Every other state is one sentence and what to do next — nothing about
 * whose invitation it was, and never an empty form that could not be sent.
 */

import { Head, Link, useForm, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'
import type { AdminEinladungProps, EinladungState } from '../../../types/admin/benutzer'

defineOptions({ inheritAttrs: false })

const props = defineProps<AdminEinladungProps>()

const page = usePage()

const ASK = 'Bitte die Person, die dich eingeladen hat, um einen neuen Link.'

/** One heading and one sentence per dead link, each ending in what to do. */
const DEAD: Record<Exclude<EinladungState, 'open'>, { title: string; text: string }> = {
    expired: {
        title: 'Dieser Link ist abgelaufen.',
        text: `Einladungen gelten nur eine Woche. ${ASK}`,
    },
    revoked: {
        title: 'Diese Einladung wurde zurückgezogen.',
        text: `Der Link funktioniert nicht mehr. Wenn du trotzdem Zugang brauchst: ${ASK}`,
    },
    used: {
        title: 'Dieser Link wurde schon benutzt.',
        text: `Zu dieser Einladung gibt es schon ein Konto – melde dich damit an. Warst du das nicht? ${ASK}`,
    },
    unknown: {
        title: 'Diesen Link kennen wir nicht.',
        text: `Vielleicht ist er unvollständig, oder er wurde durch einen neueren ersetzt. ${ASK}`,
    },
}

const dead = computed(() => (props.state === 'open' ? null : DEAD[props.state]))

const form = useForm({ name: props.invitation?.name ?? '', password: '', password_confirmation: '' })

const busy = computed(() => form.processing)

function submit(): void {
    form.post(page.url, {
        // A password never survives a failed attempt: it is typed again, not left in the DOM.
        onFinish: () => form.reset('password', 'password_confirmation'),
    })
}
</script>

<template>
    <Head :title="state === 'open' ? 'Einladung annehmen' : 'Einladung'" />

    <main id="inhalt" class="invite">
        <div class="invite__brand">
            <span class="wordmark wordmark--light">RIMIFY</span>
            <p class="t-h2 invite__line">Freigaben verwalten. Bestellungen abwickeln.</p>
        </div>

        <div class="invite__pane">
            <div class="invite__form">
                <span class="wordmark invite__mark">RIMIFY</span>

                <template v-if="dead">
                    <h1 class="t-h1">{{ dead.title }}</h1>
                    <p class="t-body invite__sub">{{ dead.text }}</p>

                    <Link v-if="state === 'used'" href="/admin/anmelden" class="btn btn--primary btn--block btn--lg invite__go">
                        Zur Anmeldung
                    </Link>
                </template>

                <template v-else-if="invitation">
                    <h1 class="t-h1">Willkommen im RIMIFY-Admin</h1>
                    <p class="t-body invite__sub">
                        <template v-if="invitation.invitedBy">{{ invitation.invitedBy }} hat dich eingeladen.</template>
                        Leg dein Passwort fest, dann bist du angemeldet.
                    </p>

                    <dl class="invite__facts">
                        <div class="invite__fact">
                            <dt>E-Mail</dt>
                            <dd>{{ invitation.email }}</dd>
                        </div>
                        <div v-if="invitation.role" class="invite__fact">
                            <dt>Rolle</dt>
                            <dd>{{ invitation.role }}</dd>
                        </div>
                        <div class="invite__fact">
                            <dt>Link gültig bis</dt>
                            <dd>{{ invitation.expiresAt }}</dd>
                        </div>
                    </dl>

                    <form class="invite__fields" novalidate @submit.prevent="submit">
                        <!-- The sign-in name a password manager stores with the new password; without it,
                             it saves "Dein Name" as the login. Shown above as a fact, not typed. -->
                        <input
                            class="visually-hidden"
                            type="email"
                            name="username"
                            autocomplete="username"
                            :value="invitation.email"
                            readonly
                            tabindex="-1"
                            aria-hidden="true"
                        >
                        <div>
                            <label class="field-label" for="inv-name">Dein Name</label>
                            <input
                                id="inv-name"
                                v-model="form.name"
                                class="field"
                                :class="{ 'field--error': form.errors.name }"
                                type="text"
                                autocomplete="name"
                                maxlength="255"
                                required
                                aria-describedby="inv-name-help inv-name-err"
                                :aria-invalid="form.errors.name ? 'true' : undefined"
                            >
                            <p id="inv-name-help" class="invite__help">So sieht dich das Team im Admin.</p>
                            <p v-if="form.errors.name" id="inv-name-err" class="invite__error" role="alert">{{ form.errors.name }}</p>
                        </div>

                        <div>
                            <label class="field-label" for="inv-pass">Passwort</label>
                            <input
                                id="inv-pass"
                                v-model="form.password"
                                class="field"
                                :class="{ 'field--error': form.errors.password }"
                                type="password"
                                autocomplete="new-password"
                                required
                                aria-describedby="inv-pass-help inv-pass-err"
                                :aria-invalid="form.errors.password ? 'true' : undefined"
                            >
                            <p id="inv-pass-help" class="invite__help">Mindestens 12 Zeichen.</p>
                            <p v-if="form.errors.password" id="inv-pass-err" class="invite__error" role="alert">{{ form.errors.password }}</p>
                        </div>

                        <div>
                            <label class="field-label" for="inv-repeat">Passwort wiederholen</label>
                            <input
                                id="inv-repeat"
                                v-model="form.password_confirmation"
                                class="field"
                                type="password"
                                autocomplete="new-password"
                                required
                            >
                        </div>

                        <button class="btn btn--primary btn--block btn--lg" type="submit" :disabled="busy" :aria-busy="busy ? 'true' : undefined">
                            {{ busy ? 'Wird eingerichtet …' : 'Konto einrichten' }}
                        </button>
                    </form>
                </template>
            </div>
        </div>
    </main>
</template>

<style scoped>
.invite {
    display: grid;
    min-height: 100dvh;
    background: var(--surface);
}

.invite__brand {
    display: none;
}

.invite__pane {
    display: flex;
    align-items: flex-start;
    padding: var(--space-8) var(--gutter);
}

.invite__form {
    width: 100%;
    max-width: 400px;
}

.invite__mark {
    display: block;
    margin-bottom: var(--space-7);
}

.invite__sub {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.invite__go {
    margin-top: var(--space-6);
}

.invite__facts {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-5) 0 0;
    padding: var(--space-4) 0;
    border-top: 1px solid var(--c-line);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--text-small);
    line-height: var(--lh-small);
}

.invite__fact {
    display: grid;
    grid-template-columns: minmax(0, 9rem) minmax(0, 1fr);
    gap: var(--space-3);
}

.invite__fact dt {
    color: var(--ink2);
}

.invite__fact dd {
    margin: 0;
    color: var(--ink);
    overflow-wrap: anywhere;
}

.invite__fields {
    display: grid;
    gap: var(--space-4);
    margin-top: var(--space-6);
}

.invite__help {
    margin-top: var(--space-1);
    color: var(--ink2);
    font-size: var(--text-small);
    line-height: var(--lh-small);
}

/* The field's own refusal: the shop's bad-news colour, under the field it is about. */
.invite__error {
    margin-top: var(--space-1);
    color: var(--danger);
    font-size: var(--text-small);
    line-height: var(--lh-small);
}

@media (min-width: 900px) {
    .invite {
        grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    }

    .invite__brand {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: var(--space-7) var(--space-7) var(--space-8);
        background: var(--ink);
    }

    .invite__line {
        max-width: 22ch;
        color: var(--on-dark);
    }

    .invite__pane {
        align-items: center;
        justify-content: center;
        padding: var(--space-8) var(--space-7);
    }

    /* The panel carries the wordmark on a wide screen; the form does not repeat it. */
    .invite__mark {
        display: none;
    }
}
</style>
