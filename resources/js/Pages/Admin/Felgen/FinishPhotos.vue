<script setup lang="ts">
/**
 * One colour's photographs (COMPLIANCE row 23): as many as the colour needs, up to the server's limit,
 * in the order the shop shows them — the first is the cover on every tile and the product page's first
 * view. Every change is its own request beside the form's save, so a photograph is never lost to an
 * unsaved form or held back by one.
 *
 * The order moves with *nach oben* / *nach unten* (beside the photo from 768 px, always in its menu) and,
 * with a pointer, by dragging. Every photo keeps its own sentence for a screen reader; the server refuses
 * one without it (WheelImageRequest, WheelPhotoAltRequest). A generated drawing (the demo set) says it is one.
 *
 * The keyboard never falls to `<body>`: every action names where the focus goes next and useFocusAfter puts
 * it there once the round trip is over and the control is enabled again (K2-04, K2-22).
 */

import { router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, ref, watch } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import FilePick from '../../../Components/Admin/FilePick.vue'
import Picture from '../../../Components/Ui/Picture.vue'
import { MENU_ROOM } from '../../../composables/admin/menu'
import { stampHeaders } from '../../../composables/admin/useDirtyForm'
import { resolveTarget, useFocusAfter } from '../../../composables/admin/useFocusAfter'
import { FILE_CHANGED, stillReadable } from '../../../lib/file'
import type { FinishImage, FinishPhoto } from '../../../types/admin/felgen'

const props = defineProps<{
    modelId: number
    finishId: number
    finishName: string
    /** The cover as the shop reads it — only consulted for the demo set's drawing. */
    image: FinishImage | null
    photos: FinishPhoto[]
    /** The photos' order as loaded (EditStamp): a move sends it, a move from an older order is refused. */
    orderStamp?: string
    max: number
    editable: boolean
    /** The model's full name, for the suggested alt text. */
    title: string
}>()

const page = usePage()
const focus = useFocusAfter()
const base = computed(() => `/admin/felgen/${props.modelId}/ausfuehrungen/${props.finishId}`)
const idBase = computed(() => `fe-photo-${props.finishId}`)
const busy = ref(false)
const fresh = ref<number | null>(null)
const announce = ref('')

/** Whose errors this colour shows: only those of a request it sent itself, and only until it starts anew. */
const mine = ref<'upload' | 'alt' | 'order' | null>(null)

const errors = computed(() => {
    const bag = (page.props.errors ?? {}) as Record<string, string | undefined>

    return {
        image: mine.value === 'upload' ? (bag.image ?? '') : '',
        alt: mine.value === 'upload' || mine.value === 'alt' ? (bag.alt ?? '') : '',
        order: mine.value === 'order' ? (bag.ids ?? bag._stamp ?? '') : '',
    }
})

const full = computed(() => props.photos.length >= props.max)
const drawing = computed(() => props.photos.length === 0 && props.image?.placeholder === true)

const startId = computed(() => `${idBase.value}-start`)
const moreId = (id: number): string => `${idBase.value}-more-${id}`
/** The last photo's „⋯“ — where the keyboard goes when „Foto hinzufügen“ is closed off by the limit. */
const lastMore = (): HTMLElement | null => {
    const last = props.photos.at(-1)

    return last === undefined ? null : resolveTarget(moreId(last.id))
}

/* ── Adding ────────────────────────────────────────────────────────────────── */

const adding = ref(false)
const file = ref<File | null>(null)
const alt = ref('')
/** A file dropped on the field that is not a photo: said by name, gone once a photo is chosen. */
const refusedFile = ref<string | null>(null)
/** „Hochladen“ (or Enter) before a photo was chosen. */
const missingFile = ref(false)
/** The chosen photo was saved anew on disk since it was chosen: asked for again (K2-29). */
const changedFile = ref(false)
const refusedLine = computed(() => {
    if (refusedFile.value !== null) {
        return `„${refusedFile.value}“ nimmt dieses Feld nicht – nur JPEG, PNG, WebP oder AVIF.`
    }

    if (changedFile.value) {
        return FILE_CHANGED
    }

    return missingFile.value ? 'Bitte wähl ein Foto aus.' : ''
})

