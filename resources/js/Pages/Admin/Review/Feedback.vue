<script setup lang="ts">
/**
 * Review › Rückmeldungen (the review release §3): every point of the review with where it was made,
 * what it looked like and what was said — and our answer: its state (neu, angenommen, erledigt,
 * abgelehnt with a reason), who has it, and what we say back. Filtered by kind, screen and state.
 * `R` gives a new point from anywhere; `php artisan review:report` writes these out.
 */

import { router, useForm } from '@inertiajs/vue3'
import { ref, watch } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface Item {
    id: number
    type: string
    typeLabel: string
    sentence: string
    url: string
    screen: string
    viewport: string
    browser: string
    role: string | null
    by: string | null
    at: string | null
    status: string
    statusLabel: string
    answer: string
    assigneeId: number | null
    assignee: string | null
    closedAt: string | null
    image: string | null
}

const props = defineProps<{
    items: Item[]
    filters: { typ: string; seite: string; status: string }
    types: { value: string; label: string }[]
    statuses: { value: string; label: string }[]
    screens: string[]
    team: { value: number; label: string }[]
    can: { answer: boolean }
}>()

const typ = ref(props.filters.typ)
const seite = ref(props.filters.seite)
const status = ref(props.filters.status)

watch(
    () => props.filters,
    (filters) => {
        typ.value = filters.typ
        seite.value = filters.seite
        status.value = filters.status
    }
)

function apply(): void {
    const query: Record<string, string> = {}

    if (typ.value) {
        query.typ = typ.value
    }

    if (seite.value) {
        query.seite = seite.value
    }

    if (status.value && status.value !== 'offen') {
        query.status = status.value
    }

    router.get('/admin/review/rueckmeldungen', query, { preserveScroll: true, preserveState: true })
}

/* ── Answering one point ─────────────────────────────────────────────────── */

const editing = ref<number | null>(null)
const answer = useForm({ status: 'neu', answer: '', assignee_id: null as number | null })

function edit(item: Item): void {
    editing.value = item.id
    answer.defaults({ status: item.status, answer: item.answer, assignee_id: item.assigneeId })
    answer.reset()
    answer.clearErrors()
}

function save(item: Item): void {
    answer.patch(`/admin/review/rueckmeldungen/${item.id}`, { preserveScroll: true, onSuccess: () => (editing.value = null) })
}

function tag(stateValue: string): string | null {
    return stateValue === 'neu' ? 'adm-tag adm-tag--neutral' : null
}
</script>

