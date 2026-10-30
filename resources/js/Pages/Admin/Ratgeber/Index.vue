<script setup lang="ts">
/**
 * Inhalte › Ratgeber (the client's admin item 12, D-351): the Blog's articles on a page of their own — searched, sorted
 * by a column heading (F-32: `sort` and `richtung` in the address), opened in the page editor, published and withdrawn,
 * deleted. One primary action, *Artikel anlegen*; the rest of a row sits behind its more-menu, as on the FAQ page.
 * Every write is refused by the server regardless of what this page offers (PagePolicy).
 */

import { Link, router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, nextTick, ref, watch } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSortHeader from '../../../Components/Admin/AdminSortHeader.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { useOpenOnArrival } from '../../../composables/admin/useOpenOnArrival'
import type { AdminRatgeberProps, RatgeberArticle, RatgeberSort } from '../../../types/admin/seiten'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminRatgeberProps>()

const BASE = '/admin/ratgeber'

/* The way a column first sorts when it is chosen: the latest on top, the titles from A. */
const FIRST: Record<RatgeberSort, 'auf' | 'ab'> = { geaendert: 'ab', titel: 'auf', veroeffentlicht: 'ab' }

const page = usePage()

const live = computed(() => props.articles.filter((article) => article.published).length)

const context = computed(() => {
    const all = props.total === 1 ? '1 Artikel' : `${props.total} Artikel`

    return props.filters.q !== '' ? `${all} · gefiltert` : `${all} · ${live.value} im Shop`
})

/* What the server refused — the publish check, a menu entry still leading here, a change meanwhile — said above the list. */
const refusal = computed(() => {
    const raw: unknown = page.props.errors
    const bag = raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}

    return bag.article ?? bag.page ?? bag.baseVersion ?? ''
})

/* ── Search and sort ─────────────────────────────────────────────────────────── */

const search = ref(props.filters.q)
const busy = ref(false)

watch(
    () => props.filters.q,
    (q) => (search.value = q)
)

function visit(query: Record<string, string>): void {
    busy.value = true
    router.get(BASE, query, {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => {
            busy.value = false
        },
    })
}

function query(overrides: Partial<{ q: string; sort: RatgeberSort; richtung: 'auf' | 'ab' }> = {}): Record<string, string> {
    const next = { q: search.value.trim(), sort: props.filters.sort, richtung: props.filters.richtung, ...overrides }
    const out: Record<string, string> = {}

    if (next.q !== '') {
        out.q = next.q
    }

    // The list's own order is no parameter: the address of the plain list stays /admin/ratgeber.
    if (!(next.sort === 'geaendert' && next.richtung === FIRST.geaendert)) {
        out.sort = next.sort
        out.richtung = next.richtung
    }

    return out
}

function find(): void {
    visit(query())
}

function clear(): void {
    search.value = ''
    visit(query({ q: '' }))
}

function sortBy(column: string): void {
    const chosen = column as RatgeberSort
    const richtung = props.filters.sort === chosen ? (props.filters.richtung === 'auf' ? 'ab' : 'auf') : FIRST[chosen]

    visit(query({ sort: chosen, richtung }))
}

/* ── Artikel anlegen ─────────────────────────────────────────────────────────── */

const creating = ref(false)
const title = ref('')
const sending = ref(false)
const sent = ref(false)

