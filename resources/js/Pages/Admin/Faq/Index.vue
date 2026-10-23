<script setup lang="ts">
/**
 * Inhalte › FAQ — the questions on /faq, under their two groups, and the five the homepage shows.
 *
 * One primary action, *Frage anlegen*. A question opens its dialog; everything else done to an
 * entry sits behind its more-menu, and its place in the list moves with *nach oben* / *nach unten*
 * (beside the row from 768 px, and always in the menu). There is no draft: a visible answer changes
 * on the shop when it is saved, so anything a visitor would see change is offered only to a role
 * that may publish — the server refuses it regardless (FaqEntryPolicy).
 */

import { router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, nextTick, reactive, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { stampHeaders } from '../../../composables/admin/useDirtyForm'
import type { AdminFaqProps, FaqEntryRow } from '../../../types/admin/faq'
import type { SchemaField } from '../../../types/admin/seiten'
import FieldInput from '../Seiten/FieldInput.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminFaqProps>()

const page = usePage()

const all = computed(() => props.groups.flatMap((group) => group.entries))

const context = computed(() => {
    const total = all.value.length
    const visible = all.value.filter((entry) => entry.published).length

    return `${total === 1 ? '1 Frage' : `${total} Fragen`} · ${visible} im Shop sichtbar`
})

/** „KOMPATIBILITÄT & FREIGABE" is the shop's micro-label; here it is read as a heading. */
function groupName(key: string): string {
    return key
        .toLocaleLowerCase('de-DE')
        .split(' ')
        .map((word) => (word === '&' ? word : word.charAt(0).toLocaleUpperCase('de-DE') + word.slice(1)))
        .join(' ')
}

const NUMBERS = ['', 'eine', 'zwei', 'drei', 'vier', 'fünf']

/** One fact about the list, in words: which of these questions the homepage shows too. */
const homeNote = computed(() => {
    const n = props.onHome.length

    if (n === 0) {
        return ''
    }

    return n === 1
        ? 'Die erste sichtbare Frage steht auch auf der Startseite.'
        : `Die ersten ${NUMBERS[n] ?? String(n)} sichtbaren Fragen stehen auch auf der Startseite.`
})

/* ── What this viewer may do with one entry ──────────────────────────────────────────── */

/** Change the words: a visible entry takes the right to publish. */
function mayEdit(entry: FaqEntryRow): boolean {
    return props.can.edit && (!entry.published || props.can.publish)
}

const mayToggle = computed(() => props.can.edit && props.can.publish)
const mayMove = computed(() => props.can.publish)

function mayDelete(entry: FaqEntryRow): boolean {
    return props.can.delete && (!entry.published || props.can.publish)
}

/** A menu is offered only when it holds something: never an empty one. */
function hasMenu(entry: FaqEntryRow): boolean {
    return mayEdit(entry) || mayToggle.value || mayMove.value || mayDelete(entry)
}

function groupOf(entry: FaqEntryRow): { key: string; index: number; count: number } {
    const group = props.groups.find((g) => g.entries.some((e) => e.id === entry.id))

    return { key: group?.key ?? '', index: group?.entries.findIndex((e) => e.id === entry.id) ?? -1, count: group?.entries.length ?? 0 }
}

/* ── After an answer: the row that changed, and where focus goes ─────────────────────── */

/* The row a person just changed: one tint that fades (.adm-row--fresh), so the eye finds it. */
const fresh = ref<number | null>(null)

function markFresh(id: number | undefined): void {
    if (id === undefined) {
        return
    }

    fresh.value = null
    void nextTick(() => (fresh.value = id))
}

/*
 * A dialog opened from a row's menu would hand focus back to the menu item, which is gone once the
 * menu closes — and focus fell to the page's end. It goes to the row's own "…" instead, or to the
 * button that opened a new question, or after a delete to the next row still there.
 */
let returnTo = ''

/* A menu trigger carries its key in `data-focus`: the menu primitive owns the element's id. */
function byKey(key: string): HTMLElement | null {
    return key === '' ? null : (document.getElementById(key) ?? document.querySelector<HTMLElement>(`[data-focus="${key}"]`))
}

function restoreFocus(event: Event): void {
    const target = byKey(returnTo)

    if (target) {
        event.preventDefault()
        target.focus()
    }
}

/** A refusal about one row — out of date, no room, no right — said above the lists. */
const rowError = ref('')

function refused(bag: Record<string, string>): void {
    rowError.value = Object.values(bag)[0] ?? ''
}

/* ── Frage anlegen / bearbeiten ──────────────────────────────────────────────────────── */

const editing = ref<FaqEntryRow | 'new' | null>(null)
const busy = ref(false)
const title = ref('')
/* Each opening of the dialog has its own number: a late answer to an earlier one neither closes
   the dialog now open nor shows its errors in it. */
let opened = 0
const sentFrom = ref(-1)
const draft = reactive<{ group: string; question: string; answer: string; published: boolean }>({ group: '', question: '', answer: '', published: false })

const dialogOpen = computed({
    get: () => editing.value !== null,
    set: (open: boolean) => {
        if (!open) {
            editing.value = null
        }
    },
})

const questionField = computed<SchemaField>(() => ({ key: 'question', label: 'Frage', kind: 'text', required: true, max: props.limits.question }))
const answerField = computed<SchemaField>(() => ({
    key: 'answer',
    label: 'Antwort',
    kind: 'textarea',
    required: true,
    max: props.limits.answer,
    help: 'Steht im Shop genau so, wie du sie hier schreibst. Eine Leerzeile beginnt einen neuen Absatz.',
}))

const errors = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return sentFrom.value === opened && raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

function openNew(group?: string): void {
    Object.assign(draft, { group: group ?? props.groupOptions[0] ?? '', question: '', answer: '', published: false })
    opened++
    title.value = 'Frage anlegen'
    returnTo = group ? `faq-new-${props.groups.findIndex((g) => g.key === group)}` : 'faq-new'
    editing.value = 'new'
}

function openEdit(entry: FaqEntryRow): void {
    Object.assign(draft, { group: groupOf(entry).key || (props.groupOptions[0] ?? ''), question: entry.question, answer: entry.answer, published: entry.published })
    opened++
    title.value = 'Frage bearbeiten'
    returnTo = `faq-more-${entry.id}`
    editing.value = entry
}

function save(): void {
    if (busy.value || editing.value === null) {
        return
    }

    const target = editing.value
    const token = opened
    busy.value = true
    sentFrom.value = token
    rowError.value = ''

    const options = {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
            // The entry just saved; a new one is the last of its group.
            const id = target === 'new' ? props.groups.find((g) => g.key === draft.group)?.entries.at(-1)?.id : target.id

            if (target === 'new' && id !== undefined) {
                returnTo = `faq-more-${id}`
            }

            if (opened === token) {
                editing.value = null
            }

            markFresh(id)
        },
        onError: () => {
            if (opened === token) {
                // The first field the server refused takes focus, so the fix starts there.
                void nextTick(() => document.querySelector<HTMLElement>('.adm-dialog [aria-invalid="true"]')?.focus())
            }
        },
        onFinish: () => {
            busy.value = false
        },
    }

    if (target === 'new') {
        router.post('/admin/faq', { ...draft }, options)
    } else {
        // The entry as it was when the dialog opened: changed meanwhile, the save is refused (EditStamp, F-25).
        router.put(`/admin/faq/${target.id}`, { ...draft }, { ...options, headers: stampHeaders(target.stamp) })
    }
}

