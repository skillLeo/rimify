<script setup lang="ts">
/**
 * Gutachten › Auflagen — every document's own Auflagenverzeichnis, one after the other, to read (the
 * corrections memo §1). There is no catalogue shared between documents any more: `A01` of one Gutachten and
 * `A01` of another are two entries, each with its own sentence. A list is written on its Gutachten, while it
 * is a draft; this page shows them — and the codes a document's rows carry that it does not define, which keep
 * those rows „Noch nicht bestätigt“ and the document unreleased. Here each code's shop colour is seen, filtered and
 * changed, so it can be found (the client's item 23).
 */

import { Link, router } from '@inertiajs/vue3'
import { computed } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import ListPager, { type ListPagination } from '../../../Components/Admin/Lists/ListPager.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'
import type { DocumentConditionView, UnresolvedCode } from '../../../types/admin/gutachten'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface DocumentList {
    id: number
    label: string
    status: 'draft' | 'published' | 'superseded' | 'withdrawn'
    href: string
    conditions: DocumentConditionView[]
    unresolved: UnresolvedCode[]
}

const props = defineProps<{
    documents: DocumentList[]
    /** Every document with a code, over all pages (the admin audit's F-33). */
    found: number
    /** The filter on the shop colour; null: every code. */
    farbe: 'green' | 'yellow' | null
    canColour: boolean
    pagination: ListPagination
}>()

const context = computed(() => (props.found === 1 ? '1 Gutachten' : `${decimal(props.found, 0)} Gutachten`))

const STATUS: Record<DocumentList['status'], string> = {
    draft: 'Entwurf',
    published: 'Freigegeben',
    superseded: 'Ersetzt',
    withdrawn: 'Zurückgezogen',
}

function filterColour(value: string): void {
    router.get('/admin/auflagen', value === '' ? {} : { farbe: value }, { preserveState: true, preserveScroll: true })
}

function setColour(doc: DocumentList, c: DocumentConditionView, target: HTMLSelectElement): void {
    router.put(`/admin/gutachten/${doc.id}/auflagen/${c.id}/farbe`, { shop_colour: target.value }, {
        preserveScroll: true,
        preserveState: true,
        // Not saved: the field says what stands, never what was only tried.
        onError: () => {
            target.value = c.shopColour
        },
    })
}

/** The parameter a filter or tyre kind carries, as the admin entered it. */
function parameter(c: DocumentConditionView): string {
    if (c.bodyForms.length) {
        return `Nur ${c.bodyForms.join(', ')}`
    }

    if (c.drive) {
        return `${c.drive.mode === 'only' ? 'Nur mit' : 'Nicht mit'} ${c.drive.drive}`
    }

    if (c.maxAxleLoadKg !== null) {
        return `Bis ${decimal(c.maxAxleLoadKg, 0)} kg Achslast`
    }

    if (c.axle) {
        return c.axle === 'FRONT' ? 'Nur Vorderachse' : 'Nur Hinterachse'
    }

    return ''
}
</script>

