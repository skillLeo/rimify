<script setup lang="ts">
/**
 * Inhalte › Seiten › one page — its words edited beside the real shop (docs/admin/inhalte-build-plan.md).
 *
 * *Speichern* keeps a draft that visitors never see; the preview beside the fields shows that saved
 * draft in the storefront's own page. *Veröffentlichen* — the page's one primary action — first
 * lists every place that changes, then the server runs the publish check and puts the page live
 * whole. Every published state stays in *Versionen* and can be loaded back as the draft.
 *
 * Sections of a Ratgeber article or a legal page are added, removed and moved with buttons, never
 * by dragging alone (BRIEF-2 §1): a keyboard reaches everything a mouse does.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, nextTick, ref, toRaw } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage, { type AdminPageAction } from '../../../Components/Admin/AdminPage.vue'
import AdminSaveBar from '../../../Components/Admin/AdminSaveBar.vue'
import { toast } from '../../../Components/Chrome/toast'
import Dialog from '../../../Components/Ui/Dialog.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import { useDirtyForm } from '../../../composables/admin/useDirtyForm'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminSeiteProps, PageContent, SchemaBlock, SchemaField, SeitenRevision } from '../../../types/admin/seiten'
import DiffList from './DiffList.vue'
import FieldInput from './FieldInput.vue'
import GridField from './GridField.vue'
import ImageField from './ImageField.vue'
import PreviewFrame from './PreviewFrame.vue'
import { blockLabel, clickGuard, diff, emptyBlock, emptyItem, fieldId, move, placeOf, repeatables, type Change } from './content'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminSeiteProps>()

type Value = string | number | null
type Item = Record<string, Value>

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

const previewVersion = ref(0)

/** Which button the last answer belongs to, so its refusal is headed with the right verb. */
const lastAction = ref<'save' | 'publish'>('save')

const editor = useDirtyForm<PageContent>(clone(props.content), {
    method: 'put',
    url: () => `/admin/seiten/${props.page.id}/entwurf`,
    beforeSave: (send) => {
        lastAction.value = 'save'
        send()
    },
    onSaved: () => {
        previewVersion.value++
    },
})

const form = editor.form
const readonly = computed(() => !props.can.edit)

/* Every write names the page version it was made against; one against an older version is
   refused (PagePublisher::lock), so nobody silently undoes a colleague's newer words. */
function withVersion(data: PageContent): PageContent & { baseVersion: number } {
    return { ...data, baseVersion: props.page.version }
}

form.transform(withVersion)

/** A refusal about the page as a whole — changed meanwhile, still in a menu — said above the fields. */
const inertiaPage = usePage()
const pageError = computed(() => {
    const raw: unknown = inertiaPage.props.errors
    const bag = raw !== null && typeof raw === 'object' ? (raw as Record<string, string | undefined>) : {}

    return bag.page ?? (form.errors as Record<string, string | undefined>).page ?? ''
})

/** After the server changed what "unchanged" means — published, restored, discarded. */
function syncFromServer(): void {
    form.defaults(clone(props.content))
    form.reset()
    form.clearErrors()
    previewVersion.value++
}

/* ── Errors: the server's keys are the fields' paths ─────────────────────────────────── */

const errors = computed(() => form.errors as Record<string, string | undefined>)

function err(path: string): string {
    return errors.value[path] ?? ''
}

const errorList = computed(() =>
    Object.entries(errors.value).filter((entry): entry is [string, string] => entry[0] !== 'page' && typeof entry[1] === 'string' && entry[1] !== '')
)

/** What takes the focus for a field: a picture's button (FilePick hides the file input behind it), else the field. */
function focusTarget(path: string): string {
    const id = fieldId(path)

    return document.getElementById(`${id}-button`) ? `${id}-button` : id
}

function focusField(path: string): void {
    document.getElementById(focusTarget(path))?.focus()
}

/* ── Reading and writing values by position ──────────────────────────────────────────── */

function pageValue(field: SchemaField): Value {
    return field.key === 'metaDescription' ? form.metaDescription : form.title
}

function setPageValue(field: SchemaField, value: Value): void {
    if (field.key === 'metaDescription') {
        form.metaDescription = String(value ?? '')
    } else {
        form.title = String(value ?? '')
    }
}

function blockValue(index: number, key: string): Value {
    const value = form.blocks[index]?.data[key]

    return Array.isArray(value) ? null : (value ?? null)
}

function setBlockValue(index: number, key: string, value: Value): void {
    const block = form.blocks[index]

    if (block) {
        block.data[key] = value
    }
}

function items(index: number, list: string): Item[] {
    const value = form.blocks[index]?.data[list]

    return Array.isArray(value) ? (value as Item[]) : []
}

function setItems(index: number, list: string, next: Item[]): void {
    const block = form.blocks[index]

    if (block) {
        block.data[list] = next
    }
}

function schemaOf(index: number): SchemaBlock | undefined {
    return props.schema.blocks.find((b) => b.type === form.blocks[index]?.type)
}

/* A table's headings and rows, and a picture's address and size, are kept in the block's data beside each other. */
function cellsOf(index: number, key: string): string[] {
    const value = form.blocks[index]?.data[key]

    return Array.isArray(value) ? value.map((cell) => (typeof cell === 'string' ? cell : '')) : []
}

function rowsOf(index: number): string[][] {
    const value = form.blocks[index]?.data.rows

    return Array.isArray(value) ? value.map((row) => (Array.isArray(row) ? row.map((cell) => (typeof cell === 'string' ? cell : '')) : [])) : []
}

function setTable(index: number, key: string, table: { head: string[]; rows: string[][] }): void {
    const block = form.blocks[index]

    if (block) {
        block.data[key] = table.head
        block.data.rows = table.rows
    }
}