/* ── Zeigen / ausblenden, löschen ────────────────────────────────────────────────────── */

function toggle(entry: FaqEntryRow): void {
    rowError.value = ''
    // The visibility alone: a list that is out of date never writes a colleague's newer words back.
    router.patch(
        `/admin/faq/${entry.id}/sichtbarkeit`,
        { visible: !entry.published },
        { preserveScroll: true, preserveState: true, onSuccess: () => markFresh(entry.id), onError: refused }
    )
}

const deleting = ref<FaqEntryRow | null>(null)
const deleteTitle = ref('')
const deleteBody = ref('')

const deleteOpen = computed({
    get: () => deleting.value !== null,
    set: (open: boolean) => {
        if (!open) {
            deleting.value = null
        }
    },
})

function askDelete(entry: FaqEntryRow): void {
    deleteTitle.value = `Frage „${entry.question}“ löschen?`
    deleteBody.value = entry.published
        ? 'Die Frage und ihre Antwort verschwinden aus dem Shop. Das Protokoll behält ihren Wortlaut.'
        : 'Die Frage ist ausgeblendet und wird endgültig gelöscht. Das Protokoll behält ihren Wortlaut.'
    returnTo = `faq-more-${entry.id}`
    deleting.value = entry
}

function remove(): void {
    const entry = deleting.value

    if (entry === null || busy.value) {
        return
    }

    // Focus goes on to the next row still there, or the one before, or the primary action.
    const list = all.value
    const at = list.findIndex((e) => e.id === entry.id)
    const next = list[at + 1] ?? list[at - 1]

    busy.value = true
    rowError.value = ''
    router.delete(`/admin/faq/${entry.id}`, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
            returnTo = next ? `faq-more-${next.id}` : 'faq-new'
        },
        onError: refused,
        onFinish: () => {
            busy.value = false
            deleting.value = null
        },
    })
}

