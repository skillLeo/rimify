<script setup lang="ts">
/**
 * Verkauf › Bewertungen (the client's #19, D-103): every buyer's review, newest first — its stars, its text, the wheel
 * and the order it came from. The team hides one with a reason (it then no longer counts towards the wheel's rating),
 * shows it again, or answers it under its text. There is no „Neue Bewertung“: a review comes only from a delivered
 * order's own signed link, so the stars in the shop are always the buyers'.
 */

import { Link, router, useForm } from '@inertiajs/vue3'
import { nextTick, ref } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface Item {
    id: number
    rating: number
    body: string | null
    wheel: string
    wheelHref: string | null
    order: string | null
    orderHref: string | null
    at: string | null
    hidden: boolean
    hiddenReason: string | null
    hiddenAt: string | null
    reply: string | null
    repliedAt: string | null
}

const props = defineProps<{
    items: Item[]
    total: number
    filter: string
    filters: { value: string; label: string }[]
    canModerate: boolean
}>()

const status = ref(props.filter)

function apply(): void {
    router.get('/admin/bewertungen', status.value === 'alle' ? {} : { status: status.value }, { preserveScroll: true, preserveState: true })
}

function resetFilter(): void {
    status.value = 'alle'
    apply()
}

function stars(n: number): string {
    return n === 1 ? '1 von 5 Sternen' : `${n} von 5 Sternen`
}

/* ── One review at a time: hiding asks why, answering opens the answer ───────────── */

const open = ref<{ id: number; what: 'hide' | 'reply' } | null>(null)
const hideForm = useForm({ reason: '' })
const replyForm = useForm({ reply: '' })

function start(item: Item, what: 'hide' | 'reply'): void {
    open.value = { id: item.id, what }
    hideForm.reset()
    hideForm.clearErrors()
    replyForm.defaults({ reply: item.reply ?? '' })
    replyForm.reset()
    replyForm.clearErrors()
    void nextTick(() => document.getElementById(`bw-${what}-${item.id}`)?.focus())
}

function close(id: number): void {
    const what = open.value?.what
    open.value = null
    void nextTick(() => document.querySelector<HTMLElement>(`[data-start="${what}-${id}"]`)?.focus())
}

function hide(item: Item): void {
    hideForm.post(`/admin/bewertungen/${item.id}/ausblenden`, { preserveScroll: true, onSuccess: () => close(item.id) })
}

function reveal(item: Item): void {
    router.post(`/admin/bewertungen/${item.id}/einblenden`, {}, { preserveScroll: true })
}

function reply(item: Item): void {
    replyForm.put(`/admin/bewertungen/${item.id}/antwort`, { preserveScroll: true, onSuccess: () => close(item.id) })
}
</script>

