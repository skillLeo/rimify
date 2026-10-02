<script setup lang="ts">
/**
 * „Rückmeldung geben“ (the review release §3): one sentence and what kind of point it is — Fehler,
 * Design, Text, Wunsch. The page's address, the window, the browser, the role and a screenshot go
 * with it on their own, and the dialog says so. The `R` key opens it wherever nobody is typing.
 *
 * `surface`: the admin's frame, or the shop's own pages (ShopFeedback, D-142) — the same form in the
 * design system of the page it is opened on.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Dialog from '../Ui/Dialog.vue'
import { isTyping, overlayOpen } from '../../composables/admin/useAdminShortcuts'
import { FEEDBACK_TYPES, feedback, startFeedback, type FeedbackType } from '../../composables/admin/useFeedback'

const props = withDefaults(defineProps<{ surface?: 'admin' | 'shop' }>(), { surface: 'admin' })
const shop = computed(() => props.surface === 'shop')

const page = usePage()
const type = ref<FeedbackType>('fehler')
const sentence = ref('')
const busy = ref(false)
const errors = ref<Record<string, string | undefined>>({})

const open = computed({
    get: () => feedback.open,
    set: (value: boolean) => (feedback.open = value),
})

/* A sentence written about another page is not sent with this one's address. */
let sentenceFor = ''

watch(open, (value) => {
    if (value) {
        errors.value = {}

        if (feedback.url !== sentenceFor) {
            sentence.value = ''
            type.value = 'fehler'
        }

        sentenceFor = feedback.url
    }
})

/** The server refused the picture: the point can still go, without it. */
function sendWithout(): void {
    feedback.screenshot = null
    send()
}

/* `1440×900` is what is sent and stored; it reads with spaces, like every other product of two figures („7,5J × 17“). */
const viewportLabel = computed(() => feedback.viewport.replace('×', ' × '))

const role = computed(() => {
    const shared = page.props as { admin?: { account?: { role?: string | null } | null }; reviewer?: { role?: string | null } }

    return shared.admin?.account?.role ?? shared.reviewer?.role ?? null
})

/*
 * A send that does not arrive is said here, in the dialog, with the sentence kept — never Inertia's own pane of raw
 * response over the shop (SHOP-FEEDBACK-01): a sign-in that ran out, too many points at once, a picture too large,
 * no connection, or anything else.
 */
function refused(status: number): string {
    if (status === 401 || status === 403 || status === 419) {
        return 'Deine Anmeldung ist abgelaufen. Melde dich im Admin neu an und schick die Rückmeldung dann noch einmal.'
    }

    if (status === 429) {
        return 'Das waren viele Rückmeldungen in kurzer Zeit. Warte eine Minute und schick diese dann noch einmal.'
    }

    return 'Die Rückmeldung ist nicht angekommen. Dein Satz ist noch da – versuch es gleich noch einmal.'
}

function send(): void {
    if (busy.value) {
        return
    }

    busy.value = true
    router.post(
        '/admin/review/rueckmeldungen',
        { type: type.value, sentence: sentence.value, url: feedback.url, viewport: feedback.viewport, browser: feedback.browser, screenshot: feedback.screenshot },
        {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                feedback.open = false
                sentence.value = ''
                type.value = 'fehler'
                feedback.screenshot = null
            },
            onError: (bag) => (errors.value = bag),
            onHttpException: (response) => {
                // Too large to take: the server never read it, so offer the point without its picture.
                errors.value = response.status === 413 && feedback.screenshot
                    ? { screenshot: 'Das Bildschirmfoto ist zu groß. Schick die Rückmeldung bitte ohne.' }
                    : { send: refused(response.status) }

                return false
            },
            onNetworkError: () => {
                errors.value = { send: 'Keine Verbindung zum Server. Dein Satz ist noch da – prüf die Verbindung und versuch es noch einmal.' }

                return false
            },
            onFinish: () => (busy.value = false),
        }
    )
}

/* Back, or any other way to another page, while the dialog is open: its address and picture are of the page it was
   opened on, so it closes rather than file the point under the wrong page (SHOP-FEEDBACK-04). */
let stopNavigate: (() => void) | undefined

