<script setup lang="ts">
/**
 * Gutachten › Konflikte (the corrections memo §3) — every car and wheel two current documents disagree
 * about. The shop answers „Unbekannt“ there until a person decides: „beide gelten jeweils für sich“ (the
 * shop names both and reads them together, the stricter way) or „nur Dokument X gilt“. Both sides stand
 * side by side, as each document says it, with the page to check it on. A decision needs its reason and
 * goes into the Protokoll.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, reactive, ref } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface Side {
    documentId: number
    document: string
    href: string
    pdfHref: string | null
    page: number | null
    requiresEntry: boolean
    sizes: string[]
    conditions: string[]
}

interface Pair {
    key: string
    vehicleId: number
    vehicle: string
    configId: number
    wheel: string
    what: string[]
    sides: Side[]
    decision: { mode: 'each' | 'only'; document: string | null; reason: string; by: string | null; at: string | null } | null
}

const props = defineProps<{
    open: Pair[]
    decided: Pair[]
    can: { decide: boolean }
}>()

const page = usePage()
const focus = useFocusAfter()
const context = computed(() => (props.open.length === 1 ? '1 offen' : `${decimal(props.open.length, 0)} offen`))

/* ── Deciding one pair ─────────────────────────────────────────────────────── */

/** The pair whose decision was sent last: its sentences, not another's. */
const sentFor = ref<string | null>(null)
const busy = ref(false)
const choice = reactive<Record<string, string>>({})
const reason = reactive<Record<string, string>>({})

const errors = computed(() => {
    const bag = (page.props.errors ?? {}) as Record<string, string | undefined>

    return (key: string, field: string): string => (sentFor.value === key ? (bag[field] ?? '') : '')
})

function decide(pair: Pair): void {
    if (busy.value) {
        return
    }

    const picked = choice[pair.key] ?? ''
    const only = picked.startsWith('only:')

    busy.value = true
    sentFor.value = pair.key
    router.post(
        '/admin/konflikte/entscheiden',
        {
            vehicle_id: pair.vehicleId,
            wheel_config_id: pair.configId,
            mode: picked === '' ? '' : only ? 'only' : 'each',
            document_id: only ? Number(picked.slice(5)) : null,
            reason: reason[pair.key] ?? '',
        },
        {
            preserveScroll: true,
            onSuccess: () => {
                sentFor.value = null
                // The pair has left the list: the keyboard goes to the next one, or the page's title.
                const next = props.open[0]
                focus.request(next ? [`kf-h-${next.key}`, 'kf-title'] : ['kf-title'])
            },
            onError: (bag: Record<string, string>) => {
                focus.request(bag.mode || bag.document_id ? `kf-choice-${pair.key}-0` : `kf-reason-${pair.key}`)
            },
            onFinish: () => {
                busy.value = false
            },
        }
    )
}
</script>