function setImage(index: number, key: string, image: { src: string; width: number | null; height: number | null }): void {
    const block = form.blocks[index]

    if (block) {
        block.data[key] = image.src
        block.data.width = image.width
        block.data.height = image.height
    }
}

function textOf(index: number, key: string): string {
    const value = form.blocks[index]?.data[key]

    return typeof value === 'string' ? value : ''
}

/* ── Sections: add, remove, move ─────────────────────────────────────────────────────── */

/* A legal page has one kind of section; an article has its building blocks — text, picture, table, quote (D-306). */
const sectionTypes = computed(() => repeatables(props.schema))

function isSection(type: string | undefined): boolean {
    return sectionTypes.value.some((definition) => definition.type === type)
}

const sectionIndexes = computed(() => form.blocks.map((block, index) => (isSection(block.type) ? index : -1)).filter((index) => index >= 0))

const fixedIndexes = computed(() => form.blocks.map((block, index) => (isSection(block.type) ? -1 : index)).filter((index) => index >= 0))

function countOf(type: string): number {
    return form.blocks.filter((block) => block.type === type).length
}

function mayAdd(definition: SchemaBlock): boolean {
    return countOf(definition.type) < definition.max
}

function mayRemove(index: number): boolean {
    const definition = schemaOf(index)

    return definition !== undefined && countOf(definition.type) > definition.min
}

/** The add button of a block type: the first keeps the id it always had. */
function addId(definition: SchemaBlock): string {
    return definition === sectionTypes.value[0] ? 'pg-add-section' : `pg-add-${definition.type}`
}

/** The kinds at their limit, said under the add buttons — a greyed button alone does not say why (SEI-32). */
const limitsReached = computed(() =>
    sectionTypes.value.filter((definition) => !mayAdd(definition)).map((definition) => `Höchstens ${definition.max} ${definition.many ?? definition.label} pro Seite.`)
)

/*
 * A block keeps its identity while it moves: keyed by the block itself, not by its place, its fields — a picture still
 * uploading among them — go where it goes (SEI-23). The same objects travel through move(), remove and Rückgängig.
 */
const blockKeys = new WeakMap<object, number>()
let lastKey = 0

function keyOf(index: number): number {
    const block = form.blocks[index]

    if (!block) {
        return -index
    }

    const raw = toRaw(block)
    let key = blockKeys.get(raw)

    if (key === undefined) {
        key = ++lastKey
        blockKeys.set(raw, key)
    }

    return key
}

/* One click of a double-click per change of structure (content.ts › clickGuard; SEI-24, SEI-33). */
const settled = clickGuard()

/* Focus follows what the keyboard just moved. A button that became disabled at the first or last
   place cannot hold focus; its section (or item) takes it instead, so a second Enter does not undo
   the move on the neighbour. */
function focusAfter(id: string, fallback?: string): void {
    void nextTick(() => {
        const target = document.getElementById(id)

        if (target && !(target as HTMLButtonElement).disabled) {
            target.focus()

            return
        }

        if (fallback) {
            document.getElementById(fallback)?.focus()
        }
    })
}

/* Errors of the publish check point at positions; once sections move, they would point at the
   wrong one. They are cleared, and the next check names the places afresh. */
function structureChanged(): void {
    form.clearErrors()
}

function addSection(definition: SchemaBlock): void {
    if (!mayAdd(definition)) {
        return
    }

    form.blocks = [...form.blocks, emptyBlock(definition)]
    structureChanged()
    const index = form.blocks.length - 1
    const first = definition.fields[0]

    if (first) {
        const id = fieldId(`blocks.${index}.data.${first.key}`)
        focusAfter(first.kind === 'image' ? `${id}-button` : id)
    }
}

function removeSection(index: number, event?: MouseEvent): void {
    if (!mayRemove(index) || !settled(event)) {
        return
    }

    const label = blockLabel(props.schema, form.blocks, index)
    const removed = form.blocks[index]
    const definition = schemaOf(index)
    const position = sectionIndexes.value.indexOf(index)
    form.blocks = form.blocks.filter((_, i) => i !== index)
    structureChanged()

    const next = sectionIndexes.value[Math.min(position, sectionIndexes.value.length - 1)]
    focusAfter(next === undefined ? 'pg-add-section' : `pg-section-${next}`)

    // Nothing is lost until Speichern, but a slip should not need Verwerfen to undo.
    if (removed) {
        toast.show({
            text: `${label} entfernt.`,
            action: {
                label: 'Rückgängig',
                run: () => {
                    // Not past the kind's limit: one added meanwhile may have taken its room (SEI-29).
                    if (definition && !mayAdd(definition)) {
                        toast.show({ text: `${label} kommt nicht zurück: Mehr als ${definition.max} ${definition.many ?? definition.label} hat eine Seite nicht.`, icon: 'info' })

                        return
                    }

                    const blocks = [...form.blocks]
                    blocks.splice(Math.min(index, blocks.length), 0, removed)
                    form.blocks = blocks
                    structureChanged()
                    focusAfter(`pg-section-${index}`)
                },
            },
        })
    }
}

function moveSection(index: number, by: -1 | 1, event?: MouseEvent): void {
    const position = sectionIndexes.value.indexOf(index)
    const target = sectionIndexes.value[position + by]

    if (target === undefined || !settled(event)) {
        return
    }

    form.blocks = move(form.blocks, index, target)
    structureChanged()
    focusAfter(`pg-move-${by < 0 ? 'up' : 'down'}-${target}`, `pg-section-${target}`)
}

/* ── A block's own list (the promise row) ────────────────────────────────────────────── */

