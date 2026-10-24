<script setup lang="ts">
/**
 * Katalog › Marken: every brand the shop knows, with its logo.
 *
 * A brand is created here, by the import or by the Felge form; its logo only here (MarkenController). The
 * brand wall on the homepage draws a logo as a shape in the shop's own ink, so a logo is an SVG or a PNG /
 * WebP with a transparent ground — the server reads the file and refuses anything else in a sentence under
 * the row it was sent from. One form serves a new brand and an existing one, like Zubehörpreise.
 *
 * The keyboard never falls to `<body>`: every action names where the focus goes next and useFocusAfter
 * puts it there once the page has settled (K2-03, K2-05, K2-11).
 *
 * Every write is authorised on the server (R-11); `can` only decides what is drawn.
 */

import { router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed, reactive, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import ListPager, { type ListPagination } from '../../../Components/Admin/Lists/ListPager.vue'
import { MENU_ROOM } from '../../../composables/admin/menu'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import { stampHeaders } from '../../../composables/admin/useDirtyForm'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'

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
    /** Removed Felgen keep their brand too (BrandPolicy). */
    removedWheels: number
    tyres: number
    /** GPSR, as entered (Herstellerangaben). */
    manufacturer: ManufacturerForm
    /** The product page can name the manufacturer: name, address and contact are all given. */
    manufacturerComplete: boolean
    /** The Herstellerangaben as the row was loaded (EditStamp): a save against older ones is refused. */
    manufacturerStamp: string
    /** Name, wall and position as the row was loaded (EditStamp): „Bearbeiten“ sends it, an older state is refused. */
    stamp?: string
}

interface ManufacturerForm {
    manufacturerName: string | null
    manufacturerAddress: string | null
    manufacturerContact: string | null
    euResponsibleName: string | null
    euResponsibleAddress: string | null
    euResponsibleContact: string | null
    safetyNote: string | null
}

const props = defineProps<{
    /** One page of what the search finds (the admin audit's F-31). */
    brands: BrandRow[]
    search: string
    found: number
    pagination: ListPagination
    /** Over every brand on file, not the page's own. */
    summary: { total: number; wall: number; logos: number }
    /** Where a new brand joins the wall: at its end (K2-12). */
    nextSortOrder: number
    can: { create: boolean; update: boolean; delete: boolean }
}>()

const q = ref(props.search)

function searchBrands(): void {
    router.get(BASE, q.value.trim() === '' ? {} : { q: q.value.trim() }, { preserveScroll: true, preserveState: true })
}

function resetSearch(): void {
    q.value = ''
    searchBrands()
}

const BASE = '/admin/marken'
const LOGO_HINT = 'SVG oder PNG/WebP mit transparentem Hintergrund, höchstens 1 MB. Die Markenwand zeichnet die Form des Logos in der Schriftfarbe des Shops.'

interface BrandForm {
    name: string
    isWheelBrand: boolean
    sortOrder: number | ''
}

function blank(): BrandForm {
    return { name: '', isWheelBrand: true, sortOrder: props.nextSortOrder }
}

const page = usePage()
const focus = useFocusAfter()
const form = reactive<BrandForm>(blank())
const editing = ref<number | null>(null)
/* The brand as its form opened on (EditStamp, the admin audit's F-25): sent with the save. */
const editingStamp = ref<string | undefined>(undefined)
const sent = ref(false)
const busy = ref(false)
/** The row whose logo was just sent: only it shows the server's word about a logo. */
const logoRow = ref<number | null>(null)
const confirming = ref<BrandRow | null>(null)
/** A row just created or changed: tinted once, so the eye finds it. */
const fresh = ref<number | null>(null)

const bag = computed<Record<string, string>>(() => {
    const raw: unknown = page.props.errors

    return raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})
const errors = computed<Record<string, string>>(() => (sent.value ? bag.value : {}))
const logoError = computed(() => bag.value.logo ?? '')
/** Why a brand could not be removed — the Policy's own sentence (K2-16). */
const brandError = computed(() => bag.value.brand ?? '')

