<script setup lang="ts">
/**
 * Gutachten › Auflagen — every document's own Auflagenverzeichnis, one after the other, to read (the
 * corrections memo §1). There is no catalogue shared between documents any more: `A01` of one Gutachten and
 * `A01` of another are two entries, each with its own sentence. A list is written on its Gutachten, while it
 * is a draft; this page only shows them — and the codes a document's rows carry that it does not define,
 * which keep those rows „Noch nicht bestätigt“ and the document unreleased.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
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

const props = defineProps<{ documents: DocumentList[] }>()

const context = computed(() => (props.documents.length === 1 ? '1 Gutachten' : `${decimal(props.documents.length, 0)} Gutachten`))

const STATUS: Record<DocumentList['status'], string> = {
    draft: 'Entwurf',
    published: 'Freigegeben',
    superseded: 'Ersetzt',
    withdrawn: 'Zurückgezogen',
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

        <AdminState v-if="documents.length === 0" kind="empty" text="Hier steht das Auflagenverzeichnis jedes Gutachtens, sobald das erste einen Code hat." />

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
                <table class="adm-table">
                    <caption class="visually-hidden">Auflagenverzeichnis von {{ doc.label }}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Code</th>
                            <th scope="col">Art</th>
                            <th scope="col">Satz aus dem Gutachten</th>
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
                            <td data-label="Seite" class="num">{{ c.page ?? '–' }}</td>
                            <td data-label="Verwendet" class="num" data-phone="hide">{{ c.uses === 0 ? '–' : decimal(c.uses, 0) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    </AdminPage>
</template>

<style scoped>
.al-intro {
    margin-bottom: var(--sp-24);
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