/* ── Reihenfolge ─────────────────────────────────────────────────────────────────────── */

const moving = ref(false)

function move(entry: FaqEntryRow, by: -1 | 1): void {
    if (moving.value) {
        return
    }

    const group = props.groups.find((g) => g.entries.some((e) => e.id === entry.id))

    if (!group) {
        return
    }

    const from = group.entries.findIndex((e) => e.id === entry.id)
    const to = from + by

    if (to < 0 || to >= group.entries.length) {
        return
    }

    const entries = [...group.entries]
    const [moved] = entries.splice(from, 1)
    entries.splice(to, 0, moved as FaqEntryRow)

    const ids = props.groups.flatMap((g) => (g.key === group.key ? entries : g.entries).map((e) => e.id))

    moving.value = true
    rowError.value = ''
    router.put('/admin/faq/reihenfolge', { ids }, {
        preserveScroll: true,
        preserveState: true,
        // The order this list shows: moved meanwhile elsewhere, the move is refused (EditStamp, F-25).
        headers: stampHeaders(props.orderStamp),
        onSuccess: () => markFresh(entry.id),
        onError: refused,
        onFinish: () => {
            moving.value = false

            // The keyboard stays on the entry it moved, once the buttons are enabled again; at the
            // first or last place the other direction's button takes it, and from the menu, the "…".
            void nextTick(() => {
                const same = document.getElementById(`faq-${by < 0 ? 'up' : 'down'}-${entry.id}`) as HTMLButtonElement | null
                const other = document.getElementById(`faq-${by < 0 ? 'down' : 'up'}-${entry.id}`) as HTMLButtonElement | null
                const usable = [same, other].find((button) => button !== null && !button.disabled && button.offsetParent !== null)

                ;(usable ?? byKey(`faq-more-${entry.id}`))?.focus()
            })
        },
    })
}
</script>

