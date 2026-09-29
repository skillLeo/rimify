<script setup lang="ts">
/**
 * Katalog › Felgen › one Felge — its master data, finishes with photographs, the size matrix, and the
 * words for search engines, saved together (WheelEditor); and its step into the shop, which is not a
 * save (the review release §4.2).
 *
 * The Freigabe-Check stands above the form: what stops publishing, and what only needs knowing. It is
 * the server's reading of the saved rows, so it changes when the form is saved, not while typing.
 * A size an approval names keeps its measurements (SizesTable).
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, nextTick, ref, watch } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage, { type AdminPageAction } from '../../../Components/Admin/AdminPage.vue'
import AdminSaveBar from '../../../Components/Admin/AdminSaveBar.vue'
import { useDirtyForm } from '../../../composables/admin/useDirtyForm'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import type { AdminFelgeProps, FinishForm, SizeForm, WheelForm } from '../../../types/admin/felgen'
import FinishPhotos from './FinishPhotos.vue'
import MatrixPanel from './MatrixPanel.vue'
import SizesTable from './SizesTable.vue'
import { generate, type MatrixInput } from './matrix'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminFelgeProps>()

const NEW_BRAND = -1

function fromProps(): WheelForm {
    const model = props.model

    return {
        brand_id: model?.brandId ?? null,
        brand_new: '',
        name: model?.name ?? '',
        type_designation: model?.typeDesignation ?? '',
        spoke_count: model?.spokeCount ?? 5,
        description: model?.description ?? '',
        seo_title: model?.seoTitle ?? '',
        seo_description: model?.seoDescription ?? '',
        finishes: props.finishes.length
            ? props.finishes.map((f) => ({ key: f.key, id: f.id, name: f.name, hex: f.hex, art_finish: f.artFinish }))
            : [{ key: 'n1', id: null, name: '', hex: '', art_finish: 'graphite' }],
        configs: props.configs.map(({ locked: _locked, ...size }) => ({ ...size })),
    }
}

const editor = useDirtyForm<WheelForm>(fromProps(), {
    // Asked at each save: after the first save of a new Felge the page stays, now with its model.
    method: () => (props.model ? 'put' : 'post'),
    url: () => (props.model ? `/admin/felgen/${props.model.id}` : '/admin/felgen'),
    onSaved: () => sync(),
})

const form = editor.form

/* Sent as the server reads it: a chosen brand or a new one, never both. */
form.transform((data) => ({
    ...data,
    brand_id: data.brand_id === NEW_BRAND ? null : data.brand_id,
    brand_new: data.brand_id === NEW_BRAND ? data.brand_new : '',
}))

/**
 * After a save the server's rows are the truth: new finishes and sizes now have ids, and a second
 * save must not create them again.
 */
function sync(): void {
    const fresh = fromProps()

    form.defaults(fresh)
    form.reset()
    form.clearErrors()
}

watch(
    () => props.model?.id,
    () => sync()
)

const editable = computed(() => (props.model ? props.can.edit : props.can.create))
const readonly = computed(() => !editable.value)
const locked = computed(() => props.configs.flatMap((c) => (c.locked && c.id !== null ? [c.id] : [])))

const title = computed(() => (props.model ? `${props.model.brand} ${props.model.name}` : 'Neue Felge'))
const context = computed(() => {
    if (!props.model) {
        return 'Entwurf, noch nicht gespeichert'
    }

    const sizes = props.configs.length === 1 ? '1 Größe' : `${props.configs.length} Größen`

    return `${props.model.statusLabel} · ${sizes}${props.model.updated ? ` · geändert am ${props.model.updated}` : ''}`
})

/* ── Errors: the server's keys are the fields' paths ───────────────────────── */

const inertiaPage = usePage()
/* The fields' errors are the form's own, so „Verwerfen“ clears them; the page's bag carries only the
   refusal of a step (Veröffentlichen). */
const errors = computed(() => form.errors as Record<string, string | undefined>)
const stepError = computed(() => ((inertiaPage.props.errors ?? {}) as Record<string, string | undefined>).publish ?? '')

