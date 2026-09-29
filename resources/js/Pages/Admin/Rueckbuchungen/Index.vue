<script setup lang="ts">
/**
 * Verkauf › Rückbuchungen (Block G §5): the chargebacks Stripe reported, open ones first — each with its reason, the
 * amount, the order, and the days left to answer, counted down, because an unanswered one is money gone. Answered
 * here once: an explanation for the bank and up to two files; the order's invoice goes with them as the receipt.
 * Stripe takes one answer per chargeback, so the button asks before it sends.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { computed, reactive, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import FilePick from '../../../Components/Admin/FilePick.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { formatMoney } from '../../../lib/num'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface DisputeRow {
    id: number
    reference: string
    reason: string
    status: string
    amount: number
    order: { id: number; number: string } | null
    dueBy: string | null
    daysLeft: number | null
    overdue: boolean
    open: boolean
    answered: boolean
    answeredAt: string | null
    outcome: string | null
}

const props = defineProps<{ disputes: DisputeRow[]; canRespond: boolean }>()

const page = usePage()
const errors = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

const context = computed(() => {
    const open = props.disputes.filter((d) => d.open).length

    return props.disputes.length === 0 ? 'Keine Rückbuchung' : `${open} offen · ${props.disputes.length} insgesamt`
})

/** „noch 5 Tage“, „noch heute“, „Frist abgelaufen“ — the deadline the bank set, counted down. */
function countdown(row: DisputeRow): string | null {
    if (row.daysLeft === null) {
        return null
    }

    if (row.overdue) {
        return 'Frist abgelaufen'
    }

    return row.daysLeft === 0 ? 'noch heute' : row.daysLeft === 1 ? 'noch 1 Tag' : `noch ${row.daysLeft} Tage`
}

function urgency(row: DisputeRow): string | null {
    if (row.overdue) {
        return 'adm-tag adm-tag--bad'
    }

    return row.daysLeft !== null && row.daysLeft <= 3 ? 'adm-tag adm-tag--warn' : 'adm-tag adm-tag--neutral'
}

/* One answer at a time: the dispute being answered, its note and its two files. */
const answering = ref<DisputeRow | null>(null)
const form = reactive<{ note: string; shipping: File | null; other: File | null }>({ note: '', shipping: null, other: null })
const confirmOpen = ref(false)
const busy = ref(false)

function answer(row: DisputeRow): void {
    answering.value = row
    form.note = ''
    form.shipping = null
    form.other = null
}

function send(): void {
    const row = answering.value

    if (row === null) {
        return
    }

    busy.value = true
    router.post(`/admin/rueckbuchungen/${row.id}/nachweise`, { note: form.note, shipping: form.shipping, other: form.other }, {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
            answering.value = null
        },
        onFinish: () => {
            busy.value = false
            confirmOpen.value = false
        },
    })
}
</script>

