<script setup lang="ts">
/**
 * Bestätigung in zwei Schritten — setting it up, and the recovery codes shown once (D-514).
 *
 * Outside the panel frame, like Anmelden: a Super-Admin without a second factor reaches nothing but
 * this page and the way out (EnsureTwoFactorSetUp), so it cannot lean on the rail or the bell.
 *
 * Setup is two steps on one screen: scan (or type) the key, then type the code the app shows — only
 * that code stores the key, so a setup left halfway never locks anyone out. The QR code is drawn on
 * the server as SVG from the key this session holds.
 *
 * One page for every width.
 */

import { Head, Link, useForm } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import type { AdminZweiFaktorProps } from '../../../types/pages'

defineOptions({ inheritAttrs: false })

const props = defineProps<AdminZweiFaktorProps>()

const form = useForm({ code: '' })
const signOut = useForm({})

const heading = computed(() => {
    if (props.stage === 'codes') {
        return 'Deine Wiederherstellungscodes'
    }

    return props.replacing ? 'Auf ein neues Telefon übertragen' : 'Bestätigung in zwei Schritten einrichten'
})

const intro = computed(() => {
    if (props.stage === 'codes') {
        return 'Hast du dein Telefon nicht zur Hand, meldest du dich mit einem dieser Codes an. Jeder gilt einmal. '
            + 'Bewahr sie getrennt von deinem Telefon auf – du siehst sie nur jetzt.'
    }

    if (props.replacing) {
        return 'Dein bisheriges Telefon gilt, bis du hier den ersten Code des neuen eingibst.'
    }

    const after = 'Nach dem Passwort fragt die Anmeldung dann nach einem Code aus einer App auf deinem Telefon.'

    if (props.unreadable) {
        return `Richte sie bitte neu ein: Der gespeicherte Schlüssel lässt sich nicht mehr lesen. ${after}`
    }

    return props.required ? `Für Super-Admins ist sie Pflicht. ${after}` : after
})

function confirm(): void {
    form.clearErrors()
    form.post('/admin/zwei-faktor/einrichten', { onFinish: () => form.reset('code') })
}

const copied = ref(false)

async function copy(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text)
        copied.value = true
        window.setTimeout(() => (copied.value = false), 2500)
    } catch {
        copied.value = false
    }
}
</script>

