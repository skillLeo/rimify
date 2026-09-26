<script setup lang="ts">
/**
 * Gutachten › Abdeckung: the Abdeckungs-Matrix at full size, and — once a cell is chosen — every
 * variant of that make with the Felgen of that size a customer may be shown for it. The variants with
 * none come first: they are the next Gutachten worth having.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import CoverageMatrix from '../../../Components/Admin/Dashboard/CoverageMatrix.vue'
import DashWidget from '../../../Components/Admin/Dashboard/DashWidget.vue'
import { decimal } from '../../../format'
import type { AdminAbdeckungProps } from '../../../types/admin/abdeckung'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminAbdeckungProps>()

const context = computed(() => `${props.matrix.summary.sentence} · Stand: ${props.matrix.computedAt}`)
</script>

<template>
    <AdminPage title="Abdeckung" :context="context">
        <div class="ab">
            <DashWidget title="Varianten mit freigegebener Felge, nach Marke und Größe" :empty="matrix.rows.length ? null : 'Noch kein Fahrzeug im Katalog. Die Matrix füllt sich mit dem ersten Import.'">
                <CoverageMatrix :matrix="matrix" />
            </DashWidget>

            <DashWidget
                v-if="selection"
                :title="`${selection.make}, ${selection.size} Zoll`"
                href="/admin/abdeckung"
                href-label="Auswahl aufheben"
                :empty="selection.total ? null : `Von ${selection.make} ist kein Fahrzeug im Katalog.`"
            >
                <p class="ab__lead">
                    {{ decimal(selection.covered, 0) }} von {{ decimal(selection.total, 0) }} Varianten haben mindestens eine freigegebene Felge in {{ selection.size }} Zoll.
                    Die ohne stehen oben.
                </p>
                <div class="ab__scroll">
                    <table class="adm-table ab__table">
                        <thead>
                            <tr>
                                <th scope="col">Fahrzeug</th>
                                <th scope="col">Baujahre</th>
                                <th scope="col">HSN / TSN</th>
                                <th scope="col" class="num">Felgen in {{ selection.size }}″</th>
                                <th scope="col" class="num">Gutachten</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in selection.rows" :key="row.id">
                                <td data-label="Fahrzeug">{{ row.vehicle }}</td>
                                <td data-label="Baujahre" class="num-plain">{{ row.period }}</td>
                                <td data-label="HSN / TSN" class="num-plain">{{ row.keys }}</td>
                                <td data-label="Felgen" class="num">
                                    <span v-if="row.wheels">{{ decimal(row.wheels, 0) }}</span>
                                    <span v-else class="adm-tag adm-tag--warn">keine</span>
                                </td>
                                <td data-label="Gutachten" class="num">{{ row.documents ? decimal(row.documents, 0) : '–' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p class="ab__hint">
                    Wer auf ein Gutachten für sein Auto wartet, steht unter <Link href="/admin/anfragen">Anfragen</Link>.
                </p>
            </DashWidget>
        </div>
    </AdminPage>
</template>

<style scoped>
.ab {
    display: grid;
    gap: var(--sp-24);
    max-width: var(--adm-dash-max);
}

.ab__lead,
.ab__hint {
    margin: 0 0 var(--sp-12);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.ab__hint {
    margin: var(--sp-12) 0 0;
}

.ab__scroll {
    overflow-x: auto;
}

.num-plain {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
</style>
