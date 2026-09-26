<script setup lang="ts">
/**
 * Benachrichtigungen — the team's own alerts, behind the bell (docs/admin/rest-build-plan.md, step 1).
 *
 * Everything on this page belongs to the reader: their alerts, newest first under the Berlin day
 * they arrived, and „Was du bekommst“ — per kind, in the admin and by e-mail. A switch saves as it
 * is flipped, like a light switch; there is no form to forget to send. Choosing an alert marks it
 * read and, where it has a page, opens it; *Gelesen* only marks it.
 */

import { Link, router } from '@inertiajs/vue3'
import { computed, nextTick, ref, watch } from 'vue'
import Icon from '../../../Components/Ui/Icon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'
import type { AdminAlertItem, AdminAlertKind } from '../../../types/admin'
import type { AdminBenachrichtigungenProps } from '../../../types/admin/benachrichtigungen'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminBenachrichtigungenProps>()

const BASE = '/admin/benachrichtigungen'

const busy = ref(false)
const saving = ref(false)
/** The switches as shown; put back to the server's answer after every visit. */
const choices = ref<AdminAlertKind[]>(props.kinds.map((k) => ({ ...k })))

watch(
    () => props.kinds,
    (kinds) => {
        choices.value = kinds.map((k) => ({ ...k }))
    }
)

const context = computed(() => {
    const { unread, all } = props.counts

    if (all === 0) {
        return 'Noch keine Benachrichtigungen'
    }

    const total = `${decimal(all, 0)} insgesamt`

    return unread === 0 ? `Alles gelesen · ${total}` : `${decimal(unread, 0)} ungelesen · ${total}`
})

