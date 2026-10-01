<script setup lang="ts">
/**
 * `/bewertung/{number}` — the page the review invitation links to (the client's #19, D-103). The rims of one delivered
 * order, each rated once: five stars as a radio group (arrow keys move, each star names its count), and a sentence if
 * the buyer likes. A rim already rated shows its stars and stays as it is. The form goes back to the same signed
 * address, so the signature that proves the purchase travels with it.
 */

import { Head, Link, useForm } from '@inertiajs/vue3'
import { computed } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Ui/Icon.vue'

defineOptions({ layout: AppLayout })

interface Line {
    line: number
    label: string
    wheelModelId: number
    quantity: number
    review: { rating: number; body: string | null } | null
}

const props = defineProps<{ number: string; lines: Line[]; action: string }>()

const open = computed(() => props.lines.filter((l) => l.review === null))

const form = useForm({
    reviews: Object.fromEntries(props.lines.filter((l) => l.review === null).map((l) => [l.line, { rating: 0, body: '' }])) as Record<number, { rating: number; body: string }>,
})

const ready = computed(() => Object.values(form.reviews).some((r) => r.rating > 0))

function starsLabel(n: number): string {
    return n === 1 ? '1 Stern' : `${n} Sterne`
}

function submit(): void {
    if (!ready.value || form.processing) {
        return
    }

    // Only the rims that got stars: a rim left without is not rated, not rated badly.
    form.transform((data) => ({
        reviews: Object.fromEntries(Object.entries(data.reviews).filter(([, r]) => r.rating > 0).map(([line, r]) => [line, { rating: r.rating, body: r.body.trim() === '' ? null : r.body.trim() }])),
    })).post(props.action, { preserveScroll: true })
}
</script>

<template>
    <Head title="Felgen bewerten" />

    <section class="section-dense">
        <div class="wrap bw">
            <h1 class="t-h1">Wie zufrieden bist du mit deinen Felgen?</h1>
            <p class="t-lead bw__lead">
                Bestellung <span class="num" translate="no">{{ number }}</span>. Ein paar Sterne genügen, ein Satz dazu ist freiwillig.
            </p>

            <form v-if="open.length > 0" class="bw__form" novalidate @submit.prevent="submit">
                <ul class="bw__lines">
                    <li v-for="line in lines" :key="line.line" class="card bw__line">
                        <p class="bw__label">{{ line.label }}</p>
                        <p class="t-small quiet">{{ line.quantity === 1 ? '1 Stück' : `${line.quantity} Stück` }}</p>

                        <!-- Already rated: the stars as given, nothing to change. -->
                        <template v-if="line.review">
                            <p class="bw__given" :aria-label="`Du hast ${starsLabel(line.review.rating)} gegeben`">
                                <Icon v-for="n in 5" :key="n" name="star" :size="24" :class="n <= line.review.rating ? 'bw__on' : 'bw__off'" />
                            </p>
                            <p v-if="line.review.body" class="bw__body">„{{ line.review.body }}“</p>
                            <p class="t-small quiet">Danke, diese Felge hast du schon bewertet.</p>
                        </template>

                        <template v-else-if="form.reviews[line.line]">
                            <fieldset class="bw__stars">
                                <legend class="visually-hidden">Sterne für {{ line.label }}</legend>
                                <label v-for="n in 5" :key="n" class="bw__star" :class="{ 'bw__on': n <= form.reviews[line.line]!.rating }">
                                    <input
                                        v-model="form.reviews[line.line]!.rating"
                                        type="radio"
                                        class="visually-hidden"
                                        :name="`bw-${line.line}`"
                                        :value="n"
                                    >
                                    <Icon name="star" :size="24" />
                                    <span class="visually-hidden">{{ starsLabel(n) }}</span>
                                </label>
                            </fieldset>
                            <div class="form-field bw__field">
                                <label class="form-field__label" :for="`bw-text-${line.line}`">Was möchtest du anderen dazu sagen? (freiwillig)</label>
                                <textarea :id="`bw-text-${line.line}`" v-model="form.reviews[line.line]!.body" class="input bw__area" rows="3" maxlength="1000" />
                            </div>
                        </template>
                    </li>
                </ul>

                <p class="t-small quiet bw__note">
                    Deine Bewertung erscheint auf der Seite der Felge – ohne deinen Namen, als Bewertung eines geprüften Kaufs.
                </p>
                <p v-if="form.errors.reviews" class="form-field__error" role="alert">{{ form.errors.reviews }}</p>

                <button class="btn btn--primary btn--lg bw__go" type="submit" :disabled="!ready || form.processing" :aria-busy="form.processing ? 'true' : undefined">
                    Bewertung abschicken
                </button>
            </form>

            <div v-else class="card bw__done">
                <p class="t-body">Danke! Du hast alle Felgen dieser Bestellung bewertet.</p>
                <ul class="bw__lines">
                    <li v-for="line in lines" :key="line.line" class="bw__done-line">
                        <span>{{ line.label }}</span>
                        <span v-if="line.review" class="bw__given" :aria-label="starsLabel(line.review.rating)">
                            <Icon v-for="n in 5" :key="n" name="star" :size="20" :class="n <= line.review.rating ? 'bw__on' : 'bw__off'" />
                        </span>
                    </li>
                </ul>
                <Link href="/felgen" class="btn btn--secondary">Zu den Felgen</Link>
            </div>
        </div>
    </section>
</template>

<style scoped>
.bw {
    display: grid;
    gap: var(--space-4);
    max-width: 760px;
}

.bw__lead {
    margin: 0;
}

.bw__form,
.bw__done {
    display: grid;
    gap: var(--space-4);
}

.bw__lines {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
}

.bw__line {
    display: grid;
    gap: var(--space-2);
}

.bw__label {
    margin: 0;
    font-weight: 700;
}

.bw__stars {
    display: flex;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    border: 0;
}

/* Each star is a 44 px target; its colour says whether it is chosen, the hidden label says how many. */
.bw__star {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    color: var(--c-line);
    cursor: pointer;
    border-radius: var(--radius-sm);
}

.bw__star:has(input:focus-visible) {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}

/* `--c-star`: ratings only (DIRECTION §2). */
.bw__on {
    color: var(--c-star);
}

.bw__off {
    color: var(--c-line);
}

.bw__given {
    display: inline-flex;
    gap: var(--space-1);
    margin: 0;
}

.bw__body {
    margin: 0;
}

.bw__field {
    margin-top: var(--space-1);
}

.bw__area {
    height: auto;
    padding-block: var(--space-2);
    resize: vertical;
}

.bw__note {
    margin: 0;
}

.bw__go {
    justify-self: start;
}

.bw__done-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
}
</style>