watch(file, (chosen) => {
    if (chosen !== null) {
        refusedFile.value = null
        missingFile.value = false
        changedFile.value = false
    }
})

/*
 * What a refusal says, spoken: the error lines are hidden while empty, and a live region that appears
 * together with its text is announced unreliably — so one region that is always there speaks it (K2-39).
 */
const spoken = computed(() => errors.value.image || refusedLine.value || errors.value.alt || errors.value.order)

/** Photos whose file did not load: said plainly instead of the browser's alt text spilling into the frame. */
const broken = ref(new Set<number>())

function startAdd(): void {
    adding.value = true
    mine.value = null
    // The first photo is the front view as a rule; any later one is the admin's own sentence.
    alt.value = props.photos.length === 0 ? `${props.title} in ${props.finishName}, Ansicht von vorn` : ''
    // The button that opened the form is gone: focus goes to the first thing to do in it.
    focus.request(() => document.querySelector<HTMLElement>(`label[for="${idBase.value}-file"]`))
}

function cancelAdd(): void {
    adding.value = false
    file.value = null
    mine.value = null
    focus.request(startId.value)
}

const fileButton = (): HTMLElement | null => document.getElementById(`${idBase.value}-file-button`)

async function upload(): Promise<void> {
    if (busy.value) {
        return
    }

    // Enter before a photo is chosen: said, and the keyboard taken to the field that is missing (K2-40).
    if (file.value === null) {
        missingFile.value = true
        focus.request(fileButton)

        return
    }

    busy.value = true
    const chosen = file.value

    // Saved anew since it was chosen: the browser would not send it and the page would blame the
    // connection — the photo is asked for again instead (K2-29).
    if (!(await stillReadable(chosen))) {
        busy.value = false
        file.value = null
        // An earlier refusal's sentence gives way to this one.
        mine.value = null
        changedFile.value = true
        focus.request(fileButton)

        return
    }

    mine.value = 'upload'
    router.post(
        `${base.value}/foto`,
        { image: chosen, alt: alt.value },
        {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                adding.value = false
                file.value = null
                mine.value = null
                fresh.value = props.photos.at(-1)?.id ?? null
                // „Foto hinzufügen“ once it is enabled again; at the limit it stays off, so the new photo's „⋯“.
                focus.request([startId.value, lastMore])
            },
            onError: (refusal) => {
                // Refused: the form stays with the sentence, and the keyboard goes to what it is about (K2-38).
                // A refused file is let go: the one chosen again — saved smaller, perhaps under the same
                // name — must be a fresh copy, or the browser will not send it (K2-29).
                if (refusal.image) {
                    file.value = null
                    focus.request(fileButton)
                } else {
                    focus.request(`${idBase.value}-alt`)
                }
            },
            onFinish: () => {
                busy.value = false
            },
        }
    )
}

/* ── Order ─────────────────────────────────────────────────────────────────── */

function place(index: number): string {
    return index === 0 ? 'an erster Stelle und ist das Titelbild' : `an Stelle ${index + 1}`
}

/**
 * @param ids the whole new order
 * @param keep where the keyboard stays: the photo's arrow (with the other arrow as the way out at the first
 *             or last place), or its „⋯“ when the move came from the menu (K2-22), or nothing for a drag
 */
function order(ids: number[], moved: number, keep: string[]): void {
    if (busy.value) {
        return
    }

    busy.value = true
    mine.value = 'order'
    router.put(`${base.value}/fotos/reihenfolge`, { ids }, {
        preserveScroll: true,
        preserveState: true,
        // The order this page shows: moved meanwhile elsewhere, the move is refused (EditStamp, F-25).
        headers: stampHeaders(props.orderStamp),
        onSuccess: () => {
            mine.value = null
            fresh.value = moved
            announce.value = `Das Foto steht jetzt ${place(ids.indexOf(moved))}.`
        },
        onFinish: () => {
            busy.value = false

            if (keep.length > 0) {
                focus.request([...keep, moreId(moved)])
            }
        },
    })
}