<template>
    <AdminPage title="FAQ" :context="context" :read-only="!can.edit && !can.create && !can.publish && !can.delete">
        <template v-if="can.create" #primary>
            <button id="faq-new" class="btn btn--primary" type="button" @click="openNew()">Frage anlegen</button>
        </template>

        <p v-if="rowError" class="adm-alert" role="alert">{{ rowError }}</p>

        <template v-if="all.length">
            <!-- One fact about the list, said once rather than under five rows. -->
            <p v-if="homeNote" class="adm-note faq-adm__home">{{ homeNote }}</p>

            <section v-for="(group, g) in groups" :key="group.key" class="faq-adm__group" :aria-labelledby="`faq-g-${g}`">
                <h2 :id="`faq-g-${g}`" class="adm-section__title">{{ groupName(group.key) }}</h2>

                <ol v-if="group.entries.length" class="faq-adm__list">
                    <li
                        v-for="(entry, index) in group.entries"
                        :key="entry.id"
                        class="faq-adm__entry"
                        :class="{ 'adm-row--fresh': fresh === entry.id }"
                        @animationend="fresh = null"
                    >
                        <div class="faq-adm__text">
                            <p class="faq-adm__question">
                                <button v-if="mayEdit(entry)" class="faq-adm__open" type="button" @click="openEdit(entry)">{{ entry.question }}</button>
                                <span v-else>{{ entry.question }}</span>
                                <span v-if="!entry.published" class="adm-tag adm-tag--neutral">Ausgeblendet</span>
                            </p>
                            <p class="faq-adm__answer">{{ entry.answer }}</p>
                        </div>

                        <div class="faq-adm__tools">
                            <div v-if="mayMove" class="adm-row-arrows">
                                <button
                                    :id="`faq-up-${entry.id}`"
                                    class="adm-iconbtn"
                                    type="button"
                                    :disabled="index === 0 || moving"
                                    :aria-label="`${entry.question} nach oben`"
                                    @click="move(entry, -1)"
                                >
                                    <Icon name="chevron-up" :size="20" />
                                </button>
                                <button
                                    :id="`faq-down-${entry.id}`"
                                    class="adm-iconbtn"
                                    type="button"
                                    :disabled="index === group.entries.length - 1 || moving"
                                    :aria-label="`${entry.question} nach unten`"
                                    @click="move(entry, 1)"
                                >
                                    <Icon name="chevron-down" :size="20" />
                                </button>
                            </div>

                            <DropdownMenuRoot v-if="hasMenu(entry)">
                                <DropdownMenuTrigger :data-focus="`faq-more-${entry.id}`" class="adm-iconbtn" :aria-label="`Aktionen für ${entry.question}`">
                                    <Icon name="more" :size="20" />
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuContent class="adm-menu" align="end" :side-offset="4">
                                        <DropdownMenuItem v-if="mayEdit(entry)" class="adm-menu__item" @select="openEdit(entry)">
                                            <Icon name="edit" :size="20" />
                                            Bearbeiten
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-if="mayToggle" class="adm-menu__item" @select="toggle(entry)">
                                            <Icon :name="entry.published ? 'eye-off' : 'eye'" :size="20" />
                                            {{ entry.published ? 'Im Shop ausblenden' : 'Im Shop zeigen' }}
                                        </DropdownMenuItem>
                                        <template v-if="mayMove">
                                            <DropdownMenuItem class="adm-menu__item" :disabled="groupOf(entry).index === 0 || moving" @select="move(entry, -1)">
                                                <Icon name="chevron-up" :size="20" />
                                                Nach oben
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                class="adm-menu__item"
                                                :disabled="groupOf(entry).index === groupOf(entry).count - 1 || moving"
                                                @select="move(entry, 1)"
                                            >
                                                <Icon name="chevron-down" :size="20" />
                                                Nach unten
                                            </DropdownMenuItem>
                                        </template>
                                        <template v-if="mayDelete(entry)">
                                            <DropdownMenuSeparator class="adm-menu__sep" />
                                            <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="askDelete(entry)">
                                                <Icon name="delete" :size="20" />
                                                Löschen
                                            </DropdownMenuItem>
                                        </template>
                                    </DropdownMenuContent>
                                </DropdownMenuPortal>
                            </DropdownMenuRoot>
                        </div>
                    </li>
                </ol>

                <div v-else class="faq-adm__empty">
                    <p class="adm-note">In dieser Gruppe steht noch keine Frage.</p>
                    <button v-if="can.create" :id="`faq-new-${g}`" class="btn btn--secondary btn--sm" type="button" @click="openNew(group.key)">
                        Frage in dieser Gruppe anlegen
                    </button>
                </div>
            </section>
        </template>

        <AdminState v-else kind="empty" text="Noch keine Frage. Was du hier anlegst, steht auf der FAQ-Seite und – die ersten fünf – auf der Startseite." />

        <Dialog v-model:open="dialogOpen" :title="title" content-class="adm-dialog" @close-auto-focus="restoreFocus">
            <form id="faq-form" class="adm-fields" novalidate @submit.prevent="save">
                <!-- Changed meanwhile elsewhere (EditStamp): nothing was saved, and what was typed stays. -->
                <p v-if="errors._stamp" class="adm-alert" role="alert">{{ errors._stamp }}</p>
                <div class="form-field">
                    <label class="form-field__label" for="faq-group">Gruppe</label>
                    <select id="faq-group" v-model="draft.group" class="input" :aria-invalid="errors.group ? 'true' : undefined" aria-describedby="faq-group-err">
                        <option v-for="option in groupOptions" :key="option" :value="option">{{ groupName(option) }}</option>
                    </select>
                    <p id="faq-group-err" class="form-field__error">{{ errors.group ?? '' }}</p>
                </div>

                <FieldInput
                    id="faq-question"
                    :model-value="draft.question"
                    :field="questionField"
                    :error="errors.question ?? ''"
                    @update:model-value="draft.question = String($event ?? '')"
                />
                <FieldInput
                    id="faq-answer"
                    :model-value="draft.answer"
                    :field="answerField"
                    :error="errors.answer ?? ''"
                    @update:model-value="draft.answer = String($event ?? '')"
                />

                <label class="check">
                    <input v-model="draft.published" type="checkbox" :disabled="!can.publish">
                    Im Shop zeigen
                </label>
                <p v-if="!can.publish" class="form-field__help">Zeigen und Ausblenden braucht das Recht „Inhalte · Veröffentlichen“. Deine Frage bleibt ausgeblendet, bis jemand mit diesem Recht sie zeigt.</p>
                <p v-else-if="draft.published" class="form-field__help">Sichtbar heißt: Die Änderung steht sofort im Shop.</p>
            </form>

            <template #actions>
                <button class="btn btn--secondary" type="button" @click="dialogOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="submit" form="faq-form" :disabled="busy" :aria-busy="busy ? 'true' : undefined">
                    {{ title === 'Frage anlegen' ? 'Anlegen' : 'Speichern' }}
                </button>
            </template>
        </Dialog>

        <AdminConfirm
            v-model:open="deleteOpen"
            :title="deleteTitle"
            :body="deleteBody"
            confirm-label="Löschen"
            :busy="busy"
            @confirm="remove"
            @close-auto-focus="restoreFocus"
        />
    </AdminPage>
