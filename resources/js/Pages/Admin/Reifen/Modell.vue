<script setup lang="ts">
/**
 * Katalog › Reifen › one tyre model (the Gutachten rework §9): its photographs — up to four, by the rim page's own upload, sorted the
 * same way —, its facts, and its sizes with supplier, price, availability and EU label per line. A size opens on its own page. A photo
 * applies to every size of the model; without one the shop draws a neutral outline, never another tyre's picture.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSaveBar from '../../../Components/Admin/AdminSaveBar.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import { useDirtyForm } from '../../../composables/admin/useDirtyForm'
import { anzahl, withUnit } from '../../../format'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { formatMoney } from '../../../lib/num'
import type { AdminReifenModellProps } from '../../../types/admin/reifen'
import FinishPhotos from '../Felgen/FinishPhotos.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminReifenModellProps>()

const NEW_BRAND = -1

const editor = useDirtyForm(
    { brand_id: props.model.brandId as number, brand_new: '', name: props.model.name, season: props.model.season },
    { method: 'put', url: () => `/admin/reifen/modell/${props.model.id}`, stamp: () => props.stamp },
)

const form = editor.form

/* Sent as the server reads it: a chosen brand or a new one, never both. */
form.transform((data) => ({
    ...data,
    brand_id: data.brand_id === NEW_BRAND ? null : data.brand_id,
    brand_new: data.brand_id === NEW_BRAND ? data.brand_new : '',
}))

const editable = computed(() => props.can.edit && !props.model.demo)
const errors = computed(() => form.errors as Record<string, string | undefined>)
const context = computed(() => `${anzahl(props.sizes.length, 'Größe', 'Größen')}${props.model.updated ? ` · Geändert am ${props.model.updated}` : ''}`)
const firstSize = computed(() => props.sizes[0]?.id ?? null)

const photoSubject = computed(() => ({
    base: `/admin/reifen/modell/${props.model.id}`,
    idBase: `rm-photo-${props.model.id}`,
    list: `Fotos von ${props.model.title}`,
    suggestion: `${props.model.title}, Seitenansicht`,
    example: `${props.model.title}, Lauffläche`,
    only: 'Es ist das einzige Foto dieses Modells. Der Shop zeigt danach wieder die neutrale Reifenzeichnung.',
    removeTitle: 'Foto entfernen?',
}))
</script>