function move(photo: FinishPhoto, by: -1 | 1, from: 'arrows' | 'menu' = 'arrows'): void {
    const ids = props.photos.map((p) => p.id)
    const at = ids.indexOf(photo.id)
    const to = at + by

    if (at < 0 || to < 0 || to >= ids.length) {
        return
    }

    ids.splice(at, 1)
    ids.splice(to, 0, photo.id)

    const same = `${idBase.value}-${photo.id}-${by < 0 ? 'up' : 'down'}`
    const other = `${idBase.value}-${photo.id}-${by < 0 ? 'down' : 'up'}`

    order(ids, photo.id, from === 'menu' ? [moreId(photo.id)] : [same, other])
}

/*
 * Dragging, for a pointer: the same request as the arrows. The marker is drawn where the photo will land:
 * dragged down, it lands after the photo it is dropped on, so the line is under that photo; dragged up,
 * before it, the line above (K2-07).
 */
const dragging = ref<number | null>(null)
const over = ref<{ id: number; after: boolean } | null>(null)

/* A file dragged in from the desktop is FilePick's to take, or AdminLayout's to refuse (K2-08, K2-30). */

/** Leaving a photo for one of its own parts is not leaving it: the line stays put (K2-43). */
function dragLeave(event: DragEvent, photo: FinishPhoto): void {
    const into = event.relatedTarget as Node | null
    const row = event.currentTarget as HTMLElement

    if (into !== null && row.contains(into)) {
        return
    }

    if (over.value?.id === photo.id) {
        over.value = null
    }
}

function dragStart(event: DragEvent, photo: FinishPhoto): void {
    dragging.value = photo.id
    event.dataTransfer?.setData('text/plain', String(photo.id))

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
    }
}

function dragOver(event: DragEvent, target: FinishPhoto): void {
    if (dragging.value === null) {
        return
    }

    event.preventDefault()
    const from = props.photos.findIndex((p) => p.id === dragging.value)
    const to = props.photos.findIndex((p) => p.id === target.id)
    over.value = { id: target.id, after: from < to }
}

function drop(event: DragEvent, target: FinishPhoto): void {
    event.preventDefault()
    const moved = dragging.value
    const after = over.value?.after ?? false
    dragEnd()

    if (moved === null || moved === target.id) {
        return
    }

    const ids = props.photos.map((p) => p.id).filter((id) => id !== moved)
    ids.splice(ids.indexOf(target.id) + (after ? 1 : 0), 0, moved)
    order(ids, moved, [])
}

function dragEnd(): void {
    dragging.value = null
    over.value = null
}

/* ── Describing anew ───────────────────────────────────────────────────────── */

const editing = ref<number | null>(null)
const draft = ref('')

function startEdit(photo: FinishPhoto): void {
    editing.value = photo.id
    draft.value = photo.alt
    mine.value = null
    focus.request(`${idBase.value}-alt-${photo.id}`)
}

function cancelEdit(photo: FinishPhoto): void {
    editing.value = null
    mine.value = null
    focus.request(moreId(photo.id))
}

function saveEdit(photo: FinishPhoto): void {
    if (busy.value) {
        return
    }

    busy.value = true
    mine.value = 'alt'
    router.put(`${base.value}/fotos/${photo.id}`, { alt: draft.value }, {
        preserveScroll: true,
        onSuccess: () => {
            editing.value = null
            mine.value = null
            fresh.value = photo.id
            focus.request(moreId(photo.id))
        },
        onError: () => {
            focus.request(`${idBase.value}-alt-${photo.id}`)
        },
        onFinish: () => {
            busy.value = false
        },
    })
}

/* ── Taking one off ────────────────────────────────────────────────────────── */

const removing = ref<FinishPhoto | null>(null)
const confirmOpen = ref(false)

