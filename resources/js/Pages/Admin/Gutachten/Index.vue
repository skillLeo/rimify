<script setup lang="ts">
/**
 * Gutachten › Dokumente: every approval document on file.
 *
 * The „Zeilen im Shop“ column shows released rows against all rows on purpose: a document with twenty
 * rows entered and none released is the most common half-finished state in this workflow, and it is
 * invisible unless the list says so.
 *
 * Only the exception is tagged: a released document says so in plain text, a draft is neutral
 * (never red — "not yet checked" is not "refused", R-03, R-07), a superseded one a warning and a
 * withdrawn one the failure tone. Status and type narrow the list in place, and a filter appears only
 * where there is something to choose between. Nothing on file and nothing matching the filters are two
 * different states with two different sentences (admin-shell.md §9.3).
 */

import { Link, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import ListPager from '../../../Components/Admin/Lists/ListPager.vue'
import { decimal } from '../../../format'
import type { AdminGutachtenProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminGutachtenProps>()

type Document = AdminGutachtenProps['documents'][number]

const KIND_LABEL: Record<string, string> = {
    ABE: 'ABE',
    TEILEGUTACHTEN: 'Teilegutachten',
    NACHTRAG: 'Nachtrag',
    ECE: 'ECE-Genehmigung',
    EC: 'EG-Typgenehmigung',
}

/** `tag: null` is the normal state, printed as plain text. */
const STATUS: Record<string, { label: string; tag: string | null }> = {
    published: { label: 'Freigegeben', tag: null },
    draft: { label: 'Entwurf', tag: 'adm-tag--neutral' },
    superseded: { label: 'Ersetzt', tag: 'adm-tag--warn' },
    withdrawn: { label: 'Zurückgezogen', tag: 'adm-tag--bad' },
}

function statusOf(status: string): { label: string; tag: string | null } {
    return STATUS[status] ?? { label: status, tag: 'adm-tag--neutral' }
}

/*
 * The list comes in pages (the admin audit's F-31: a thousand on one page, no search), so status, kind and the search
 * narrow it on the server — each chip with how many documents on file it holds.
 */
const status = computed(() => (props.status === '' ? null : props.status))
const kind = computed(() => (props.kind === '' ? null : props.kind))
const q = ref(props.search)

/** Only the values that actually occur, each with its count. */
const statusOptions = computed(() => props.statusOptions)
const kindOptions = computed(() => props.kindOptions)

/** A filter with one value filters nothing, so it is not drawn. */
const showStatus = computed(() => statusOptions.value.length >= 2)
const showKind = computed(() => kindOptions.value.length >= 2)

function go(change: { q?: string; status?: string | null; art?: string | null }): void {
    const next = { q: props.search, status: props.status, art: props.kind, ...change }
    const query: Record<string, string> = {}

    for (const [key, value] of Object.entries(next)) {
        if (typeof value === 'string' && value.trim() !== '') {
            query[key] = value.trim()
        }
    }

    router.get('/admin/gutachten', query, { preserveScroll: true, preserveState: true })
}

function setStatus(value: string | null): void {
    go({ status: value })
}

function setKind(value: string | null): void {
    go({ art: value })
}

/* Not `search`: in the template that name is the prop — the search on screen. */
function runSearch(): void {
    go({ q: q.value })
}

function resetFilters(): void {
    q.value = ''
    router.get('/admin/gutachten', {}, { preserveScroll: true, preserveState: true })
}

const rows = computed<Document[]>(() => props.documents)
const filtered = computed(() => props.search !== '' || props.status !== '' || props.kind !== '')

const context = computed(() => {
    if (props.total === 0) {
        return 'Noch kein Dokument erfasst'
    }

    if (filtered.value) {
        return `${decimal(props.found, 0)} ${props.found === 1 ? 'Dokument' : 'Dokumente'} · gefiltert`
    }

    return `${decimal(props.total, 0)} ${props.total === 1 ? 'Dokument' : 'Dokumente'} · ${decimal(props.released, 0)} freigegeben`
})
</script>

<template>
    <AdminPage title="Dokumente" :context="context">
        <template v-if="can.create" #primary>
            <Link href="/admin/gutachten/neu" class="btn btn--primary">
                <Icon name="plus" :size="20" />
                Neues Gutachten
            </Link>
        </template>

        <form v-if="total > 0" class="gd-search" role="search" @submit.prevent="runSearch">
            <div class="form-field">
                <label class="form-field__label" for="gd-q">Suchen</label>
                <input id="gd-q" v-model="q" class="input" type="search" maxlength="100" autocomplete="off" placeholder="Nummer, KBA-Nummer oder Aussteller">
            </div>
            <button class="btn btn--secondary" type="submit">Suchen</button>
        </form>

        <div v-if="showStatus || showKind" class="adm-filters">
            <div v-if="showStatus" class="adm-filter" role="group" aria-label="Status">
                <span class="adm-filter__label" aria-hidden="true">Status</span>
                <button class="adm-chip" type="button" :aria-pressed="status === null" @click="setStatus(null)">Alle</button>
                <button
                    v-for="option in statusOptions"
                    :key="option.value"
                    class="adm-chip"
                    type="button"
                    :aria-pressed="status === option.value"
                    @click="setStatus(status === option.value ? null : option.value)"
                >
                    {{ statusOf(option.value).label }}
                    <span class="adm-chip__n">{{ decimal(option.count, 0) }}</span>
                </button>
            </div>

            <div v-if="showKind" class="adm-filter" role="group" aria-label="Art">
                <span class="adm-filter__label" aria-hidden="true">Art</span>
                <button class="adm-chip" type="button" :aria-pressed="kind === null" @click="setKind(null)">Alle</button>
                <button
                    v-for="option in kindOptions"
                    :key="option.value"
                    class="adm-chip"
                    type="button"
                    :aria-pressed="kind === option.value"
                    @click="setKind(kind === option.value ? null : option.value)"
                >
                    {{ KIND_LABEL[option.value] ?? option.value }}
                    <span class="adm-chip__n">{{ decimal(option.count, 0) }}</span>
                </button>
            </div>
        </div>

        <div v-if="rows.length > 0" class="adm-panel">
            <table class="adm-table">
                <thead>
                    <tr>
                        <th scope="col">Nummer</th>
                        <th scope="col">Art</th>
                        <th scope="col">Aussteller</th>
                        <th scope="col" class="num">Ausgestellt</th>
                        <th scope="col">Status</th>
                        <th scope="col" class="num">Zeilen im Shop</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="doc in rows" :key="doc.id">
                        <td data-label="Nummer">
                            <Link :href="doc.href" class="adm-table__key gd-link">{{ doc.reportNumber }}</Link>
                            <span v-if="doc.kbaNumber" class="adm-table__sub">KBA {{ doc.kbaNumber }}</span>
                            <span v-if="doc.demo" class="adm-tag adm-tag--neutral adm-demo">Demodaten</span>
                        </td>
                        <td data-label="Art" data-phone="hide">{{ KIND_LABEL[doc.kind] ?? doc.kind }}</td>
                        <td data-label="Aussteller" data-phone="hide">{{ doc.issuer }}</td>
                        <td data-label="Ausgestellt" class="num">{{ doc.issuedOn ?? '–' }}</td>
                        <td data-label="Status" data-phone="status">
                            <span>
                                <span v-if="statusOf(doc.status).tag" class="adm-tag" :class="statusOf(doc.status).tag">{{ statusOf(doc.status).label }}</span>
                                <template v-else>{{ statusOf(doc.status).label }}</template>
                                <span class="adm-table__sub">Fassung {{ doc.revision }}</span>
                            </span>
                        </td>
                        <td data-label="Zeilen im Shop" class="num">{{ decimal(doc.publishedCount, 0) }} von {{ decimal(doc.fitmentCount, 0) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <AdminState v-else-if="total === 0" kind="empty" text="Noch kein Gutachten erfasst. Jedes Gutachten, das du anlegst, steht hier, mit der Zahl seiner Zeilen.">
            <Link v-if="can.create" href="/admin/gutachten/neu" class="btn btn--primary">Erstes Gutachten anlegen</Link>
        </AdminState>

        <AdminState v-else kind="filtered" :total="total" @reset="resetFilters" />

        <ListPager :pagination="pagination" label="Seiten der Dokumente" />
    </AdminPage>
</template>

<style scoped>
/* The search above the chips: the field takes what room there is, the button beside it, under it on a phone. */
.gd-search {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--sp-12);
    margin-bottom: var(--sp-16);
}

.gd-search .form-field {
    flex: 1 1 280px;
    max-width: 480px;
}

.gd-link {
    color: var(--c-ink);
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .gd-link:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}
</style>