function addItem(index: number, block: SchemaBlock): void {
    const list = block.list

    if (!list || items(index, list.key).length >= list.max) {
        return
    }

    setItems(index, list.key, [...items(index, list.key), emptyItem(list.fields)])
    structureChanged()
    const first = list.fields.find((f) => f.kind !== 'icon') ?? list.fields[0]

    if (first) {
        focusAfter(fieldId(`blocks.${index}.data.${list.key}.${items(index, list.key).length - 1}.${first.key}`))
    }
}

function removeItem(index: number, block: SchemaBlock, item: number, event?: MouseEvent): void {
    const list = block.list

    if (!list || items(index, list.key).length <= list.min || !settled(event)) {
        return
    }

    setItems(index, list.key, items(index, list.key).filter((_, i) => i !== item))
    structureChanged()
    focusAfter(`pg-add-item-${index}`)
}

function moveItem(index: number, block: SchemaBlock, item: number, by: -1 | 1, event?: MouseEvent): void {
    const list = block.list

    if (!list || !settled(event)) {
        return
    }

    setItems(index, list.key, move(items(index, list.key), item, item + by))
    structureChanged()
    focusAfter(`pg-item-${by < 0 ? 'up' : 'down'}-${index}-${item + by}`, `pg-item-${index}-${item + by}`)
}

/* ── Header ──────────────────────────────────────────────────────────────────────────── */

const context = computed(() => {
    // The homepage's group is its own name; saying it twice under the title reads as a template.
    const parts = props.page.group === props.page.title ? [] : [props.page.group]

    // A waiting draft is said once, in the note above the fields.
    parts.push(props.page.published ? `Veröffentlicht am ${props.page.publishedAt ?? '–'}` : 'Nicht veröffentlicht')

    return parts.join(' · ')
})

const discarding = ref(false)
const withdrawing = ref(false)
const busy = ref(false)

function copyPreviewLink(): void {
    void navigator.clipboard
        .writeText(props.preview.desktop)
        .then(() => toast.show({ text: `Vorschau-Link kopiert. Er funktioniert ${props.preview.days} Tage lang, ohne Anmeldung.` }))
        .catch(() => toast.show({ text: 'Der Link konnte nicht kopiert werden. Öffne die Vorschau in einem neuen Tab und kopier ihn dort.', icon: 'info' }))
}

const more = computed<AdminPageAction[]>(() => {
    const actions: AdminPageAction[] = []

    if (props.page.published) {
        actions.push({ label: 'Im Shop ansehen', icon: 'eye', run: () => window.open(props.page.href, '_blank', 'noopener') })
    }

    actions.push(
        { label: 'Vorschau in neuem Tab', icon: 'arrow-right', run: () => window.open(props.preview.desktop, '_blank', 'noopener') },
        { label: 'Vorschau-Link kopieren', icon: 'duplicate', run: copyPreviewLink }
    )

    if (props.draft && props.can.edit) {
        actions.push({ label: 'Entwurf verwerfen', icon: 'delete', danger: true, run: () => (discarding.value = true) })
    }

    if (props.can.withdraw) {
        actions.push({ label: 'Zurückziehen', icon: 'close', danger: true, run: () => (withdrawing.value = true) })
    }

    // A Ratgeber article is deleted here or from its list (his admin item 12, D-351).
    if (props.can.delete) {
        actions.push({ label: 'Artikel löschen', icon: 'delete', danger: true, run: () => (deleting.value = true) })
    }

    return actions
})

/* ── Platzhalter (D-319) ─────────────────────────────────────────────────────────────── */

type PlaceholderPart = 'text' | 'formular'

/** The switch asked for, held while its question is open. */
const switching = ref<{ part: PlaceholderPart; on: boolean } | null>(null)
const switchBusy = ref(false)

const switchOpen = computed({
    get: () => switching.value !== null,
    set: (open: boolean) => {
        if (!open) {
            switching.value = null
        }
    },
})

/* Off only over the Kanzlei's words: while the published text is still the seeded marker, the
   button says why it waits — and the server refuses it as well (LegalPlaceholderRequest). */
const textSwitchWaits = computed(() => props.page.placeholder && props.page.markerLeft)

/** A refusal of the switch, beside the switches rather than above the fields. */
const switchError = computed(() => {
    const raw: unknown = inertiaPage.props.errors
    const bag = raw !== null && typeof raw === 'object' ? (raw as Record<string, string | undefined>) : {}

    return bag.placeholder ?? bag.part ?? ''
})

const SWITCH_COPY: Record<`${PlaceholderPart}-${'on' | 'off'}`, { title: string; body: string; confirm: string }> = {
    'text-off': {
        title: 'Platzhalter ausschalten?',
        body: 'Besucher lesen dann den veröffentlichten Text dieser Seite. Schalte den Platzhalter nur aus, wenn dort der Text der Kanzlei steht.',
        confirm: 'Ausschalten',
    },
    'text-on': {
        title: 'Platzhalter einschalten?',
        body: 'Besucher sehen dann statt des Textes nur den Hinweis, dass der Text der Kanzlei folgt. Solange der Platzhalter an ist, sperrt der Shop Suchmaschinen aus und nimmt keine echten Zahlungen an.',
        confirm: 'Einschalten',
    },
    'formular-off': {
        title: 'Platzhalter beim Muster-Widerrufsformular ausschalten?',
        body: 'Besucher sehen dann das Muster-Widerrufsformular im Wortlaut des Gesetzes. Schalte den Platzhalter erst aus, wenn die Kanzlei das Formular freigegeben hat.',
        confirm: 'Ausschalten',
    },
    'formular-on': {
        title: 'Platzhalter beim Muster-Widerrufsformular einschalten?',
        body: 'Besucher sehen dann statt des Formulars nur den Hinweis, dass der Text der Kanzlei folgt. Solange der Platzhalter an ist, sperrt der Shop Suchmaschinen aus und nimmt keine echten Zahlungen an.',
        confirm: 'Einschalten',
    },
}