const removeBody = computed(() => {
    const photo = removing.value

    if (photo === null) {
        return ''
    }

    if (props.photos.length === 1) {
        return 'Es ist das einzige Foto dieser Farbe. Der Shop zeigt danach wieder die Umrisszeichnung.'
    }

    return props.photos[0]?.id === photo.id ? 'Es ist das Titelbild. Das nächste Foto rückt an seine Stelle.' : 'Die übrigen Fotos rücken nach.'
})

function askRemove(photo: FinishPhoto): void {
    removing.value = photo
    confirmOpen.value = true
}

function remove(): void {
    const photo = removing.value

    if (photo === null || busy.value) {
        return
    }

    busy.value = true
    router.delete(`${base.value}/fotos/${photo.id}`, {
        preserveScroll: true,
        onSuccess: () => {
            confirmOpen.value = false
            removing.value = null
            focus.request([startId.value, lastMore])
        },
        onFinish: () => {
            busy.value = false
        },
    })
}
</script>

<template>
    <div class="fe-photos">
        <p v-if="drawing" class="fe-photos__state">Platzhalterbild der Demodaten – kein Produktfoto.</p>
        <p v-else-if="photos.length === 0" class="fe-photos__state">Kein Foto. Der Shop zeigt die Umrisszeichnung, bis eines hochgeladen ist.</p>
        <p v-else-if="editable && photos.length > 1" class="fe-photos__state">
            Das erste Foto ist das Titelbild im Shop.
            <!-- Below 768 px the arrows step aside and a finger cannot drag: the menu is the way there. -->
            <span class="fe-photos__how fe-photos__how--wide">Zieh ein Foto an eine andere Stelle oder nutze die Pfeile.</span>
            <span class="fe-photos__how fe-photos__how--narrow">Die Reihenfolge änderst du im Menü eines Fotos.</span>
        </p>

        <ol v-if="photos.length" class="fe-photos__list" :aria-label="`Fotos in ${finishName}`">
            <li
                v-for="(photo, index) in photos"
                :key="photo.id"
                class="fe-photos__item"
                :class="{
                    'adm-row--fresh': fresh === photo.id,
                    'fe-photos__item--dragging': dragging === photo.id,
                    'fe-photos__item--over': over?.id === photo.id && dragging !== photo.id && !over.after,
                    'fe-photos__item--over-after': over?.id === photo.id && dragging !== photo.id && over.after,
                }"
                :draggable="editable && !busy && editing === null && photos.length > 1 ? 'true' : undefined"
                @dragstart="dragStart($event, photo)"
                @dragover="dragOver($event, photo)"
                @dragleave="dragLeave($event, photo)"
                @drop="drop($event, photo)"
                @dragend="dragEnd"
                @animationend="fresh = null"
            >
                <div class="fe-photos__frame">
                    <span v-if="broken.has(photo.id)" class="fe-photos__missing">Datei fehlt</span>
                    <Picture v-else :image="photo.manifest" :alt="photo.alt" sizes="64px" @failed="broken = new Set([...broken, photo.id])" />
                </div>

                <div class="fe-photos__text">
                    <p class="fe-photos__place">
                        Foto {{ index + 1 }}<span v-if="index === 0" class="fe-photos__cover"> · Titelbild</span>
                    </p>
                    <p v-if="editing !== photo.id" class="fe-photos__alt">{{ photo.alt }}</p>

                    <div v-else class="fe-photos__form">
                        <div class="form-field">
                            <label class="form-field__label" :for="`${idBase}-alt-${photo.id}`">Was zeigt das Foto?</label>
                            <input
                                :id="`${idBase}-alt-${photo.id}`"
                                v-model="draft"
                                class="input"
                                type="text"
                                maxlength="200"
                                :aria-invalid="errors.alt ? 'true' : undefined"
                                :aria-describedby="`${idBase}-alt-${photo.id}-help ${idBase}-alt-${photo.id}-err`"
                                @keydown.enter.prevent="saveEdit(photo)"
                                @keydown.esc.prevent="cancelEdit(photo)"
                            >
                            <p :id="`${idBase}-alt-${photo.id}-help`" class="form-field__help">Diesen Satz hört, wer das Foto nicht sehen kann.</p>
                            <p :id="`${idBase}-alt-${photo.id}-err`" class="form-field__error">{{ errors.alt }}</p>
                        </div>
                        <div class="fe-photos__actions">
                            <button class="btn btn--primary" type="button" :disabled="busy" :aria-busy="busy ? 'true' : undefined" @click="saveEdit(photo)">Speichern</button>
                            <button class="btn btn--ghost" type="button" :disabled="busy" @click="cancelEdit(photo)">Abbrechen</button>
                        </div>
                    </div>
                </div>

                <div v-if="editable && editing !== photo.id" class="fe-photos__tools">
                    <div v-if="photos.length > 1" class="adm-row-arrows">
                        <button
                            :id="`${idBase}-${photo.id}-up`"
                            class="adm-iconbtn"
                            type="button"
                            :disabled="index === 0 || busy"
                            :aria-label="`Foto ${index + 1} nach oben`"
                            @click="move(photo, -1)"
                        >
                            <Icon name="chevron-up" :size="20" />
                        </button>
                        <button
                            :id="`${idBase}-${photo.id}-down`"
                            class="adm-iconbtn"
                            type="button"
                            :disabled="index === photos.length - 1 || busy"
                            :aria-label="`Foto ${index + 1} nach unten`"
                            @click="move(photo, 1)"
                        >
                            <Icon name="chevron-down" :size="20" />
                        </button>
                    </div>

                    <DropdownMenuRoot>
                        <DropdownMenuTrigger :data-focus="moreId(photo.id)" class="adm-iconbtn" :disabled="busy" :aria-label="`Aktionen für Foto ${index + 1}`">
                            <Icon name="more" :size="20" />
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuContent class="adm-menu" align="end" :side-offset="4" :collision-padding="MENU_ROOM" @close-auto-focus="focus.onMenuClose">
                                <DropdownMenuItem class="adm-menu__item" @select="startEdit(photo)">
                                    <Icon name="edit" :size="20" />
                                    Beschreibung ändern
                                </DropdownMenuItem>
                                <template v-if="photos.length > 1">
                                    <DropdownMenuItem class="adm-menu__item" :disabled="index === 0" @select="move(photo, -1, 'menu')">
                                        <Icon name="chevron-up" :size="20" />
                                        Nach oben
                                    </DropdownMenuItem>
                                    <DropdownMenuItem class="adm-menu__item" :disabled="index === photos.length - 1" @select="move(photo, 1, 'menu')">
                                        <Icon name="chevron-down" :size="20" />
                                        Nach unten
                                    </DropdownMenuItem>
                                </template>
                                <DropdownMenuSeparator class="adm-menu__sep" />
                                <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="askRemove(photo)">
                                    <Icon name="delete" :size="20" />
                                    Entfernen
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
                    </DropdownMenuRoot>
                </div>
            </li>
        </ol>

        <p v-if="errors.order" class="form-field__error" role="alert">{{ errors.order }}</p>

        <div v-if="editable && !adding" class="fe-photos__add">
            <button :id="startId" class="btn btn--secondary" type="button" :disabled="busy || full" @click="startAdd">Foto hinzufügen</button>
            <p class="fe-photos__count">
                {{ photos.length }} von höchstens {{ max }} Fotos<template v-if="full"> – entferne eines, um ein weiteres hinzuzufügen</template>
            </p>
        </div>

        <!-- Not a <form>: the Felge form around it is one. Enter in the description uploads, as Enter saves a
             description that is edited (K2-09). -->
        <div v-if="adding" class="fe-photos__form">
            <div class="form-field">
                <span :id="`${idBase}-file-label`" class="form-field__label">Foto (JPEG, PNG, WebP oder AVIF, höchstens 10 MB)</span>
                <FilePick
                    :id="`${idBase}-file`"
                    v-model="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    @refused="(name: string) => (refusedFile = name)"
                    label="Foto auswählen"
                    :invalid="!!errors.image"
                    :describedby="`${idBase}-file-label ${idBase}-file-err`"
                />
                <p :id="`${idBase}-file-err`" class="form-field__error">{{ errors.image || refusedLine }}</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" :for="`${idBase}-alt`">Was zeigt das Foto?</label>
                <input
                    :id="`${idBase}-alt`"
                    v-model="alt"
                    class="input"
                    type="text"
                    maxlength="200"
                    :aria-invalid="errors.alt ? 'true' : undefined"
                    :aria-describedby="`${idBase}-alt-help ${idBase}-alt-err`"
                    @keydown.enter.prevent="upload"
                >
                <p :id="`${idBase}-alt-help`" class="form-field__help">
                    Diesen Satz hört, wer das Foto nicht sehen kann – zum Beispiel „{{ title }} in {{ finishName }}, schräg von der Seite“.
                </p>
                <p :id="`${idBase}-alt-err`" class="form-field__error">{{ errors.alt }}</p>
            </div>
            <div class="fe-photos__actions">
                <button class="btn btn--primary" type="button" :disabled="busy || file === null" :aria-busy="busy ? 'true' : undefined" @click="upload">Hochladen</button>
                <button class="btn btn--ghost" type="button" :disabled="busy" @click="cancelAdd">Abbrechen</button>
            </div>
        </div>

        <p class="visually-hidden" aria-live="polite">{{ announce }}</p>
        <p class="visually-hidden" aria-live="assertive">{{ spoken }}</p>

        <AdminConfirm
            v-model:open="confirmOpen"
            :title="`Foto aus „${finishName}“ entfernen?`"
            :body="removeBody"
            confirm-label="Entfernen"
            :busy="busy"
            @confirm="remove"
        />
    </div>