const createError = computed(() => {
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
    if (sending.value) {
        return
    }

    sending.value = true
    sent.value = true

    router.post(BASE, { title: title.value }, {
        preserveScroll: true,
        // A refused title takes focus again, so the error under it is heard and the fix starts there.
        onError: () => void nextTick(() => document.getElementById('rg-title')?.focus()),
        onFinish: () => {
            sending.value = false
        },
    })
}

/* ── A row's actions ─────────────────────────────────────────────────────────── */

type Asked = { article: RatgeberArticle; action: 'withdraw' | 'delete' }

const asked = ref<Asked | null>(null)
const askOpen = computed({
    get: () => asked.value !== null,
    set: (open: boolean) => {
        if (!open) {
            asked.value = null
        }
    },
})

const askTitle = computed(() => (asked.value === null ? '' : `${asked.value.article.title} ${asked.value.action === 'delete' ? 'löschen' : 'zurückziehen'}?`))

const askBody = computed(() => {
    if (asked.value === null) {
        return ''
    }

    if (asked.value.action === 'withdraw') {
        return 'Der Artikel ist danach nicht mehr im Shop zu sehen. Seine Texte bleiben, du kannst ihn wieder veröffentlichen.'
    }

    return asked.value.article.published
        ? 'Der Artikel verschwindet aus dem Shop und aus dieser Liste. Seine veröffentlichten Fassungen bleiben gespeichert, seine Adresse bekommt kein anderer Artikel.'
        : 'Der Artikel verschwindet aus dieser Liste. Seine Adresse bekommt kein anderer Artikel.'
})

const mayDelete = (article: RatgeberArticle): boolean => props.can.delete && (!article.published || props.can.publish)

const hasMenu = (article: RatgeberArticle): boolean => props.can.publish || mayDelete(article)

function publish(article: RatgeberArticle): void {
    busy.value = true
    router.post(`${BASE}/${article.id}/veroeffentlichen`, { baseVersion: article.version }, {
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
        },
    })
}

function confirmAsked(): void {
    const current = asked.value

    if (current === null || busy.value) {
        return
    }

    busy.value = true
    const done = {
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
            asked.value = null
        },
    }

    if (current.action === 'withdraw') {
        // The editor's own withdraw, refused while a menu entry still leads to the article.
        router.post(`/admin/seiten/${current.article.id}/zurueckziehen`, { baseVersion: current.article.version }, done)
    } else {
        router.delete(`${BASE}/${current.article.id}`, { data: { baseVersion: current.article.version }, ...done })
    }
}
</script>