<template>
    <AdminPage title="Rückmeldungen" :context="items.length === 1 ? '1 Rückmeldung' : `${decimal(items.length, 0)} Rückmeldungen`">
        <form class="rf-filters" @submit.prevent="apply">
            <div class="form-field">
                <label class="form-field__label" for="rf-typ">Art</label>
                <select id="rf-typ" v-model="typ" class="input">
                    <option value="">Alle</option>
                    <option v-for="option in types" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="rf-seite">Seite</label>
                <select id="rf-seite" v-model="seite" class="input">
                    <option value="">Alle</option>
                    <option v-for="screen in screens" :key="screen" :value="screen">{{ screen }}</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-field__label" for="rf-status">Stand</label>
                <select id="rf-status" v-model="status" class="input">
                    <option value="offen">Offen (neu und angenommen)</option>
                    <option value="alle">Alle</option>
                    <option v-for="option in statuses" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
            </div>
            <div class="rf-filters__go">
                <button class="btn btn--secondary" type="submit">Anwenden</button>
            </div>
        </form>

        <AdminState v-if="items.length === 0" kind="empty" text="Hier erscheint jede Rückmeldung aus der Review. Gib die erste unten links – oder drück R." />

        <ol v-else class="rf-list">
            <li v-for="item in items" :key="item.id" class="rf-item">
                <div class="rf-item__head">
                    <span class="rf-item__id">#{{ item.id }}</span>
                    <span class="rf-item__kind">{{ item.typeLabel }} · {{ item.screen }}</span>
                    <span v-if="tag(item.status)" :class="tag(item.status)">{{ item.statusLabel }}</span>
                    <span v-else class="rf-item__state">{{ item.statusLabel }}<template v-if="item.closedAt"> am {{ item.closedAt }}</template></span>
                </div>

                <div class="rf-item__body">
                    <a v-if="item.image" :href="item.image" target="_blank" rel="noopener" class="rf-item__shot">
                        <img :src="item.image" :alt="`Bildschirmfoto zu Rückmeldung ${item.id}`" loading="lazy">
                    </a>
                    <div class="rf-item__text">
                        <p class="rf-item__sentence">{{ item.sentence }}</p>
                        <p class="rf-item__meta">
                            <a :href="item.url">{{ item.url }}</a> · {{ item.viewport }} · {{ item.browser }}<template v-if="item.role"> · {{ item.role }}</template> ·
                            {{ item.by ?? 'unbekannt' }}, {{ item.at }}
                        </p>
                        <p v-if="item.answer && editing !== item.id" class="rf-item__answer"><strong>Unsere Antwort:</strong> {{ item.answer }}</p>
                        <p v-if="item.assignee && editing !== item.id" class="rf-item__meta">Bei {{ item.assignee }}</p>
                        <div v-if="can.answer" class="rf-item__actions">
                            <button v-if="editing !== item.id" class="btn btn--secondary rf-item__answerbtn" type="button" @click="edit(item)">Beantworten</button>
                            <form v-else class="rf-answer" @submit.prevent="save(item)">
                                <div class="rf-answer__pair">
                                    <div class="form-field">
                                        <label class="form-field__label" :for="`rf-a-status-${item.id}`">Stand</label>
                                        <select :id="`rf-a-status-${item.id}`" v-model="answer.status" class="input">
                                            <option v-for="option in statuses" :key="option.value" :value="option.value">{{ option.label }}</option>
                                        </select>
                                    </div>
                                    <div class="form-field">
                                        <label class="form-field__label" :for="`rf-a-who-${item.id}`">Zuständig</label>
                                        <select :id="`rf-a-who-${item.id}`" v-model="answer.assignee_id" class="input">
                                            <option :value="null">Niemand</option>
                                            <option v-for="person in team" :key="person.value" :value="person.value">{{ person.label }}</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-field">
                                    <label class="form-field__label" :for="`rf-a-text-${item.id}`">{{ answer.status === 'abgelehnt' ? 'Begründung' : 'Antwort' }}</label>
                                    <textarea
                                        :id="`rf-a-text-${item.id}`"
                                        v-model="answer.answer"
                                        class="input rf-area"
                                        rows="3"
                                        maxlength="2000"
                                        :aria-invalid="answer.errors.answer ? 'true' : undefined"
                                        :aria-describedby="`rf-a-text-${item.id}-err`"
                                    />
                                    <p :id="`rf-a-text-${item.id}-err`" class="form-field__error">{{ answer.errors.answer }}</p>
                                </div>
                                <div class="rf-answer__go">
                                    <button class="btn btn--primary" type="submit" :disabled="answer.processing">Speichern</button>
                                    <button class="btn btn--ghost" type="button" @click="editing = null">Abbrechen</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </li>
        </ol>
    </AdminPage>
</template>

<style scoped>
.rf-filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    align-items: end;
    gap: var(--sp-16);
    margin-bottom: var(--sp-24);
}

.rf-list {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.rf-item {
    display: grid;
    gap: var(--sp-12);
    padding-block: var(--sp-16);
    border-bottom: 1px solid var(--c-line);
}

.rf-item__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.rf-item__id {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.rf-item__kind,
.rf-item__state {
    color: var(--c-ink-2);
}

.rf-item__body {
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr);
    gap: var(--sp-16);
    align-items: start;
}

.rf-item__body:not(:has(.rf-item__shot)) {
    grid-template-columns: minmax(0, 1fr);
}

.rf-item__shot img {
    display: block;
    width: 160px;
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
}

.rf-item__text {
    display: grid;
    gap: var(--sp-8);
    min-width: 0;
}

.rf-item__sentence {
    margin: 0;
    max-width: 72ch;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    overflow-wrap: anywhere;
}

.rf-item__meta,
.rf-item__answer {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

.rf-item__answer strong {
    color: var(--c-ink);
    font-weight: 500;
}

/* A bordered button, so its edge lines up with the sentence above it. */
.rf-item__actions {
    margin-top: var(--sp-4);
}

.rf-answer {
    display: grid;
    gap: var(--sp-12);
    max-width: var(--adm-form-max);
}

.rf-answer .form-field__error:empty {
    display: none;
}

.rf-answer__pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-12);
}

.rf-answer__go {
    display: flex;
    gap: var(--sp-8);
}

.rf-area {
    height: auto;
    padding-block: var(--sp-8);
    resize: vertical;
}

@media (max-width: 1023px) {
    .rf-filters {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 767px) {
    .rf-filters,
    .rf-answer__pair,
    .rf-item__body {
        grid-template-columns: minmax(0, 1fr);
    }

    /* The screenshot stays a thumbnail — its top strip — so one point never fills the screen. */
    .rf-item__shot img {
        height: 120px;
        object-fit: cover;
        object-position: top;
    }

    .rf-filters .btn,
    .rf-answer .btn,
    .rf-item__actions .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
