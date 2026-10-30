<script setup lang="ts">
/**
 * „Sterne von Hand“ on one Felge (the client's #19, D-344, D-345): the stars and their count as the operator has them
 * from elsewhere, and the one sentence that stands beside every rim's typed stars in the shop — with the default agreed
 * on 29.10.2026, which his lawyer may reword. Emptied, the shop shows no typed stars anywhere. Both are saved on their
 * own, beside the Felge's form, as its photographs are: never held back by an unsaved form, never lost to one.
 *
 * Nothing here is a buyer's review: the stars never count towards the buyers' own rating, never read „Geprüfter Kauf“
 * and never go into the data for search engines.
 */

import { router, useForm } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import { focusRefused } from '../../../composables/admin/focusRefused'
import type { StatedDisclosureProp, StatedRatingProp } from '../../../types/admin/felgen'

const props = defineProps<{
    modelId: number
    /** What is saved, as the form shows it, with the line the shop shows; null while there are none. */
    stated: StatedRatingProp | null
    /** The sentence beside every rim's typed stars; empty, none render. */
    disclosure: StatedDisclosureProp
    /** WheelModelPolicy::rate — the server asks it again on every save (R-11). */
    editable: boolean
}>()

function fromProps(): { rating: string; count: string } {
    return { rating: props.stated?.rating ?? '', count: props.stated?.count ?? '' }
}

const form = useForm(fromProps())
const note = useForm({ disclosure: props.disclosure.text })
const errors = computed(() => form.errors as Record<string, string | undefined>)
const noteErrors = computed(() => note.errors as Record<string, string | undefined>)
const removing = ref(false)
const url = computed(() => `/admin/felgen/${props.modelId}/sterne`)
const silent = computed(() => props.disclosure.text === '')

/* The saved state is the truth after a save or a removal: compared by value, so a refused save keeps what was typed. */
watch(
    () => JSON.stringify(props.stated),
    () => {
        form.defaults(fromProps())
        form.reset()
        form.clearErrors()
    }
)

watch(
    () => props.disclosure.text,
    (text) => {
        note.defaults({ disclosure: text })
        note.reset()
        note.clearErrors()
    }
)

function save(): void {
    if (form.processing || removing.value) {
        return
    }

    form.put(url.value, { preserveScroll: true, preserveState: true, onError: () => focusRefused('.fe-stars') })
}

function remove(): void {
    if (form.processing || removing.value) {
        return
    }

    removing.value = true
    router.delete(url.value, {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => {
            removing.value = false
        },
    })
}

function saveNote(): void {
    if (note.processing) {
        return
    }

    note.put('/admin/felgen/sterne-hinweis', { preserveScroll: true, preserveState: true, onError: () => focusRefused('.fe-stars__note-form') })
}

function useDefault(): void {
    note.disclosure = props.disclosure.default
    document.getElementById('fe-stars-note')?.focus()
}
</script>

