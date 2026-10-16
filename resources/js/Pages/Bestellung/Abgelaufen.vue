<script setup lang="ts">
/**
 * Where an order link leads once its twelve months are up (D-240): one sentence saying so, and the way back — the order
 * number and the address the order went to, and a fresh link goes to that same address. The answer is the same whether
 * or not the two belong together, so the page tells nobody which orders exist. Once sent, the sentence stands in the
 * form's place.
 */

import { Head, useForm } from '@inertiajs/vue3'
import { ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

const props = defineProps<{ number: string }>()

const form = useForm({ order_number: props.number, email: '' })
const sent = ref(false)

function submit(): void {
    // The answer comes back to this same page: kept, so the sentence takes the form's place.
    form.post('/bestellung/link', { preserveScroll: true, preserveState: true, onSuccess: () => (sent.value = true) })
}
</script>

<template>
    <Head title="Link abgelaufen" />

    <section class="section--tight">
        <div class="container">
            <div class="ablauf">
                <h1 class="h1">Dieser Link ist abgelaufen</h1>
                <p class="ablauf__lead">Ein Link zu deiner Bestellung gilt zwölf Monate – den neuen schicken wir dir an die Adresse, an die die Bestätigung ging.</p>

                <p v-if="sent" class="ablauf__lead" role="status">
                    Wenn Bestellnummer und Adresse zusammengehören, ist ein neuer Link an {{ form.email }} unterwegs. Er gilt zwölf Monate.
                </p>

                <form v-else class="ablauf__form" novalidate @submit.prevent="submit">
                    <div class="form-field">
                        <label class="form-field__label" for="ablauf-nummer">Bestellnummer</label>
                        <input id="ablauf-nummer" v-model="form.order_number" class="input" type="text" autocomplete="off" aria-describedby="ablauf-nummer-err" :aria-invalid="form.errors.order_number ? 'true' : undefined">
                        <p id="ablauf-nummer-err" class="form-field__error">{{ form.errors.order_number ?? '' }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="ablauf-mail">E-Mail-Adresse der Bestellung</label>
                        <input id="ablauf-mail" v-model="form.email" class="input" type="email" inputmode="email" autocomplete="email" aria-describedby="ablauf-mail-err" :aria-invalid="form.errors.email ? 'true' : undefined">
                        <p id="ablauf-mail-err" class="form-field__error">{{ form.errors.email ?? '' }}</p>
                    </div>
                    <div>
                        <button class="btn btn--primary" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Neuen Link schicken</button>
                    </div>
                </form>
            </div>
        </div>
    </section>
</template>

<style scoped>
.ablauf {
    max-width: calc(54 * var(--ch-text));
}

.ablauf__lead {
    margin-top: var(--sp-8);
    color: var(--c-ink-2);
}

.ablauf__form {
    display: grid;
    gap: var(--sp-16);
    margin-top: var(--sp-24);
}
</style>
