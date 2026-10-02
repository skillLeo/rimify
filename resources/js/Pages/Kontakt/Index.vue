<script setup lang="ts">
/**
 * Kontakt: the contact form (the client's #12, D-123).
 *
 * Name, e-mail, subject and message go to `POST /kontakt` (ContactRequest, ContactMessagePolicy): the message is kept
 * for the team (Verkauf › Nachrichten), mailed to the shop with the sender as reply-to, and confirmed to the sender.
 * Every e-mail button in the shop leads here (#26), with a subject where the page knows one and the path it came from.
 *
 * The chosen car is offered as a ticked box — the first thing we would ask is which car the question is about — and
 * the server names it from the visitor's own cookie, never from the form. `rmf_leer` is the honeypot: a field nobody
 * sees, so a filled one is a script. A draft survives a failed send (a limit, an expired page) in this tab's own
 * storage, so the visitor never finds the form cleared (R-09).
 *
 * Every contact detail renders from `config('rimify.contact')` (D-023). No reply-time promise: the client gave service
 * hours, not a response time.
 */

import { Head, Link, useForm } from '@inertiajs/vue3'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import { useShared } from '../../composables/useShared'
import type { KontaktProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<KontaktProps>()

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle ?? null)

/* The car as the page names it: its key numbers, or, for a car known only from a Gutachten, its Feld K. */
const vehicleLine = computed(() => (vehicle.value === null ? null : `${vehicle.value.label} (${vehicle.value.approval ?? vehicle.value.keyNumbers})`))

/* A copy to the sender only where outgoing mail is configured (F2): elsewhere it would never arrive. */
const copyByMail = computed(() => shared.value.notifyByMail === true)

const form = useForm({
    name: '',
    email: '',
    subject: props.prefill?.subject ?? '',
    message: '',
    withVehicle: true,
    from: props.prefill?.from ?? null,
    rmf_leer: '',
})

const sent = ref(false)
const done = useTemplateRef<HTMLElement>('done')

/* ── The draft: this tab only, never the server's, gone once the message is sent ─────── */

const DRAFT_KEY = 'rmf-kontakt-entwurf'

function readDraft(): Partial<Record<'name' | 'email' | 'subject' | 'message', string>> | null {
    try {
        const raw = window.sessionStorage.getItem(DRAFT_KEY)

        return raw === null ? null : (JSON.parse(raw) as Partial<Record<'name' | 'email' | 'subject' | 'message', string>>)
    } catch {
        return null
    }
}

function writeDraft(): void {
    try {
        window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name: form.name, email: form.email, subject: form.subject, message: form.message }))
    } catch {
        // No storage (a private window): the form still works, a failed send just cannot bring the words back.
    }
}

function clearDraft(): void {
    try {
        window.sessionStorage.removeItem(DRAFT_KEY)
    } catch {
        // Nothing was kept.
    }
}

onMounted(() => {
    const draft = readDraft()

    if (draft === null) {
        return
    }

    form.name = typeof draft.name === 'string' ? draft.name : form.name
    form.email = typeof draft.email === 'string' ? draft.email : form.email
    // A subject the linking page set wins over an older draft's: the visitor came here about this.
    form.subject = props.prefill?.subject ? props.prefill.subject : typeof draft.subject === 'string' ? draft.subject : form.subject
    form.message = typeof draft.message === 'string' ? draft.message : form.message
})

watch(() => [form.name, form.email, form.subject, form.message], writeDraft)

function submit(): void {
    form.transform((data) => ({ ...data, withVehicle: vehicle.value !== null && data.withVehicle })).post('/kontakt', {
        preserveScroll: true,
        onSuccess: () => {
            clearDraft()
            sent.value = true
            void nextTick(() => done.value?.focus())
        },
        onError: () => void nextTick(() => document.querySelector<HTMLElement>('.kon__form [aria-invalid="true"]')?.focus()),
    })
}

function again(): void {
    form.reset('subject', 'message')
    form.subject = ''
    sent.value = false
    void nextTick(() => document.getElementById('kon-subject')?.focus())
}

/* Phone and WhatsApp only once the client has given them (config); today there are none. */
const telHref = computed(() => `tel:${(props.contact.phoneIntl ?? props.contact.phone ?? '').replace(/\s/g, '')}`)
const waHref = computed(() => `https://wa.me/${(props.contact.whatsapp ?? '').replace(/[^0-9]/g, '')}`)
const backHref = computed(() => props.prefill?.from ?? '/')
</script>

