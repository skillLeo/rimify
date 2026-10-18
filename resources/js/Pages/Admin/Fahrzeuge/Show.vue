<script setup lang="ts">
/**
 * Fahrzeuge › one vehicle — its keys and build period, the legal data a verdict needs (axle loads and
 * top speed, fields 8.1, 8.2 and T of the Zulassungsbescheinigung), and every Gutachten row that names
 * it. Without the axle loads — and the top speed, where a released Gutachten for this car needs it (D-284) —
 * the shop answers the wheel and leaves the tyres „Noch nicht bestätigt“ until a customer enters their own
 * papers (D-286); entered here, they answer every customer at once. Field T is asked only where it is needed,
 * and the page names the documents that need it and why (D-287). Entering all three is the review (R-03).
 */

import { Link, useForm } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { focusRefused } from '../../../composables/admin/focusRefused'
import { decimal } from '../../../format'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<{
    vehicle: {
        id: number
        name: string
        keys: string
        vsn: string | null
        typeDesignation: string | null
        window: string
        power: string | null
        bodyForm: string | null
        axleFront: number | null
        axleRear: number | null
        maxSpeed: number | null
        needsReview: boolean
        complete: boolean
    }
    rows: Row[]
    /** Whether a released Gutachten naming this car needs field T for the tyres, which ones and why (D-287). */
    topSpeed: { needed: boolean; released: number; documents: { id: number; label: string; href: string; why: string }[] }
    /** What the shop waits for of this car (D-286): `8.1`, `8.2`, `T`. */
    owed: string[]
    can: { edit: boolean }
}>()

interface Row {
    id: number
    documentId: number
    document: string
    documentHref: string
    wheel: string
    size: string
    status: string
    requiresEntry: boolean
    conditions: number
}

/** One heading per Gutachten, in the order the server sends them — as Gutachten › Dokument groups by vehicle. */
const groups = computed(() => {
    const byDocument = new Map<number, { id: number; document: string; href: string; rows: Row[] }>()

    for (const row of props.rows) {
        const group = byDocument.get(row.documentId) ?? { id: row.documentId, document: row.document, href: row.documentHref, rows: [] }
        group.rows.push(row)
        byDocument.set(row.documentId, group)
    }

    return [...byDocument.values()].map((group) => {
        const released = group.rows.filter((row) => row.status === 'published').length
        const rows = group.rows.length === 1 ? '1 Zeile' : `${decimal(group.rows.length, 0)} Zeilen`

        return { ...group, summary: released === group.rows.length ? `${rows}, alle freigegeben` : `${rows} · ${decimal(released, 0)} freigegeben` }
    })
})

/* Text, not number fields: `1.200` is read as the German thousands it is (VehicleRequest), never as 1,2. */
const form = useForm({
    axle_load_front_kg: props.vehicle.axleFront === null ? '' : String(props.vehicle.axleFront),
    axle_load_rear_kg: props.vehicle.axleRear === null ? '' : String(props.vehicle.axleRear),
    max_speed_kmh: props.vehicle.maxSpeed === null ? '' : String(props.vehicle.maxSpeed),
})

const errors = computed(() => form.errors as Record<string, string | undefined>)
const context = computed(() => `${props.vehicle.keys} · ${props.vehicle.window}`)

/* What the shop waits for, in one sentence: the axle loads always, the top speed where a released Gutachten needs it. */
const owedLine = computed(() => {
    const axles = props.owed.includes('8.1')
    const speed = props.owed.includes('T')

    if (!axles && !speed) {
        return null
    }

    const [what, until] = axles && speed
        ? ['fehlen die Achslasten (Felder 8.1 und 8.2) und die Höchstgeschwindigkeit (Feld T)', 'Solange sie fehlen']
        : axles ? ['fehlen die Achslasten (Felder 8.1 und 8.2)', 'Solange sie fehlen'] : ['fehlt die Höchstgeschwindigkeit (Feld T)', 'Solange sie fehlt']

    return `Diesem Fahrzeug ${what}. ${until}, bestätigt der Shop die Reifen nur für Kunden, die ihre Werte aus der Zulassungsbescheinigung Teil I eintragen.`
})

/* `nicht eingetragen` for a top speed nothing asks for — never „fehlt“ beside a field no released Gutachten needs. */
const speedRead = computed(() => {
    if (props.vehicle.maxSpeed !== null) {
        return `${decimal(props.vehicle.maxSpeed, 0)} km/h`
    }

    if (props.topSpeed.needed) {
        return 'fehlt'
    }

    return props.topSpeed.released > 0 ? 'nicht eingetragen – für die Reifen nicht nötig' : 'nicht eingetragen'
})