</template>

<style scoped>
.fe-photos {
    display: grid;
    gap: var(--sp-12);
}

.fe-photos__state,
.fe-photos__count {
    max-width: 54ch;
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.fe-photos__list {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.fe-photos__item {
    position: relative;
    display: grid;
    grid-template-columns: var(--sp-64) minmax(0, 1fr) auto;
    gap: var(--sp-12);
    align-items: start;
    padding-block: var(--sp-8);
    border-bottom: 1px solid var(--c-line);
}

.fe-photos__item[draggable='true'] {
    cursor: grab;
}

.fe-photos__item--dragging {
    opacity: 0.5;
}

/* Where a dragged photo lands: a line above the photo it will stand before, or below the one it will follow. */
.fe-photos__item--over::before,
.fe-photos__item--over-after::before {
    content: '';
    position: absolute;
    right: 0;
    left: 0;
    height: 2px;
    background: var(--c-blue);
}

.fe-photos__item--over::before {
    top: -1px;
}

.fe-photos__item--over-after::before {
    bottom: -1px;
}

.fe-photos__frame {
    display: grid;
    place-items: center;
    width: var(--sp-64);
    height: var(--sp-64);
    overflow: hidden;
    border-radius: var(--r-control);
    background: var(--c-band);
}

.fe-photos__frame :deep(.picture) {
    width: 100%;
    height: 100%;
}

.fe-photos__text {
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.fe-photos__place {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 600;
    color: var(--c-ink);
}

.fe-photos__missing {
    padding: var(--sp-4);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
    text-align: center;
}

.fe-photos__cover {
    font-weight: 400;
    color: var(--c-ink-2);
}

.fe-photos__alt {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

.fe-photos__tools {
    display: flex;
    flex: none;
    gap: var(--sp-4);
}

.fe-photos__add {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-16);
}

.fe-photos__form {
    display: grid;
    gap: var(--sp-12);
}

.fe-photos__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.fe-photos .form-field__error:empty {
    display: none;
}

.fe-photos__how--narrow {
    display: none;
}

@media (max-width: 767px) {
    .fe-photos__how--wide {
        display: none;
    }

    .fe-photos__how--narrow {
        display: inline;
    }

    .fe-photos__item {
        grid-template-columns: var(--sp-48) minmax(0, 1fr) auto;
    }

    .fe-photos__frame {
        width: var(--sp-48);
        height: var(--sp-48);
    }

    .fe-photos__add .btn,
    .fe-photos__actions .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
