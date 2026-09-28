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
 */

import { router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, nextTick, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import FilePick from '../../../Components/Admin/FilePick.vue'
import Picture from '../../../Components/Ui/Picture.vue'
import type { FinishImage, FinishPhoto } from '../../../types/admin/felgen'

const props = defineProps<{
    modelId: number
    finishId: number
    finishName: string
    /** The cover as the shop reads it — only consulted for the demo set's drawing. */
    image: FinishImage | null
    photos: FinishPhoto[]
    max: number
    editable: boolean
    /** The model's full name, for the suggested alt text. */
    title: string
}>()

const page = usePage()
const base = computed(() => `/admin/felgen/${props.modelId}/ausfuehrungen/${props.finishId}`)
const idBase = computed(() => `fe-photo-${props.finishId}`)
const busy = ref(false)
const fresh = ref<number | null>(null)
const announce = ref('')

/** Whose errors this colour shows: only those of a request it sent itself. */
const mine = ref<'upload' | 'alt' | 'order' | null>(null)

const errors = computed(() => {
    const bag = (page.props.errors ?? {}) as Record<string, string | undefined>

    return {
        image: mine.value === 'upload' ? (bag.image ?? '') : '',
        alt: mine.value === 'upload' || mine.value === 'alt' ? (bag.alt ?? '') : '',
        order: mine.value === 'order' ? (bag.ids ?? '') : '',
    }
})

const full = computed(() => props.photos.length >= props.max)
const drawing = computed(() => props.photos.length === 0 && props.image?.placeholder === true)
const count = computed(() => (props.photos.length === 1 ? '1 Foto' : `${props.photos.length} Fotos`))

function focus(id: string): void {
    void nextTick(() => document.getElementById(id)?.focus())
}

/* ── Adding ────────────────────────────────────────────────────────────────── */

const adding = ref(false)
const file = ref<File | null>(null)
const alt = ref('')

function startAdd(): void {
    adding.value = true
    // The first photo is the front view as a rule; any later one is the admin's own sentence.
    alt.value = props.photos.length === 0 ? `${props.title} in ${props.finishName}, Ansicht von vorn` : ''
    // The button that opened the form is gone: focus goes to the first thing to do in it.
    void nextTick(() => document.querySelector<HTMLElement>(`label[for="${idBase.value}-file"]`)?.focus())
}

function cancelAdd(): void {
    adding.value = false
    file.value = null
    focus(`${idBase.value}-start`)
}

function upload(): void {
    if (file.value === null || busy.value) {
        return
    }

    busy.value = true
    mine.value = 'upload'
    router.post(
        `${base.value}/foto`,
        { image: file.value, alt: alt.value },
        {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                adding.value = false
                file.value = null
                mine.value = null
                fresh.value = props.photos.at(-1)?.id ?? null
                focus(`${idBase.value}-start`)
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

function order(ids: number[], moved: number, button: string | null): void {
    if (busy.value) {
        return
    }

    busy.value = true
    mine.value = 'order'
    router.put(`${base.value}/fotos/reihenfolge`, { ids }, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
            mine.value = null
            fresh.value = moved
            announce.value = `Das Foto steht jetzt ${place(ids.indexOf(moved))}.`
        },
        onFinish: () => {
            busy.value = false

            if (button !== null) {
                // The keyboard stays on the photo it moved; at the first or last place the other
                // direction's button takes it, and from the menu, the "…".
                void nextTick(() => {
                    const other = button.endsWith('-up') ? button.replace(/-up$/, '-down') : button.replace(/-down$/, '-up')
                    const usable = [button, other]
                        .map((id) => document.getElementById(id) as HTMLButtonElement | null)
                        .find((el) => el !== null && !el.disabled && el.offsetParent !== null)

                    ;(usable ?? document.getElementById(`${idBase.value}-more-${moved}`))?.focus()
                })
            }
        },
    })
}

function move(photo: FinishPhoto, by: -1 | 1): void {
    const ids = props.photos.map((p) => p.id)
    const from = ids.indexOf(photo.id)
    const to = from + by

    if (from < 0 || to < 0 || to >= ids.length) {
        return
    }

    ids.splice(from, 1)
    ids.splice(to, 0, photo.id)
    order(ids, photo.id, `${idBase.value}-${photo.id}-${by < 0 ? 'up' : 'down'}`)
}

/* Dragging, for a pointer: the same request as the arrows. */
const dragging = ref<number | null>(null)
const over = ref<number | null>(null)

function dragStart(event: DragEvent, photo: FinishPhoto): void {
    dragging.value = photo.id
    event.dataTransfer?.setData('text/plain', String(photo.id))

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
    }
}

function dragOver(event: DragEvent, photo: FinishPhoto): void {
    if (dragging.value === null) {
        return
    }

    event.preventDefault()
    over.value = photo.id
}

function drop(event: DragEvent, target: FinishPhoto): void {
    event.preventDefault()
    const moved = dragging.value
    dragEnd()

    if (moved === null || moved === target.id) {
        return
    }

    const ids = props.photos.map((p) => p.id).filter((id) => id !== moved)
    ids.splice(props.photos.findIndex((p) => p.id === target.id), 0, moved)
    order(ids, moved, null)
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
    focus(`${idBase.value}-alt-${photo.id}`)
}

function cancelEdit(photo: FinishPhoto): void {
    editing.value = null
    focus(`${idBase.value}-more-${photo.id}`)
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
            focus(`${idBase.value}-more-${photo.id}`)
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
            focus(`${idBase.value}-start`)
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
                    'fe-photos__item--over': over === photo.id && dragging !== photo.id,
                }"
                :draggable="editable && !busy && editing === null && photos.length > 1 ? 'true' : undefined"
                @dragstart="dragStart($event, photo)"
                @dragover="dragOver($event, photo)"
                @dragleave="over = over === photo.id ? null : over"
                @drop="drop($event, photo)"
                @dragend="dragEnd"
                @animationend="fresh = null"
            >
                <div class="fe-photos__frame">
                    <Picture :image="photo.manifest" :alt="photo.alt" sizes="72px" />
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
                        <DropdownMenuTrigger :id="`${idBase}-more-${photo.id}`" class="adm-iconbtn" :disabled="busy" :aria-label="`Aktionen für Foto ${index + 1}`">
                            <Icon name="more" :size="20" />
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuContent class="adm-menu" align="end" :side-offset="4">
                                <DropdownMenuItem class="adm-menu__item" @select="startEdit(photo)">
                                    <Icon name="edit" :size="20" />
                                    Beschreibung ändern
                                </DropdownMenuItem>
                                <template v-if="photos.length > 1">
                                    <DropdownMenuItem class="adm-menu__item" :disabled="index === 0" @select="move(photo, -1)">
                                        <Icon name="chevron-up" :size="20" />
                                        Nach oben
                                    </DropdownMenuItem>
                                    <DropdownMenuItem class="adm-menu__item" :disabled="index === photos.length - 1" @select="move(photo, 1)">
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
            <button :id="`${idBase}-start`" class="btn btn--secondary" type="button" :disabled="busy || full" @click="startAdd">Foto hinzufügen</button>
            <p class="fe-photos__count">
                {{ count }} von höchstens {{ max }}<template v-if="full"> – entferne eines, um ein weiteres hinzuzufügen</template>
            </p>
        </div>

        <div v-if="adding" class="fe-photos__form">
            <div class="form-field">
                <span :id="`${idBase}-file-label`" class="form-field__label">Foto (JPEG, PNG, WebP oder AVIF, höchstens 10 MB)</span>
                <FilePick
                    :id="`${idBase}-file`"
                    v-model="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    label="Foto auswählen"
                    :invalid="!!errors.image"
                    :describedby="`${idBase}-file-label ${idBase}-file-err`"
                />
                <p :id="`${idBase}-file-err`" class="form-field__error">{{ errors.image }}</p>
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
    grid-template-columns: 72px minmax(0, 1fr) auto;
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

/* Where a dragged photo lands: a line across the top of the photo it will stand before. */
.fe-photos__item--over::before {
    content: '';
    position: absolute;
    inset: -1px 0 auto;
    height: 2px;
    background: var(--c-blue);
}

.fe-photos__frame {
    width: 72px;
    height: 72px;
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
        grid-template-columns: 56px minmax(0, 1fr) auto;
    }

    .fe-photos__frame {
        width: 56px;
        height: 56px;
    }

    .fe-photos__add .btn,
    .fe-photos__actions .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