</template>

<style scoped>
/* One rhythm with the Navigation page: the lists at an even distance, a heading close to its list. */
.faq-adm__group {
    display: grid;
    gap: var(--sp-12);
}

.faq-adm__group + .faq-adm__group {
    margin-top: var(--sp-32);
}

.faq-adm__empty {
    display: grid;
    justify-items: start;
    gap: var(--sp-8);
}

.faq-adm__list {
    display: grid;
    border-top: 1px solid var(--c-line);
}

.faq-adm__entry {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-16);
    padding-block: var(--sp-12);
    border-bottom: 1px solid var(--c-line);
}

.faq-adm__text {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
    max-width: 64ch;
}

.faq-adm__question {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
    font-weight: 600;
    overflow-wrap: anywhere;
}

.faq-adm__open {
    padding: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    background: none;
    border: 0;
    cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
    .faq-adm__open:hover {
        text-decoration: underline;
        text-underline-offset: 2px;
    }
}

/* A finger needs the whole line: the question is the row's way into its dialog. */
@media (pointer: coarse) {
    .faq-adm__open {
        min-height: var(--adm-control-h-lg);
    }
}

/* Two lines of the answer: enough to recognise it, not a second copy of the page. */
.faq-adm__answer {
    display: -webkit-box;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.faq-adm__home {
    margin-bottom: var(--sp-16);
}

.faq-adm__tools {
    display: flex;
    flex: none;
    gap: var(--sp-4);
}
</style>