<template>
    <AdminPage title="Konflikte" :context="context">
        <p id="kf-title" class="adm-note kf-intro" tabindex="-1">
            Hier sagen zwei gültige Gutachten zur selben Kombination aus Fahrzeug und Felge Verschiedenes. Bis du entscheidest, sagt der Shop dort „Unbekannt“ – nie von sich aus das eine oder das andere.
        </p>

        <AdminState v-if="open.length === 0" kind="empty" text="Kein Konflikt offen. Ein neuer steht hier, sobald eine Freigabe einem anderen Gutachten widerspricht." />

        <section v-for="pair in open" :id="`konflikt-${pair.key}`" :key="pair.key" class="kf-pair" :aria-labelledby="`kf-h-${pair.key}`">
            <div class="kf-pair__head">
                <h2 :id="`kf-h-${pair.key}`" class="kf-pair__title" tabindex="-1">{{ pair.vehicle }}</h2>
                <p class="kf-pair__wheel">{{ pair.wheel }}</p>
                <p class="kf-what">Unterschiedlich: {{ pair.what.join(', ') }}</p>
            </div>

            <div class="kf-sides">
                <article v-for="side in pair.sides" :key="side.documentId" class="kf-side">
                    <h3 class="kf-side__title"><a :href="side.href">{{ side.document }}</a></h3>
                    <p v-if="side.pdfHref" class="kf-side__page">
                        <a :href="side.pdfHref" target="_blank" rel="noopener">{{ side.page ? `Seite ${side.page} im PDF` : 'PDF öffnen' }}</a>
                    </p>
                    <dl class="kf-facts">
                        <div class="kf-facts__row">
                            <dt>Eintragung</dt>
                            <dd>{{ side.requiresEntry ? 'Erforderlich' : 'Nicht erforderlich' }}</dd>
                        </div>
                        <div class="kf-facts__row">
                            <dt>Reifen</dt>
                            <dd>
                                <span v-if="side.sizes.length === 0">–</span>
                                <span v-for="size in side.sizes" :key="size" class="kf-line">{{ size }}</span>
                            </dd>
                        </div>
                        <div class="kf-facts__row">
                            <dt>Auflagen</dt>
                            <dd>
                                <span v-if="side.conditions.length === 0">–</span>
                                <span v-for="line in side.conditions" :key="line" class="kf-line">{{ line }}</span>
                            </dd>
                        </div>
                    </dl>
                </article>
            </div>

            <form v-if="can.decide" class="kf-decide" novalidate @submit.prevent="decide(pair)">
                <fieldset class="kf-choices">
                    <legend class="form-field__label">Wie gelten die Gutachten?</legend>
                    <label class="kf-choice">
                        <input :id="`kf-choice-${pair.key}-0`" v-model="choice[pair.key]" type="radio" :name="`kf-${pair.key}`" value="each" :aria-describedby="`kf-choice-${pair.key}-err`">
                        <span>Beide gelten jeweils für sich – der Shop nennt beide und liest sie zusammen, im Zweifel streng.</span>
                    </label>
                    <label v-for="side in pair.sides" :key="side.documentId" class="kf-choice">
                        <input v-model="choice[pair.key]" type="radio" :name="`kf-${pair.key}`" :value="`only:${side.documentId}`" :aria-describedby="`kf-choice-${pair.key}-err`">
                        <span>Nur {{ side.document }} gilt.</span>
                    </label>
                    <p :id="`kf-choice-${pair.key}-err`" class="form-field__error">{{ errors(pair.key, 'mode') || errors(pair.key, 'document_id') }}</p>
                </fieldset>
                <div class="form-field">
                    <label class="form-field__label" :for="`kf-reason-${pair.key}`">Warum?</label>
                    <textarea
                        :id="`kf-reason-${pair.key}`"
                        v-model="reason[pair.key]"
                        class="input kf-reason"
                        rows="2"
                        maxlength="1000"
                        :aria-invalid="errors(pair.key, 'reason') ? 'true' : undefined"
                        :aria-describedby="`kf-reason-${pair.key}-help kf-reason-${pair.key}-err`"
                    />
                    <p :id="`kf-reason-${pair.key}-help`" class="form-field__help">Steht im Protokoll – zum Beispiel, was der Hersteller oder die Prüfstelle gesagt hat.</p>
                    <p :id="`kf-reason-${pair.key}-err`" class="form-field__error">{{ errors(pair.key, 'reason') }}</p>
                </div>
                <div>
                    <button class="btn btn--primary" type="submit" :disabled="busy" :aria-busy="busy && sentFor === pair.key ? 'true' : undefined">Entscheiden</button>
                </div>
            </form>
        </section>

        <section v-if="decided.length" class="adm-section kf-done" aria-labelledby="kf-done-h">
            <div class="adm-section__head">
                <h2 id="kf-done-h" class="adm-section__title">Entschieden</h2>
            </div>
            <div class="adm-panel">
                <table class="adm-table">
                    <caption class="visually-hidden">Die letzten Entscheidungen</caption>
                    <thead>
                        <tr>
                            <th scope="col">Fahrzeug und Felge</th>
                            <th scope="col">Entscheidung</th>
                            <th scope="col">Grund</th>
                            <th scope="col">Von</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="pair in decided" :key="pair.key">
                            <td data-label="Fahrzeug und Felge">
                                {{ pair.vehicle }}
                                <span class="adm-table__sub">{{ pair.wheel }}</span>
                            </td>
                            <td data-label="Entscheidung">{{ pair.decision?.mode === 'only' ? `Nur ${pair.decision?.document ?? 'ein Gutachten'} gilt` : 'Beide gelten' }}</td>
                            <td data-label="Grund" class="kf-text">{{ pair.decision?.reason }}</td>
                            <td data-label="Von">
                                {{ pair.decision?.by ?? '–' }}
                                <span v-if="pair.decision?.at" class="adm-table__sub">{{ pair.decision.at }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </AdminPage>
</template>

<style scoped>
.kf-intro {
    max-width: 64ch;
    margin-bottom: var(--sp-24);
}

.kf-pair {
    display: grid;
    gap: var(--sp-16);
    padding-block: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

.kf-pair__head {
    display: grid;
    gap: var(--sp-4);
}

.kf-pair__title {
    margin: 0;
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
    overflow-wrap: anywhere;
}

.kf-pair__wheel,
.kf-what {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.kf-what {
    color: var(--c-warn);
}

.kf-sides {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 32ch), 1fr));
    gap: var(--sp-16);
}

.kf-side {
    display: grid;
    align-content: start;
    gap: var(--sp-8);
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.kf-side__title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.kf-side__page {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.kf-facts {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
}

.kf-facts__row {
    display: grid;
    grid-template-columns: 11ch minmax(0, 1fr);
    gap: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.kf-facts dt {
    color: var(--c-ink-3);
}

.kf-facts dd {
    margin: 0;
}

.kf-line {
    display: block;
    overflow-wrap: anywhere;
}

.kf-decide {
    display: grid;
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
}

.kf-choices {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
}

.kf-choice {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-8);
    min-height: var(--adm-control-h);
    padding-block: var(--sp-4);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    cursor: pointer;
}

.kf-choice input {
    flex: none;
    margin: 0;
    accent-color: var(--c-ink);
}

.kf-reason {
    min-height: calc(var(--adm-control-h) * 2);
    resize: vertical;
}

.kf-decide .form-field__error:empty {
    display: none;
}

.kf-text {
    overflow-wrap: anywhere;
}

.kf-done {
    margin-top: var(--sp-32);
}

@media (max-width: 767px) {
    .kf-choice {
        min-height: var(--adm-control-h-lg);
    }

    .kf-facts__row {
        grid-template-columns: minmax(0, 1fr);
        gap: 0;
    }
}
</style>
