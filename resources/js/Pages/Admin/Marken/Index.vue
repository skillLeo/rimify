<script setup lang="ts">
/**
 * Katalog › Marken: every brand the shop knows, with its logo.
 *
 * A brand is created here, by the import or by the Felge form; its logo only here (MarkenController). The
 * brand wall on the homepage draws a logo as a shape in the shop's own ink, so a logo is an SVG or a PNG /
 * WebP with a transparent ground — the server reads the file and refuses anything else in a sentence under
 * the row it was sent from. One form serves a new brand and an existing one, like Zubehörpreise.
 *
 * Every write is authorised on the server (R-11); `can` only decides what is drawn.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, reactive, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface BrandRow {
    id: number
    name: string
    slug: string
    isWheelBrand: boolean
    sortOrder: number
    logo: { url: string; aspect: number } | null
    logoBroken: boolean
    wheels: number
    tyres: number
}

const props = defineProps<{
    brands: BrandRow[]
    can: { create: boolean; update: boolean; delete: boolean }
}>()

const BASE = '/admin/marken'
const LOGO_HINT = 'SVG, oder PNG / WebP mit transparentem Hintergrund, höchstens 1 MB. Die Markenwand zeichnet die Form des Logos in der Schriftfarbe des Shops.'

interface BrandForm {
    name: string
    isWheelBrand: boolean
    sortOrder: number | ''
}

function blank(): BrandForm {
    return { name: '', isWheelBrand: true, sortOrder: 0 }
}

const page = usePage()
const form = reactive<BrandForm>(blank())
const nameField = ref<HTMLInputElement | null>(null)
const editing = ref<number | null>(null)
const sent = ref(false)
const busy = ref(false)
/** The row whose logo was just sent: only it shows the server's word about a logo. */
const logoRow = ref<number | null>(null)
const confirming = ref<BrandRow | null>(null)

const bag = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})
const errors = computed<Record<string, string>>(() => (sent.value ? bag.value : {}))
const logoError = computed(() => bag.value.logo ?? '')

const canWrite = computed(() => props.can.create || props.can.update)
const editingBrand = computed(() => props.brands.find((b) => b.id === editing.value) ?? null)
const formTitle = computed(() => (editingBrand.value === null ? 'Neue Marke' : `Marke bearbeiten: ${editingBrand.value.name}`))

const context = computed(() => {
    const total = props.brands.length
    const onWall = props.brands.filter((b) => b.isWheelBrand).length
    const withLogo = props.brands.filter((b) => b.logo !== null).length

    return total === 0 ? 'Noch keine Marke' : `${total} ${total === 1 ? 'Marke' : 'Marken'} · ${onWall} auf der Markenwand · ${withLogo} mit Logo`
})

const confirmOpen = computed({
    get: () => confirming.value !== null,
    set: (open: boolean) => {
        if (!open) {
            confirming.value = null
        }
    },
})

function reset(): void {
    Object.assign(form, blank())
    editing.value = null
    sent.value = false
}

function edit(brand: BrandRow): void {
    form.name = brand.name
    form.isWheelBrand = brand.isWheelBrand
    form.sortOrder = brand.sortOrder
    editing.value = brand.id
    sent.value = false
    nameField.value?.focus()
}

function submit(): void {
    sent.value = true
    busy.value = true

    const options = {
        preserveScroll: true,
        onSuccess: reset,
        onFinish: () => {
            busy.value = false
        },
    }

    if (editing.value === null) {
        router.post(BASE, { ...form }, options)
    } else {
        router.put(`${BASE}/${editing.value}`, { ...form }, options)
    }
}

function upload(brand: BrandRow, event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (file === undefined) {
        return
    }

    logoRow.value = brand.id
    busy.value = true

    router.post(`${BASE}/${brand.id}/logo`, { logo: file }, {
        forceFormData: true,
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
            input.value = ''
        },
    })
}

function removeLogo(brand: BrandRow): void {
    logoRow.value = brand.id
    busy.value = true

    router.delete(`${BASE}/${brand.id}/logo`, {
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
        },
    })
}