<template>
    <AdminPage title="Rückbuchungen" :context="context" :read-only="!canRespond">
        <p class="adm-note rb__lead">
            Eine Rückbuchung holt eine Zahlung über die Bank zurück. Bis zur Frist kannst du einmal antworten: was bestellt,
            wann versandt und zugestellt wurde – die Rechnung geht von selbst mit.
        </p>

        <ul v-if="disputes.length" class="rb__list">
            <li v-for="row in disputes" :key="row.id" class="adm-panel rb__item" :class="{ 'rb__item--closed': !row.open }">
                <div class="rb__head">
                    <p class="rb__title"><span class="rb__amount">{{ formatMoney(row.amount) }}</span> · {{ row.reason }}</p>
                    <span v-if="row.open && countdown(row)" :class="urgency(row)">{{ countdown(row) }}</span>
                </div>
                <dl class="adm-facts">
                    <div class="adm-facts__row"><dt>Stand</dt><dd>{{ row.status }}</dd></div>
                    <div class="adm-facts__row">
                        <dt>Bestellung</dt>
                        <dd><Link v-if="row.order" :href="`/admin/bestellungen/${row.order.id}`">{{ row.order.number }}</Link><template v-else>keiner Bestellung zugeordnet</template></dd>
                    </div>
                    <div v-if="row.dueBy && row.open" class="adm-facts__row"><dt>Antwort bis</dt><dd>{{ row.dueBy }}</dd></div>
                    <div v-if="row.answered" class="adm-facts__row"><dt>Nachweise</dt><dd>gesendet am {{ row.answeredAt }}</dd></div>
                    <div v-if="row.outcome" class="adm-facts__row"><dt>Ergebnis</dt><dd>{{ row.outcome }}</dd></div>
                    <div class="adm-facts__row"><dt>Bei Stripe</dt><dd class="rb__ref">{{ row.reference }}</dd></div>
                </dl>

                <template v-if="canRespond && row.open && !row.answered">
                    <button v-if="answering?.id !== row.id" class="btn btn--secondary" type="button" @click="answer(row)">Antworten</button>

                    <form v-else class="rb__form" novalidate @submit.prevent="confirmOpen = true">
                        <div class="form-field">
                            <label class="form-field__label" :for="`rb-note-${row.id}`">Was geschehen ist</label>
                            <textarea :id="`rb-note-${row.id}`" v-model="form.note" class="input" rows="6" maxlength="20000" :aria-describedby="`rb-note-help-${row.id} rb-err-${row.id}`" />
                            <p :id="`rb-note-help-${row.id}`" class="form-field__help">Für die Bank, sachlich: was bestellt wurde, wann versandt, mit welcher Sendungsnummer zugestellt.</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" :for="`rb-ship-${row.id}`">Versandnachweis (PDF oder Bild)</label>
                            <FilePick :id="`rb-ship-${row.id}`" v-model="form.shipping" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" label="Datei auswählen" />
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" :for="`rb-other-${row.id}`">Weiterer Nachweis (optional)</label>
                            <FilePick :id="`rb-other-${row.id}`" v-model="form.other" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" label="Datei auswählen" />
                        </div>
                        <p :id="`rb-err-${row.id}`" class="form-field__error" role="alert">{{ errors.evidence ?? errors.note ?? errors.shipping ?? errors.other ?? '' }}</p>
                        <div class="adm-fields__actions">
                            <button class="btn btn--primary" type="submit" :disabled="busy">Nachweise an Stripe senden …</button>
                            <button class="btn btn--secondary" type="button" @click="answering = null">Abbrechen</button>
                        </div>
                    </form>
                </template>
            </li>
        </ul>

        <AdminState v-else kind="empty" text="Meldet Stripe eine Rückbuchung, steht sie hier – mit der Frist für die Antwort." />

        <AdminConfirm
            v-model:open="confirmOpen"
            title="Nachweise senden?"
            body="Stripe nimmt pro Rückbuchung eine Antwort an; danach entscheidet die Bank. Die Rechnung geht mit."
            confirm-label="Senden"
            :busy="busy"
            @confirm="send"
        />
    </AdminPage>
</template>

<style scoped>
.rb__lead {
    max-width: var(--adm-form-max);
    margin-bottom: var(--sp-24);
}

.rb__list {
    display: grid;
    gap: var(--sp-16);
    margin: 0;
    padding: 0;
    list-style: none;
}

.rb__item {
    display: grid;
    gap: var(--sp-16);
    padding: var(--sp-16) var(--sp-20);
}

.rb__item--closed {
    color: var(--c-ink-2);
}

.rb__head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-8) var(--sp-16);
}

.rb__title {
    margin: 0;
    font-weight: 500;
}

.rb__amount {
    font-variant-numeric: tabular-nums;
}

.rb__ref {
    overflow-wrap: anywhere;
    font-size: var(--fs-small);
}

.rb__form {
    display: grid;
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
}

.rb__form .form-field__error:empty {
    display: none;
}
</style>
