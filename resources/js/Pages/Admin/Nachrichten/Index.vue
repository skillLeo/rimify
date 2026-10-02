<script setup lang="ts">
/**
 * Verkauf › Nachrichten (the client's #12, D-123): what came through the contact form, newest first. The page opens on
 * the unread ones — the queue the rail counts. „Antworten“ opens the team's own mail program addressed to the sender;
 * „Als gelesen markieren“ takes a message out of the queue. Nothing here writes or edits a message.
 */

import { router } from '@inertiajs/vue3'
import { ref } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface Item {
    id: number
    name: string
    email: string
    subject: string
    message: string
    vehicle: string | null
    from: string | null
    at: string | null
    read: boolean
    readAt: string | null
    replyHref: string
}

const props = defineProps<{
    items: Item[]
    total: number
    filter: string
    filters: { value: string; label: string }[]
    canMarkRead: boolean
    keepMonths: number
}>()

const status = ref(props.filter)

function apply(): void {
    router.get('/admin/nachrichten', status.value === 'ungelesen' ? {} : { status: status.value }, { preserveScroll: true, preserveState: true })
}

function showAll(): void {
    status.value = 'alle'
    apply()
}

function markRead(item: Item): void {
    router.post(`/admin/nachrichten/${item.id}/gelesen`, {}, { preserveScroll: true })
}

function context(): string {
    const n = props.items.length
    const noun = props.filter === 'ungelesen' ? (n === 1 ? 'ungelesene Nachricht' : 'ungelesene Nachrichten') : n === 1 ? 'Nachricht' : 'Nachrichten'

    return `${decimal(n, 0)} ${noun}`
}
</script>

<template>
    <AdminPage title="Nachrichten" :context="context()">
        <p class="nfa-lead">
            Hier steht, was über das Kontaktformular im Shop kam – mit dem Fahrzeug, wenn die Person es mitgeschickt hat.
            Geantwortet wird per E-Mail. Jede Nachricht wird nach {{ keepMonths }} Monaten gelöscht.
        </p>

        <form class="nfa-filters" @submit.prevent="apply">
            <div class="form-field">
                <label class="form-field__label" for="nfa-status">Zeigen</label>
                <select id="nfa-status" v-model="status" class="input">
                    <option v-for="option in filters" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
            </div>
            <div class="nfa-filters__go">
                <button class="btn btn--secondary" type="submit">Anwenden</button>
            </div>
        </form>

        <AdminState v-if="total === 0" kind="empty" text="Hier erscheint jede Nachricht, die jemand über das Kontaktformular im Shop schickt." />
        <AdminState v-else-if="items.length === 0" kind="empty" text="Alles gelesen. Ältere Nachrichten stehen unter „Alle“.">
            <button class="btn btn--secondary" type="button" @click="showAll">Alle zeigen</button>
        </AdminState>

        <ol v-else class="nfa-list">
            <li v-for="item in items" :key="item.id" class="nfa-item" :class="{ 'nfa-item--read': item.read }">
                <div class="nfa-item__head">
                    <h2 class="nfa-item__subject">{{ item.subject }}</h2>
                    <span v-if="!item.read && filter !== 'ungelesen'" class="adm-tag adm-tag--neutral">Ungelesen</span>
                </div>
                <p class="nfa-item__meta">
                    <span class="nfa-item__from">{{ item.name }}</span> · <span class="nfa-item__email">{{ item.email }}</span> · {{ item.at }}
                </p>

                <p class="nfa-item__body">{{ item.message }}</p>

                <dl v-if="item.vehicle || item.from" class="nfa-facts">
                    <template v-if="item.vehicle">
                        <dt>Fahrzeug</dt>
                        <dd>{{ item.vehicle }}</dd>
                    </template>
                    <template v-if="item.from">
                        <dt>Geschrieben auf</dt>
                        <dd><a :href="item.from" target="_blank" rel="noopener">{{ item.from }}</a></dd>
                    </template>
                </dl>

                <div class="nfa-item__actions">
                    <a class="btn btn--secondary" :href="item.replyHref">Antworten</a>
                    <button v-if="canMarkRead && !item.read" class="btn btn--ghost" type="button" @click="markRead(item)">Als gelesen markieren</button>
                    <span v-else-if="item.read" class="nfa-item__meta">Gelesen am {{ item.readAt }}</span>
                </div>
            </li>
        </ol>
    </AdminPage>
</template>

<style scoped>
.nfa-lead {
    margin: 0 0 var(--sp-24);
    max-width: 72ch;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.nfa-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--sp-16);
    margin-bottom: var(--sp-24);
}

.nfa-filters .form-field {
    min-width: 240px;
}

.nfa-list {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.nfa-item {
    display: grid;
    gap: var(--sp-8);
    padding-block: var(--sp-16);
    border-bottom: 1px solid var(--c-line);
}

.nfa-item__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
}

.nfa-item__subject {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
    overflow-wrap: anywhere;
}

.nfa-item--read .nfa-item__subject {
    font-weight: 500;
}

.nfa-item__meta {
    margin: 0;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    overflow-wrap: anywhere;
}

.nfa-item__from {
    color: var(--c-ink);
    font-weight: 500;
}

.nfa-item__body {
    margin: 0;
    max-width: 72ch;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    white-space: pre-line;
    overflow-wrap: anywhere;
}

.nfa-facts {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--sp-4) var(--sp-16);
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.nfa-facts dt {
    color: var(--c-ink-2);
}

.nfa-facts dd {
    margin: 0;
    overflow-wrap: anywhere;
}

.nfa-item__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin-top: var(--sp-4);
}

@media (max-width: 767px) {
    .nfa-filters .form-field {
        min-width: 0;
        flex: 1 1 100%;
    }

    .nfa-facts {
        grid-template-columns: 1fr;
        gap: 0;
    }

    .nfa-facts dd + dt {
        margin-top: var(--sp-8);
    }

    .nfa-item__actions .btn,
    .nfa-filters .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