/* Emptying a value the shop's answers rest on takes them away: that is asked first. A top speed nothing needs is not one. */
const confirmOpen = ref(false)
const empties = computed(() =>
    [form.axle_load_front_kg, form.axle_load_rear_kg, ...(props.topSpeed.needed ? [form.max_speed_kmh] : [])].some((value) => String(value).trim() === '')
)

function save(): void {
    if (props.owed.length === 0 && empties.value && !confirmOpen.value) {
        confirmOpen.value = true

        return
    }

    send()
}

function send(): void {
    confirmOpen.value = false
    form.put(`/admin/fahrzeuge/${props.vehicle.id}`, { preserveScroll: true, onError: () => focusRefused('.fs-form') })
}

const STATUS: Record<string, string> = { draft: 'Entwurf', published: 'Freigegeben', retired: 'Ausgelaufen' }
</script>

<template>
    <AdminPage :title="vehicle.name" :context="context">
        <p v-if="owedLine" class="fs-warn" role="note">{{ owedLine }}</p>

        <section class="adm-section" aria-labelledby="fs-facts-h">
            <div class="adm-section__head">
                <h2 id="fs-facts-h" class="adm-section__title">Angaben</h2>
            </div>
            <dl class="adm-facts fs-facts">
                <div class="adm-facts__row"><dt>HSN/TSN</dt><dd>{{ vehicle.keys }}<template v-if="vehicle.vsn"> · VSN {{ vehicle.vsn }}</template></dd></div>
                <div v-if="vehicle.typeDesignation" class="adm-facts__row"><dt>Typ</dt><dd>{{ vehicle.typeDesignation }}</dd></div>
                <div class="adm-facts__row"><dt>Bauzeitraum</dt><dd>{{ vehicle.window }}</dd></div>
                <div v-if="vehicle.power" class="adm-facts__row"><dt>Leistung</dt><dd>{{ vehicle.power }}</dd></div>
                <div v-if="vehicle.bodyForm" class="adm-facts__row"><dt>Aufbau</dt><dd>{{ vehicle.bodyForm }}</dd></div>
            </dl>
        </section>

        <section class="adm-section" aria-labelledby="fs-legal-h">
            <div class="adm-section__head">
                <h2 id="fs-legal-h" class="adm-section__title">Daten für die Prüfung</h2>
            </div>
            <form v-if="can.edit" class="fs-form" novalidate @submit.prevent="save">
                <div class="form-field">
                    <label class="form-field__label" for="fs-front">Achslast vorn in kg (Feld 8.1)</label>
                    <input id="fs-front" v-model="form.axle_load_front_kg" class="input" type="text" inputmode="numeric" autocomplete="off" :aria-invalid="errors.axle_load_front_kg ? 'true' : undefined" aria-describedby="fs-front-err">
                    <p id="fs-front-err" class="form-field__error">{{ errors.axle_load_front_kg }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fs-rear">Achslast hinten in kg (Feld 8.2)</label>
                    <input id="fs-rear" v-model="form.axle_load_rear_kg" class="input" type="text" inputmode="numeric" autocomplete="off" :aria-invalid="errors.axle_load_rear_kg ? 'true' : undefined" aria-describedby="fs-rear-err">
                    <p id="fs-rear-err" class="form-field__error">{{ errors.axle_load_rear_kg }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fs-speed">Höchstgeschwindigkeit in km/h (Feld T)</label>
                    <input id="fs-speed" v-model="form.max_speed_kmh" class="input" type="text" inputmode="numeric" autocomplete="off" :aria-invalid="errors.max_speed_kmh ? 'true' : undefined" aria-describedby="fs-speed-why fs-speed-err">
                    <!-- Why it is asked, or why not (D-287): the released Gutachten that need it, each with what is recorded. -->
                    <div id="fs-speed-why" class="fs-why" data-speed-why>
                        <template v-if="topSpeed.needed">
                            <p class="fs-why__lead">Für die Reifen nötig:</p>
                            <ul class="fs-why__list">
                                <li v-for="document in topSpeed.documents" :key="document.id">
                                    <Link :href="document.href" class="fs-link">{{ document.label }}</Link>: {{ document.why }}
                                </li>
                            </ul>
                        </template>
                        <p v-else-if="topSpeed.released > 0" class="fs-why__lead">
                            Für die Reifen nicht nötig: Bei jedem freigegebenen Gutachten zu diesem Fahrzeug sind Lastindex und Geschwindigkeitssymbol bei jeder Reifengröße erfasst.
                        </p>
                        <p v-else class="fs-why__lead">
                            Bei uns ist noch kein Gutachten zu diesem Fahrzeug freigegeben. Ob die Höchstgeschwindigkeit für die Reifen nötig ist, hängt davon ab, wie ein Gutachten Lastindex und Geschwindigkeitssymbol angibt.
                        </p>
                    </div>
                    <p id="fs-speed-err" class="form-field__error">{{ errors.max_speed_kmh }}</p>
                </div>
                <div>
                    <button class="btn btn--primary" type="submit" :disabled="form.processing || !form.isDirty" :aria-busy="form.processing ? 'true' : undefined">Speichern</button>
                </div>
            </form>
            <dl v-else class="adm-facts fs-facts">
                <div class="adm-facts__row"><dt>Achslast vorn</dt><dd>{{ vehicle.axleFront === null ? 'fehlt' : `${decimal(vehicle.axleFront, 0)} kg` }}</dd></div>
                <div class="adm-facts__row"><dt>Achslast hinten</dt><dd>{{ vehicle.axleRear === null ? 'fehlt' : `${decimal(vehicle.axleRear, 0)} kg` }}</dd></div>
                <div class="adm-facts__row"><dt>Höchstgeschwindigkeit</dt><dd>{{ speedRead }}</dd></div>
            </dl>
        </section>

        <section class="adm-section" aria-labelledby="fs-rows-h">
            <div class="adm-section__head">
                <h2 id="fs-rows-h" class="adm-section__title">In Gutachten genannt</h2>
            </div>
            <p v-if="rows.length === 0" class="adm-note">Zu diesem Fahrzeug ist noch keine Zeile aus einem Gutachten hinterlegt.</p>
            <div v-for="group in groups" :key="group.id" class="fs-group">
                <h3 class="fs-group__title">
                    <Link :href="group.href" class="fs-link">{{ group.document }}</Link>
                    <span class="fs-group__meta">{{ group.summary }}</span>
                </h3>
                <div class="adm-panel">
                    <table class="adm-table">
                        <caption class="visually-hidden">Zeilen aus {{ group.document }}</caption>
                        <thead>
                            <tr>
                                <th scope="col">Felge</th>
                                <th scope="col">Eintragung</th>
                                <th scope="col" class="num">Auflagen</th>
                                <th scope="col">Stand</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in group.rows" :key="row.id">
                                <td data-label="Felge">
                                    <span class="fs-wheel">{{ row.wheel }}</span>
                                    <span class="fs-sub">{{ row.size }}</span>
                                </td>
                                <td data-label="Eintragung">{{ row.requiresEntry ? 'Ja' : 'Nein' }}</td>
                                <td data-label="Auflagen" class="num" data-phone="hide">{{ decimal(row.conditions, 0) }}</td>
                                <td data-label="Stand" data-phone="status">
                                    <span v-if="row.status !== 'published'" class="adm-tag adm-tag--neutral">{{ STATUS[row.status] ?? row.status }}</span>
                                    <template v-else>{{ STATUS[row.status] }}</template>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
        <AdminConfirm
            v-model:open="confirmOpen"
            title="Angabe entfernen?"
            body="Ohne diesen Wert bestätigt der Shop die Reifen für dieses Fahrzeug erst wieder, wenn er hier eingetragen ist – bis dahin nur für Kunden, die ihn aus ihrer Zulassungsbescheinigung Teil I eintragen."
            confirm-label="Entfernen und speichern"
            :busy="form.processing"
            @confirm="send"
        />
    </AdminPage>
</template>

<style scoped>
.fs-warn {
    max-width: var(--adm-form-max);
    margin: 0 0 var(--sp-24);
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-warn-tint);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.fs-facts {
    max-width: var(--adm-form-max);
}

.fs-form {
    display: grid;
    gap: var(--sp-16);
    max-width: 40ch;
}

.fs-form .form-field__error:empty {
    display: none;
}

/* Why field T is asked or not: small, under the field, the documents linked. */
.fs-why {
    display: grid;
    gap: var(--sp-4);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.fs-why__lead {
    margin: 0;
}

.fs-why__list {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding-left: var(--sp-16);
}

.fs-group + .fs-group {
    margin-top: var(--sp-24);
}

.fs-group__title {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--sp-4) var(--sp-12);
    margin: 0 0 var(--sp-8);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.fs-group__meta {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 400;
    color: var(--c-ink-2);
}

.fs-link {
    color: var(--c-ink);
    text-decoration: none;
    overflow-wrap: anywhere;
}

@media (hover: hover) and (pointer: fine) {
    .fs-link:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.fs-wheel {
    font-weight: 500;
}

.fs-sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}
</style>
