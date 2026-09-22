<script setup lang="ts">
/**
 * "Benachrichtigen, sobald verfügbar" (F2), where the listing is empty for the chosen vehicle.
 *
 * It posts to the real endpoint, `POST /api/v1/fitment/notify` (FitmentNotifyController: a Form
 * Request, double opt-in, one row per address and vehicle), and it says only what that endpoint
 * answered: 202 is a thank-you, 422 names the field in German, anything else offers the shop's
 * e-mail address instead — a failed request is never a dead end (R-09).
 *
 * The listing used to send this customer to the Kontakt form, which sent nothing (ACCURACY D5).
 */

import { computed, ref, useId } from 'vue'
import { useShared } from '../../composables/useShared'

const props = defineProps<{
    vehicleId: number
    /** `BMW 3er` — how the sentence names the car. */
    vehicleLabel: string
}>()

const shared = useShared()
const contact = computed(() => shared.value.contact)
/* Only where outgoing mail is configured: otherwise the confirmation would never arrive (F2). */
const byMail = computed(() => shared.value.notifyByMail === true)

const id = useId()
const email = ref('')
const state = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const error = ref('')

/** Laravel's XSRF cookie, decoded, as the `X-XSRF-TOKEN` header the endpoint checks. */
function xsrfToken(): string {
    const match = /(?:^|;\s*)XSRF-TOKEN=([^;]+)/.exec(document.cookie)

    return match?.[1] === undefined ? '' : decodeURIComponent(match[1])
}

function generalError(): string {
    return `Das hat nicht geklappt. Versuch es bitte noch einmal oder schreib uns: ${contact.value.email}.`
}

async function send(): Promise<void> {
    if (state.value === 'sending' || email.value.trim() === '') {
        return
    }

    state.value = 'sending'
    error.value = ''

    try {
        const response = await fetch('/api/v1/fitment/notify', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': xsrfToken(),
            },
            credentials: 'same-origin',
            body: JSON.stringify({ email: email.value.trim(), fahrzeug: props.vehicleId }),
        })

        if (response.status === 202) {
            state.value = 'sent'

            return
        }

        if (response.status === 422) {
            const body = (await response.json()) as { errors?: Record<string, string[]> }
            error.value = body.errors?.email?.[0] ?? body.errors?.fahrzeug?.[0] ?? generalError()
            state.value = 'error'

            return
        }

        error.value = generalError()
        state.value = 'error'
    } catch {
        error.value = generalError()
        state.value = 'error'
    }
}
</script>

<template>
    <div class="vnotify">
        <p v-if="!byMail" class="t-body">
            Du suchst eine Felge für deinen {{ vehicleLabel }}? Schreib uns eine E-Mail an
            <a class="link" :href="`mailto:${contact.email}`">{{ contact.email }}</a>.
        </p>

        <p v-else-if="state === 'sent'" class="t-body vnotify__done" role="status">
            Danke. Bestätige bitte den Link in unserer E-Mail – erst dann melden wir uns.
        </p>

        <form v-else class="vnotify__form" @submit.prevent="send">
            <p class="t-body">
                Sag uns deine E-Mail-Adresse – wir melden uns, sobald ein Gutachten deinen {{ vehicleLabel }} nennt.
            </p>
            <label class="field-label vnotify__label" :for="`${id}-mail`">E-Mail-Adresse</label>
            <div class="vnotify__row">
                <input
                    :id="`${id}-mail`"
                    v-model="email"
                    class="field vnotify__input"
                    :class="{ 'field--error': state === 'error' }"
                    type="email"
                    inputmode="email"
                    autocomplete="email"
                    enterkeyhint="send"
                    required
                    :aria-invalid="state === 'error' ? 'true' : undefined"
                    :aria-describedby="`${id}-error`"
                >
                <button
                    class="btn btn--primary vnotify__send"
                    type="submit"
                    :disabled="state === 'sending'"
                    :aria-busy="state === 'sending' ? 'true' : undefined"
                >
                    Benachrichtigen, sobald verfügbar
                </button>
            </div>
            <p :id="`${id}-error`" class="field-error" aria-live="polite">{{ error }}</p>
            <p class="t-small quiet">Du bekommst zuerst eine Bestätigungsmail. Abmelden geht jederzeit mit einem Klick.</p>
        </form>
    </div>
</template>

<style scoped>
.vnotify {
    width: 100%;
    max-width: 560px;
}

.vnotify__label {
    margin-top: var(--space-3);
}

.vnotify__row {
    display: grid;
    gap: var(--space-2);
}

.vnotify__input {
    min-width: 0;
}

/* The label is long: on a 320px screen it wraps inside the button instead of leaving the page. */
.vnotify__send {
    white-space: normal;
}

.vnotify__done {
    font-weight: 700;
}

@media (min-width: 640px) {
    .vnotify__row {
        grid-template-columns: minmax(0, 1fr) auto;
    }
}
</style>