function err(path: string): string {
    return errors.value[path] ?? ''
}

const errorCount = computed(() => Object.values(errors.value).filter((value) => typeof value === 'string' && value !== '').length)

/* ── Finishes ──────────────────────────────────────────────────────────────── */

let counter = 0

function nextKey(prefix: string): string {
    counter++

    return `${prefix}${Date.now().toString(36)}${counter}`
}

function addFinish(): void {
    form.finishes.push({ key: nextKey('n'), id: null, name: '', hex: '', art_finish: 'graphite' })
    void nextTick(() => document.getElementById(`fe-f-${form.finishes.length - 1}-name`)?.focus())
}

function usedBy(finish: FinishForm): number {
    return form.configs.filter((size) => size.finish === finish.key).length
}

/* Errors are keyed by position: after a row goes they would stand under its neighbour, so they go
   too, and the next save says again what is still wrong. Focus moves to what is still there. */
function removeFinish(index: number): void {
    form.finishes.splice(index, 1)
    form.clearErrors()
    void nextTick(() => document.getElementById(`fe-f-${Math.min(index, form.finishes.length - 1)}-name`)?.focus())
}

function serverFinish(finish: FinishForm) {
    return finish.id === null ? null : (props.finishes.find((f) => f.id === finish.id) ?? null)
}

/* ── Sizes ─────────────────────────────────────────────────────────────────── */

const brandName = computed(() => {
    if (form.brand_id === NEW_BRAND) {
        return form.brand_new
    }

    return props.brands.find((b) => b.value === form.brand_id)?.label ?? ''
})

const matrixStart = computed(() => {
    const first = form.configs[0]

    return { bolt_holes: first?.bolt_holes ?? 5, bolt_circle: first?.bolt_circle ?? '', bore: first?.bore ?? '' }
})

const added = ref('')
/* Open from the start while there is no size yet: that is when lists save the most typing. */
const matrixOpen = ref(props.configs.length === 0)

function addSizes(input: MatrixInput): void {
    const rows = generate(input, form.finishes, form.configs, brandName.value, form.name, () => nextKey('m'))

    form.configs.push(...rows)
    added.value =
        rows.length === 0
            ? 'Alle diese Größen stehen schon in der Tabelle.'
            : `${rows.length === 1 ? '1 Größe' : `${rows.length} Größen`} hinzugefügt. Sie werden mit „Speichern“ angelegt.`
}

function addSize(): void {
    const last = form.configs[form.configs.length - 1]
    const size: SizeForm = {
        key: nextKey('m'),
        id: null,
        finish: last?.finish ?? form.finishes[0]?.key ?? '',
        diameter: last?.diameter ?? '',
        width: last?.width ?? '',
        et: '',
        bolt_holes: last?.bolt_holes ?? 5,
        bolt_circle: last?.bolt_circle ?? '',
        bore: last?.bore ?? '',
        sku: '',
        ean: '',
        kba: '',
        price: last?.price ?? '',
        stock: 0,
        weight_g: null,
    }

    form.configs.push(size)
    // The new row is below the fold more often than not: brought into view, its first field focused.
    void nextTick(() => {
        const field = document.getElementById(`fe-size-${form.configs.length - 1}-finish`)
        // At once, not smooth: on a phone the row can be screens away, and a long glide is motion
        // nobody asked for.
        field?.scrollIntoView({ block: 'center' })
        field?.focus({ preventScroll: true })
    })
}

function removeSize(index: number): void {
    form.configs.splice(index, 1)
    form.clearErrors()
    void nextTick(() => {
        const next = document.getElementById(`fe-size-${Math.min(index, form.configs.length - 1)}-sku`)
        ;(next ?? document.getElementById('fe-add-size'))?.focus()
    })
}

/* ── Search engines ─────────────────────────────────────────────────────────── */

const seoTitlePreview = computed(() => form.seo_title || `${brandName.value} ${form.name}`.trim() || 'Titel der Felge')
const seoDescriptionPreview = computed(() => form.seo_description || form.description.slice(0, 160) || 'Beschreibung der Felge für Suchmaschinen.')

