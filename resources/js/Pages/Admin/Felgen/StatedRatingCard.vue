<script setup lang="ts">
/**
 * „Sterne von Hand“ on one Felge (the client's #19 as promised, D-344): the stars and their count as the operator has them
 * from elsewhere — his eBay shop, his old shop — and the sentence that says where they come from. The shop shows them
 * under the rim's name beside that sentence; without it, none. Saved on their own, beside the Felge's form, as its
 * photographs are: never held back by an unsaved form, never lost to one.
 *
 * Nothing here is a buyer's review. The shop has checked none of it, so the server refuses a sentence that says it has,
 * and the stars never count towards the buyers' own rating or go into the data for search engines.
 */

import { router, useForm } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'
import { focusRefused } from '../../../composables/admin/focusRefused'
import type { StatedRatingProp } from '../../../types/admin/felgen'

const props = defineProps<{
    modelId: number
    /** What is saved, as the form shows it, with the line the shop shows; null while there are none. */
    stated: StatedRatingProp | null
    /** WheelModelPolicy::rate — the server asks it again on every save (R-11). */
    editable: boolean
}>()

function fromProps(): { rating: string; count: string; origin: string } {
    return { rating: props.stated?.rating ?? '', count: props.stated?.count ?? '', origin: props.stated?.origin ?? '' }
}

const form = useForm(fromProps())
const errors = computed(() => form.errors as Record<string, string | undefined>)
const removing = ref(false)
const url = computed(() => `/admin/felgen/${props.modelId}/sterne`)

/* The saved state is the truth after a save or a removal: compared by value, so a refused save keeps what was typed. */
watch(
    () => JSON.stringify(props.stated),
    () => {
        form.defaults(fromProps())
        form.reset()
        form.clearErrors()
    }
)

function save(): void {
    if (form.processing || removing.value) {
        return
    }

    form.put(url.value, {
        preserveScroll: true,
        preserveState: true,
        onError: () => focusRefused('.fe-stars'),
    })
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
</script>

<template>
    <section class="adm-section fe-stars" aria-labelledby="fe-h-stars">
        <div class="adm-section__head">
            <h2 id="fe-h-stars" class="adm-section__title">Sterne von Hand</h2>
        </div>
        <div class="fe-stars__body">
            <p class="adm-note">
                Sterne, die du anderswo gesammelt hast – etwa in deinem eBay-Shop. Der Shop zeigt sie unter dem Namen der Felge,
                immer zusammen mit deinem Satz, woher sie stammen. Ohne diesen Satz zeigt er keine Sterne.
            </p>

            <p class="fe-stars__now" data-stars-now>
                <template v-if="stated">
                    <span class="fe-stars__label">Im Shop steht:</span>
                    <!-- One line in the source: the spaces between the parts are kept (a line break between them would not be). -->
                    <span class="fe-stars__line"><span class="fe-stars__glyph" aria-hidden="true">★</span> <span class="num">{{ stated.label }}</span>{{ ' – ' + stated.origin }}</span>
                </template>
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
                <div class="form-field">
                    <label class="form-field__label" for="fe-stars-origin">Woher die Bewertungen stammen</label>
                    <input
                        id="fe-stars-origin"
                        v-model="form.origin"
                        class="input"
                        type="text"
                        maxlength="200"
                        autocomplete="off"
                        :aria-invalid="errors.origin ? 'true' : undefined"
                        aria-describedby="fe-stars-origin-help fe-stars-origin-err"
                    >
                    <p id="fe-stars-origin-help" class="form-field__help">
                        Ein ganzer Satz, so wie er im Shop neben den Sternen steht – etwa „Bewertungen aus unserem eBay-Shop, Stand
                        Oktober 2026.“ Geprüft hat der Shop diese Sterne nicht, also darf der Satz das auch nicht behaupten.
                    </p>
                    <p id="fe-stars-origin-err" class="form-field__error">{{ errors.origin }}</p>
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
            <p v-else class="adm-note">Sterne von Hand ändern darf, wer Felgen bearbeiten und veröffentlichen darf.</p>
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