<template>
    <AdminPage :title="model.title" :context="context" :read-only="!can.edit && !model.demo">
        <template #primary>
            <Link href="/admin/reifen" class="btn btn--secondary">
                <Icon name="chevron-left" :size="20" />
                Alle Reifen
            </Link>
        </template>

        <p v-if="model.demo" class="adm-note rm-note">Dieses Reifenmodell gehört zu den Demodaten. Du kannst es ansehen, aber nicht ändern. Es wird zusammen mit den Demodaten entfernt.</p>

        <section class="adm-section" aria-labelledby="rm-photos-h">
            <div class="adm-section__head">
                <h2 id="rm-photos-h" class="adm-section__title">Fotos</h2>
            </div>
            <p class="adm-note rm-note">Bis zu vier Fotos je Modell, zum Beispiel Seitenansicht, Lauffläche, Profil und Schrägansicht. Sie gelten für alle Größen. Das erste ist das Hauptbild im Shop.</p>
            <FinishPhotos
                :model-id="model.id"
                :finish-id="model.id"
                finish-name=""
                :image="null"
                :photos="photos"
                :order-stamp="photoOrderStamp"
                :max="maxPhotos"
                :editable="editable"
                :title="model.title"
                :subject="photoSubject"
            />
        </section>

        <section class="adm-section" aria-labelledby="rm-facts-h">
            <div class="adm-section__head">
                <h2 id="rm-facts-h" class="adm-section__title">Modell</h2>
            </div>
            <form id="rm-form" class="adm-fields rm-facts" novalidate @submit.prevent="editor.save">
                <div class="form-field">
                    <label class="form-field__label" for="rm-brand">Marke</label>
                    <select id="rm-brand" v-model="form.brand_id" class="input" :disabled="!editable" :aria-invalid="errors.brand_id ? 'true' : undefined" aria-describedby="rm-brand-err">
                        <option v-for="brand in brands" :key="brand.value" :value="brand.value">{{ brand.label }}</option>
                        <option :value="NEW_BRAND">Neue Marke anlegen …</option>
                    </select>
                    <p id="rm-brand-err" class="form-field__error">{{ errors.brand_id }}</p>
                </div>
                <div v-if="form.brand_id === NEW_BRAND" class="form-field">
                    <label class="form-field__label" for="rm-brand-new">Name der neuen Marke</label>
                    <input id="rm-brand-new" v-model="form.brand_new" class="input" type="text" maxlength="60" :aria-invalid="errors.brand_new ? 'true' : undefined" aria-describedby="rm-brand-new-err">
                    <p id="rm-brand-new-err" class="form-field__error">{{ errors.brand_new }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="rm-name">Modell</label>
                    <input id="rm-name" v-model="form.name" class="input" type="text" maxlength="80" :readonly="!editable" :aria-invalid="errors.name ? 'true' : undefined" aria-describedby="rm-name-err">
                    <p id="rm-name-err" class="form-field__error">{{ errors.name }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="rm-season">Saison</label>
                    <select id="rm-season" v-model="form.season" class="input" :disabled="!editable" :aria-invalid="errors.season ? 'true' : undefined" aria-describedby="rm-season-err">
                        <option v-for="season in seasons" :key="season.value" :value="season.value">{{ season.label }}</option>
                    </select>
                    <p id="rm-season-err" class="form-field__error">{{ errors.season }}</p>
                </div>
            </form>
        </section>

        <section class="adm-section" aria-labelledby="rm-sizes-h">
            <div class="adm-section__head">
                <h2 id="rm-sizes-h" class="adm-section__title">Größen</h2>
                <Link v-if="can.create && !model.demo && firstSize" :href="`/admin/reifen/neu?wie=${firstSize}`" class="btn btn--secondary">
                    <Icon name="plus" :size="20" />
                    Größe hinzufügen
                </Link>
            </div>
            <p class="adm-note rm-note">Je Größe: Lastindex und Geschwindigkeitssymbol, Preis, Verfügbarkeit, Lieferant und EU-Reifenlabel. Ohne vollständiges Label bietet der Shop die Größe nicht an.</p>

            <AdminState v-if="sizes.length === 0" kind="empty" text="Dieses Modell hat keine Größe mehr. Der Shop bietet es nicht an." />
            <div v-else class="adm-panel">
                <table class="adm-table">
                    <caption class="visually-hidden">Größen von {{ model.title }}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Größe</th>
                            <th scope="col">Lieferant</th>
                            <th scope="col" class="num">Preis</th>
                            <th scope="col">EU-Reifenlabel</th>
                            <th scope="col">EPREL</th>
                            <th scope="col">Stand</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="line in sizes" :key="line.id">
                            <td data-label="Größe"><Link :href="line.href" class="rm-size">{{ line.size }}</Link></td>
                            <td data-label="Lieferant">{{ line.supplier ?? '–' }}</td>
                            <td data-label="Preis" class="num">{{ formatMoney(line.priceCents) }}</td>
                            <td data-label="EU-Reifenlabel">
                                <template v-if="line.label">
                                    <span class="rm-label">{{ line.label.fuel }} · {{ line.label.wet }} · {{ withUnit(line.label.noiseDb, 'dB') }} ({{ line.label.noiseClass }})</span>
                                    <span v-if="line.label.snow || line.label.ice" class="rm-sub">{{ [line.label.snow ? 'Schneegriffigkeit' : '', line.label.ice ? 'Eisgriffigkeit' : ''].filter(Boolean).join(' · ') }}</span>
                                </template>
                                <template v-else-if="line.demo">–</template>
                                <span v-else class="adm-tag adm-tag--warn" :title="`Noch nicht eingetragen: ${line.missingLabel.join(', ')}`">Unvollständig</span>
                            </td>
                            <td data-label="EPREL">{{ line.eprel ?? '–' }}</td>
                            <td data-label="Stand" data-phone="status">
                                <span v-if="line.demo" class="rm-quiet">Demodaten</span>
                                <span v-else-if="!line.available" class="adm-tag adm-tag--neutral">Nicht verfügbar</span>
                                <span v-else-if="!line.offered" class="adm-tag adm-tag--warn">Nicht im Shop</span>
                                <template v-else>Im Shop</template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <AdminSaveBar v-if="editable" :editor="editor" />
    </AdminPage>
</template>

<style scoped>
.rm-note {
    margin-bottom: var(--sp-12);
}

.rm-facts {
    max-width: var(--adm-form-max);
}

.rm-size {
    color: var(--c-ink);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.rm-label {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.rm-sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.rm-quiet {
    color: var(--c-ink-3);
}
</style>