/* A refusal, spoken by one region that is always there: the error lines are hidden while empty (K2-39). */
const spoken = computed(() => errors.value.name ?? errors.value.slug ?? errors.value.sortOrder ?? logoError.value)

const canWrite = computed(() => props.can.create || props.can.update)
const editingBrand = computed(() => props.brands.find((b) => b.id === editing.value) ?? null)
const formTitle = computed(() => (editingBrand.value === null ? 'Neue Marke' : `Marke bearbeiten: ${editingBrand.value.name}`))

const context = computed(() => {
    const { total, wall, logos } = props.summary

    if (total === 0) {
        return 'Noch keine Marke'
    }

    // Counted over every brand, written the German way: „1.022 Marken“ (R-10).
    const line = `${decimal(total, 0)} ${total === 1 ? 'Marke' : 'Marken'} · ${decimal(wall, 0)} auf der Markenwand · ${decimal(logos, 0)} mit Logo`

    return props.search === '' ? line : `${line} · ${decimal(props.found, 0)} gefunden`
})

const confirmOpen = computed({
    get: () => confirming.value !== null,
    set: (open: boolean) => {
        if (!open) {
            confirming.value = null
        }
    },
})

const more = (id: number): string => `mk-more-${id}`

function reset(): void {
    Object.assign(form, blank())
    editing.value = null
    editingStamp.value = undefined
    sent.value = false
}

/** „Abbrechen“: the form is new again, and the keyboard stays in it. */
function cancel(): void {
    reset()
    focus.request('mk-name')
}

/** From a row's menu: the form, far above on a phone, is brought into view with the focus in Name (K2-05). */
function edit(brand: BrandRow): void {
    form.name = brand.name
    form.isWheelBrand = brand.isWheelBrand
    form.sortOrder = brand.sortOrder
    editing.value = brand.id
    editingStamp.value = brand.stamp
    sent.value = false
    focus.request('mk-name', { scroll: true })
}

function submit(): void {
    sent.value = true
    busy.value = true
    const name = form.name.trim()

    const options = {
        preserveScroll: true,
        onSuccess: () => {
            reset()
            fresh.value = props.brands.find((b) => b.name === name)?.id ?? null
        },
        onFinish: () => {
            busy.value = false
            // Created, saved or refused: the keyboard is in Name, where the next thing is typed or fixed.
            focus.request('mk-name')
        },
    }

    if (editing.value === null) {
        router.post(BASE, { ...form }, options)
    } else {
        router.put(`${BASE}/${editing.value}`, { ...form }, { ...options, headers: stampHeaders(editingStamp.value) })
    }
}

/* ── Herstellerangaben (GPSR) ─────────────────────────────────────────────── */

/** The brand whose manufacturer is being entered; its form opens below the list's head. */
const manufacturing = ref<BrandRow | null>(null)
const maker = reactive<Record<keyof ManufacturerForm, string>>({
    manufacturerName: '',
    manufacturerAddress: '',
    manufacturerContact: '',
    euResponsibleName: '',
    euResponsibleAddress: '',
    euResponsibleContact: '',
    safetyNote: '',
})
const makerSent = ref(false)
const makerErrors = computed<Record<string, string>>(() => (makerSent.value ? bag.value : {}))

function editManufacturer(brand: BrandRow): void {
    for (const key of Object.keys(maker) as (keyof ManufacturerForm)[]) {
        maker[key] = brand.manufacturer[key] ?? ''
    }

    manufacturing.value = brand
    makerSent.value = false
    focus.request('mk-maker-name', { scroll: true })
}

function closeManufacturer(): void {
    const id = manufacturing.value?.id
    manufacturing.value = null

    if (id !== undefined) {
        focus.request(more(id))
    }
}

