<script setup lang="ts">
/**
 * Einstellungen › Medien und Speicher: the bucket the shop's files live in (SpeicherController).
 *
 * The keys are write-only. The page only ever gets their last four characters, masked; a key stays
 * as stored until „Neuen Schlüssel eintragen“ opens an empty field for a new one. A save is tested
 * at once, and so is „Verbindung testen“ on demand: write, read, compare, delete on private/ — one
 * line per step, the storage's own words where one fails. The page says which set is in force.
 */

import { router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSaveBar from '../../../Components/Admin/AdminSaveBar.vue'
import { useDirtyForm } from '../../../composables/admin/useDirtyForm'
import type { AdminSpeicherProps } from '../../../types/admin/speicher'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminSpeicherProps>()

const editor = useDirtyForm(
    { ...props.form, access_key: '', secret: '' },
    { method: 'put', url: '/admin/einstellungen/speicher', stamp: () => props.stamp }
)
const form = editor.form

/** The two write-only fields: closed (the masked value), or open for a new one. */
const newKey = ref(props.keyMasked === null)
const newSecret = ref(props.secretMasked === null)

function replaceKey(): void {
    newKey.value = true
    form.access_key = ''
}

function replaceSecret(): void {
    newSecret.value = true
    form.secret = ''
}

const SOURCES: Record<AdminSpeicherProps['source'], string> = {
    database: 'Diese Einstellungen',
    env: 'Die Werte aus der .env-Datei – hier ist noch nichts gespeichert und geprüft',
    local: 'Lokaler Speicher auf dem Server – noch kein Bucket eingerichtet',
}

/* The bucket's name from AWS (ListBuckets): a select where the key may list, free text where not. */
const listing = ref(false)
const bucketNames = computed(() => {
    const names = props.buckets?.names ?? []

    // A stored name the key cannot see stays choosable, so the select never silently changes it.
    return form.bucket && names.length && !names.includes(form.bucket) ? [form.bucket, ...names] : names
})

function listBuckets(): void {
    if (listing.value) {
        return
    }

    listing.value = true
    router.post(
        '/admin/einstellungen/speicher/buckets',
        { region: form.region, endpoint: form.endpoint, path_style: form.path_style, access_key: form.access_key, secret: form.secret },
        { preserveScroll: true, preserveState: true, onFinish: () => (listing.value = false) }
    )
}

const testing = ref(false)

function testConnection(): void {
    if (testing.value) {
        return
    }

    testing.value = true
    router.post('/admin/einstellungen/speicher/test', { ...form.data() }, { preserveScroll: true, onFinish: () => (testing.value = false) })
}

const VISIBILITY: Record<string, string> = { public: 'öffentlich lesbar', private: 'privat, nur mit signiertem Link' }
const HOLDS: Record<string, string> = {
    media_products: 'Felgenfotos und ihre Größen',
    media_site: 'Bilder der Inhaltsseiten',
    docs_public: 'Gutachten zum Öffnen im Shop',
    docs_private: 'Rechnungen, Exporte, Uploads in Prüfung',
}

const disks = computed(() => Object.entries(props.disks).map(([name, spec]) => ({ name, ...spec })))
</script>

<template>
    <AdminPage title="Medien und Speicher" :context="`In Kraft: ${SOURCES[source]}`">
        <p v-if="pending" class="adm-alert" role="status">
            Die zuletzt gespeicherten Werte sind noch nicht aktiv: Die Verbindung klappte damit nicht. Es gelten weiter die bisherigen Einstellungen.
        </p>

        <form class="adm-form" novalidate @submit.prevent="editor.save">
            <section class="adm-form__group" aria-labelledby="sp-bucket">
                <h2 id="sp-bucket" class="adm-form__heading">Bucket</h2>

                <div class="form-field">
                    <label class="form-field__label" for="sp-provider">Anbieter</label>
                    <select id="sp-provider" v-model="form.provider" class="input">
                        <option value="s3">S3-kompatibel (AWS S3 und andere)</option>
                    </select>
                </div>

                <div class="adm-fields">
                    <div class="form-field">
                        <label class="form-field__label" for="sp-region">Region</label>
                        <input id="sp-region" v-model="form.region" class="input" type="text" autocomplete="off" spellcheck="false" aria-describedby="sp-region-help sp-region-error" :aria-invalid="form.errors.region ? 'true' : undefined">
                        <p id="sp-region-help" class="form-field__help">Stockholm ist eu-north-1.</p>
                        <p id="sp-region-error" class="form-field__error">{{ form.errors.region }}</p>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="sp-bucket-name">Name des Buckets</label>
                        <!-- From AWS itself where the key may list: the real name, never a typing error. -->
                        <select v-if="bucketNames.length" id="sp-bucket-name" v-model="form.bucket" class="input" aria-describedby="sp-bucket-help sp-bucket-error" :aria-invalid="form.errors.bucket ? 'true' : undefined">
                            <option value="" disabled>Bucket wählen</option>
                            <option v-for="name in bucketNames" :key="name" :value="name">{{ name }}</option>
                        </select>
                        <input v-else id="sp-bucket-name" v-model="form.bucket" class="input" type="text" autocomplete="off" spellcheck="false" aria-describedby="sp-bucket-help sp-bucket-error" :aria-invalid="form.errors.bucket ? 'true' : undefined">
                        <p id="sp-bucket-help" class="form-field__help">
                            <template v-if="buckets?.error">AWS erlaubt diesem Schlüssel keine Liste ({{ buckets.error }}). Trag den Namen bitte genau wie in der AWS-Konsole ein.</template>
                            <template v-else-if="bucketNames.length">Die Buckets, die dieser Schlüssel sehen darf – direkt von AWS.</template>
                            <template v-else>Am sichersten aus AWS geladen: ein Zeichen daneben, und AWS antwortet mit „NoSuchBucket“.</template>
                        </p>
                        <p id="sp-bucket-error" class="form-field__error">{{ form.errors.bucket }}</p>
                        <div>
                            <button class="btn btn--secondary btn--sm" type="button" :aria-busy="listing ? 'true' : undefined" @click="listBuckets">Buckets von AWS laden</button>
                        </div>
                    </div>
                </div>

                <div class="adm-fields">
                    <div class="form-field">
                        <label class="form-field__label" for="sp-public-url">Öffentliche Adresse oder CDN <span class="form-field__optional">optional</span></label>
                        <input id="sp-public-url" v-model="form.public_url" class="input" type="url" inputmode="url" autocomplete="off" spellcheck="false" aria-describedby="sp-public-help sp-public-error" :aria-invalid="form.errors.public_url ? 'true' : undefined">
                        <p id="sp-public-help" class="form-field__help">Leer lassen, dann gilt die Adresse des Buckets selbst.</p>
                        <p id="sp-public-error" class="form-field__error">{{ form.errors.public_url }}</p>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="sp-endpoint">Endpunkt <span class="form-field__optional">optional</span></label>
                        <input id="sp-endpoint" v-model="form.endpoint" class="input" type="url" inputmode="url" autocomplete="off" spellcheck="false" aria-describedby="sp-endpoint-help sp-endpoint-error" :aria-invalid="form.errors.endpoint ? 'true' : undefined">
                        <p id="sp-endpoint-help" class="form-field__help">Nur für einen Anbieter außer AWS.</p>
                        <p id="sp-endpoint-error" class="form-field__error">{{ form.errors.endpoint }}</p>
                    </div>
                </div>

                <label class="check">
                    <input v-model="form.path_style" type="checkbox">
                    Pfad-Stil verwenden (nur wenn der Anbieter es verlangt)
                </label>
            </section>

            <section class="adm-form__group" aria-labelledby="sp-keys">
                <h2 id="sp-keys" class="adm-form__heading">Zugang</h2>
                <p class="adm-form__note">Die Schlüssel werden verschlüsselt gespeichert und nie wieder angezeigt – nur ihre letzten vier Zeichen.</p>

                <div class="form-field">
                    <label class="form-field__label" for="sp-key">Zugriffsschlüssel (Access Key ID)</label>
                    <div v-if="!newKey" class="sp-masked">
                        <output id="sp-key" class="sp-masked__value" aria-label="Gespeicherter Zugriffsschlüssel, nur die letzten vier Zeichen">{{ keyMasked }}</output>
                        <button class="btn btn--secondary btn--sm" type="button" @click="replaceKey">Neuen Schlüssel eintragen</button>
                    </div>
                    <input v-else id="sp-key" v-model="form.access_key" class="input sp-secret" type="text" autocomplete="off" spellcheck="false" aria-describedby="sp-key-error" :aria-invalid="form.errors.access_key ? 'true' : undefined">
                    <p id="sp-key-error" class="form-field__error">{{ form.errors.access_key }}</p>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="sp-secret">Geheimer Schlüssel (Secret Access Key)</label>
                    <div v-if="!newSecret" class="sp-masked">
                        <output id="sp-secret" class="sp-masked__value" aria-label="Gespeicherter geheimer Schlüssel, nur die letzten vier Zeichen">{{ secretMasked }}</output>
                        <button class="btn btn--secondary btn--sm" type="button" @click="replaceSecret">Neuen Schlüssel eintragen</button>
                    </div>
                    <input v-else id="sp-secret" v-model="form.secret" class="input sp-secret" type="password" autocomplete="new-password" spellcheck="false" aria-describedby="sp-secret-help sp-secret-error" :aria-invalid="form.errors.secret ? 'true' : undefined">
                    <!-- Only where a secret is stored: with none, an empty field keeps nothing. -->
                    <p v-if="newSecret && secretMasked !== null" id="sp-secret-help" class="form-field__help">Leer lassen behält den gespeicherten Schlüssel.</p>
                    <p id="sp-secret-error" class="form-field__error">{{ form.errors.secret }}</p>
                </div>
            </section>

            <section class="adm-form__group" aria-labelledby="sp-test">
                <h2 id="sp-test" class="adm-form__heading">Verbindung</h2>
                <p class="adm-form__note">Schreibt eine kleine Datei nach invoices/, liest sie zurück, vergleicht sie und löscht sie wieder. Jedes Speichern prüft genauso.</p>

                <div>
                    <button class="btn btn--secondary" type="button" :aria-busy="testing ? 'true' : undefined" @click="testConnection">Verbindung testen</button>
                </div>

                <ol v-if="test" class="sp-steps" aria-label="Ergebnis der letzten Prüfung">
                    <li v-for="step in test.steps" :key="step.step" class="sp-step" :class="step.ok ? 'sp-step--ok' : 'sp-step--bad'">
                        <span class="adm-health__dot" :class="step.ok ? 'adm-health__dot--ok' : 'adm-health__dot--bad'" aria-hidden="true" />
                        <span class="sp-step__name">{{ step.step }}<span class="visually-hidden">{{ step.ok ? ': geklappt' : ': fehlgeschlagen' }}</span></span>
                        <code v-if="step.detail" class="sp-step__detail">{{ step.detail }}</code>
                    </li>
                </ol>
            </section>

            <section class="adm-form__group" aria-labelledby="sp-disks">
                <h2 id="sp-disks" class="adm-form__heading">Ordner im Bucket</h2>
                <div class="adm-panel">
                    <table class="adm-table">
                        <caption class="visually-hidden">Die vier Ordner im Bucket</caption>
                        <thead>
                            <tr>
                                <th scope="col">Ordner</th>
                                <th scope="col">Sichtbarkeit</th>
                                <th scope="col">Enthält</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="disk in disks" :key="disk.name">
                                <td data-label="Ordner"><code>{{ disk.prefix }}/</code></td>
                                <td data-label="Sichtbarkeit">{{ VISIBILITY[disk.visibility] }}</td>
                                <td data-label="Enthält">{{ HOLDS[disk.name] ?? '' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </form>

        <AdminSaveBar :editor="editor" />
    </AdminPage>
</template>

<style scoped>
.sp-masked {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
}

.sp-masked__value,
.sp-secret,
.sp-step__detail {
    font-variant-numeric: tabular-nums;
}

.sp-masked__value {
    color: var(--c-ink-2);
    letter-spacing: 0.04em;
}

.sp-steps {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.sp-step {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.sp-step--ok .sp-step__name {
    color: var(--c-ok);
}

.sp-step--bad .sp-step__name {
    color: var(--c-bad);
    font-weight: 600;
}

.sp-step__detail {
    grid-column: 2;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}
</style>