function remove(): void {
    const brand = confirming.value

    if (brand === null) {
        return
    }

    busy.value = true
    router.delete(`${BASE}/${brand.id}`, {
        preserveScroll: true,
        onSuccess: () => {
            confirming.value = null

            if (editing.value === brand.id) {
                reset()
            }
        },
        onFinish: () => {
            busy.value = false
        },
    })
}

function counts(brand: BrandRow): string {
    const parts = [brand.wheels === 1 ? '1 Felge' : `${brand.wheels} Felgen`]

    if (brand.tyres > 0) {
        parts.push(brand.tyres === 1 ? '1 Reifen' : `${brand.tyres} Reifen`)
    }

    return parts.join(' · ')
}
</script>

<template>
    <AdminPage title="Marken" :context="context" :read-only="!canWrite">
        <p class="adm-note mk__lead">
            Eine Marke entsteht hier, beim Import oder beim Anlegen einer Felge. Das Logo kommt nur hier hinein. Marken
            mit Häkchen „Markenwand“ stehen auf der Startseite – als Link erst, wenn sie eine Felge auf Lager haben.
        </p>

        <section v-if="canWrite" class="adm-section" aria-labelledby="mk-form-title">
            <form class="mk__form" :aria-busy="busy ? 'true' : undefined" @submit.prevent="submit">
                <h2 id="mk-form-title" class="adm-section__title">{{ formTitle }}</h2>

                <div class="adm-fields">
                    <div class="form-field">
                        <label class="form-field__label" for="mk-name">Name</label>
                        <input
                            id="mk-name"
                            ref="nameField"
                            v-model="form.name"
                            class="input"
                            :class="{ 'input--error': errors.name || errors.slug }"
                            type="text"
                            maxlength="60"
                            autocomplete="off"
                            aria-required="true"
                            aria-describedby="mk-name-err"
                            :aria-invalid="errors.name || errors.slug ? 'true' : undefined"
                        >
                        <p id="mk-name-err" class="form-field__error">{{ errors.name ?? errors.slug ?? '' }}</p>
                    </div>

                    <div class="form-field adm-fields__narrow">
                        <label class="form-field__label" for="mk-sort">Position auf der Markenwand</label>
                        <input
                            id="mk-sort"
                            v-model.number="form.sortOrder"
                            class="input mk__num"
                            :class="{ 'input--error': errors.sortOrder }"
                            type="number"
                            min="0"
                            max="9999"
                            step="1"
                            aria-describedby="mk-sort-help mk-sort-err"
                            :aria-invalid="errors.sortOrder ? 'true' : undefined"
                        >
                        <p id="mk-sort-help" class="form-field__help">Kleinere Zahlen stehen weiter vorn.</p>
                        <p id="mk-sort-err" class="form-field__error">{{ errors.sortOrder ?? '' }}</p>
                    </div>

                    <div class="adm-fields__checks">
                        <label class="check">
                            <input v-model="form.isWheelBrand" type="checkbox">
                            Felgenmarke – auf der Markenwand zeigen
                        </label>
                    </div>
                </div>

                <div class="adm-fields__actions">
                    <button class="btn btn--primary" type="submit" :disabled="busy">{{ editing === null ? 'Marke anlegen' : 'Änderungen speichern' }}</button>
                    <button v-if="editing !== null" class="btn btn--secondary" type="button" @click="reset">Abbrechen</button>
                </div>
            </form>
        </section>

        <section class="adm-section" aria-labelledby="mk-list-title">
            <div class="adm-section__head">
                <h2 id="mk-list-title" class="adm-section__title">Marken</h2>
            </div>
            <p class="form-field__help mk__hint">{{ LOGO_HINT }}</p>

            <div v-if="brands.length > 0" class="adm-panel">
                <table class="adm-table mk__table">
                    <thead>
                        <tr>
                            <th scope="col">Logo</th>
                            <th scope="col">Marke</th>
                            <th scope="col">Markenwand</th>
                            <th scope="col" class="num">Position</th>
                            <th scope="col">Im Katalog</th>
                            <th v-if="can.update || can.delete" scope="col"><span class="visually-hidden">Aktionen</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="brand in brands" :key="brand.id" :aria-current="editing === brand.id ? 'true' : undefined">
                            <td data-label="Logo">
                                <span class="mk__logo">
                                    <img v-if="brand.logo" :src="brand.logo.url" :alt="`Logo ${brand.name}`" width="96" :height="Math.round(96 / brand.logo.aspect)">
                                    <span v-else-if="brand.logoBroken" class="adm-tag adm-tag--warn">Datei fehlt</span>
                                    <span v-else class="mk__none">kein Logo</span>
                                </span>
                            </td>
                            <td data-label="Marke">
                                <span class="adm-table__key">{{ brand.name }}</span>
                                <span class="adm-table__sub">{{ brand.slug }}</span>
                            </td>
                            <td data-label="Markenwand">{{ brand.isWheelBrand ? 'Ja' : 'Nein' }}</td>
                            <td data-label="Position" class="num">{{ brand.sortOrder }}</td>
                            <td data-label="Im Katalog">{{ counts(brand) }}</td>
                            <td v-if="can.update || can.delete" data-label="Aktionen">
                                <div class="adm-table__actions">
                                    <button v-if="can.update" class="btn btn--secondary btn--sm" type="button" @click="edit(brand)">
                                        Bearbeiten<span class="visually-hidden">: {{ brand.name }}</span>
                                    </button>
                                    <label v-if="can.update" class="btn btn--secondary btn--sm mk__file">
                                        {{ brand.logo ? 'Logo ersetzen' : 'Logo hochladen' }}<span class="visually-hidden">: {{ brand.name }}</span>
                                        <input class="visually-hidden" type="file" accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp" :disabled="busy" @change="upload(brand, $event)">
                                    </label>
                                    <button v-if="can.update && brand.logo" class="btn btn--secondary btn--sm" type="button" :disabled="busy" @click="removeLogo(brand)">
                                        Logo entfernen<span class="visually-hidden">: {{ brand.name }}</span>
                                    </button>
                                    <button v-if="can.delete && brand.wheels === 0 && brand.tyres === 0" class="btn btn--secondary btn--sm adm-btn--danger" type="button" @click="confirming = brand">
                                        Entfernen<span class="visually-hidden">: {{ brand.name }}</span>
                                    </button>
                                </div>
                                <p v-if="logoRow === brand.id && logoError" class="form-field__error" role="alert">{{ logoError }}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <AdminState v-else kind="empty" text="Noch keine Marke. Marken entstehen hier, beim Import einer Lieferantendatei oder beim Anlegen einer Felge." />
        </section>

        <AdminConfirm
            v-model:open="confirmOpen"
            :title="`Marke „${confirming?.name ?? ''}“ entfernen?`"
            body="Sie führt keine Felge und keinen Reifen mehr. Das Protokoll hält fest, wer sie entfernt hat."
            confirm-label="Entfernen"
            :busy="busy"
            @confirm="remove"
        />
    </AdminPage>
</template>

<style scoped>
.mk__lead,
.mk__hint {
    max-width: var(--adm-form-max);
}

.mk__form {
    max-width: var(--adm-form-max);
}

.mk__num {
    max-width: 8rem;
}

.mk__logo {
    display: inline-flex;
    align-items: center;
    min-height: var(--sp-32);
}

.mk__logo img {
    /* A definite box: an SVG with only a viewBox has no width of its own, and a flex item with
       width: auto collapses to nothing. The logo sits inside it at its own proportions. */
    display: block;
    width: 6rem;
    height: var(--sp-32);
    object-fit: contain;
    object-position: left center;
}

.mk__none {
    color: var(--c-ink-3);
    font-size: var(--fs-small);
}

.mk__file {
    position: relative;
    cursor: pointer;
}

.mk__file:focus-within {
    outline: 2px solid var(--c-blue);
    outline-offset: 2px;
}
</style>