/* ── Into the shop and out of it ───────────────────────────────────────────── */

type Step = 'veroeffentlichen' | 'zurueckziehen' | 'archivieren' | 'wiederherstellen'

const step = ref<Step | null>(null)
const stepBusy = ref(false)
const stepOpen = computed({
    get: () => step.value !== null,
    set: (open: boolean) => {
        if (!open) {
            step.value = null
        }
    },
})

const STEPS: Record<Step, { title: string; body: string; label: string }> = {
    veroeffentlichen: {
        title: 'Felge veröffentlichen?',
        body: 'Sie ist danach im Shop und wird bei jedem Fahrzeug gezeigt, für das eine Freigabe hinterlegt ist.',
        label: 'Veröffentlichen',
    },
    zurueckziehen: {
        title: 'Felge zurückziehen?',
        body: 'Sie ist danach nicht mehr im Shop. Offene Warenkörbe mit ihr können nicht mehr bestellt werden.',
        label: 'Zurückziehen',
    },
    archivieren: {
        title: 'Felge archivieren?',
        body: 'Sie verschwindet aus dem Shop und aus der Liste. Unter „Status: Archiviert“ findest du sie wieder.',
        label: 'Archivieren',
    },
    wiederherstellen: {
        title: 'Felge wiederherstellen?',
        body: 'Sie wird wieder ein Entwurf und steht in der Liste. In den Shop kommt sie erst, wenn du sie veröffentlichst.',
        label: 'Wiederherstellen',
    },
}

function runStep(): void {
    if (!props.model || step.value === null) {
        return
    }

    stepBusy.value = true
    router.post(`/admin/felgen/${props.model.id}/${step.value}`, {}, {
        preserveScroll: true,
        onFinish: () => {
            stepBusy.value = false
            step.value = null
        },
    })
}

const blocked = computed(() => (props.check?.blockers.length ?? 0) > 0)
const canPublish = computed(() => !!props.model && props.can.publish && !props.model.demo && props.model.status === 'draft')
const canUnpublish = computed(() => !!props.model && props.can.publish && props.model.status === 'published')

const more = computed<AdminPageAction[]>(() => {
    const actions: AdminPageAction[] = []
    const model = props.model

    if (!model) {
        return actions
    }

    if (model.shopUrl) {
        actions.push({ label: 'Im Shop ansehen', href: model.shopUrl, icon: 'eye' })
    }

    if (canUnpublish.value) {
        actions.push({ label: 'Zurückziehen', run: () => (step.value = 'zurueckziehen'), icon: 'eye-off' })
    }

    if (props.can.archive && model.status === 'archived') {
        actions.push({ label: 'Wiederherstellen', run: () => (step.value = 'wiederherstellen') })
    } else if (props.can.archive) {
        actions.push({ label: 'Archivieren', run: () => (step.value = 'archivieren'), danger: true })
    }

    return actions
})
</script>