onMounted(() => {
    stopNavigate = router.on('navigate', (event) => {
        if (feedback.open && event.detail.page.url !== feedback.url) {
            feedback.open = false
        }
    })
})

onBeforeUnmount(() => stopNavigate?.())

/* `R` — Rückmeldung — like the panel's other single keys: never while typing, never over a dialog. */
function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'r' && event.key !== 'R') {
        return
    }

    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat || isTyping(event.target) || overlayOpen()) {
        return
    }

    event.preventDefault()
    void startFeedback()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
    <Dialog v-model:open="open" title="Rückmeldung geben" :content-class="shop ? undefined : 'adm-dialog'" initial-focus="#fb-sentence">
        <form class="fb" novalidate @submit.prevent="send">
            <fieldset class="fb-types">
                <legend class="form-field__label">Worum geht es?</legend>
                <div class="fb-types__row">
                    <label v-for="option in FEEDBACK_TYPES" :key="option.value" class="fb-type" :class="shop ? ['chip', { 'chip--on': type === option.value }] : 'adm-chip'">
                        <input v-model="type" class="visually-hidden" type="radio" name="fb-type" :value="option.value">
                        {{ option.label }}
                    </label>
                </div>
            </fieldset>
            <div class="form-field">
                <label class="form-field__label" for="fb-sentence">Was ist dir aufgefallen?</label>
                <textarea
                    id="fb-sentence"
                    v-model="sentence"
                    class="input fb-area"
                    rows="3"
                    maxlength="2000"
                    placeholder="Ein Satz reicht, zum Beispiel: Der Preis steht hier ohne Mehrwertsteuer."
                    :aria-invalid="errors.sentence ? 'true' : undefined"
                    aria-describedby="fb-sentence-err fb-context"
                />
                <p id="fb-sentence-err" class="form-field__error" aria-live="polite">{{ errors.send ?? errors.sentence ?? errors.type ?? errors.url ?? errors.viewport ?? errors.browser ?? errors.screenshot }}</p>
                <button v-if="errors.screenshot && feedback.screenshot" class="btn btn--ghost fb-without" type="button" @click="sendWithout">Ohne Bildschirmfoto senden</button>
            </div>
            <div id="fb-context" class="fb-context">
                <img v-if="feedback.screenshot" class="fb-shot" :src="feedback.screenshot" alt="Bildschirmfoto dieser Seite, wie es mitgeschickt wird">
                <p :class="shop ? 'small muted' : 'adm-note'">
                    Mitgeschickt werden: diese Seite ({{ feedback.url }}), Fenster {{ viewportLabel }}, {{ feedback.browser }}<template v-if="role">, deine Rolle „{{ role }}“</template>{{ feedback.screenshot ? ' und das Bildschirmfoto.' : '. Ein Bildschirmfoto ließ sich hier nicht machen.' }}
                </p>
            </div>
        </form>
        <template #actions>
            <button class="btn btn--secondary" type="button" @click="open = false">Abbrechen</button>
            <button class="btn btn--primary" type="button" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="send">Senden</button>
        </template>
    </Dialog>
</template>

<style scoped>
.fb {
    display: grid;
    gap: var(--sp-16);
}

.fb .form-field__error:empty {
    display: none;
}

.fb-types {
    margin: 0;
    padding: 0;
    border: 0;
}

.fb-types legend {
    margin-bottom: var(--sp-8);
    padding: 0;
}

.fb-types__row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.fb-type:has(input:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

.fb-without {
    justify-self: start;
}

.fb-area {
    height: auto;
    padding-block: var(--sp-8);
    resize: vertical;
}

.fb-context {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    align-items: start;
    gap: var(--sp-12);
}

.fb-context:not(:has(img)) {
    grid-template-columns: minmax(0, 1fr);
}

.fb-shot {
    width: 120px;
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
}

/* On a phone the screenshot is a strip of the page's top, as wide as the form, so „Senden“ stays in view; the four
   kinds stand two by two rather than leaving one alone on a row. */
@media (max-width: 767px) {
    .fb-types__row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .fb-context {
        grid-template-columns: minmax(0, 1fr);
    }

    .fb-shot {
        width: 100%;
        height: 96px;
        object-fit: cover;
        object-position: top;
    }
}
</style>