function saveManufacturer(): void {
    const brand = manufacturing.value

    if (brand === null) {
        return
    }

    makerSent.value = true
    busy.value = true
    router.put(`${BASE}/${brand.id}/hersteller`, { ...maker }, {
        preserveScroll: true,
        headers: stampHeaders(brand.manufacturerStamp),
        onSuccess: () => {
            fresh.value = brand.id
            closeManufacturer()
        },
        onFinish: () => {
            busy.value = false
        },
    })
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
        onSuccess: () => {
            fresh.value = brand.id
        },
        onFinish: () => {
            busy.value = false
            input.value = ''
            // Back on the row's „⋯“ once the answer is in, however long a slow line took (K2-37).
            focus.request(more(brand.id))
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
            focus.request(more(brand.id))
        },
    })
}

function remove(): void {
    const brand = confirming.value

    if (brand === null) {
        return
    }

    // Where the keyboard goes once the row is gone: the next row, else the one before, else the form.
    const index = props.brands.findIndex((b) => b.id === brand.id)
    const next = props.brands[index + 1]?.id
    const previous = props.brands[index - 1]?.id
    const targets = [next, previous].filter((id): id is number => id !== undefined).map(more)

    busy.value = true
    router.delete(`${BASE}/${brand.id}`, {
        preserveScroll: true,
        onSuccess: () => {
            confirming.value = null
            focus.request([...targets, 'mk-name', 'mk-list-title'])

            if (editing.value === brand.id) {
                reset()
            }
        },
        onError: () => {
            // Refused (still in use): the dialog closes, the sentence stands above the list, the keyboard
            // stays on the row.
            confirming.value = null
            focus.request(more(brand.id))
        },
        onFinish: () => {
            busy.value = false
        },
    })
}

/** A brand that carries nothing — not even a removed Felge — may go; the server says the same (BrandPolicy). */
function mayRemove(brand: BrandRow): boolean {
    return props.can.delete && brand.wheels === 0 && brand.removedWheels === 0 && brand.tyres === 0
}

function hasMenu(brand: BrandRow): boolean {
    return props.can.update || mayRemove(brand)
}

/** The menu closes and hands the focus back to its trigger; the row's own picker opens then. */
function pickLogo(brand: BrandRow): void {
    window.setTimeout(() => document.getElementById(`mk-file-${brand.id}`)?.click(), 0)
}

function counts(brand: BrandRow): string {
    const parts = [brand.wheels === 1 ? '1 Felge' : `${brand.wheels} Felgen`]

    if (brand.removedWheels > 0) {
        parts.push(brand.removedWheels === 1 ? '1 entfernte Felge' : `${brand.removedWheels} entfernte Felgen`)
    }

    if (brand.tyres > 0) {
        parts.push(brand.tyres === 1 ? '1 Reifen' : `${brand.tyres} Reifen`)
    }

    return parts.join(' · ')
}
</script>