<template>
    <AdminPage :title="title" :context="context" :more="more" :read-only="readonly">
        <template v-if="canPublish" #primary>
            <button class="btn btn--primary" type="button" :disabled="blocked || editor.dirty.value" @click="step = 'veroeffentlichen'">
                <Icon name="publish" :size="20" />
                Veröffentlichen
            </button>
        </template>

        <!-- The Freigabe-Check: the saved rows as the shop would read them. -->
        <section v-if="model" class="fe-check" :class="{ 'fe-check--blocked': blocked }" aria-labelledby="fe-check-h">
            <h2 id="fe-check-h" class="fe-check__title">
                Freigabe-Check
                <span class="fe-check__verdict">
                    <template v-if="model.demo">Nicht veröffentlichbar</template>
                    <template v-else-if="model.status === 'published'">Im Shop</template>
                    <template v-else-if="blocked">Noch nicht veröffentlichbar</template>
                    <template v-else>Kann veröffentlicht werden</template>
                </span>
            </h2>
            <ul v-if="check && (check.blockers.length || check.hints.length)" class="fe-check__list">
                <li v-for="line in check.blockers" :key="line" class="fe-check__item fe-check__item--bad">
                    <Icon name="warning" :size="16" />
                    {{ line }}
                </li>
                <li v-for="line in check.hints" :key="line" class="fe-check__item">
                    <Icon name="info" :size="16" />
                    {{ line }}
                </li>
            </ul>
            <p v-else class="adm-note">Nichts steht im Weg.</p>
            <p v-if="canPublish && editor.dirty.value" class="adm-note">Speichere zuerst deine Änderungen – veröffentlicht wird, was gespeichert ist.</p>
            <p v-if="stepError" class="adm-alert" role="alert">{{ stepError }}</p>
        </section>
        <p v-else class="adm-note fe-first">Nach dem ersten Speichern prüft der Freigabe-Check hier, ob die Felge in den Shop kann. Gespeichert wird sie als Entwurf.</p>

        <p v-if="errorCount" class="adm-alert" role="alert">
            {{ errorCount === 1 ? 'Eine Angabe muss noch korrigiert werden.' : `${errorCount} Angaben müssen noch korrigiert werden.` }}
            Die Hinweise stehen bei den Feldern.
        </p>
        <p v-if="err('configs')" class="adm-alert" role="alert">{{ err('configs') }}</p>

        <form class="fe-form" novalidate @submit.prevent="editor.save">
            <!-- ── Stammdaten ──────────────────────────────────────────────── -->
            <section class="adm-section" aria-labelledby="fe-h-base">
                <div class="adm-section__head">
                    <h2 id="fe-h-base" class="adm-section__title">Stammdaten</h2>
                </div>
                <div class="adm-fields fe-narrow">
                    <div class="form-field">
                        <label class="form-field__label" for="fe-brand">Marke</label>
                        <select id="fe-brand" v-model="form.brand_id" class="input" :disabled="readonly" :aria-invalid="err('brand_id') ? 'true' : undefined" aria-describedby="fe-brand-err">
                            <option :value="null" disabled>Marke wählen</option>
                            <option v-for="brand in brands" :key="brand.value" :value="brand.value">{{ brand.label }}</option>
                            <option :value="NEW_BRAND">Neue Marke anlegen …</option>
                        </select>
                        <p id="fe-brand-err" class="form-field__error">{{ err('brand_id') }}</p>
                    </div>
                    <div v-if="form.brand_id === NEW_BRAND" class="form-field">
                        <label class="form-field__label" for="fe-brand-new">Name der neuen Marke</label>
                        <input id="fe-brand-new" v-model="form.brand_new" class="input" type="text" maxlength="60" :aria-invalid="err('brand_new') ? 'true' : undefined" aria-describedby="fe-brand-new-err">
                        <p id="fe-brand-new-err" class="form-field__error">{{ err('brand_new') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fe-name">Modell</label>
                        <input id="fe-name" v-model="form.name" class="input" type="text" maxlength="80" :readonly="readonly" :aria-invalid="err('name') ? 'true' : undefined" aria-describedby="fe-name-err">
                        <p id="fe-name-err" class="form-field__error">{{ err('name') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fe-type">Typbezeichnung <span class="fe-optional">(optional)</span></label>
                        <input id="fe-type" v-model="form.type_designation" class="input" type="text" maxlength="80" :readonly="readonly" aria-describedby="fe-type-help fe-type-err">
                        <p id="fe-type-help" class="form-field__help">So, wie sie im Gutachten steht.</p>
                        <p id="fe-type-err" class="form-field__error">{{ err('type_designation') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fe-spokes">Speichen</label>
                        <select id="fe-spokes" v-model.number="form.spoke_count" class="input fe-short" :disabled="readonly" aria-describedby="fe-spokes-help">
                            <option v-for="n in options.spokes" :key="n" :value="n">{{ n }}</option>
                        </select>
                        <p id="fe-spokes-help" class="form-field__help">Bestimmt die Umrisszeichnung, solange es kein Foto gibt.</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="fe-desc">Beschreibung <span class="fe-optional">(optional)</span></label>
                        <textarea id="fe-desc" v-model="form.description" class="input fe-area" rows="5" maxlength="4000" :readonly="readonly" :aria-invalid="err('description') ? 'true' : undefined" aria-describedby="fe-desc-err" />
                        <p id="fe-desc-err" class="form-field__error">{{ err('description') }}</p>
                    </div>
                </div>
            </section>

            <!-- ── Ausführungen ───────────────────────────────────────────── -->
            <section class="adm-section" aria-labelledby="fe-h-finishes">
                <div class="adm-section__head">
                    <h2 id="fe-h-finishes" class="adm-section__title">Ausführungen</h2>
                    <button v-if="!readonly" class="btn btn--ghost" type="button" @click="addFinish">
                        <Icon name="plus" :size="20" />
                        Ausführung hinzufügen
                    </button>
                </div>
                <p v-if="err('finishes')" class="form-field__error">{{ err('finishes') }}</p>
                <ol class="fe-finishes">
                    <li v-for="(finish, index) in form.finishes" :key="finish.key" class="fe-finish">
                        <div class="fe-finish__fields">
                            <div class="form-field">
                                <label class="form-field__label" :for="`fe-f-${index}-name`">Name</label>
                                <input
                                    :id="`fe-f-${index}-name`"
                                    v-model="finish.name"
                                    class="input"
                                    type="text"
                                    maxlength="60"
                                    placeholder="z. B. Graphit matt"
                                    :readonly="readonly"
                                    :aria-invalid="err(`finishes.${index}.name`) ? 'true' : undefined"
                                    :aria-describedby="`fe-f-${index}-name-err`"
                                >
                                <p :id="`fe-f-${index}-name-err`" class="form-field__error">{{ err(`finishes.${index}.name`) }}</p>
                            </div>
                            <div class="form-field">
                                <label class="form-field__label" :for="`fe-f-${index}-hex`">Farbfeld <span class="fe-optional">(optional)</span></label>
                                <div class="fe-hex">
                                    <input
                                        class="fe-hex__swatch"
                                        type="color"
                                        :value="/^#[0-9A-Fa-f]{6}$/.test(finish.hex) ? finish.hex : '#C9CED5'"
                                        :disabled="readonly"
                                        :aria-label="`Farbe für ${finish.name || 'die Ausführung'} wählen`"
                                        @input="finish.hex = ($event.target as HTMLInputElement).value.toUpperCase()"
                                    >
                                    <input
                                        :id="`fe-f-${index}-hex`"
                                        v-model="finish.hex"
                                        class="input"
                                        type="text"
                                        maxlength="7"
                                        placeholder="#3F454D"
                                        spellcheck="false"
                                        :readonly="readonly"
                                        :aria-invalid="err(`finishes.${index}.hex`) ? 'true' : undefined"
                                        :aria-describedby="`fe-f-${index}-hex-err`"
                                    >
                                </div>
                                <p :id="`fe-f-${index}-hex-err`" class="form-field__error">{{ err(`finishes.${index}.hex`) }}</p>
                            </div>
                            <div class="form-field">
                                <label class="form-field__label" :for="`fe-f-${index}-art`">Farbe der Umrisszeichnung</label>
                                <select :id="`fe-f-${index}-art`" v-model="finish.art_finish" class="input" :disabled="readonly">
                                    <option v-for="option in options.artFinishes" :key="option.value" :value="option.value">{{ option.label }}</option>
                                </select>
                            </div>
                            <div v-if="!readonly && form.finishes.length > 1" class="fe-finish__remove">
                                <button v-if="usedBy(finish) === 0" class="btn btn--ghost" type="button" @click="removeFinish(index)">Entfernen</button>
                                <p v-else class="adm-note fe-finish__used">Von {{ usedBy(finish) === 1 ? 'einer Größe' : `${usedBy(finish)} Größen` }} genutzt – erst die Größen entfernen.</p>
                            </div>
                        </div>

                        <FinishPhotos
                            v-if="model && finish.id !== null && serverFinish(finish)"
                            :model-id="model.id"
                            :finish-id="finish.id"
                            :finish-name="serverFinish(finish)!.name"
                            :image="serverFinish(finish)!.image"
                            :photos="serverFinish(finish)!.photos"
                            :max="options.maxPhotos"
                            :editable="editable"
                            :title="title"
                        />
                        <p v-else class="adm-note">Nach dem Speichern kannst du für diese Ausführung Fotos hochladen.</p>
                    </li>
                </ol>
            </section>

            <!-- ── Größen ─────────────────────────────────────────────────── -->
            <section class="adm-section" aria-labelledby="fe-h-sizes">
                <div class="adm-section__head">
                    <h2 id="fe-h-sizes" class="adm-section__title">Größen</h2>
                    <div v-if="!readonly" class="fe-size-actions">
                        <button class="btn btn--ghost" type="button" :aria-expanded="matrixOpen ? 'true' : 'false'" aria-controls="fe-matrix" @click="matrixOpen = !matrixOpen">
                            Größen aus Listen erzeugen
                            <Icon :name="matrixOpen ? 'chevron-up' : 'chevron-down'" :size="16" />
                        </button>
                        <button id="fe-add-size" class="btn btn--ghost" type="button" @click="addSize">
                            <Icon name="plus" :size="20" />
                            Eine Größe hinzufügen
                        </button>
                    </div>
                </div>
                <p class="adm-note">Preis je Felge, mit Mehrwertsteuer. Eine Größe, die in einem Gutachten steht, behält ihre Maße.</p>

                <MatrixPanel v-if="!readonly && matrixOpen" id="fe-matrix" :finishes="form.finishes" :bolt-holes="options.boltHoles" :start="matrixStart" @add="addSizes" />
                <p v-if="added" class="adm-note fe-added" role="status">{{ added }}</p>

                <SizesTable
                    v-if="form.configs.length"
                    v-model:sizes="form.configs"
                    :finishes="form.finishes"
                    :documents="documents"
                    :locked="locked"
                    :errors="errors"
                    :readonly="readonly"
                    :bolt-holes="options.boltHoles"
                    @remove="removeSize"
                />
                <p v-else class="adm-note fe-nosizes">Noch keine Größe. Erzeuge sie oben aus Listen oder füge eine einzeln hinzu.</p>
            </section>

            <!-- ── Suchmaschinen ──────────────────────────────────────────── -->
            <section class="adm-section" aria-labelledby="fe-h-seo">
                <div class="adm-section__head">
                    <h2 id="fe-h-seo" class="adm-section__title">Suchmaschinen</h2>
                </div>
                <div class="adm-fields fe-narrow">
                    <div class="form-field">
                        <div class="fe-count-head">
                            <label class="form-field__label" for="fe-seo-t">Titel <span class="fe-optional">(optional)</span></label>
                            <span class="fe-count" :class="{ 'fe-count--over': form.seo_title.length > 60 }">{{ form.seo_title.length }} / 60</span>
                        </div>
                        <input id="fe-seo-t" v-model="form.seo_title" class="input" type="text" maxlength="70" :readonly="readonly" aria-describedby="fe-seo-t-help fe-seo-t-err">
                        <p id="fe-seo-t-help" class="form-field__help">Leer lassen, dann steht dort Marke und Modell.</p>
                        <p id="fe-seo-t-err" class="form-field__error">{{ err('seo_title') }}</p>
                    </div>
                    <div class="form-field">
                        <div class="fe-count-head">
                            <label class="form-field__label" for="fe-seo-d">Beschreibung <span class="fe-optional">(optional)</span></label>
                            <span class="fe-count" :class="{ 'fe-count--over': form.seo_description.length > 155 }">{{ form.seo_description.length }} / 155</span>
                        </div>
                        <textarea id="fe-seo-d" v-model="form.seo_description" class="input fe-area" rows="3" maxlength="170" :readonly="readonly" aria-describedby="fe-seo-d-err" />
                        <p id="fe-seo-d-err" class="form-field__error">{{ err('seo_description') }}</p>
                    </div>
                    <figure class="fe-serp" aria-label="So etwa erscheint die Felge in den Suchergebnissen">
                        <p class="fe-serp__title">{{ seoTitlePreview }}</p>
                        <p class="fe-serp__desc">{{ seoDescriptionPreview }}</p>
                    </figure>
                </div>
            </section>
        </form>

        <AdminSaveBar v-if="editable" :editor="editor" />

        <AdminConfirm
            v-model:open="stepOpen"
            :title="step ? STEPS[step].title : ''"
            :body="step ? STEPS[step].body : ''"
            :confirm-label="step ? STEPS[step].label : ''"
            :busy="stepBusy"
            @confirm="runStep"
        />
    </AdminPage>
</template>

<style scoped>
.fe-narrow {
    max-width: var(--adm-form-max);
}

.fe-short {
    max-width: 12ch;
}

.fe-area {
    height: auto;
    padding-block: var(--sp-8);
    resize: vertical;
}

.fe-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.fe-form .form-field__error:empty {
    display: none;
}

.fe-first {
    margin-bottom: var(--sp-24);
}

/* ── The Freigabe-Check ───────────────────────────────────────────────────── */

.fe-check {
    display: grid;
    gap: var(--sp-12);
    max-width: var(--adm-form-max);
    margin-bottom: var(--sp-32);
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.fe-check--blocked {
    background: var(--c-warn-tint);
}

.fe-check__title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4) var(--sp-16);
    margin: 0;
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
}

.fe-check__verdict {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    color: var(--c-ink-2);
}

.fe-check__list {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.fe-check__item {
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr);
    gap: var(--sp-8);
    align-items: start;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.fe-check__item :deep(svg) {
    margin-top: 2px;
}

.fe-check__item--bad {
    color: var(--c-ink);
    font-weight: 500;
}

.fe-check .adm-alert {
    margin: 0;
}

/* ── Finishes ─────────────────────────────────────────────────────────────── */

.fe-finishes {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.fe-finish {
    display: grid;
    gap: var(--sp-16);
    padding-block: var(--sp-16);
    border-bottom: 1px solid var(--c-line);
}

.fe-finish__fields {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1.2fr) minmax(0, 1.4fr) auto;
    align-items: start;
    gap: var(--sp-16);
}

.fe-finish__remove {
    padding-top: calc(var(--lh-small) + var(--sp-8));
}

.fe-hex {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
}

/* The swatch is the colour picker itself: a control, the size of one. */
.fe-hex__swatch {
    flex: none;
    width: var(--adm-control-h);
    height: var(--adm-control-h);
    padding: var(--sp-4);
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
    background: var(--c-surface);
    cursor: pointer;
}

.fe-hex__swatch:disabled {
    cursor: default;
}

.fe-finish__used {
    max-width: 22ch;
}

.fe-size-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.fe-hex .input {
    min-width: 0;
}

/* ── Sizes ────────────────────────────────────────────────────────────────── */

.fe-added {
    margin-block: var(--sp-12);
}

.fe-nosizes {
    margin-top: var(--sp-16);
}

.adm-section :deep(.fe-matrix) {
    margin-block: var(--sp-16);
}

/* ── Search engines ───────────────────────────────────────────────────────── */

.fe-count-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-8);
}

.fe-count {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
    font-variant-numeric: tabular-nums;
}

.fe-count--over {
    color: var(--c-bad);
}

.fe-serp {
    margin: 0;
    padding: var(--sp-12) var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
}

.fe-serp__title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    color: var(--c-blue);
    overflow-wrap: anywhere;
}

.fe-serp__desc {
    margin: var(--sp-4) 0 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

@media (max-width: 1023px) {
    .fe-finish__fields {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .fe-finish__remove {
        padding-top: 0;
    }
}

@media (max-width: 767px) {
    .fe-finish__fields {
        grid-template-columns: minmax(0, 1fr);
    }

    .fe-finish__remove .btn,
    .adm-section__head .btn {
        min-height: var(--adm-control-h-lg);
    }

    .fe-hex__swatch {
        width: var(--adm-control-h-lg);
        height: var(--adm-control-h-lg);
    }
}
</style>