/* The words of the open question — kept while the dialog closes, so its title never empties mid-fade. */
const switchCopy = ref(SWITCH_COPY['text-off'])

function askSwitch(part: PlaceholderPart, on: boolean): void {
    if (part === 'text' && !on && textSwitchWaits.value) {
        return
    }

    switchCopy.value = SWITCH_COPY[`${part}-${on ? 'on' : 'off'}`]
    switching.value = { part, on }
}

function switchPlaceholder(): void {
    const target = switching.value

    if (target === null || switchBusy.value) {
        return
    }

    switchBusy.value = true
    // The switch is about the published text: whatever is typed and not yet saved stays in the fields.
    router.post(`/admin/seiten/${props.page.id}/platzhalter`, { part: target.part, placeholder: target.on }, {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => {
            switchBusy.value = false
            switching.value = null
        },
    })
}

function discardDraft(): void {
    if (busy.value) {
        return
    }

    busy.value = true
    router.delete(`/admin/seiten/${props.page.id}/entwurf`, {
        data: { baseVersion: props.page.version },
        preserveScroll: true,
        onSuccess: syncFromServer,
        onFinish: () => {
            busy.value = false
            discarding.value = false
        },
    })
}

function withdraw(): void {
    if (busy.value) {
        return
    }

    busy.value = true
    router.post(`/admin/seiten/${props.page.id}/zurueckziehen`, { baseVersion: props.page.version }, {
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
            withdrawing.value = false
        },
    })
}

/* ── Löschen (D-351) ─────────────────────────────────────────────────────────────────── */

const deleting = ref(false)

function remove(): void {
    if (busy.value) {
        return
    }

    busy.value = true
    // On success the server sends to the list; a refusal (a menu entry still leading here) stays on this page, said above it.
    router.delete(`/admin/ratgeber/${props.page.id}`, {
        data: { baseVersion: props.page.version },
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
            deleting.value = false
        },
    })
}

/* ── Veröffentlichen ─────────────────────────────────────────────────────────────────── */

const publishOpen = ref(false)
const publishing = ref(false)
const note = ref('')
const reviewed = ref(false)

const pending = computed(() => diff(props.schema, props.live, form.data() as unknown as PageContent))
const isLegal = computed(() => props.page.kind === 'legal')

/*
 * Publishing is the page's next step only when there is something to publish: a saved draft, or a
 * page not yet live. While the form holds unsaved changes, Speichern in the bar is the next step
 * and Veröffentlichen steps back. When the shop already shows exactly this, there is nothing to do
 * — except on a legal page whose wording still waits for the lawyer's mark.
 */
const nothingToPublish = computed(
    () => props.page.published && props.draft === null && !editor.dirty.value && !(isLegal.value && props.page.lawyerReviewed !== true)
)
const publishIsNext = computed(() => !editor.dirty.value && (props.draft !== null || !props.page.published))

let refused = false

function onPublishClosed(event: Event): void {
    if (!refused) {
        return
    }

    refused = false
    event.preventDefault()
    document.getElementById('pg-problems')?.focus()
}

function openPublish(): void {
    if (nothingToPublish.value) {
        return
    }

    note.value = ''
    // The mark belongs to one wording: kept only while nothing in the text changes.
    reviewed.value = props.page.lawyerReviewed === true && pending.value.length === 0
    publishOpen.value = true
}

function publish(): void {
    if (publishing.value) {
        return
    }

    publishing.value = true
    lastAction.value = 'publish'

    form.transform((data) => ({ ...withVersion(data), note: note.value, lawyerReviewed: reviewed.value })).post(`/admin/seiten/${props.page.id}/veroeffentlichen`, {
        preserveScroll: true,
        onSuccess: () => {
            publishOpen.value = false
            syncFromServer()
        },
        onError: () => {
            // The check's findings are listed above the fields; the dialog steps aside for them,
            // and focus goes to the list rather than back to the button (onPublishClosed). If the
            // dialog was already closed with Esc, the list takes focus at once.
            if (publishOpen.value) {
                refused = true
                publishOpen.value = false
            } else {
                void nextTick(() => document.getElementById('pg-problems')?.focus())
            }
        },
        onFinish: () => {
            publishing.value = false
            form.transform(withVersion)
        },
    })
}

/* ── Versionen ───────────────────────────────────────────────────────────────────────── */

const restoring = ref<SeitenRevision | null>(null)

const restoreOpen = computed({
    get: () => restoring.value !== null,
    set: (open: boolean) => {
        if (!open) {
            restoring.value = null
        }
    },
})

/* What loading the version would change in the shop, asked for when the dialog opens: twenty
   versions of a legal page do not travel with every visit. */
const comparison = ref<Change[] | null>(null)
const comparisonFailed = ref(false)
/* The dialog's title keeps naming its version while the dialog closes, rather than "vom  laden". */
const shownRevision = ref<SeitenRevision | null>(null)

function openRestore(revision: SeitenRevision): void {
    restoring.value = revision
    shownRevision.value = revision
    comparison.value = null
    comparisonFailed.value = false

    fetch(`/admin/seiten/${props.page.id}/versionen/${revision.id}/vergleich`, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
    })
        .then((response) => (response.ok ? (response.json() as Promise<{ changes: Change[] }>) : Promise.reject(new Error(String(response.status)))))
        .then((body) => {
            if (restoring.value?.id === revision.id) {
                comparison.value = body.changes
            }
        })
        .catch(() => {
            if (restoring.value?.id === revision.id) {
                comparisonFailed.value = true
            }
        })
}

function restore(): void {
    const revision = restoring.value

    if (revision === null || busy.value) {
        return
    }

    busy.value = true
    router.post(`/admin/seiten/${props.page.id}/versionen/${revision.id}`, { baseVersion: props.page.version }, {
        preserveScroll: true,
        onSuccess: syncFromServer,
        onFinish: () => {
            busy.value = false
            restoring.value = null
        },
    })
}

