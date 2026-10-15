<script setup lang="ts">
/**
 * Kontakt: the contact form (the client's #12, D-123).
 *
 * Name, e-mail, subject and message go to `POST /kontakt` (ContactRequest, ContactMessagePolicy): the message is kept
 * for the team (Verkauf › Nachrichten), mailed to the shop with the sender as reply-to; a copy goes only to a signed-in customer's own address (D-218).
 * Every e-mail button in the shop leads here (#26), with a subject where the page knows one and the path it came from.
 *
 * The chosen car is offered as a ticked box — the first thing we would ask is which car the question is about — and
 * the server names it from the visitor's own cookie, never from the form. `rmf_leer` is the honeypot: a field nobody
 * sees, so a filled one is a script; `ticket` is the time the server handed the form out, and a message back sooner
 * than a person writes one is refused with a sentence under the button (ContactRequest). A draft survives a failed send
 * (a limit, an expired page) in this tab's own storage, so the visitor never finds the form cleared (R-09).
 *
 * Every contact detail renders from `config('rimify.contact')` (D-023). No reply-time promise: the client gave service
 * hours, not a response time.
 */

import { Head, Link, useForm } from '@inertiajs/vue3'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Ui/Icon.vue'
import { useShared } from '../../composables/useShared'
import type { KontaktProps } from '../../types/pages'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<KontaktProps>()

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle ?? null)

/* The car as the page names it: its key numbers, or, for a car known only from a Gutachten, its Feld K. */
const vehicleLine = computed(() => (vehicle.value === null ? null : `${vehicle.value.label} (${vehicle.value.approval ?? vehicle.value.keyNumbers})`))

const form = useForm({
    name: '',
    // A signed-in customer's own address, so the copy can go to it — theirs to change.
    email: props.copyTo ?? '',
    subject: props.prefill?.subject ?? '',
    message: '',
    withVehicle: true,
    from: props.prefill?.from ?? null,
    rmf_leer: '',
    ticket: props.ticket ?? '',
})

/*
 * A copy of the message goes to one address only: a signed-in customer's own, confirmed (D-218) — the shop does not
 * send a visitor's words to an address it cannot know to be theirs. And only where outgoing mail is configured (F2).
 */
const copyByMail = computed(() => {
    const confirmed = props.copyTo?.trim().toLowerCase() ?? ''

    return shared.value.notifyByMail === true && confirmed !== '' && form.email.trim().toLowerCase() === confirmed
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
    form.email = typeof draft.email === 'string' && draft.email.trim() !== '' ? draft.email : form.email
    form.message = typeof draft.message === 'string' ? draft.message : form.message

    // A half-written message keeps its own subject — the visitor's words over a linking page's, which may only be the
    // error page's „Fehler 429“. Without a message, the subject the linking page set is the reason they came.
    if (form.message.trim() !== '' && typeof draft.subject === 'string' && draft.subject.trim() !== '') {
        form.subject = draft.subject
    } else if (!props.prefill?.subject && typeof draft.subject === 'string') {
        form.subject = draft.subject
    }
})

watch(() => [form.name, form.email, form.subject, form.message], writeDraft)

/*
 * Each field is checked when it is left (DIRECTION §8), in ContactRequest's own words, and again as it is typed once
 * it carries a sentence, so the sentence goes the moment the field is right. The server checks everything anyway.
 */
type Field = 'name' | 'email' | 'subject' | 'message'

function problem(field: Field): string | null {
    const value = form[field].trim()

    switch (field) {
        case 'name':
            return value === '' ? 'Bitte sag uns deinen Namen.' : null
        case 'email':
            if (value === '') {
                return 'Bitte gib deine E-Mail-Adresse an, damit wir dir antworten können.'
            }

            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Diese E-Mail-Adresse sieht nicht vollständig aus. Bitte prüf sie noch einmal.'
        case 'subject':
            return value === '' ? 'Worum geht es? Ein paar Worte als Betreff reichen.' : null
        case 'message':
            if (value === '') {
                return 'Bitte schreib uns deine Frage.'
            }

            return value.length < 10 ? 'Ein, zwei Sätze mehr, damit wir dir gleich richtig antworten können.' : null
    }
}

function check(field: Field): void {
    const message = problem(field)

    if (message === null) {
        form.clearErrors(field)
    } else {
        form.setError(field, message)
    }
}

function recheck(field: Field): void {
    if (form.errors[field]) {
        check(field)
    }
}

/* A send that never reached the server: said under the button, and the words stay where they are. */
const offline = ref(false)