const emptyText = computed(() => {
    if (props.kinds.length === 0) {
        return 'Für die Bereiche, die du öffnen darfst, gibt es noch keine Benachrichtigungen.'
    }

    const names = props.kinds.map((k) => `„${k.label}“`)
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}` : names[0]

    return `Hier erscheint, was du wissen musst – ${list}. Was davon du bekommst, legst du unten fest.`
})

/** Consecutive alerts of one Berlin day under one heading; the server sent them newest first. */
const days = computed(() => {
    const groups: { key: string; label: string; items: AdminAlertItem[] }[] = []

    for (const item of props.items) {
        const key = item.day === '' ? 'ohne-datum' : item.day
        const last = groups[groups.length - 1]

        if (last !== undefined && last.key === key) {
            last.items.push(item)
        } else {
            groups.push({ key, label: item.dayLabel, items: [item] })
        }
    }

    return groups
})

function filterHref(filter: 'alle' | 'ungelesen'): string {
    return filter === 'ungelesen' ? `${BASE}?filter=ungelesen` : BASE
}

/**
 * After a read, the control that was pressed may be gone — the title of an alert without a page
 * becomes plain text, *Gelesen* and *Alle als gelesen markieren* disappear, under *Ungelesen* the
 * whole row goes. Focus then moves to the row, or to the one now in its place, or to the list, never
 * back to the top of the document.
 */
async function keepFocus(id: string | null, index: number): Promise<void> {
    await nextTick()

    const rows = Array.from(document.querySelectorAll<HTMLElement>('.bn-item'))
    const target =
        (id === null ? null : document.getElementById(`bn-item-${id}`)) ??
        rows[Math.min(index, rows.length - 1)] ??
        document.querySelector<HTMLElement>('.bn-days, .bn-done, .adm-page__title')

    target?.focus()
}

function markRead(item: AdminAlertItem, then: () => void): void {
    router.post(`${BASE}/${item.id}/gelesen`, { bleiben: true }, { preserveScroll: true, preserveState: true, onSuccess: then })
}

/** An alert's title: an unread one is marked read, then its page opens — as its own visit, at the page's top. */
function open(item: AdminAlertItem): void {
    const index = props.items.findIndex((i) => i.id === item.id)

    if (item.read) {
        if (item.href !== null) {
            router.visit(item.href)
        }

        return
    }

    markRead(item, () => {
        if (item.href !== null) {
            router.visit(item.href)
        } else {
            void keepFocus(item.id, index)
        }
    })
}

function markOnly(item: AdminAlertItem): void {
    const index = props.items.findIndex((i) => i.id === item.id)

    markRead(item, () => void keepFocus(item.id, index))
}

function readAll(): void {
    busy.value = true
    router.post(`${BASE}/gelesen`, {}, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => void keepFocus(null, 0),
        onFinish: () => (busy.value = false),
    })
}

/** A flip made while the last one is still on its way: sent as soon as that one has answered. */
let pending = false

function saveChoices(): void {
    if (saving.value) {
        pending = true

        return
    }

    saving.value = true
    let saved = false

    router.put(
        `${BASE}/einstellungen`,
        { kinds: choices.value.map(({ kind, inApp, email }) => ({ kind, inApp, email })) },
        {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                saved = true
            },
            onFinish: () => {
                saving.value = false

                if (pending) {
                    pending = false
                    saveChoices()

                    return
                }

                // Refused, failed on the server or lost on the way: the switches go back to what
                // is actually stored. A switch that says "on" for a choice that was not saved
                // would be the page being confidently wrong about the reader's own setting.
                if (!saved) {
                    choices.value = props.kinds.map((k) => ({ ...k }))
                }
            },
        }
    )
}
</script>

<template>
    <AdminPage title="Benachrichtigungen" :context="context">
        <template v-if="counts.unread > 0" #primary>
            <button class="btn btn--secondary" type="button" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="readAll">
                <Icon name="check" :size="20" />
                Alle als gelesen markieren
            </button>
        </template>

        <nav v-if="counts.all > 0" class="adm-tabs" aria-label="Anzeigen">
            <Link :href="filterHref('alle')" class="adm-tabs__item" :aria-current="filter === 'alle' ? 'page' : undefined" preserve-scroll>
                Alle
            </Link>
            <Link :href="filterHref('ungelesen')" class="adm-tabs__item" :aria-current="filter === 'ungelesen' ? 'page' : undefined" preserve-scroll>
                Ungelesen<span v-if="counts.unread > 0" class="bn-count"><span class="visually-hidden">, </span>{{ decimal(counts.unread, 0) }}</span>
            </Link>
        </nav>

        <template v-if="items.length === 0">
            <div v-if="filter === 'ungelesen' && counts.all > 0" class="bn-done" tabindex="-1">
                <p class="bn-done__title">Alles gelesen.</p>
                <Link :href="filterHref('alle')" class="btn btn--secondary">Alle anzeigen</Link>
            </div>
            <AdminState v-else kind="empty" :text="emptyText" />
        </template>

        <div v-else class="bn-days" tabindex="-1" aria-label="Benachrichtigungen">
            <section v-for="group in days" :key="group.key" class="adm-section bn-day" :aria-labelledby="`bn-day-${group.key}`">
                <h2 :id="`bn-day-${group.key}`" class="adm-section__title bn-day__title">{{ group.label }}</h2>

                <ol class="adm-panel bn-list">
                    <li
                        v-for="item in group.items"
                        :id="`bn-item-${item.id}`"
                        :key="item.id"
                        class="bn-item"
                        :class="{ 'bn-item--unread': !item.read }"
                        tabindex="-1"
                    >
                        <span class="bn-item__dot" aria-hidden="true" />

                        <div class="bn-item__text">
                            <button v-if="item.href || !item.read" class="bn-item__title bn-item__title--button" type="button" @click="open(item)">
                                <span v-if="!item.read" class="visually-hidden">Ungelesen: </span>{{ item.title }}
                                <Icon v-if="item.href" class="bn-item__go" name="chevron-right" :size="16" />
                            </button>
                            <p v-else class="bn-item__title">{{ item.title }}</p>
                            <p v-if="item.detail" class="bn-item__detail">{{ item.detail }}</p>
                            <p class="bn-item__meta">
                                {{ item.kindLabel }}<span aria-hidden="true"> · </span><span class="visually-hidden">, </span>
                                <time :datetime="item.iso ?? undefined" :title="item.at ?? undefined">{{ item.time ?? '–' }}</time>
                            </p>
                        </div>

                        <button v-if="!item.read && item.href" class="btn btn--ghost btn--sm bn-item__read" type="button" @click="markOnly(item)">
                            Gelesen<span class="visually-hidden">: {{ item.title }}</span>
                        </button>
                    </li>
                </ol>
            </section>

            <nav v-if="pagination.last > 1" class="bn-pages" aria-label="Seiten der Benachrichtigungen">
                <Link v-if="pagination.prev" :href="pagination.prev" class="btn btn--secondary">
                    <Icon name="chevron-left" :size="16" />
                    Neuere
                </Link>
                <span v-else aria-hidden="true" />

                <p class="bn-pages__where">Seite {{ decimal(pagination.current, 0) }} von {{ decimal(pagination.last, 0) }}</p>

                <Link v-if="pagination.next" :href="pagination.next" class="btn btn--secondary">
                    Ältere
                    <Icon name="chevron-right" :size="16" />
                </Link>
                <span v-else aria-hidden="true" />
            </nav>
        </div>

        <section v-if="choices.length" class="adm-section bn-prefs" aria-labelledby="bn-prefs">
            <h2 id="bn-prefs" class="adm-section__title">Was du bekommst</h2>
            <p class="adm-note">Jede Änderung gilt sofort. E-Mails gehen an die Adresse deines Kontos.</p>

            <table class="adm-table bn-prefs__table" :aria-busy="saving ? 'true' : undefined">
                <thead>
                    <tr>
                        <th scope="col">Benachrichtigung</th>
                        <th scope="col" class="bn-prefs__col">Im Admin</th>
                        <th scope="col" class="bn-prefs__col">Per E-Mail</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="choice in choices" :key="choice.kind">
                        <th scope="row" class="bn-prefs__kind">
                            <span class="bn-prefs__label">{{ choice.label }}</span>
                            <span class="bn-prefs__desc">{{ choice.description }}</span>
                        </th>
                        <td class="bn-prefs__col" data-label="Im Admin">
                            <label class="check bn-prefs__check">
                                <input v-model="choice.inApp" type="checkbox" @change="saveChoices">
                                <span class="visually-hidden">{{ choice.label }} im Admin</span>
                            </label>
                        </td>
                        <td class="bn-prefs__col" data-label="Per E-Mail">
                            <label class="check bn-prefs__check">
                                <input v-model="choice.email" type="checkbox" @change="saveChoices">
                                <span class="visually-hidden">{{ choice.label }} per E-Mail</span>
                            </label>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    </AdminPage>
</template>

<style scoped>
.bn-count {
    margin-left: var(--sp-8);
    font-variant-numeric: tabular-nums;
    color: var(--c-ink-3);
}

.bn-done {
    display: grid;
    justify-items: start;
    gap: var(--sp-12);
    padding-block: var(--sp-16);
}

.bn-done__title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.bn-day + .bn-day {
    margin-top: var(--sp-24);
}

/* A day is a label over its alerts, not a section heading: it ranks below „Was du bekommst“. */
.bn-day__title {
    margin-bottom: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-ink-2);
}

.bn-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.bn-item {
    display: grid;
    grid-template-columns: var(--sp-8) minmax(0, 1fr) auto;
    align-items: start;
    gap: var(--sp-12);
    padding: var(--sp-12) 0;
    border-bottom: 1px solid var(--c-line);
}

/* Unread has one cue, the dot, centred on the sentence's first line. */
.bn-item__dot {
    width: var(--sp-8);
    height: var(--sp-8);
    margin-top: calc((var(--lh-body) - var(--sp-8)) / 2);
    border-radius: var(--r-round);
}

.bn-item--unread .bn-item__dot {
    background: var(--c-ink);
}

.bn-item__text {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.bn-item__title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    color: var(--c-ink);
}

.bn-item__title--button {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    justify-self: start;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
    .bn-item__title--button:hover {
        text-decoration: underline;
        text-underline-offset: var(--sp-4);
    }
}

.bn-item__go {
    flex: none;
    color: var(--c-ink-3);
}

.bn-item__detail {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

.bn-item__meta {
    margin: 0;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-variant-numeric: tabular-nums;
    color: var(--c-ink-3);
}

.bn-pages {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--sp-12);
    margin-top: var(--sp-24);
}

.bn-pages > :last-child {
    justify-self: end;
}

.bn-pages__where {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--c-ink-3);
}

.bn-prefs {
    margin-top: var(--sp-48);
}

.bn-prefs__table {
    max-width: var(--adm-form-max);
    margin-top: var(--sp-16);
}

/* A row heading that holds a sentence: it wraps and grows with it, unlike the table's own
   one-line headings, and takes the row's hover like the cells beside it. */
.bn-prefs__kind {
    height: auto;
    padding: var(--sp-8) var(--sp-12);
    font-weight: 400;
    white-space: normal;
}

@media (hover: hover) and (pointer: fine) {
    .bn-prefs__table tbody tr:hover .bn-prefs__kind {
        background: var(--c-band);
    }
}

.bn-prefs__label,
.bn-prefs__desc {
    display: block;
}

.bn-prefs__label {
    font-weight: 600;
    color: var(--c-ink);
}

.bn-prefs__desc {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.bn-prefs__col {
    width: var(--sp-128);
    text-align: center;
}

.bn-prefs__check {
    justify-content: center;
}

/* On a phone each kind is a card (the admin table's own phone form): its sentence, then the two
   switches under their labels, left-aligned. */
@media (max-width: 767px) {
    .bn-prefs__col {
        width: auto;
        text-align: left;
    }

    .bn-prefs__kind {
        display: block;
        grid-column: 1 / -1;
        padding: 0;
        border: 0;
    }

    .bn-prefs__check {
        justify-content: flex-start;
    }
}

@media (pointer: coarse) {
    .bn-item__title--button,
    .bn-item__read {
        min-height: var(--adm-control-h-lg);
    }

    .bn-prefs__check {
        min-width: var(--adm-control-h-lg);
        min-height: var(--adm-control-h-lg);
    }
}
</style>