const restoreBody = computed(() => {
    const replaces = props.draft || editor.dirty.value ? ' Sie ersetzt deinen jetzigen Entwurf und alles, was noch nicht gespeichert ist.' : ''

    return `Diese Version wird dein Entwurf.${replaces} Im Shop ändert sich erst etwas, wenn du veröffentlichst.`
})

/** The newest version is what the shop shows while the page is live; it has nothing to load. */
function isLive(revision: SeitenRevision, index: number): boolean {
    return index === 0 && props.page.published
}
</script>

<template>
    <AdminPage :title="page.title" :context="context" :more="more" :read-only="readonly">
        <template v-if="can.publish" #primary>
            <button
                class="btn"
                :class="publishIsNext ? 'btn--primary' : 'btn--secondary'"
                type="button"
                :aria-disabled="nothingToPublish ? 'true' : undefined"
                :aria-describedby="nothingToPublish ? 'pg-nothing' : undefined"
                @click="openPublish"
            >
                Veröffentlichen
            </button>
            <span v-if="nothingToPublish" id="pg-nothing" class="visually-hidden">Der Shop zeigt schon genau diesen Stand.</span>
        </template>

        <div class="pg">
            <div class="pg__fields">
                <div
                    v-if="errorList.length"
                    id="pg-problems"
                    class="adm-alert pg__problems"
                    role="alert"
                    tabindex="-1"
                >
                    <p>
                        {{ lastAction === 'publish' ? 'Veröffentlichen' : 'Speichern' }} geht noch nicht. Bitte prüf
                        {{ errorList.length === 1 ? 'diese Stelle' : `diese ${errorList.length} Stellen` }}:
                    </p>
                    <ul>
                        <li v-for="[path, message] in errorList" :key="path">
                            <a v-if="placeOf(schema, form.blocks, path)" :href="`#${fieldId(path)}`" @click.prevent="focusField(path)">
                                {{ placeOf(schema, form.blocks, path) }}: {{ message }}
                            </a>
                            <template v-else>{{ message }}</template>
                        </li>
                    </ul>
                </div>

                <!--
                    A legal text's placeholder flag (D-319): while it is on, visitors read one notice in place of the
                    text, the shop keeps search engines out and takes no real payment. On the Widerrufsbelehrung the
                    Muster-Widerrufsformular has a flag of its own.
                -->
                <section v-if="isLegal" class="pg__switches" aria-labelledby="pg-switches">
                    <h2 id="pg-switches" class="pg__heading">Platzhalter</h2>

                    <div class="pg__switch">
                        <p class="pg__switch-state">
                            <span class="adm-tag" :class="page.placeholder ? 'adm-tag--warn' : 'adm-tag--neutral'">{{ page.placeholder ? 'An' : 'Aus' }}</span>
                            {{ page.placeholder ? 'Besucher sehen statt des Textes nur den Hinweis, dass der Text der Kanzlei folgt.' : 'Besucher lesen den veröffentlichten Text.' }}
                        </p>
                        <button
                            v-if="can.publish"
                            id="pg-switch-text"
                            class="btn btn--secondary btn--sm"
                            type="button"
                            :aria-disabled="textSwitchWaits ? 'true' : undefined"
                            :aria-describedby="textSwitchWaits ? 'pg-switch-waits' : undefined"
                            @click="askSwitch('text', !page.placeholder)"
                        >
                            {{ page.placeholder ? 'Platzhalter ausschalten' : 'Platzhalter einschalten' }}
                        </button>
                    </div>
                    <p v-if="textSwitchWaits" id="pg-switch-waits" class="adm-note">
                        Im veröffentlichten Text steht noch „[Rechtstext folgt von der Kanzlei …]“. Ersetz das in jedem Abschnitt durch den Text der Kanzlei, veröffentliche die Seite und schalte den Platzhalter danach aus.
                    </p>

                    <div v-if="page.formPlaceholder !== null" class="pg__switch">
                        <p class="pg__switch-state">
                            <span class="adm-tag" :class="page.formPlaceholder ? 'adm-tag--warn' : 'adm-tag--neutral'">{{ page.formPlaceholder ? 'An' : 'Aus' }}</span>
                            {{ page.formPlaceholder ? 'Muster-Widerrufsformular: Besucher sehen nur den Hinweis, dass der Text der Kanzlei folgt.' : 'Muster-Widerrufsformular: Besucher sehen das Formular im Wortlaut des Gesetzes.' }}
                        </p>
                        <button v-if="can.publish" id="pg-switch-form" class="btn btn--secondary btn--sm" type="button" @click="askSwitch('formular', !page.formPlaceholder)">
                            {{ page.formPlaceholder ? 'Platzhalter beim Formular ausschalten' : 'Platzhalter beim Formular einschalten' }}
                        </button>
                    </div>

                    <p v-if="switchError" class="adm-alert" role="alert">{{ switchError }}</p>
                </section>

                <p v-if="page.lawyerReviewed" class="adm-note">
                    Diese Fassung ist als vom Anwalt geprüft markiert. Änderst du den Text, bestätigst du das beim Veröffentlichen neu.
                </p>
                <p v-if="pageError" class="adm-alert" role="alert">{{ pageError }}</p>

                <p v-if="draft" class="adm-note">
                    Entwurf vom {{ draft.at }}<template v-if="draft.by"> von {{ draft.by }}</template>.
                    {{ page.published ? 'Im Shop steht noch die veröffentlichte Fassung.' : 'Der Artikel ist noch nicht im Shop zu sehen.' }}
                </p>
                <p v-else-if="!page.published" class="adm-note">Dieser Artikel ist nicht veröffentlicht. Besucher sehen ihn erst, wenn du ihn veröffentlichst.</p>

                <!-- The page's own fields: title and search description. -->
                <div v-if="schema.page.length" class="pg__group">
                    <FieldInput
                        v-for="field in schema.page"
                        :id="fieldId(field.key)"
                        :key="field.key"
                        :field="field"
                        :model-value="pageValue(field)"
                        :error="err(field.key)"
                        :readonly="readonly"
                        @update:model-value="setPageValue(field, $event)"
                    />
                </div>

                <!-- Fixed blocks: the hero, the promise row, the lead. -->
                <section v-for="index in fixedIndexes" :key="`fixed-${index}`" class="pg__block" :aria-labelledby="`pg-block-${index}`">
                    <h2 :id="`pg-block-${index}`" class="pg__heading">{{ blockLabel(schema, form.blocks, index) }}</h2>

                    <FieldInput
                        v-for="field in schemaOf(index)?.fields ?? []"
                        :id="fieldId(`blocks.${index}.data.${field.key}`)"
                        :key="field.key"
                        :field="field"
                        :model-value="blockValue(index, field.key)"
                        :error="err(`blocks.${index}.data.${field.key}`)"
                        :readonly="readonly"
                        @update:model-value="setBlockValue(index, field.key, $event)"
                    />

                    <template v-if="schemaOf(index)?.list">
                        <p v-if="err(`blocks.${index}.data.${schemaOf(index)!.list!.key}`)" class="form-field__error">
                            {{ err(`blocks.${index}.data.${schemaOf(index)!.list!.key}`) }}
                        </p>

                        <fieldset
                            v-for="(item, j) in items(index, schemaOf(index)!.list!.key)"
                            :id="`pg-item-${index}-${j}`"
                            :key="j"
                            class="pg__item"
                            tabindex="-1"
                        >
                            <legend class="visually-hidden">{{ schemaOf(index)!.list!.itemLabel }} {{ j + 1 }}</legend>
                            <div class="pg__block-head">
                                <span class="pg__item-title" aria-hidden="true">{{ schemaOf(index)!.list!.itemLabel }} {{ j + 1 }}</span>
                                <div v-if="!readonly" class="pg__tools">
                                    <button
                                        :id="`pg-item-up-${index}-${j}`"
                                        class="adm-iconbtn"
                                        type="button"
                                        :disabled="j === 0"
                                        :aria-label="`${schemaOf(index)!.list!.itemLabel} ${j + 1} nach oben`"
                                        @click="moveItem(index, schemaOf(index)!, j, -1, $event)"
                                    >
                                        <Icon name="chevron-up" :size="20" />
                                    </button>
                                    <button
                                        :id="`pg-item-down-${index}-${j}`"
                                        class="adm-iconbtn"
                                        type="button"
                                        :disabled="j === items(index, schemaOf(index)!.list!.key).length - 1"
                                        :aria-label="`${schemaOf(index)!.list!.itemLabel} ${j + 1} nach unten`"
                                        @click="moveItem(index, schemaOf(index)!, j, 1, $event)"
                                    >
                                        <Icon name="chevron-down" :size="20" />
                                    </button>
                                    <button
                                        class="adm-iconbtn"
                                        type="button"
                                        :disabled="items(index, schemaOf(index)!.list!.key).length <= schemaOf(index)!.list!.min"
                                        :aria-label="`${schemaOf(index)!.list!.itemLabel} ${j + 1} entfernen`"
                                        @click="removeItem(index, schemaOf(index)!, j, $event)"
                                    >
                                        <Icon name="delete" :size="20" />
                                    </button>
                                </div>
                            </div>

                            <FieldInput
                                v-for="field in schemaOf(index)!.list!.fields"
                                :id="fieldId(`blocks.${index}.data.${schemaOf(index)!.list!.key}.${j}.${field.key}`)"
                                :key="field.key"
                                :field="field"
                                :model-value="item[field.key] ?? null"
                                :error="err(`blocks.${index}.data.${schemaOf(index)!.list!.key}.${j}.${field.key}`)"
                                :readonly="readonly"
                                @update:model-value="item[field.key] = $event"
                            />
                        </fieldset>

                        <button
                            v-if="!readonly"
                            :id="`pg-add-item-${index}`"
                            class="btn btn--secondary pg__add"
                            type="button"
                            :disabled="items(index, schemaOf(index)!.list!.key).length >= schemaOf(index)!.list!.max"
                            @click="addItem(index, schemaOf(index)!)"
                        >
                            <Icon name="plus" :size="20" />
                            {{ schemaOf(index)!.list!.itemLabel }} hinzufügen
                        </button>
                        <p v-if="!readonly && items(index, schemaOf(index)!.list!.key).length >= schemaOf(index)!.list!.max" class="form-field__help">
                            Mehr als {{ schemaOf(index)!.list!.max }} passen nicht in die Zeile.
                        </p>
                    </template>
                </section>

                <!-- Repeatable sections: a legal page's, or a Ratgeber article's building blocks in any order. -->
                <template v-if="sectionTypes.length">
                    <p v-if="err('blocks')" class="form-field__error">{{ err('blocks') }}</p>

                    <section
                        v-for="(index, position) in sectionIndexes"
                        :id="`pg-section-${index}`"
                        :key="`section-${keyOf(index)}`"
                        class="pg__block"
                        tabindex="-1"
                        :aria-labelledby="`pg-block-${index}`"
                    >
                        <div class="pg__block-head">
                            <h2 :id="`pg-block-${index}`" class="pg__heading">{{ blockLabel(schema, form.blocks, index) }}</h2>
                            <div v-if="!readonly" class="pg__tools">
                                <button
                                    :id="`pg-move-up-${index}`"
                                    class="adm-iconbtn"
                                    type="button"
                                    :disabled="position === 0"
                                    :aria-label="`${blockLabel(schema, form.blocks, index)} nach oben`"
                                    @click="moveSection(index, -1, $event)"
                                >
                                    <Icon name="chevron-up" :size="20" />
                                </button>
                                <button
                                    :id="`pg-move-down-${index}`"
                                    class="adm-iconbtn"
                                    type="button"
                                    :disabled="position === sectionIndexes.length - 1"
                                    :aria-label="`${blockLabel(schema, form.blocks, index)} nach unten`"
                                    @click="moveSection(index, 1, $event)"
                                >
                                    <Icon name="chevron-down" :size="20" />
                                </button>
                                <button
                                    class="adm-iconbtn"
                                    type="button"
                                    :disabled="!mayRemove(index)"
                                    :aria-label="`${blockLabel(schema, form.blocks, index)} entfernen`"
                                    @click="removeSection(index, $event)"
                                >
                                    <Icon name="delete" :size="20" />
                                </button>
                            </div>
                        </div>

                        <template v-for="field in schemaOf(index)?.fields ?? []" :key="field.key">
                            <ImageField
                                v-if="field.kind === 'image'"
                                :id="fieldId(`blocks.${index}.data.${field.key}`)"
                                :label="field.label"
                                :help="field.help"
                                :page-id="page.id"
                                :src="textOf(index, field.key)"
                                :alt="textOf(index, 'alt')"
                                :error="err(`blocks.${index}.data.${field.key}`)"
                                :readonly="readonly"
                                @uploaded="setImage(index, field.key, $event)"
                            />
                            <GridField
                                v-else-if="field.kind === 'grid'"
                                :id="fieldId(`blocks.${index}.data.${field.key}`)"
                                :rows-id="fieldId(`blocks.${index}.data.rows`)"
                                :label="field.label"
                                :help="field.help"
                                :head="cellsOf(index, field.key)"
                                :rows="rowsOf(index)"
                                :max="field.max ?? 200"
                                :head-error="err(`blocks.${index}.data.${field.key}`)"
                                :rows-error="err(`blocks.${index}.data.rows`)"
                                :readonly="readonly"
                                @change="setTable(index, field.key, $event)"
                            />
                            <FieldInput
                                v-else
                                :id="fieldId(`blocks.${index}.data.${field.key}`)"
                                :field="field"
                                :model-value="blockValue(index, field.key)"
                                :error="err(`blocks.${index}.data.${field.key}`)"
                                :readonly="readonly"
                                @update:model-value="setBlockValue(index, field.key, $event)"
                            />
                        </template>
                    </section>

                    <!-- One button per kind of block; each stops at its own limit. -->
                    <div v-if="!readonly" class="pg__adds">
                        <button
                            v-for="definition in sectionTypes"
                            :id="addId(definition)"
                            :key="definition.type"
                            class="btn btn--secondary"
                            type="button"
                            :disabled="!mayAdd(definition)"
                            @click="addSection(definition)"
                        >
                            <Icon name="plus" :size="20" />
                            {{ definition.label }} hinzufügen
                        </button>
                    </div>
                    <p v-if="!readonly && limitsReached.length" class="form-field__help">{{ limitsReached.join(' ') }}</p>
                </template>

                <!-- Every published state, newest first. -->
                <section class="pg__versions" aria-labelledby="pg-versions">
                    <h2 id="pg-versions" class="pg__heading">Versionen</h2>
                    <p v-if="revisions.length === 0" class="adm-note">
                        Noch keine Version. Beim ersten Veröffentlichen wird auch die bisherige Fassung aus dem Shop gesichert.
                    </p>
                    <ul v-else class="pg__revisions">
                        <li v-for="(revision, index) in revisions" :key="revision.id" class="pg__revision">
                            <div class="pg__revision-text">
                                <span class="pg__revision-at">{{ revision.at }}</span>
                                <span class="pg__revision-by">{{ revision.by ?? 'Ausgangsstand' }}</span>
                                <span v-if="revision.note" class="pg__revision-note">{{ revision.note }}</span>
                            </div>
                            <span v-if="isLive(revision, index)" class="pg__revision-live">Steht im Shop</span>
                            <button v-else-if="can.edit" class="btn btn--secondary btn--sm" type="button" @click="openRestore(revision)">Als Entwurf laden</button>
                        </li>
                    </ul>
                </section>
            </div>

            <PreviewFrame class="pg__preview" :urls="preview" :version="previewVersion" :unsaved="editor.dirty.value" />
        </div>

        <AdminSaveBar v-if="can.edit" :editor="editor" />

        <!-- Veröffentlichen: what changes, a note, and on a legal page the lawyer's mark. -->
        <Dialog v-model:open="publishOpen" title="Seite veröffentlichen?" content-class="adm-dialog" @close-auto-focus="onPublishClosed">
            <div class="adm-fields">
                <template v-if="pending.length">
                    <p class="adm-note">Das ändert sich im Shop:</p>
                    <DiffList :changes="pending" />
                </template>
                <p v-else class="adm-note">
                    {{ page.published ? 'Der Text ist derselbe wie im Shop.' : 'Der Artikel geht mit diesem Text in den Shop.' }}
                </p>

                <div class="form-field">
                    <label class="form-field__label" for="pg-note">Notiz zur Version (optional)</label>
                    <input id="pg-note" v-model="note" class="input" type="text" maxlength="200" autocomplete="off">
                    <p class="form-field__help">Steht in der Versionsliste, zum Beispiel „Neue Versandzeiten“.</p>
                </div>

                <label v-if="isLegal" class="check">
                    <input v-model="reviewed" type="checkbox">
                    Dieser Text ist so vom Anwalt geprüft.
                </label>
            </div>

            <template #actions>
                <button class="btn btn--secondary" type="button" @click="publishOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="button" :disabled="publishing" :aria-busy="publishing ? 'true' : undefined" @click="publish">
                    {{ publishing ? 'Wird veröffentlicht …' : 'Veröffentlichen' }}
                </button>
            </template>
        </Dialog>

        <!-- Als Entwurf laden -->
        <Dialog v-model:open="restoreOpen" :title="`Version vom ${shownRevision?.at ?? ''} laden?`" content-class="adm-dialog">
            <div class="adm-fields">
                <p class="adm-confirm__body">{{ restoreBody }}</p>
                <p v-if="comparisonFailed" class="adm-note">Der Vergleich mit dem Shop konnte nicht geladen werden. Du kannst die Version trotzdem laden und vor dem Veröffentlichen prüfen.</p>
                <p v-else-if="comparison === null" class="adm-note" role="status">Vergleich mit dem Shop wird geladen …</p>
                <p v-else-if="comparison.length === 0" class="adm-note">Diese Version hat denselben Text, der gerade im Shop steht.</p>
                <template v-else>
                    <p class="adm-note">Gegenüber dem Shop ändert sich damit:</p>
                    <DiffList :changes="comparison" />
                </template>
            </div>

            <template #actions>
                <button class="btn btn--secondary" type="button" @click="restoreOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="button" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="restore">Als Entwurf laden</button>
            </template>
        </Dialog>

        <AdminConfirm
            v-model:open="discarding"
            title="Entwurf verwerfen?"
            :body="
                live.blocks.length
                    ? 'Die Änderungen im Entwurf gehen verloren. Im Shop ändert sich nichts.'
                    : 'Der Artikel beginnt wieder leer, mit seinem Titel. Im Shop ändert sich nichts.'
            "
            confirm-label="Verwerfen"
            :busy="busy"
            @confirm="discardDraft"
        />

        <AdminConfirm
            v-model:open="switchOpen"
            :title="switchCopy.title"
            :body="switchCopy.body"
            :confirm-label="switchCopy.confirm"
            :busy="switchBusy"
            @confirm="switchPlaceholder"
        />

        <AdminConfirm
            v-model:open="withdrawing"
            :title="`${page.title} zurückziehen?`"
            body="Der Artikel verschwindet aus dem Shop und aus dem Blog. Seine Texte bleiben hier, und du kannst ihn jederzeit wieder veröffentlichen."
            confirm-label="Zurückziehen"
            :busy="busy"
            @confirm="withdraw"
        />

        <AdminConfirm
            v-model:open="deleting"
            :title="`${page.title} löschen?`"
            :body="page.published
                ? 'Der Artikel verschwindet aus dem Shop und aus der Liste. Seine veröffentlichten Fassungen bleiben gespeichert, seine Adresse bekommt kein anderer Artikel.'
                : 'Der Artikel verschwindet aus der Liste. Seine Adresse bekommt kein anderer Artikel.'"
            confirm-label="Löschen"
            :busy="busy"
            @confirm="remove"
        />
    </AdminPage>