function submit(): void {
    offline.value = false

    form.transform((data) => ({
        ...data,
        // The car the box shows, by its id: what was ticked is what is sent, whatever another tab chose since.
        withVehicle: vehicle.value !== null && data.withVehicle,
        vehicleId: vehicle.value !== null && data.withVehicle ? vehicle.value.id : null,
    })).post('/kontakt', {
        preserveScroll: true,
        onSuccess: (page) => {
            // A limit (429) or an expired page (419) answers with the shop's error page, which Inertia also hands to
            // onSuccess: only this page coming back means the message arrived (KON-01). Until then the draft stays.
            if (page.component !== 'Kontakt/Index') {
                return
            }

            clearDraft()
            sent.value = true
            void nextTick(() => done.value?.focus())
        },
        onError: () => void nextTick(() => document.querySelector<HTMLElement>('.kon__form [aria-invalid="true"]')?.focus()),
        onNetworkError: () => {
            offline.value = true

            return false
        },
    })
}

function again(): void {
    // Set, not reset: after a send the form's defaults are the words just sent, and they must not come back (KON-02).
    form.subject = ''
    form.message = ''
    form.clearErrors()
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
        <div class="container grid kon">
            <header class="kon__head">
                <h1 class="h1">Kontakt</h1>
                <p class="body-l muted prose kon__lead">Fragen zu einer Felge, zu einer Bestellung oder zu einem Gutachten? Schreib uns.</p>
            </header>

            <div class="kon__main">
                <div v-if="sent" ref="done" class="kon__done" role="status" tabindex="-1">
                    <h2 class="h3 kon__done-title">
                        <Icon name="check" :size="24" class="kon__done-mark" />
                        <span>Danke{{ form.name ? `, ${form.name}` : '' }} – deine Nachricht ist angekommen.</span>
                    </h2>
                    <p class="body muted kon__done-text">
                        Wir antworten dir an <strong class="kon__email">{{ form.email }}</strong>.<template v-if="copyByMail"> Eine Kopie deiner Nachricht ist schon in deinem Postfach.</template>
                    </p>
                    <div class="kon__done-go">
                        <Link class="btn btn--primary" :href="backHref">{{ prefill?.from ? 'Zurück zur vorherigen Seite' : 'Zur Startseite' }}</Link>
                        <button class="btn btn--secondary" type="button" @click="again">Noch eine Nachricht schreiben</button>
                    </div>
                </div>

                <form v-else class="kon__form" novalidate @submit.prevent="submit">
                    <div class="kon__pair">
                        <div class="form-field">
                            <label class="form-field__label" for="kon-name">Dein Name</label>
                            <input id="kon-name" v-model="form.name" class="input" type="text" autocomplete="name" maxlength="120" aria-describedby="kon-name-err" :aria-invalid="form.errors.name ? 'true' : undefined" @blur="check('name')" @input="recheck('name')">
                            <p id="kon-name-err" class="form-field__error">{{ form.errors.name ?? '' }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="kon-email">Deine E-Mail-Adresse</label>
                            <input id="kon-email" v-model="form.email" class="input" type="email" inputmode="email" autocomplete="email" maxlength="190" aria-describedby="kon-email-err" :aria-invalid="form.errors.email ? 'true' : undefined" @blur="check('email')" @input="recheck('email')">
                            <p id="kon-email-err" class="form-field__error">{{ form.errors.email ?? '' }}</p>
                        </div>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="kon-subject">Betreff</label>
                        <input id="kon-subject" v-model="form.subject" class="input" type="text" maxlength="150" placeholder="z. B. Frage zu einer Felge" aria-describedby="kon-subject-err" :aria-invalid="form.errors.subject ? 'true' : undefined" @blur="check('subject')" @input="recheck('subject')">
                        <p id="kon-subject-err" class="form-field__error">{{ form.errors.subject ?? '' }}</p>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="kon-message">Deine Nachricht</label>
                        <textarea id="kon-message" v-model="form.message" class="input kon__area" rows="7" maxlength="5000" :aria-describedby="vehicle ? 'kon-message-err' : 'kon-message-help kon-message-err'" :aria-invalid="form.errors.message ? 'true' : undefined" @blur="check('message')" @input="recheck('message')" />
                        <p v-if="!vehicle" id="kon-message-help" class="form-field__help">Geht es darum, ob eine Felge an dein Auto darf? Dann nenn uns gern HSN, TSN und Modell – sie stehen in deiner Zulassungsbescheinigung Teil I, Felder 2.1 und 2.2.</p>
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

                    <p class="small muted kon__privacy">
                        Wir verwenden deine Angaben nur, um deine Nachricht zu beantworten. Mehr dazu in der
                        <Link href="/rechtliches/datenschutz">Datenschutzerklärung</Link>.
                    </p>

                    <div class="kon__go">
                        <button class="btn btn--primary" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">
                            <Icon name="mail" :size="20" />
                            Nachricht senden
                        </button>
                        <p v-if="copyByMail" class="small muted kon__copy">Du bekommst eine Kopie an deine E-Mail-Adresse.</p>
                    </div>
                    <p v-if="offline" class="notice notice--bad kon__offline" role="alert">
                        Die Nachricht ist nicht bei uns angekommen – die Verbindung ist gerade weg. Dein Text bleibt hier stehen; schick
                        ihn gleich noch einmal.
                    </p>
                    <!-- Sent sooner than a person writes, or from a page without a ticket: said, never swallowed (#12). -->
                    <p v-if="form.errors.ticket" class="notice notice--bad kon__offline" role="alert">{{ form.errors.ticket }}</p>
                </form>
            </div>

            <aside class="kon__aside" aria-labelledby="kon-aside-title">
                <h2 id="kon-aside-title" class="h4">Lieber direkt?</h2>
                <ul class="kon__ways">
                    <!-- The address to read and copy, not a link: every way to write to us here is the form (the client's
                         #26, D-144). One click selects all of it. -->
                    <li class="kon__way kon__way--text">
                        <Icon name="mail" :size="20" class="kon__way-mark" />
                        <span>
                            <span class="kon__way-value kon__way-value--copy" translate="no">{{ contact.email }}</span>
                            <span class="kon__way-note">Zum Kopieren in dein eigenes E-Mail-Programm</span>
                        </span>
                    </li>
                    <li v-if="contact.phone">
                        <a class="kon__way" :href="telHref">
                            <Icon name="phone" :size="20" class="kon__way-mark" />
                            <span>
                                <span class="kon__way-value num">{{ contact.phone }}</span>
                                <span class="kon__way-note">Telefon</span>
                            </span>
                        </a>
                    </li>
                    <li v-if="contact.whatsapp">
                        <a class="kon__way" :href="waHref" rel="noopener">
                            <!-- The official WhatsApp mark is never redrawn (DIRECTION §7): the slot keeps the rows aligned. -->
                            <span class="kon__slot" aria-hidden="true" />
                            <span>
                                <span class="kon__way-value num">{{ contact.whatsapp }}</span>
                                <span class="kon__way-note">WhatsApp</span>
                            </span>
                        </a>
                    </li>
                    <li class="kon__hours">
                        <Icon name="clock" :size="20" />
                        <span class="num">{{ contact.hours }}</span>
                    </li>
                </ul>
            </aside>
        </div>
    </section>
</template>

<style scoped>
.kon {
    row-gap: var(--sp-24);
}

.kon__head,
.kon__main,
.kon__aside {
    grid-column: 1 / -1;
    min-width: 0;
}

/* On the 12-column grid: the form across six, the aside across the last four, both starting on one line. */
@media (min-width: 1024px) {
    .kon__main {
        grid-column: 1 / span 6;
    }

    .kon__aside {
        grid-column: 9 / span 4;
    }
}

.kon__lead {
    margin-top: var(--sp-8);
}

.kon__form {
    display: grid;
    gap: var(--sp-8);
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
}

.kon__go {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-16);
    margin-top: var(--sp-8);
}

.kon__offline {
    margin-top: var(--sp-8);
}

/* The thanks stands where the form stood, as text: no card around it (DIRECTION §4). */
.kon__done {
    display: grid;
    gap: var(--sp-12);
}

.kon__done:focus-visible {
    outline-offset: 4px;
}

.kon__done-title {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-8);
}

.kon__done-mark {
    flex: none;
    margin-top: 4px;
    color: var(--c-ok);
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
    margin-top: var(--sp-8);
}

.kon__aside {
    padding-top: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

@media (min-width: 1024px) {
    .kon__aside {
        padding-top: 0;
        padding-left: var(--sp-24);
        border-top: 0;
        border-left: 1px solid var(--c-line);
    }
}

.kon__ways {
    display: grid;
    margin: var(--sp-12) 0 0;
    padding: 0;
    list-style: none;
}

.kon__way,
.kon__hours {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
    min-height: 56px;
    padding-block: var(--sp-8);
    color: var(--c-ink);
    text-decoration: none;
}

.kon__hours {
    min-height: 44px;
    color: var(--c-ink-2);
}

.kon__way :deep(svg),
.kon__hours :deep(svg) {
    flex: none;
}

/* The brand's blue on the marks of the ways to reach us; the hours are a fact, not an action (D-114). */
.kon__way-mark {
    color: var(--c-blue);
}

.kon__slot {
    flex: none;
    width: 20px;
    height: 20px;
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

/* Text, not a link: ink rather than the link's blue, and one click takes the whole address. */
.kon__way-value--copy {
    color: var(--c-ink);
    user-select: all;
}

@media (hover: hover) and (pointer: fine) {
    .kon__way:hover .kon__way-value {
        color: var(--c-blue-hover);
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
