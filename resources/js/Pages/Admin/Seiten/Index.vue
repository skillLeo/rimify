<script setup lang="ts">
/**
 * Inhalte › Seiten — every page of the shop whose words the team edits: the homepage, the Ratgeber
 * articles and the legal pages (docs/admin/inhalte-build-plan.md).
 *
 * One primary action, *Ratgeber-Artikel anlegen* — the only kind of page a team adds; the others
 * are fixed by the shop's structure. A row says what differs from the normal state and nothing
 * else: not published, a draft waiting, the Kanzlei's text still missing.
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { computed, nextTick, ref } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { useOpenOnArrival } from '../../../composables/admin/useOpenOnArrival'
import type { AdminSeitenProps, SeitenGroup } from '../../../types/admin/seiten'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminSeitenProps>()

const page = usePage()

const count = computed(() => props.groups.reduce((sum, group) => sum + group.pages.length, 0))

const context = computed(() => {
    const drafts = props.groups.reduce((sum, group) => sum + group.pages.filter((p) => p.draft !== null).length, 0)
    const pages = count.value === 1 ? '1 Seite' : `${count.value} Seiten`

    return drafts === 0 ? pages : `${pages} · ${drafts === 1 ? '1 Entwurf wartet' : `${drafts} Entwürfe warten`}`
})

/* When every page of a group still waits for the Kanzlei, that is one fact about the group, said
   once — not the same tag on every row. */
function allPlaceholders(group: SeitenGroup): boolean {
    return group.pages.length > 1 && group.pages.every((p) => p.placeholder)
}

const NUMBER_WORDS = ['null', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf']

function placeholderNote(group: SeitenGroup): string {
    const n = group.pages.length

    return `Bei allen ${NUMBER_WORDS[n] ?? String(n)} Seiten fehlt noch der Text der Kanzlei.`
}

/* ── Ratgeber-Artikel anlegen ────────────────────────────────────────────────────────── */

const creating = ref(false)
const title = ref('')
const busy = ref(false)
const sent = ref(false)

const error = computed(() => {
    const raw: unknown = page.props.errors
    const bag = raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}

    return sent.value ? (bag.title ?? bag.slug ?? '') : ''
})

function openCreate(): void {
    title.value = ''
    sent.value = false
    creating.value = true
}

// „Neu › Ratgeber-Artikel anlegen“ from the rail's foot or the palette lands here with ?neu=1.
useOpenOnArrival('neu', openCreate, () => props.can.create)

function create(): void {
    if (busy.value) {
        return
    }

    busy.value = true
    sent.value = true

    router.post('/admin/seiten', { title: title.value }, {
        preserveScroll: true,
        // A refused title takes focus again, so the error under it is heard and the fix starts there.
        onError: () => void nextTick(() => document.getElementById('sn-title')?.focus()),
        onFinish: () => {
            busy.value = false
        },
    })
}
</script>

<template>
    <AdminPage title="Seiten" :context="context">
        <template v-if="can.create" #primary>
            <button class="btn btn--primary" type="button" @click="openCreate">Ratgeber-Artikel anlegen</button>
        </template>

        <!-- One table, one header, a row group per kind of page: the lists line up because they
             are one list. A draft is said under its page only where there is one. -->
        <div v-if="count > 0" class="adm-panel">
            <table class="adm-table sn__table">
                <colgroup>
                    <col>
                    <col class="sn__col-shop">
                </colgroup>
                <thead>
                    <tr>
                        <th scope="col">Seite</th>
                        <th scope="col">Im Shop</th>
                    </tr>
                </thead>
                <tbody v-for="group in groups" :key="group.key">
                    <tr v-if="!(group.pages.length === 1 && group.pages[0]?.title === group.label)" class="sn__group-row">
                        <th scope="rowgroup" colspan="2">
                            {{ group.label }}
                            <span v-if="allPlaceholders(group)" class="sn__group-note">{{ placeholderNote(group) }}</span>
                        </th>
                    </tr>
                    <tr v-for="row in group.pages" :key="row.id">
                        <td data-label="Seite">
                            <span class="adm-table__key sn__name">
                                <Link :href="`/admin/seiten/${row.id}`" class="sn__link">{{ row.title }}</Link>
                                <span v-if="row.placeholder && !allPlaceholders(group)" class="adm-tag adm-tag--warn">Text der Kanzlei fehlt</span>
                            </span>
                            <span class="adm-table__sub">
                                {{ row.href }}<template v-if="row.lawyerReviewed"> · vom Anwalt geprüft</template>
                            </span>
                            <span v-if="row.draft" class="adm-table__sub">
                                Entwurf vom {{ row.draft.at }}<template v-if="row.draft.by"> · {{ row.draft.by }}</template>
                            </span>
                        </td>
                        <td data-label="Im Shop" data-phone="status" class="sn__num">
                            <template v-if="row.published">seit {{ row.publishedAt ?? '–' }}</template>
                            <span v-else class="adm-tag adm-tag--neutral">Nicht veröffentlicht</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <AdminState v-else kind="empty" text="Noch keine Seite, deren Text du hier bearbeiten kannst." />

        <Dialog v-model:open="creating" title="Ratgeber-Artikel anlegen" content-class="adm-dialog adm-dialog--narrow">
            <form id="sn-create" class="adm-fields" novalidate @submit.prevent="create">
                <div class="form-field">
                    <label class="form-field__label" for="sn-title">Titel</label>
                    <input
                        id="sn-title"
                        v-model="title"
                        class="input"
                        type="text"
                        maxlength="90"
                        autocomplete="off"
                        aria-required="true"
                        aria-describedby="sn-title-help sn-title-err"
                        :aria-invalid="error ? 'true' : undefined"
                    >
                    <p id="sn-title-help" class="form-field__help">
                        Aus dem Titel entsteht die Adresse, zum Beispiel /ratgeber/et-richtig-lesen. Der Artikel ist erst nach dem Veröffentlichen im Shop.
                    </p>
                    <p id="sn-title-err" class="form-field__error">{{ error }}</p>
                </div>
            </form>

            <template #actions>
                <button class="btn btn--secondary" type="button" @click="creating = false">Abbrechen</button>
                <button class="btn btn--primary" type="submit" form="sn-create" :disabled="busy" :aria-busy="busy ? 'true' : undefined">
                    Anlegen
                </button>
            </template>
        </Dialog>
    </AdminPage>
</template>

<style scoped>
/* A group's own row: its name as a heading inside the table, with air above it. */
.sn__group-row th {
    padding: var(--sp-24) var(--sp-12) var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    background: var(--c-surface);
    font-weight: 600;
    color: var(--c-ink);
    text-align: left;
    white-space: normal;
}

.sn__table tbody:first-of-type .sn__group-row th {
    padding-top: var(--sp-16);
}

.sn__group-note {
    display: block;
    margin-top: var(--sp-4);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 400;
    color: var(--c-ink-2);
}

@media (hover: hover) and (pointer: fine) {
    .sn__table tbody .sn__group-row:hover th {
        background: var(--c-surface);
    }
}

.sn__table tbody:not(:last-of-type) tr:last-child td {
    border-bottom: 1px solid var(--c-line);
}

@media (max-width: 767px) {
    .sn__group-row {
        display: block;
    }

    .sn__group-row th {
        display: block;
        padding-inline: 0;
    }
}

.sn__name {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
}

.sn__link {
    color: inherit;
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .sn__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
}

.sn__num {
    font-variant-numeric: tabular-nums;
}

@media (min-width: 768px) {
    .sn__table {
        table-layout: fixed;
    }

    .sn__col-shop {
        width: 14rem;
    }
}
</style>