<template>
    <AdminPage title="Auflagen" :context="context">
        <p class="adm-note al-intro">
            Jedes Gutachten hat sein eigenes Auflagenverzeichnis; derselbe Code kann in zwei Gutachten Verschiedenes bedeuten. Geschrieben wird es beim Gutachten selbst, solange es ein Entwurf ist.
        </p>

        <div class="form-field al-filter">
            <label class="form-field__label" for="al-farbe">Farbe im Shop</label>
            <select id="al-farbe" class="input" :value="farbe ?? ''" @change="filterColour(($event.target as HTMLSelectElement).value)">
                <option value="">Alle Farben</option>
                <option value="green">Grün</option>
                <option value="yellow">Gelb</option>
            </select>
        </div>

        <AdminState v-if="documents.length === 0 && farbe" kind="empty" text="Kein Code in dieser Farbe." />

        <AdminState v-else-if="documents.length === 0" kind="empty" text="Hier steht das Auflagenverzeichnis jedes Gutachtens, sobald das erste einen Code hat." />

        <section v-for="doc in documents" :key="doc.id" class="adm-section al-doc" :aria-labelledby="`al-doc-${doc.id}`">
            <div class="adm-section__head">
                <h2 :id="`al-doc-${doc.id}`" class="adm-section__title">
                    <Link :href="doc.href">{{ doc.label }}</Link>
                </h2>
                <span class="al-status">{{ STATUS[doc.status] }}</span>
            </div>

            <p v-if="doc.unresolved.length" class="adm-alert" role="status">
                Nicht im Auflagenverzeichnis: {{ doc.unresolved.map((u) => `${u.code} (${u.rows === 1 ? '1 Zeile' : `${decimal(u.rows, 0)} Zeilen`})`).join(', ') }}. Diese Zeilen bleiben „Noch nicht bestätigt“, bis der Code dort steht.
            </p>

            <div v-if="doc.conditions.length" class="adm-panel">
                <table class="adm-table al-table">
                    <caption class="visually-hidden">Auflagenverzeichnis von {{ doc.label }}</caption>
                    <colgroup>
                        <col class="al-col-code">
                        <col class="al-col-kind">
                        <col>
                        <col class="al-col-colour">
                        <col class="al-col-num">
                        <col class="al-col-num">
                    </colgroup>
                    <thead>
                        <tr>
                            <th scope="col">Code</th>
                            <th scope="col">Art</th>
                            <th scope="col">Satz aus dem Gutachten</th>
                            <th scope="col">Farbe im Shop</th>
                            <th scope="col" class="num">Seite</th>
                            <th scope="col" class="num">Verwendet</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="c in doc.conditions" :key="c.id">
                            <td data-label="Code"><span class="adm-table__key" translate="no">{{ c.code }}</span></td>
                            <td data-label="Art">
                                {{ c.kindLabel }}
                                <span v-if="parameter(c)" class="adm-table__sub">{{ parameter(c) }}</span>
                            </td>
                            <td data-label="Satz" class="al-text">{{ c.text }}</td>
                            <td data-label="Farbe im Shop">
                                <template v-if="canColour">
                                    <span class="al-colourline">
                                        <span class="al-dot" :class="c.shopColour === 'yellow' ? 'al-dot--yellow' : 'al-dot--green'" aria-hidden="true" />
                                        <select :id="`al-colour-${c.id}`" class="input al-colour" :value="c.shopColour" :aria-label="`Farbe von Code ${c.code} im Shop`" @change="setColour(doc, c, $event.target as HTMLSelectElement)">
                                            <option value="green">Grün</option>
                                            <option value="yellow">Gelb</option>
                                        </select>
                                    </span>
                                </template>
                                <span v-else class="al-colourline">
                                    <span class="al-dot" :class="c.shopColour === 'yellow' ? 'al-dot--yellow' : 'al-dot--green'" aria-hidden="true" />
                                    {{ c.shopColour === 'yellow' ? 'Gelb' : 'Grün' }}
                                </span>
                            </td>
                            <td data-label="Seite" class="num">{{ c.page ?? '–' }}</td>
                            <td data-label="Verwendet" class="num" data-phone="hide">{{ c.uses === 0 ? '–' : decimal(c.uses, 0) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <ListPager :pagination="pagination" label="Seiten der Auflagenverzeichnisse" />
    </AdminPage>
</template>

<style scoped>
.al-intro {
    margin-bottom: var(--sp-24);
}

.al-filter {
    max-width: calc(24 * var(--ch-text));
    margin-bottom: var(--sp-24);
}

/* One table's columns stand where the next one's do: the same grid under every paper. */
@media (min-width: 768px) {
    .al-table {
        table-layout: fixed;
    }

    .al-col-code {
        width: calc(10 * var(--ch-text));
    }

    .al-col-kind {
        width: calc(24 * var(--ch-text));
    }

    .al-col-colour {
        width: calc(18 * var(--ch-text));
    }

    .al-col-num {
        width: calc(10 * var(--ch-text));
    }
}

.al-colourline {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
}

/* A yellow code looks like a yellow code at a glance, as it will in the shop. */
.al-dot {
    flex: none;
    width: var(--sp-12);
    height: var(--sp-12);
    border-radius: var(--r-round);
}

.al-dot--green {
    background: var(--c-ok);
}

.al-dot--yellow {
    background: var(--c-warn);
}

.al-colour {
    min-width: calc(9 * var(--ch-text));
}

/* A document named is ink, like every document link of the panel; the underline comes on hover. */
.al-doc .adm-section__title a {
    color: var(--c-ink);
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .al-doc .adm-section__title a:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.al-doc + .al-doc {
    margin-top: var(--sp-32);
}

.al-status {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-3);
}

.al-text {
    overflow-wrap: anywhere;
}
</style>
