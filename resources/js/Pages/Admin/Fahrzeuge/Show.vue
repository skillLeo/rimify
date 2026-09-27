<script setup lang="ts">
/**
 * Fahrzeuge › one vehicle — its keys and build period, the legal data a verdict needs (axle loads and
 * top speed, fields 8.1, 8.2 and T of the Zulassungsbescheinigung), and every Gutachten row that names
 * it. Without all three values no wheel is ever shown as fitting (R-03); entering them is the review.
 */

import { Link, useForm } from '@inertiajs/vue3'
import { computed } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
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
    rows: { id: number; document: string; documentHref: string; wheel: string; size: string; status: string; requiresEntry: boolean; conditions: number }[]
    can: { edit: boolean }
}>()

const form = useForm({
    axle_load_front_kg: props.vehicle.axleFront as number | null,
    axle_load_rear_kg: props.vehicle.axleRear as number | null,
    max_speed_kmh: props.vehicle.maxSpeed as number | null,
})

const errors = computed(() => form.errors as Record<string, string | undefined>)
const context = computed(() => `${props.vehicle.keys} · ${props.vehicle.window}`)

function save(): void {
    form.put(`/admin/fahrzeuge/${props.vehicle.id}`, { preserveScroll: true })
}

const STATUS: Record<string, string> = { draft: 'Entwurf', published: 'Freigegeben', retired: 'Ausgelaufen' }
</script>

<template>
    <AdminPage :title="vehicle.name" :context="context">
        <p v-if="!vehicle.complete" class="fs-warn" role="note">Diesem Fahrzeug fehlen Angaben. Solange sie fehlen, zeigt der Shop für es keine Felge als passend.</p>

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
                    <input id="fs-front" v-model.number="form.axle_load_front_kg" class="input" type="number" min="300" max="5000" inputmode="numeric" :aria-invalid="errors.axle_load_front_kg ? 'true' : undefined" aria-describedby="fs-front-err">
                    <p id="fs-front-err" class="form-field__error">{{ errors.axle_load_front_kg }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fs-rear">Achslast hinten in kg (Feld 8.2)</label>
                    <input id="fs-rear" v-model.number="form.axle_load_rear_kg" class="input" type="number" min="300" max="5000" inputmode="numeric" :aria-invalid="errors.axle_load_rear_kg ? 'true' : undefined" aria-describedby="fs-rear-err">
                    <p id="fs-rear-err" class="form-field__error">{{ errors.axle_load_rear_kg }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="fs-speed">Höchstgeschwindigkeit in km/h (Feld T)</label>
                    <input id="fs-speed" v-model.number="form.max_speed_kmh" class="input" type="number" min="40" max="420" inputmode="numeric" :aria-invalid="errors.max_speed_kmh ? 'true' : undefined" aria-describedby="fs-speed-err">
                    <p id="fs-speed-err" class="form-field__error">{{ errors.max_speed_kmh }}</p>
                </div>
                <div>
                    <button class="btn btn--primary" type="submit" :disabled="form.processing || !form.isDirty" :aria-busy="form.processing ? 'true' : undefined">Speichern</button>
                </div>
            </form>
            <dl v-else class="adm-facts fs-facts">
                <div class="adm-facts__row"><dt>Achslast vorn</dt><dd>{{ vehicle.axleFront === null ? 'fehlt' : `${decimal(vehicle.axleFront, 0)} kg` }}</dd></div>
                <div class="adm-facts__row"><dt>Achslast hinten</dt><dd>{{ vehicle.axleRear === null ? 'fehlt' : `${decimal(vehicle.axleRear, 0)} kg` }}</dd></div>
                <div class="adm-facts__row"><dt>Höchstgeschwindigkeit</dt><dd>{{ vehicle.maxSpeed === null ? 'fehlt' : `${decimal(vehicle.maxSpeed, 0)} km/h` }}</dd></div>
            </dl>
        </section>

        <section class="adm-section" aria-labelledby="fs-rows-h">
            <div class="adm-section__head">
                <h2 id="fs-rows-h" class="adm-section__title">In Gutachten genannt</h2>
            </div>
            <p v-if="rows.length === 0" class="adm-note">Noch kein Gutachten nennt dieses Fahrzeug.</p>
            <div v-else class="adm-panel">
                <table class="adm-table">
                    <caption class="visually-hidden">Gutachten-Zeilen für {{ vehicle.name }}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Felge</th>
                            <th scope="col">Gutachten</th>
                            <th scope="col">Eintragung</th>
                            <th scope="col" class="num">Auflagen</th>
                            <th scope="col">Stand</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in rows" :key="row.id">
                            <td data-label="Felge">
                                <span class="fs-wheel">{{ row.wheel }}</span>
                                <span class="fs-sub">{{ row.size }}</span>
                            </td>
                            <td data-label="Gutachten"><Link :href="row.documentHref">{{ row.document }}</Link></td>
                            <td data-label="Eintragung">{{ row.requiresEntry ? 'Ja' : 'Nein' }}</td>
                            <td data-label="Auflagen" class="num">{{ decimal(row.conditions, 0) }}</td>
                            <td data-label="Stand" data-phone="status">
                                <span v-if="row.status !== 'published'" class="adm-tag adm-tag--neutral">{{ STATUS[row.status] ?? row.status }}</span>
                                <template v-else>{{ STATUS[row.status] }}</template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
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