</template>

<style scoped>
/* Fields at a reading width; beside them, from 1280 px, the shop itself. */
.pg {
    display: grid;
    gap: var(--sp-32);
    align-items: start;
}

/* 40rem: a reading width for the fields, and the same track the preview sits beside from 1280. */
.pg__fields {
    display: grid;
    gap: var(--sp-24);
    min-width: 0;
    max-width: 40rem;
}

.pg__preview {
    display: none;
}

@media (min-width: 1280px) {
    .pg {
        grid-template-columns: minmax(0, 40rem) minmax(0, 1fr);
    }

    /* Held below the sticky top bar, never slid under it. */
    .pg__preview {
        display: grid;
        position: sticky;
        top: calc(var(--adm-topbar-h) + var(--sp-16));
    }
}

.pg__group,
.pg__block {
    display: grid;
    gap: var(--sp-16);
    min-width: 0;
}

.pg__block {
    padding-top: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

.pg__block:focus-visible {
    outline-offset: var(--sp-4);
}

.pg__block-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
}

.pg__heading {
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.pg__tools {
    display: flex;
    flex: none;
    gap: var(--sp-4);
}

/* A promise is one small group inside its row: its number and tools on one line, then its fields. */
.pg__item {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
    margin: 0;
    padding: var(--sp-16) 0 0;
    border: 0;
    border-top: 1px solid var(--c-line);
}

.pg__item-title {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
    color: var(--c-ink-2);
}

.pg__add {
    justify-self: start;
}

.pg__adds {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.pg__problems ul {
    display: grid;
    gap: var(--sp-4);
    margin-top: var(--sp-8);
    padding-left: var(--sp-20);
    list-style: disc;
}

.pg__problems a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.pg__versions {
    display: grid;
    gap: var(--sp-12);
    padding-top: var(--sp-24);
    border-top: 1px solid var(--c-line);
}

/* The placeholder switches: the state in words with its tag, the button beside it; stacked on a phone. */
.pg__switches {
    display: grid;
    gap: var(--sp-12);
}

.pg__switch {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8) var(--sp-16);
}

.pg__switch-state {
    flex: 1 1 18rem;
    margin: 0;
}

.pg__switch-state .adm-tag {
    margin-right: var(--sp-8);
}

.pg__revisions {
    display: grid;
}

.pg__revision {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-16);
    padding-block: var(--sp-12);
    border-top: 1px solid var(--c-line);
}

.pg__revision:first-child {
    border-top: 0;
    padding-top: 0;
}

.pg__revision-text {
    display: grid;
    min-width: 0;
}

.pg__revision-at {
    font-variant-numeric: tabular-nums;
}

.pg__revision-by,
.pg__revision-note {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-3);
    overflow-wrap: anywhere;
}

.pg__revision-live {
    flex: none;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}
</style>