<template>
    <AdminPage title="Ratgeber" :context="context">
        <template v-if="can.create" #primary>
            <button class="btn btn--primary" type="button" @click="openCreate">Artikel anlegen</button>
        </template>

        <p v-if="refusal" class="adm-alert" role="alert">{{ refusal }}</p>

        <form class="rg__search" role="search" :action="BASE" method="get" @submit.prevent="find">
            <label class="visually-hidden" for="rg-q">Ratgeber durchsuchen</label>
            <input id="rg-q" v-model="search" class="input" type="search" name="q" maxlength="90" placeholder="Titel oder Adresse" autocomplete="off">
            <button class="btn btn--secondary" type="submit" :disabled="busy">Suchen</button>
        </form>

        <div v-if="articles.length" class="adm-panel">
            <table class="adm-table rg__table">
                <colgroup>
                    <col>
                    <col class="rg__col-date">
                    <col class="rg__col-shop">
                    <col class="rg__col-more">
                </colgroup>
                <thead>
                    <tr>
                        <AdminSortHeader label="Artikel" column="titel" :sort="filters.sort" :richtung="filters.richtung" :disabled="busy" @sort="sortBy" />
                        <AdminSortHeader label="Geändert" column="geaendert" :sort="filters.sort" :richtung="filters.richtung" :disabled="busy" @sort="sortBy" />
                        <AdminSortHeader label="Im Shop" column="veroeffentlicht" :sort="filters.sort" :richtung="filters.richtung" :disabled="busy" @sort="sortBy" />
                        <th scope="col"><span class="visually-hidden">Aktionen</span></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="article in articles" :key="article.id">
                        <td data-label="Artikel">
                            <span class="adm-table__key">
                                <Link :href="`${BASE}/${article.id}`" class="rg__link">{{ article.title }}</Link>
                            </span>
                            <span class="adm-table__sub">{{ article.href }}</span>
                            <span v-if="article.draft" class="adm-table__sub">
                                Entwurf vom {{ article.draft.at }}<template v-if="article.draft.by"> · {{ article.draft.by }}</template>
                            </span>
                        </td>
                        <td data-label="Geändert" class="rg__num">{{ article.changedAt ?? '–' }}</td>
                        <td data-label="Im Shop" class="rg__num">
                            <template v-if="article.published">seit {{ article.publishedAt ?? '–' }}</template>
                            <span v-else class="adm-tag adm-tag--neutral">Nicht veröffentlicht</span>
                        </td>
                        <!-- On a phone the „⋯“ stands at the card's top right, as on every list of the panel. -->
                        <td data-label="Aktionen" data-phone="menu" class="rg__more">
                            <DropdownMenuRoot v-if="hasMenu(article)">
                                <DropdownMenuTrigger class="adm-iconbtn" :aria-label="`Aktionen für ${article.title}`">
                                    <Icon name="more" :size="20" />
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuContent class="adm-menu" align="end" :side-offset="4">
                                        <DropdownMenuItem as-child>
                                            <Link :href="`${BASE}/${article.id}`" class="adm-menu__item"><Icon name="edit" :size="20" />Bearbeiten</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-if="can.publish && !article.published" class="adm-menu__item" @select="publish(article)">
                                            <Icon name="eye" :size="20" />
                                            Veröffentlichen
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-if="can.publish && article.published" class="adm-menu__item" @select="asked = { article, action: 'withdraw' }">
                                            <Icon name="eye-off" :size="20" />
                                            Zurückziehen
                                        </DropdownMenuItem>
                                        <template v-if="mayDelete(article)">
                                            <DropdownMenuSeparator class="adm-menu__sep" />
                                            <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="asked = { article, action: 'delete' }">
                                                <Icon name="delete" :size="20" />
                                                Löschen
                                            </DropdownMenuItem>
                                        </template>
                                    </DropdownMenuContent>
                                </DropdownMenuPortal>
                            </DropdownMenuRoot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else-if="filters.q !== ''" class="rg__none">
            <AdminState kind="empty" :text="`Kein Artikel passt zu „${filters.q}“.`" />
            <button class="btn btn--secondary btn--sm" type="button" @click="clear">Suche zurücksetzen</button>
        </div>

        <AdminState v-else kind="empty" text="Noch kein Artikel. Was du hier anlegst, erscheint nach dem Veröffentlichen im Blog des Shops." />

        <Dialog v-model:open="creating" title="Artikel anlegen" content-class="adm-dialog adm-dialog--narrow">
            <form id="rg-create" class="adm-fields" novalidate @submit.prevent="create">
                <div class="form-field">
                    <label class="form-field__label" for="rg-title">Titel</label>
                    <input
                        id="rg-title"
                        v-model="title"
                        class="input"
                        type="text"
                        maxlength="90"
                        autocomplete="off"
                        aria-required="true"
                        aria-describedby="rg-title-help rg-title-err"
                        :aria-invalid="createError ? 'true' : undefined"
                    >
                    <p id="rg-title-help" class="form-field__help">
                        Aus dem Titel entsteht die Adresse, zum Beispiel /ratgeber/et-richtig-lesen. Der Artikel ist erst nach dem Veröffentlichen im Shop.
                    </p>
                    <p id="rg-title-err" class="form-field__error">{{ createError }}</p>
                </div>
            </form>

            <template #actions>
                <button class="btn btn--secondary" type="button" @click="creating = false">Abbrechen</button>
                <button class="btn btn--primary" type="submit" form="rg-create" :disabled="sending" :aria-busy="sending ? 'true' : undefined">
                    Anlegen
                </button>
            </template>
        </Dialog>

        <AdminConfirm
            v-model:open="askOpen"
            :title="askTitle"
            :body="askBody"
            :confirm-label="asked?.action === 'withdraw' ? 'Zurückziehen' : 'Löschen'"
            :busy="busy"
            @confirm="confirmAsked"
        />
    </AdminPage>
</template>

<style scoped>
.rg__search {
    display: flex;
    gap: var(--sp-8);
    max-width: 32rem;
    margin-bottom: var(--sp-16);
}

.rg__search .input {
    flex: 1;
    min-width: 0;
}

.rg__link {
    color: inherit;
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .rg__link:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
}

.rg__num {
    font-variant-numeric: tabular-nums;
}

.rg__more {
    text-align: right;
}

.rg__none {
    display: grid;
    justify-items: start;
    gap: var(--sp-12);
}

@media (min-width: 768px) {
    .rg__table {
        table-layout: fixed;
    }

    .rg__col-date {
        width: 9rem;
    }

    .rg__col-shop {
        width: 13rem;
    }

    .rg__col-more {
        width: 4rem;
    }
}
</style>