<template>
    <AdminPage title="Marken" :context="context" :read-only="!canWrite">
        <p class="adm-note mk__lead">
            Eine Marke entsteht hier, beim Import oder beim Anlegen einer Felge. Ein Logo lädst du nur hier hoch. Marken
            mit Häkchen „Markenwand“ stehen auf der Startseite – als Link erst, wenn eine ihrer Felgen verfügbar ist.
        </p>

        <section v-if="canWrite && !manufacturing" class="adm-section" aria-labelledby="mk-form-title">
            <form class="mk__form" :aria-busy="busy ? 'true' : undefined" @submit.prevent="submit">
                <div class="adm-section__head">
                    <h2 id="mk-form-title" class="adm-section__title">{{ formTitle }}</h2>
                </div>
                <!-- Changed meanwhile elsewhere (EditStamp): nothing was saved, and what was typed stays. -->
                <p v-if="errors._stamp" class="adm-alert" role="alert">{{ errors._stamp }}</p>

                <div class="adm-fields">
                    <div class="form-field">
                        <label class="form-field__label" for="mk-name">Name</label>
                        <input
                            id="mk-name"
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

                    <div class="form-field">
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
                        <p id="mk-sort-help" class="form-field__help">Kleinere Zahlen stehen weiter vorn. Eine neue Marke steht am Ende.</p>
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
                    <button v-if="editing !== null" class="btn btn--secondary" type="button" @click="cancel">Abbrechen</button>
                </div>
            </form>
        </section>

        <!-- GPSR: what the product page names about the maker of every wheel of this brand. -->
        <section v-if="manufacturing" class="adm-section" aria-labelledby="mk-maker-title">
            <form class="mk__form" :aria-busy="busy ? 'true' : undefined" @submit.prevent="saveManufacturer">
                <div class="adm-section__head">
                    <h2 id="mk-maker-title" class="adm-section__title">Herstellerangaben: {{ manufacturing.name }}</h2>
                </div>
                <!-- Changed meanwhile elsewhere (EditStamp): nothing was saved, and what was typed stays. -->
                <p v-if="makerErrors._stamp" class="adm-alert" role="alert">{{ makerErrors._stamp }}</p>
                <p class="form-field__help mk__hint">
                    Die Allgemeine Produktsicherheitsverordnung (GPSR) verlangt sie auf jeder Produktseite: Name, Postanschrift und
                    elektronische Adresse des Herstellers – so, wie er sie selbst angibt. Sitzt er außerhalb der EU, dazu die
                    verantwortliche Person in der EU. Leer bleibt leer: der Shop ergänzt nichts.
                </p>

                <div class="adm-fields">
                    <div class="form-field">
                        <label class="form-field__label" for="mk-maker-name">Hersteller</label>
                        <input id="mk-maker-name" v-model="maker.manufacturerName" class="input" :class="{ 'input--error': makerErrors.manufacturerName }" type="text" maxlength="190" autocomplete="off" aria-describedby="mk-maker-name-err">
                        <p id="mk-maker-name-err" class="form-field__error">{{ makerErrors.manufacturerName ?? '' }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="mk-maker-address">Postanschrift</label>
                        <textarea id="mk-maker-address" v-model="maker.manufacturerAddress" class="input" rows="3" maxlength="500" aria-describedby="mk-maker-address-err" />
                        <p id="mk-maker-address-err" class="form-field__error">{{ makerErrors.manufacturerAddress ?? '' }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="mk-maker-contact">Kontakt</label>
                        <input id="mk-maker-contact" v-model="maker.manufacturerContact" class="input" :class="{ 'input--error': makerErrors.manufacturerContact }" type="text" inputmode="email" maxlength="190" autocomplete="off" aria-describedby="mk-maker-contact-help mk-maker-contact-err">
                        <p id="mk-maker-contact-help" class="form-field__help">Eine E-Mail-Adresse oder eine Webadresse mit https://.</p>
                        <p id="mk-maker-contact-err" class="form-field__error">{{ makerErrors.manufacturerContact ?? '' }}</p>
                    </div>

                    <fieldset class="mk__fieldset">
                        <legend class="mk__legend">Verantwortliche Person in der EU</legend>
                        <p class="form-field__help">Nur nötig, wenn der Hersteller außerhalb der EU sitzt.</p>
                        <div class="form-field">
                            <label class="form-field__label" for="mk-eu-name">Name</label>
                            <input id="mk-eu-name" v-model="maker.euResponsibleName" class="input" :class="{ 'input--error': makerErrors.euResponsibleName }" type="text" maxlength="190" autocomplete="off" aria-describedby="mk-eu-name-err">
                            <p id="mk-eu-name-err" class="form-field__error">{{ makerErrors.euResponsibleName ?? '' }}</p>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="mk-eu-address">Postanschrift</label>
                            <textarea id="mk-eu-address" v-model="maker.euResponsibleAddress" class="input" rows="3" maxlength="500" />
                        </div>
                        <div class="form-field">
                            <label class="form-field__label" for="mk-eu-contact">Kontakt</label>
                            <input id="mk-eu-contact" v-model="maker.euResponsibleContact" class="input" :class="{ 'input--error': makerErrors.euResponsibleContact }" type="text" maxlength="190" autocomplete="off" aria-describedby="mk-eu-contact-err">
                            <p id="mk-eu-contact-err" class="form-field__error">{{ makerErrors.euResponsibleContact ?? '' }}</p>
                        </div>
                    </fieldset>

                    <div class="form-field">
                        <label class="form-field__label" for="mk-safety">Sicherheitshinweise des Herstellers</label>
                        <textarea id="mk-safety" v-model="maker.safetyNote" class="input" rows="4" maxlength="4000" aria-describedby="mk-safety-help" />
                        <p id="mk-safety-help" class="form-field__help">Auf Deutsch, wie der Hersteller sie gibt – etwa zur Montage. Die Produktseite zeigt sie unter „Hersteller und Produktsicherheit“.</p>
                    </div>
                </div>

                <div class="adm-fields__actions">
                    <button class="btn btn--primary" type="submit" :disabled="busy">Herstellerangaben speichern</button>
                    <button class="btn btn--secondary" type="button" @click="closeManufacturer">Abbrechen</button>
                </div>
            </form>
        </section>

        <section class="adm-section" aria-labelledby="mk-list-title">
            <div class="adm-section__head">
                <h2 id="mk-list-title" class="adm-section__title mk__list-title" tabindex="-1">Marken</h2>
            </div>
            <p class="form-field__help mk__hint">{{ LOGO_HINT }}</p>
            <!-- Why „Entfernen“ is missing on a brand in use: its Felgen and tyres keep their brand (BrandPolicy, R-05). -->
            <p class="form-field__help mk__hint">Entfernen lässt sich nur eine Marke ohne Felgen und Reifen – entfernte Felgen zählen mit.</p>
            <p v-if="brandError" class="adm-alert" role="alert">{{ brandError }}</p>

            <form v-if="summary.total > 0" class="mk-search" role="search" @submit.prevent="searchBrands">
                <div class="form-field">
                    <label class="form-field__label" for="mk-q">Marke suchen</label>
                    <input id="mk-q" v-model="q" class="input" type="search" maxlength="60" autocomplete="off">
                </div>
                <button class="btn btn--secondary" type="submit">Suchen</button>
            </form>

            <div v-if="brands.length > 0" class="adm-panel">
                <table class="adm-table mk__table">
                    <thead>
                        <tr>
                            <th scope="col">Marke</th>
                            <th scope="col">Logo</th>
                            <th scope="col">Markenwand</th>
                            <th scope="col" class="num">Position</th>
                            <th scope="col">Im Katalog</th>
                            <th scope="col">Hersteller (GPSR)</th>
                            <th v-if="can.update || can.delete" scope="col"><span class="visually-hidden">Aktionen</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="brand in brands"
                            :key="brand.id"
                            :class="{ 'adm-row--fresh': fresh === brand.id }"
                            :aria-current="editing === brand.id ? 'true' : undefined"
                            @animationend="fresh = null"
                        >
                            <td data-label="Marke">
                                <span class="adm-table__key">{{ brand.name }}</span>
                                <span class="adm-table__sub">{{ brand.slug }}</span>
                                <p v-if="logoRow === brand.id && logoError" class="form-field__error mk__row-error" role="alert">{{ logoError }}</p>
                            </td>
                            <td data-label="Logo">
                                <span class="mk__logo">
                                    <img v-if="brand.logo" :src="brand.logo.url" :alt="`Logo ${brand.name}`" width="96" :height="Math.round(96 / brand.logo.aspect)">
                                    <span v-else-if="brand.logoBroken" class="adm-tag adm-tag--warn">Datei fehlt</span>
                                    <span v-else class="mk__none">kein Logo</span>
                                </span>
                            </td>
                            <td data-label="Markenwand">{{ brand.isWheelBrand ? 'Ja' : 'Nein' }}</td>
                            <td data-label="Position" data-phone="hide" class="num">{{ brand.sortOrder }}</td>
                            <td data-label="Im Katalog">{{ counts(brand) }}</td>
                            <td data-label="Hersteller (GPSR)">
                                <span v-if="brand.manufacturerComplete">Angegeben</span>
                                <span v-else-if="brand.wheels > 0" class="adm-tag adm-tag--warn">Fehlt</span>
                                <span v-else class="mk__none">–</span>
                            </td>
                            <td v-if="can.update || can.delete" data-label="Aktionen" data-phone="menu" class="mk__actions">
                                <!-- The picker the menu's „Logo hochladen“ opens: one per row, never shown. -->
                                <input
                                    v-if="can.update"
                                    :id="`mk-file-${brand.id}`"
                                    class="visually-hidden"
                                    type="file"
                                    tabindex="-1"
                                    aria-hidden="true"
                                    accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
                                    :disabled="busy"
                                    @change="upload(brand, $event)"
                                >
                                <DropdownMenuRoot v-if="hasMenu(brand)">
                                    <DropdownMenuTrigger :data-focus="more(brand.id)" class="adm-iconbtn" :disabled="busy" :aria-label="`Aktionen für ${brand.name}`">
                                        <Icon name="more" :size="20" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuContent class="adm-menu" align="end" :side-offset="4" :collision-padding="MENU_ROOM" @close-auto-focus="focus.onMenuClose">
                                            <template v-if="can.update">
                                                <DropdownMenuItem class="adm-menu__item" @select="edit(brand)">
                                                    <Icon name="edit" :size="20" />
                                                    Bearbeiten
                                                </DropdownMenuItem>
                                                <DropdownMenuItem class="adm-menu__item" @select="editManufacturer(brand)">
                                                    <Icon name="shield" :size="20" />
                                                    Herstellerangaben
                                                </DropdownMenuItem>
                                                <DropdownMenuItem class="adm-menu__item" @select="pickLogo(brand)">
                                                    <Icon name="media" :size="20" />
                                                    {{ brand.logo ? 'Logo ersetzen' : 'Logo hochladen' }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem v-if="brand.logo" class="adm-menu__item" @select="removeLogo(brand)">
                                                    <Icon name="close" :size="20" />
                                                    Logo entfernen
                                                </DropdownMenuItem>
                                            </template>
                                            <template v-if="mayRemove(brand)">
                                                <DropdownMenuSeparator v-if="can.update" class="adm-menu__sep" />
                                                <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="confirming = brand">
                                                    <Icon name="delete" :size="20" />
                                                    Entfernen
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

            <AdminState v-else-if="search !== ''" kind="filtered" :total="summary.total" @reset="resetSearch" />
            <AdminState v-else kind="empty" text="Noch keine Marke. Marken entstehen hier, beim Import einer Lieferantendatei oder beim Anlegen einer Felge." />

            <ListPager :pagination="pagination" label="Seiten der Marken" />
        </section>

        <p class="visually-hidden" aria-live="assertive">{{ spoken }}</p>

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
.mk__lead {
    margin-bottom: var(--sp-32);
}

.mk__hint {
    max-width: 54ch;
}

.mk__form {
    max-width: var(--adm-form-max);
}

.mk__num {
    max-width: var(--sp-128);
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
    width: var(--sp-96);
    height: var(--sp-32);
    object-fit: contain;
    object-position: left center;
}

.mk__none {
    color: var(--c-ink-3);
    font-size: var(--fs-small);
}

/* Only a field with something to say keeps the error line's height: the form keeps its rhythm. */
.mk__form .form-field__error:empty {
    display: none;
}

.mk__row-error {
    margin-top: var(--sp-4);
}

.mk__legend {
    padding: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
    color: var(--c-ink);
}

.mk__fieldset {
    display: grid;
    gap: var(--sp-16);
    margin: 0;
    padding: var(--sp-16) 0 0;
    border: 0;
    border-top: 1px solid var(--c-line);
}

@media (max-width: 767px) {
    /* The card's label beside the logo stands on the logo's middle, not above it. */
    .mk__table td[data-label='Logo'] {
        align-items: center;
    }
}

/* The list's heading takes the focus only as the last way out of a removed row; it draws no ring. */
/* The search above the list: the field takes what room there is, the button beside it, under it on a phone. */
.mk-search {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: var(--sp-12);
    margin-bottom: var(--sp-16);
}

.mk-search .form-field {
    flex: 1 1 240px;
    max-width: 420px;
}

.mk__list-title:focus {
    outline: none;
}
</style>