<template>
    <Head :title="heading" />

    <main id="inhalt" class="tfa">
        <div class="tfa__column">
            <span class="wordmark tfa__mark">RIMIFY</span>

            <h1 class="t-h1">{{ heading }}</h1>
            <p class="t-body tfa__intro">{{ intro }}</p>

            <template v-if="stage === 'setup'">
                <ol class="tfa__steps">
                    <li class="tfa__step">
                        <h2 class="t-h3">Code scannen</h2>
                        <p class="tfa__hint">
                            Öffne eine Authenticator-App – etwa Google Authenticator, Microsoft Authenticator oder 1Password – und scanne diesen Code.
                        </p>
                        <!-- Drawn on the server from the key this session holds (Totp::qrSvg); no input of anyone's. -->
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <div class="tfa__qr" role="img" :aria-label="`QR-Code für das RIMIFY-Konto ${email}`" v-html="qr" />
                        <p class="tfa__hint">Kein Scanner? Gib diesen Schlüssel von Hand ein:</p>
                        <div class="tfa__key">
                            <code class="tfa__key-text" data-tfa-key>{{ manualKey }}</code>
                            <button class="btn btn--secondary btn--sm" type="button" @click="copy(manualKey.replace(/\s/g, ''))">
                                {{ copied ? 'Kopiert' : 'Kopieren' }}
                            </button>
                        </div>
                    </li>

                    <li class="tfa__step">
                        <h2 class="t-h3">Code eingeben</h2>
                        <form class="tfa__form" novalidate @submit.prevent="confirm">
                            <div>
                                <label class="field-label" for="tfa-code">Code aus der App</label>
                                <input
                                    id="tfa-code"
                                    v-model="form.code"
                                    class="field field--key"
                                    :class="{ 'field--error': form.errors.code }"
                                    inputmode="numeric"
                                    maxlength="6"
                                    autocomplete="one-time-code"
                                    required
                                    :aria-invalid="form.errors.code ? 'true' : undefined"
                                    aria-describedby="tfa-code-error"
                                />
                                <p id="tfa-code-error" class="tfa__error" role="alert">{{ form.errors.code }}</p>
                            </div>
                            <button class="btn btn--primary btn--block btn--lg" type="submit" :disabled="form.processing">
                                {{ form.processing ? 'Wird geprüft …' : replacing ? 'Übertragen' : 'Einrichten' }}
                            </button>
                        </form>
                    </li>
                </ol>

                <div class="tfa__ways">
                    <form v-if="required && !replacing" @submit.prevent="signOut.post('/admin/abmelden')">
                        <button class="tfa__link" type="submit">Abmelden</button>
                    </form>
                    <Link v-else class="tfa__link" href="/admin/profil#zwei-faktor">Abbrechen</Link>
                </div>
            </template>

            <template v-else>
                <ul class="tfa__codes" data-tfa-codes>
                    <li v-for="item in codes" :key="item"><code>{{ item }}</code></li>
                </ul>
                <div class="tfa__actions">
                    <button class="btn btn--secondary" type="button" @click="copy(codes.join('\n'))">
                        {{ copied ? 'Kopiert' : 'Codes kopieren' }}
                    </button>
                    <Link class="btn btn--primary" :href="next">Ich habe sie aufbewahrt</Link>
                </div>
            </template>
        </div>

        <span id="seitenende" hidden />
    </main>
</template>

<style scoped>
.tfa {
    min-height: 100vh;
    padding: var(--space-8) var(--gutter);
    background: var(--surface);
}

.tfa__column {
    max-width: 520px;
    margin: 0 auto;
}

.tfa__mark {
    display: block;
    margin-bottom: var(--space-7);
}

.tfa__intro {
    margin-top: var(--space-2);
    color: var(--ink2);
}

.tfa__steps {
    display: grid;
    gap: var(--space-7);
    margin: var(--space-7) 0 0;
    padding: 0;
    list-style: none;
    counter-reset: tfa;
}

.tfa__step {
    display: grid;
    gap: var(--space-3);
    counter-increment: tfa;
}

/* The two steps are a real order: scan before typing. */
.tfa__step > h2::before {
    content: counter(tfa) '. ';
    color: var(--ink2);
}

.tfa__hint {
    color: var(--ink2);
    font-size: var(--text-small);
    line-height: var(--lh-small);
}

.tfa__qr {
    width: 200px;
    max-width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    background: var(--surface); /* a QR code is read dark on light */
}

.tfa__qr :deep(svg) {
    display: block;
    width: 100%;
    height: auto;
}

.tfa__key {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
}

.tfa__key-text {
    font-family: var(--mono);
    font-size: var(--text-small);
    letter-spacing: 0.06em;
    overflow-wrap: anywhere;
}

.tfa__form {
    display: grid;
    gap: var(--space-4);
}

.tfa__error {
    min-height: 0;
    margin-top: var(--space-2);
    color: var(--danger);
    font-size: var(--text-small);
}

.tfa__error:empty {
    display: none;
}

.tfa__ways {
    margin-top: var(--space-6);
}

.tfa__link {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--blue);
    font: inherit;
    font-size: var(--text-small);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
}

.tfa__codes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-3) var(--space-5);
    margin: var(--space-6) 0 0;
    padding: var(--space-5);
    border: 1px solid var(--line);
    border-radius: var(--radius-sm);
    list-style: none;
}

.tfa__codes code {
    font-family: var(--mono);
    font-size: var(--text-body);
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
}

.tfa__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-6);
}
</style>