<template>
    <Head title="Kontakt" />

    <section class="section--tight">
        <div class="container kon">
            <div class="kon__main">
                <h1 class="h1">Kontakt</h1>
                <p class="kon__lead">Fragen zur Passform, zu einer Bestellung oder zu einem Gutachten? Schreib uns – wir sind {{ contact.hours }} für dich da.</p>

                <div v-if="sent" ref="done" class="kon__done" role="status" tabindex="-1">
                    <h2 class="h3">Danke{{ form.name ? `, ${form.name}` : '' }} – deine Nachricht ist angekommen.</h2>
                    <p class="kon__done-text">
                        Wir antworten dir an <strong class="kon__email">{{ form.email }}</strong>.<template v-if="copyByMail"> Eine Kopie deiner Nachricht ist schon in deinem Postfach.</template>
                    </p>
                    <div class="kon__done-go">
                        <Link class="btn btn--primary" :href="backHref">{{ prefill?.from ? 'Zurück, wo du warst' : 'Zur Startseite' }}</Link>
                        <button class="btn btn--secondary" type="button" @click="again">Noch eine Nachricht schreiben</button>
                    </div>
                </div>

                <form v-else class="kon__form" novalidate @submit.prevent="submit">
                    <div class="kon__pair">
                        <div class="form-field">
                            <label class="form-field__label" for="kon-name">Dein Name</label>
                            <input id="kon-name" v-model="form.name" class="input" type="text" autocomplete="name" maxlength="120" aria-describedby="kon-name-err" :aria-invalid="form.errors.name ? 'true' : undefined">
                            <p id="kon-name-err" class="form-field__error">{{ form.errors.name ?? '' }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="kon-email">Deine E-Mail-Adresse</label>
                            <input id="kon-email" v-model="form.email" class="input" type="email" inputmode="email" autocomplete="email" maxlength="190" aria-describedby="kon-email-err" :aria-invalid="form.errors.email ? 'true' : undefined">
                            <p id="kon-email-err" class="form-field__error">{{ form.errors.email ?? '' }}</p>
                        </div>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="kon-subject">Betreff</label>
                        <input id="kon-subject" v-model="form.subject" class="input" type="text" maxlength="150" placeholder="z. B. Frage zu einer Felge" aria-describedby="kon-subject-err" :aria-invalid="form.errors.subject ? 'true' : undefined">
                        <p id="kon-subject-err" class="form-field__error">{{ form.errors.subject ?? '' }}</p>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="kon-message">Deine Nachricht</label>
                        <textarea id="kon-message" v-model="form.message" class="input kon__area" rows="7" maxlength="5000" :aria-describedby="vehicle ? 'kon-message-err' : 'kon-message-help kon-message-err'" :aria-invalid="form.errors.message ? 'true' : undefined" />
                        <p v-if="!vehicle" id="kon-message-help" class="form-field__help">Geht es um die Passform? Dann nenn uns gern HSN, TSN und Modell – du findest sie im Fahrzeugschein.</p>
                        <p id="kon-message-err" class="form-field__error">{{ form.errors.message ?? '' }}</p>
                    </div>

                    <label v-if="vehicleLine" class="check kon__vehicle">
                        <input v-model="form.withVehicle" type="checkbox">
                        <span>Mein Fahrzeug mitschicken: <strong>{{ vehicleLine }}</strong></span>
                    </label>

                    <!-- The honeypot: hidden from people and from screen readers, so only a script fills it. -->
                    <div class="kon__trap" aria-hidden="true">
                        <label for="kon-leer">Bitte dieses Feld leer lassen</label>
                        <input id="kon-leer" v-model="form.rmf_leer" type="text" name="rmf_leer" tabindex="-1" autocomplete="off">
                    </div>

                    <p class="kon__privacy">
                        Wir verwenden deine Angaben nur, um deine Nachricht zu beantworten. Mehr dazu in der
                        <Link href="/rechtliches/datenschutz">Datenschutzerklärung</Link>.
                    </p>

                    <div class="kon__go">
                        <button class="btn btn--primary" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">
                            <Icon name="mail" :size="20" />
                            Nachricht senden
                        </button>
                        <p v-if="copyByMail" class="kon__copy">Du bekommst eine Kopie an deine E-Mail-Adresse.</p>
                    </div>
                </form>
            </div>

            <aside class="kon__aside" aria-labelledby="kon-aside-title">
                <h2 id="kon-aside-title" class="kon__aside-title">Lieber direkt?</h2>
                <ul class="kon__ways">
                    <li>
                        <a class="kon__way" :href="`mailto:${contact.email}`">
                            <Icon name="mail" :size="20" />
                            <span>
                                <span class="kon__way-value">{{ contact.email }}</span>
                                <span class="kon__way-note">E-Mail aus deinem eigenen Programm</span>
                            </span>
                        </a>
                    </li>
                    <li v-if="contact.phone">
                        <a class="kon__way" :href="telHref">
                            <Icon name="phone" :size="20" />
                            <span>
                                <span class="kon__way-value tabular">{{ contact.phone }}</span>
                                <span class="kon__way-note">Telefon</span>
                            </span>
                        </a>
                    </li>
                    <li v-if="contact.whatsapp">
                        <a class="kon__way" :href="waHref" rel="noopener">
                            <Icon name="phone" :size="20" />
                            <span>
                                <span class="kon__way-value tabular">{{ contact.whatsapp }}</span>
                                <span class="kon__way-note">WhatsApp</span>
                            </span>
                        </a>
                    </li>
                </ul>
                <p class="kon__hours">{{ contact.hours }}</p>
            </aside>
        </div>
    </section>
</template>

<style scoped>
.kon {
    display: grid;
    gap: var(--sp-40);
}

@media (min-width: 1024px) {
    .kon {
        grid-template-columns: minmax(0, 640px) minmax(0, 320px);
        justify-content: space-between;
        align-items: start;
    }
}

.kon__lead {
    margin-top: var(--sp-8);
    color: var(--c-ink-2);
    max-width: 60ch;
}

.kon__form {
    display: grid;
    gap: var(--sp-8);
    margin-top: var(--sp-24);
}

.kon__pair {
    display: grid;
    gap: var(--sp-8) var(--sp-16);
}

@media (min-width: 640px) {
    .kon__pair {
        grid-template-columns: 1fr 1fr;
    }
}

.kon__area {
    min-height: 180px;
}

.kon__vehicle {
    align-items: flex-start;
    padding-block: var(--sp-8);
    line-height: var(--lh-body);
}

.kon__vehicle input {
    margin-top: 3px;
}

.kon__vehicle strong {
    font-weight: 600;
    overflow-wrap: anywhere;
}

/* Off the page for people, still in the form for a script; never `display: none`, which some scripts skip. */
.kon__trap {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
}

.kon__privacy {
    margin-top: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.kon__go {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-16);
    margin-top: var(--sp-8);
}

.kon__copy {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.kon__done {
    display: grid;
    gap: var(--sp-12);
    margin-top: var(--sp-24);
    padding: var(--sp-24);
    border: 1px solid var(--c-line);
    border-radius: var(--r-tile);
    background: var(--c-surface);
}

.kon__done:focus-visible {
    outline-offset: 2px;
}

.kon__done-text {
    color: var(--c-ink-2);
}

.kon__email {
    color: var(--c-ink);
    font-weight: 600;
    overflow-wrap: anywhere;
}

.kon__done-go {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin-top: var(--sp-4);
}

.kon__aside {
    padding-top: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

@media (min-width: 1024px) {
    .kon__aside {
        margin-top: var(--sp-64);
        padding-top: 0;
        padding-left: var(--sp-24);
        border-top: 0;
        border-left: 1px solid var(--c-line);
    }
}

.kon__aside-title {
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.kon__ways {
    display: grid;
    margin: var(--sp-8) 0 0;
    padding: 0;
    list-style: none;
}

.kon__way {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
    min-height: 56px;
    padding-block: var(--sp-8);
    color: var(--c-ink);
    text-decoration: none;
}

.kon__way :deep(svg) {
    flex: none;
    color: var(--c-ink-2);
}

.kon__way-value {
    display: block;
    font-weight: 600;
    color: var(--c-blue);
    overflow-wrap: anywhere;
}

.kon__way-note {
    display: block;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.kon__hours {
    margin-top: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

@media (hover: hover) and (pointer: fine) {
    .kon__way:hover .kon__way-value {
        color: var(--c-blue-h);
        text-decoration: underline;
    }
}

@media (max-width: 639px) {
    .kon__go .btn,
    .kon__done-go .btn {
        width: 100%;
    }
}
</style>