<template>
    <section class="adm-section fe-stars" aria-labelledby="fe-h-stars">
        <div class="adm-section__head">
            <h2 id="fe-h-stars" class="adm-section__title">Sterne von Hand</h2>
        </div>
        <div class="fe-stars__body">
            <p class="adm-note">
                Sterne, die du anderswo gesammelt hast – etwa in deinem eBay-Shop. Der Shop zeigt sie unter dem Namen der Felge, in der
                Felgenliste und auf der Produktseite, immer mit dem Hinweis unten daneben.
            </p>

            <p class="fe-stars__now" data-stars-now>
                <template v-if="stated && !silent">
                    <span class="fe-stars__label">Im Shop steht:</span>
                    <!-- One line in the source: the spaces between the parts are kept (a line break between them would not be). -->
                    <span class="fe-stars__line"><span class="fe-stars__glyph" aria-hidden="true">★</span> <span class="num">{{ stated.label }}</span>{{ ' – ' + disclosure.text }}</span>
                </template>
                <template v-else-if="stated">Der Hinweis unten ist leer – deshalb zeigt der Shop diese Sterne nicht.</template>
                <template v-else>Im Shop stehen keine Sterne von Hand.</template>
            </p>

            <form v-if="editable" class="fe-stars__form" novalidate @submit.prevent="save">
                <div class="fe-stars__pair">
                    <div class="form-field">
                        <label class="form-field__label" for="fe-stars-rating">Sterne</label>
                        <input
                            id="fe-stars-rating"
                            v-model="form.rating"
                            class="input num"
                            type="text"
                            inputmode="decimal"
                            maxlength="3"
                            autocomplete="off"
                            placeholder="4,8"
                            :aria-invalid="errors.rating ? 'true' : undefined"
                            aria-describedby="fe-stars-rating-help fe-stars-rating-err"
                        >
                        <p id="fe-stars-rating-help" class="form-field__help">Von 1,0 bis 5,0.</p>
                        <p id="fe-stars-rating-err" class="form-field__error">{{ errors.rating }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fe-stars-count">Anzahl der Bewertungen</label>
                        <input
                            id="fe-stars-count"
                            v-model="form.count"
                            class="input num"
                            type="text"
                            inputmode="numeric"
                            maxlength="9"
                            autocomplete="off"
                            placeholder="13"
                            :aria-invalid="errors.count ? 'true' : undefined"
                            aria-describedby="fe-stars-count-err"
                        >
                        <p id="fe-stars-count-err" class="form-field__error">{{ errors.count }}</p>
                    </div>
                </div>
                <div class="fe-stars__actions">
                    <button class="btn btn--secondary" type="submit" :disabled="form.processing || removing || !form.isDirty" :aria-busy="form.processing ? 'true' : undefined">
                        Sterne speichern
                    </button>
                    <button v-if="stated" class="btn btn--ghost" type="button" :disabled="form.processing || removing" :aria-busy="removing ? 'true' : undefined" @click="remove">
                        Sterne entfernen
                    </button>
                </div>
            </form>

            <form v-if="editable" class="fe-stars__form fe-stars__note-form" novalidate @submit.prevent="saveNote">
                <div class="form-field">
                    <label class="form-field__label" for="fe-stars-note">Hinweis neben den Sternen <span class="fe-stars__all">(gilt für alle Felgen)</span></label>
                    <input
                        id="fe-stars-note"
                        v-model="note.disclosure"
                        class="input"
                        type="text"
                        maxlength="200"
                        autocomplete="off"
                        :aria-invalid="noteErrors.disclosure ? 'true' : undefined"
                        aria-describedby="fe-stars-note-help fe-stars-note-err"
                    >
                    <p id="fe-stars-note-help" class="form-field__help">
                        Das Gesetz verlangt, dass neben Bewertungen steht, ob und wie der Shop sie geprüft hat (§ 5b Abs. 3 UWG). Lässt du
                        das Feld leer, zeigt der Shop keine Sterne von Hand mehr.
                    </p>
                    <p id="fe-stars-note-err" class="form-field__error">{{ noteErrors.disclosure }}</p>
                </div>
                <div class="fe-stars__actions">
                    <button class="btn btn--secondary" type="submit" :disabled="note.processing || !note.isDirty" :aria-busy="note.processing ? 'true' : undefined">Hinweis speichern</button>
                    <button v-if="note.disclosure !== disclosure.default" class="btn btn--ghost" type="button" @click="useDefault">Vorgeschlagenen Satz einsetzen</button>
                </div>
            </form>

            <p v-if="!editable" class="adm-note">Sterne von Hand ändern darf, wer Felgen bearbeiten und veröffentlichen darf.</p>
        </div>
    </section>
</template>

<style scoped>
.fe-stars__body {
    display: grid;
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
}

.fe-stars .adm-note {
    margin: 0;
}

.fe-stars__now {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding: var(--sp-12) var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

.fe-stars__label {
    font-weight: 500;
    color: var(--c-ink);
}

.fe-stars__glyph {
    color: var(--c-star);
}

.fe-stars__all {
    font-weight: 400;
    color: var(--c-ink-3);
}

.fe-stars__form {
    display: grid;
    gap: var(--sp-16);
}

.fe-stars__form .form-field__error:empty {
    display: none;
}

.fe-stars__pair {
    display: grid;
    grid-template-columns: calc(12 * var(--ch-text)) calc(20 * var(--ch-text));
    gap: var(--sp-16);
    align-items: start;
}

.fe-stars__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

@media (max-width: 767px) {
    .fe-stars__pair {
        grid-template-columns: minmax(0, 1fr);
    }

    .fe-stars__actions .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
