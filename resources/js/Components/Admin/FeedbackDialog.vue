<script setup lang="ts">
/**
 * „Rückmeldung geben“ (the review release §3): one sentence and what kind of point it is — Fehler,
 * Design, Text, Wunsch. The page's address, the window, the browser, the role and a screenshot go
 * with it on their own, and the dialog says so. The `R` key opens it wherever nobody is typing.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Dialog from '../Ui/Dialog.vue'
import { isTyping, overlayOpen } from '../../composables/admin/useAdminShortcuts'
import { FEEDBACK_TYPES, feedback, startFeedback, type FeedbackType } from '../../composables/admin/useFeedback'

const page = usePage()
const type = ref<FeedbackType>('fehler')
const sentence = ref('')
const busy = ref(false)
const errors = ref<Record<string, string | undefined>>({})

const open = computed({
    get: () => feedback.open,
    set: (value: boolean) => (feedback.open = value),
})

watch(open, (value) => {
    if (value) {
        errors.value = {}
    }
})

const role = computed(() => {
    const admin = (page.props as { admin?: { account?: { role?: string | null } | null } }).admin

    return admin?.account?.role ?? null
})

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
                feedback.screenshot = null
            },
            onError: (bag) => (errors.value = bag),
            onFinish: () => (busy.value = false),
        }
    )
}

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
    <Dialog v-model:open="open" title="Rückmeldung geben" content-class="adm-dialog" initial-focus="#fb-sentence">
        <form class="fb" novalidate @submit.prevent="send">
            <fieldset class="fb-types">
                <legend class="form-field__label">Worum geht es?</legend>
                <div class="fb-types__row">
                    <label v-for="option in FEEDBACK_TYPES" :key="option.value" class="fb-type" :class="{ 'fb-type--on': type === option.value }">
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
                <p id="fb-sentence-err" class="form-field__error">{{ errors.sentence ?? errors.url ?? errors.screenshot }}</p>
            </div>
            <div id="fb-context" class="fb-context">
                <img v-if="feedback.screenshot" class="fb-shot" :src="feedback.screenshot" alt="Bildschirmfoto dieser Seite, wie es mitgeschickt wird">
                <p class="adm-note">
                    Mitgeschickt werden: diese Seite ({{ feedback.url }}), Fenster {{ feedback.viewport }}, {{ feedback.browser }}<template v-if="role">, deine Rolle „{{ role }}“</template>{{ feedback.screenshot ? ' und das Bildschirmfoto.' : '. Ein Bildschirmfoto ließ sich hier nicht machen.' }}
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
}

.fb-types__row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.fb-type {
    display: inline-flex;
    align-items: center;
    height: var(--adm-control-h);
    padding-inline: var(--sp-12);
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    cursor: pointer;
}

.fb-type--on {
    border-color: var(--c-ink);
    background: var(--c-ink);
    color: var(--c-surface);
}

.fb-type:has(input:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
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

@media (max-width: 767px) {
    .fb-type {
        height: var(--adm-control-h-lg);
    }

    .fb-context {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