<template>
    <AdminPage title="Bewertungen" :context="items.length === 1 ? '1 Bewertung' : `${decimal(items.length, 0)} Bewertungen`">
        <p class="bwa-lead">
            Hier stehen die Bewertungen der Käuferinnen und Käufer. Sie kommen nur über den Link aus der Einladung, die der
            Shop einige Tage nach „Zugestellt“ verschickt – anlegen kann sie hier niemand. Eine ausgeblendete Bewertung
            zählt nicht mehr zur Bewertung der Felge.
        </p>

        <form class="bwa-filters" @submit.prevent="apply">
            <div class="form-field">
                <label class="form-field__label" for="bwa-status">Zeigen</label>
                <select id="bwa-status" v-model="status" class="input">
                    <option v-for="option in filters" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
            </div>
            <div class="bwa-filters__go">
                <button class="btn btn--secondary" type="submit">Anwenden</button>
            </div>
        </form>

        <AdminState v-if="items.length === 0 && total === 0" kind="empty" text="Hier erscheint jede Bewertung, sobald eine Käuferin oder ein Käufer über den Link aus der Einladung bewertet hat." />
        <AdminState v-else-if="items.length === 0" kind="filtered" :total="total" @reset="resetFilter" />

        <ol v-else class="bwa-list">
            <li v-for="item in items" :key="item.id" class="bwa-item" :class="{ 'bwa-item--hidden': item.hidden }">
                <div class="bwa-item__head">
                    <span class="bwa-stars" :aria-label="stars(item.rating)" role="img">
                        <Icon v-for="n in 5" :key="n" name="ratings" :size="16" :class="n <= item.rating ? 'bwa-on' : 'bwa-off'" />
                    </span>
                    <Link v-if="item.wheelHref" :href="item.wheelHref" class="bwa-item__wheel">{{ item.wheel }}</Link>
                    <span v-else class="bwa-item__wheel">{{ item.wheel }}</span>
                    <span class="bwa-item__meta">
                        <template v-if="item.orderHref">aus <Link :href="item.orderHref">{{ item.order }}</Link>, </template>{{ item.at }}
                    </span>
                    <span v-if="item.hidden" class="adm-tag adm-tag--neutral">Ausgeblendet</span>
                </div>

                <p v-if="item.body" class="bwa-item__body">„{{ item.body }}“</p>
                <p v-else class="bwa-item__meta">Nur Sterne, ohne Text.</p>

                <p v-if="item.hidden" class="bwa-item__meta">Ausgeblendet am {{ item.hiddenAt }}: {{ item.hiddenReason }}</p>
                <p v-if="item.reply && open?.id !== item.id" class="bwa-item__reply"><strong>Unsere Antwort</strong> ({{ item.repliedAt }}): {{ item.reply }}</p>

                <div v-if="canModerate" class="bwa-item__actions">
                    <template v-if="open?.id !== item.id">
                        <button class="btn btn--secondary" type="button" :data-start="`reply-${item.id}`" @click="start(item, 'reply')">
                            {{ item.reply ? 'Antwort ändern' : 'Antworten' }}
                        </button>
                        <button v-if="!item.hidden" class="btn btn--ghost" type="button" :data-start="`hide-${item.id}`" @click="start(item, 'hide')">Ausblenden</button>
                        <button v-else class="btn btn--ghost" type="button" @click="reveal(item)">Wieder einblenden</button>
                    </template>

                    <form v-else-if="open.what === 'hide'" class="bwa-form" @submit.prevent="hide(item)">
                        <div class="form-field">
                            <label class="form-field__label" :for="`bw-hide-${item.id}`">Warum wird sie ausgeblendet?</label>
                            <input
                                :id="`bw-hide-${item.id}`"
                                v-model="hideForm.reason"
                                class="input"
                                maxlength="500"
                                :aria-invalid="hideForm.errors.reason ? 'true' : undefined"
                                :aria-describedby="`bw-hide-${item.id}-err`"
                            >
                            <p :id="`bw-hide-${item.id}-err`" class="form-field__error">{{ hideForm.errors.reason }}</p>
                        </div>
                        <div class="bwa-form__go">
                            <button class="btn btn--primary" type="submit" :disabled="hideForm.processing">Ausblenden</button>
                            <button class="btn btn--ghost" type="button" @click="close(item.id)">Abbrechen</button>
                        </div>
                    </form>

                    <form v-else class="bwa-form" @submit.prevent="reply(item)">
                        <div class="form-field">
                            <label class="form-field__label" :for="`bw-reply-${item.id}`">Antwort (steht im Shop unter der Bewertung)</label>
                            <textarea
                                :id="`bw-reply-${item.id}`"
                                v-model="replyForm.reply"
                                class="input bwa-area"
                                rows="3"
                                maxlength="1000"
                                :aria-invalid="replyForm.errors.reply ? 'true' : undefined"
                                :aria-describedby="`bw-reply-${item.id}-err`"
                            />
                            <p :id="`bw-reply-${item.id}-err`" class="form-field__error">{{ replyForm.errors.reply }}</p>
                        </div>
                        <div class="bwa-form__go">
                            <button class="btn btn--primary" type="submit" :disabled="replyForm.processing">Speichern</button>
                            <button class="btn btn--ghost" type="button" @click="close(item.id)">Abbrechen</button>
                        </div>
                    </form>
                </div>
            </li>
        </ol>
    </AdminPage>
</template>

<style scoped>
.bwa-lead {
    margin: 0 0 var(--sp-24);
    max-width: 72ch;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.bwa-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--sp-16);
    margin-bottom: var(--sp-24);
}

.bwa-filters .form-field {
    min-width: 240px;
}

.bwa-list {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.bwa-item {
    display: grid;
    gap: var(--sp-8);
    padding-block: var(--sp-16);
    border-bottom: 1px solid var(--c-line);
}

.bwa-item--hidden .bwa-item__body,
.bwa-item--hidden .bwa-stars {
    opacity: 0.6;
}

.bwa-item__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.bwa-stars {
    display: inline-flex;
    gap: 2px;
}

/* `--c-star`: ratings only (DIRECTION §2). */
.bwa-on {
    color: var(--c-star);
}

.bwa-off {
    color: var(--c-line);
}

.bwa-item__wheel {
    font-weight: 600;
}

.bwa-item__meta,
.bwa-item__reply {
    margin: 0;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    overflow-wrap: anywhere;
}

.bwa-item__reply strong {
    color: var(--c-ink);
    font-weight: 500;
}

.bwa-item__body {
    margin: 0;
    max-width: 72ch;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    overflow-wrap: anywhere;
}

.bwa-item__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
    margin-top: var(--sp-4);
}

.bwa-form {
    display: grid;
    gap: var(--sp-12);
    width: 100%;
    max-width: var(--adm-form-max);
}

.bwa-form .form-field__error:empty {
    display: none;
}

.bwa-form__go {
    display: flex;
    gap: var(--sp-8);
}

.bwa-area {
    height: auto;
    padding-block: var(--sp-8);
    resize: vertical;
}

@media (max-width: 767px) {
    .bwa-filters .form-field {
        min-width: 0;
        flex: 1 1 100%;
    }

    .bwa-item__actions .btn,
    .bwa-filters .btn,
    .bwa-form .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
