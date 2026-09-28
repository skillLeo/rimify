<script setup lang="ts">
/**
 * Gutachten › Abdeckung: the Abdeckungs-Matrix at full size, and — once a cell is chosen — every
 * variant of that make with the Felgen of that size a customer may be shown for it. The variants with
 * none come first: they are the next Gutachten worth having.
 */

import { Link } from '@inertiajs/vue3'
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import CoverageMatrix from '../../../Components/Admin/Dashboard/CoverageMatrix.vue'
import DashWidget from '../../../Components/Admin/Dashboard/DashWidget.vue'
import { decimal } from '../../../format'
import type { AdminAbdeckungProps } from '../../../types/admin/abdeckung'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminAbdeckungProps>()

const result = ref<HTMLElement | null>(null)

onMounted(() => {
    if (props.selection && result.value) {
        result.value.focus({ preventScroll: true })
        result.value.scrollIntoView({ block: 'start' })
    }
})

const context = computed(() => `${props.matrix.summary.sentence} · Stand: ${props.matrix.computedAt}`)
</script>

<template>
    <AdminPage title="Abdeckung" dashboard :context="context">
        <div class="ab">
            <!-- A Nachtrag without its base: the matrix counts its approvals, and says once that they are not the whole approval. -->
            <section v-if="matrix.incomplete?.length" class="adm-section ab__incomplete" aria-labelledby="ab-incomplete-h">
                <div class="adm-section__head">
                    <h2 id="ab-incomplete-h" class="adm-section__title">Nachträge ohne Grundgutachten</h2>
                </div>
                <p class="adm-note">Die Matrix zählt ihre Freigaben mit. Ihr Grundgutachten liegt uns nicht vor – ein Nachtrag allein ist nicht die ganze Freigabe, und der Shop sagt das dazu.</p>
                <ul class="ab__docs">
                    <li v-for="item in matrix.incomplete" :key="item.href" class="ab__doc">
                        <Link :href="item.href" class="ab__link">{{ item.document }}</Link>
                        <span v-if="item.base" class="ab__base">Grundgutachten {{ item.base }}</span>
                    </li>
                </ul>
            </section>

            <DashWidget title="Varianten mit freigegebener Felge, nach Marke und Größe" :empty="matrix.rows.length ? null : 'Noch kein Fahrzeug im Katalog. Die Matrix füllt sich mit dem ersten Import.'">
                <CoverageMatrix :matrix="matrix" :selected="selection ? { make: selection.make, size: selection.size } : null" />
            </DashWidget>

            <!-- The list a cell asked for is what the reader came for: in view, and the focus on it. -->
            <div v-if="selection" ref="result" class="ab__result" tabindex="-1" role="region" aria-label="Varianten zur gewählten Marke und Größe">
                <DashWidget
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
                                    <th scope="col" class="num">Felgen in {{ selection.size }} Zoll</th>
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
        </div>
    </AdminPage>
</template>

<style scoped>
.ab {
    display: grid;
    gap: var(--sp-24);
    max-width: var(--adm-dash-max);
}

.ab__docs {
    display: grid;
    gap: 0;
    margin: var(--sp-12) 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.ab__doc {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4) var(--sp-16);
    padding-block: var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.ab__link {
    color: var(--c-ink);
    font-weight: 500;
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .ab__link:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.ab__base {
    color: var(--c-ink-3);
}

.ab__result {
    display: grid;
    scroll-margin-top: var(--sp-24);
    outline: none;
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
