<script setup lang="ts">
/**
 * Einstellungen › E-Mail: the Amazon SES key the shop sends its mail with (EmailController), built as Medien und
 * Speicher — write-only keys, a save tested at once, „Verbindung testen“ on demand, one line per step in SES's own
 * words. Beside it what SES needs from the world, as it stands: the sender's DNS records, the address SNS reports
 * bounces and complaints to, and the addresses on the shop's block list.
 */

import { router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminSaveBar from '../../../Components/Admin/AdminSaveBar.vue'
import { useDirtyForm } from '../../../composables/admin/useDirtyForm'
import { decimal } from '../../../format'
import type { AdminEmailProps } from '../../../types/admin/email'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

const props = defineProps<AdminEmailProps>()

const editor = useDirtyForm(
    { ...props.form, access_key: '', secret: '' },
    { method: 'put', url: '/admin/einstellungen/e-mail', stamp: () => props.stamp }
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

const testing = ref(false)

function testConnection(): void {
    if (testing.value) {
        return
    }

    testing.value = true
    router.post('/admin/einstellungen/e-mail/test', { ...form.data() }, { preserveScroll: true, onFinish: () => (testing.value = false) })
}

const releasing = ref<number | null>(null)

type Suppression = AdminEmailProps['suppressions'][number]

/**
 * The address asked about before its block is lifted — it acted on one click, and nothing here sets a block again
 * (the admin audit's F-24). Every other such action asks first.
 */
const lifting = ref<Suppression | null>(null)
const liftOpen = ref(false)

function askRelease(row: Suppression): void {
    lifting.value = row
    liftOpen.value = true
}

const liftBody = computed(() =>
    (lifting.value?.reason === 'Beschwerde'
        ? 'Von dieser Adresse kam eine Beschwerde: Eine Mail des Shops wurde als Spam gemeldet. Jede weitere Beschwerde schadet dem Absender bei Amazon SES.'
        : 'Amazon SES hat die Adresse als dauerhaft unzustellbar gemeldet. Stimmt sie weiterhin nicht, meldet SES sie erneut.') +
    ' Nach dem Aufheben schickt der Shop ihr wieder Mails. Von Hand sperren lässt sie sich hier nicht.'
)

/*
 * The block list shows the newest addresses; any other is found by its search, run on the server and answered with the
 * list alone, so the settings typed above stay as they are (the admin audit's sweep after F-26).
 */
const SHOWN = 50
const blockedQuery = ref(props.suppressionSearch ?? '')
const blockedSearchShown = computed(() => (props.suppressionsTotal ?? 0) > SHOWN || (props.suppressionSearch ?? '') !== '')

const blockedNote = computed(() => {
    const total = props.suppressionsTotal ?? props.suppressions.length
    const search = props.suppressionSearch ?? ''
    const found = props.suppressionsFound ?? props.suppressions.length

    if (search !== '') {
        return found === 0
            ? `Keine gesperrte Adresse passt zu „${search}“.`
            : `${found === 1 ? 'Eine gesperrte Adresse passt' : `${decimal(found, 0)} gesperrte Adressen passen`} zu „${search}“${found > props.suppressions.length ? `, hier stehen die neuesten ${decimal(props.suppressions.length, 0)}` : ''}.`
    }

    return total > props.suppressions.length ? `Hier stehen die neuesten ${decimal(props.suppressions.length, 0)} von ${decimal(total, 0)} gesperrten Adressen. Eine ältere findest du über die Suche.` : ''
})

function findBlocked(): void {
    const typed = blockedQuery.value.trim()

    router.get('/admin/einstellungen/e-mail', typed === '' ? {} : { sperre: typed }, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        only: ['suppressions', 'suppressionsFound', 'suppressionsTotal', 'suppressionSearch'],
    })
}

function release(): void {
    const row = lifting.value

    if (row === null || releasing.value !== null) {
        return
    }

    releasing.value = row.id
    router.delete(`/admin/einstellungen/e-mail/sperren/${row.id}`, {
        preserveScroll: true,
        onSuccess: () => (liftOpen.value = false),
        onFinish: () => (releasing.value = null),
    })
}

const context = props.sending
    ? 'In Kraft: Versand über Amazon SES'
    : `In Kraft: Versand über „${props.mailer}“ – noch nicht über Amazon SES`
</script>

<template>
    <AdminPage title="E-Mail" :context="context">
        <p v-if="pending" class="adm-alert" role="status">
            Die zuletzt gespeicherten Werte sind noch nicht aktiv: Der Zugang zu Amazon SES klappte damit nicht. Es gelten weiter die bisherigen Einstellungen.
        </p>
        <p v-else-if="!sending" class="adm-alert" role="status">
            Die Mails des Shops gehen noch nicht über Amazon SES. Das geschieht erst, wenn die Prüfung unten keine offenen Punkte mehr nennt: Zugang, Produktionszugang, bestätigte Absenderdomain.
        </p>

        <form class="adm-form" novalidate @submit.prevent="editor.save">
            <section class="adm-form__group" aria-labelledby="em-sender">
                <h2 id="em-sender" class="adm-form__heading">Absender</h2>

                <div class="adm-fields">
                    <div class="form-field">
                        <label class="form-field__label" for="em-from">Absenderadresse</label>
                        <input id="em-from" v-model="form.from_address" class="input" type="email" inputmode="email" autocomplete="off" spellcheck="false" aria-describedby="em-from-help em-from-error" :aria-invalid="form.errors.from_address ? 'true' : undefined">
                        <p id="em-from-help" class="form-field__help">Eine Adresse der Domain, die in SES bestätigt ist, z. B. bestellung@rimify.de.</p>
                        <p id="em-from-error" class="form-field__error">{{ form.errors.from_address }}</p>
                    </div>

                    <div class="form-field">
                        <label class="form-field__label" for="em-name">Absendername <span class="form-field__optional">optional</span></label>
                        <input id="em-name" v-model="form.from_name" class="input" type="text" autocomplete="off" aria-describedby="em-name-error" :aria-invalid="form.errors.from_name ? 'true' : undefined">
                        <p id="em-name-error" class="form-field__error">{{ form.errors.from_name }}</p>
                    </div>
                </div>

                <div class="form-field">
                    <span class="form-field__label">Region</span>
                    <p class="em-fixed"><code>{{ region }}</code> – dieselbe wie beim Bucket.</p>
                </div>
            </section>

            <section class="adm-form__group" aria-labelledby="em-keys">
                <h2 id="em-keys" class="adm-form__heading">Zugang</h2>
                <p class="adm-form__note">Ein eigener Schlüssel nur für SES. Er wird verschlüsselt gespeichert und nie wieder angezeigt – nur seine letzten vier Zeichen.</p>

                <div class="form-field">
                    <label class="form-field__label" for="em-key">Zugriffsschlüssel (Access Key ID)</label>
                    <div v-if="!newKey" class="em-masked">
                        <output id="em-key" class="em-masked__value" aria-label="Gespeicherter Zugriffsschlüssel, nur die letzten vier Zeichen">{{ keyMasked }}</output>
                        <button class="btn btn--secondary btn--sm" type="button" @click="replaceKey">Neuen Schlüssel eintragen</button>
                    </div>
                    <input v-else id="em-key" v-model="form.access_key" class="input em-secret" type="text" autocomplete="off" spellcheck="false" aria-describedby="em-key-error" :aria-invalid="form.errors.access_key ? 'true' : undefined">
                    <p id="em-key-error" class="form-field__error">{{ form.errors.access_key }}</p>
                </div>

                <div class="form-field">
                    <label class="form-field__label" for="em-secret">Geheimer Schlüssel (Secret Access Key)</label>
                    <div v-if="!newSecret" class="em-masked">
                        <output id="em-secret" class="em-masked__value" aria-label="Gespeicherter geheimer Schlüssel, nur die letzten vier Zeichen">{{ secretMasked }}</output>
                        <button class="btn btn--secondary btn--sm" type="button" @click="replaceSecret">Neuen Schlüssel eintragen</button>
                    </div>
                    <input v-else id="em-secret" v-model="form.secret" class="input em-secret" type="password" autocomplete="new-password" spellcheck="false" aria-describedby="em-secret-help em-secret-error" :aria-invalid="form.errors.secret ? 'true' : undefined">
                    <!-- Only where a secret is stored: with none, an empty field keeps nothing. -->
                    <p v-if="newSecret && secretMasked !== null" id="em-secret-help" class="form-field__help">Leer lassen behält den gespeicherten Schlüssel.</p>
                    <p id="em-secret-error" class="form-field__error">{{ form.errors.secret }}</p>
                </div>
            </section>

            <section class="adm-form__group" aria-labelledby="em-test">
                <h2 id="em-test" class="adm-form__heading">Verbindung</h2>
                <p class="adm-form__note">Fragt SES nach dem Konto und der Absenderdomain. Verschickt nichts. Jedes Speichern prüft genauso.</p>

                <div>
                    <button class="btn btn--secondary" type="button" :aria-busy="testing ? 'true' : undefined" @click="testConnection">Verbindung testen</button>
                </div>

                <ol v-if="test" class="em-steps" aria-label="Ergebnis der letzten Prüfung">
                    <li v-for="step in test.steps" :key="step.step" class="em-step" :class="step.ok ? 'em-step--ok' : 'em-step--bad'">
                        <span class="adm-health__dot" :class="step.ok ? 'adm-health__dot--ok' : 'adm-health__dot--bad'" aria-hidden="true" />
                        <span class="em-step__name">{{ step.step }}<span class="visually-hidden">{{ step.ok ? ': geklappt' : ': offen' }}</span></span>
                        <span v-if="step.detail" class="em-step__detail">{{ step.detail }}</span>
                    </li>
                </ol>
            </section>

            <section class="adm-form__group" aria-labelledby="em-dns">
                <h2 id="em-dns" class="adm-form__heading">DNS-Einträge der Absenderdomain</h2>
                <p v-if="domain === null" class="adm-form__note">Erst mit einer Absenderadresse lässt sich sagen, welche Einträge die Domain braucht.</p>
                <template v-else>
                    <p class="adm-form__note">So, wie sie für {{ domain }} gerade im öffentlichen DNS stehen (alle zehn Minuten neu abgefragt). Einzutragen beim Anbieter der Domain.</p>
                    <div class="adm-panel">
                        <table class="adm-table">
                            <caption class="visually-hidden">Die DNS-Einträge, die Amazon SES für die Absenderdomain braucht</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Zweck</th>
                                    <th scope="col">Typ</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">Wert</th>
                                    <th scope="col">Stand</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="record in dns" :key="record.type + record.name">
                                    <td data-label="Zweck">{{ record.kind }}</td>
                                    <td data-label="Typ">{{ record.type }}</td>
                                    <td data-label="Name"><code class="em-dns__text">{{ record.name }}</code></td>
                                    <td data-label="Wert"><code class="em-dns__text">{{ record.value }}</code></td>
                                    <td data-label="Stand">
                                        <span class="em-dns__state" :class="record.found ? 'em-dns__state--ok' : 'em-dns__state--bad'">{{ record.found ? 'gefunden' : 'fehlt' }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </template>
            </section>

            <section class="adm-form__group" aria-labelledby="em-sns">
                <h2 id="em-sns" class="adm-form__heading">Unzustellbare Adressen und Beschwerden</h2>
                <p class="adm-form__note">
                    SES meldet sie über ein SNS-Thema an <code class="em-dns__text">{{ webhookUrl }}</code>. Der Shop schickt einer gemeldeten Adresse nichts mehr; SES führt zusätzlich eine eigene Sperrliste.
                </p>

                <div class="form-field">
                    <label class="form-field__label" for="em-topic">SNS-Thema (ARN) <span class="form-field__optional">optional</span></label>
                    <input id="em-topic" v-model="form.topic_arn" class="input" type="text" autocomplete="off" spellcheck="false" aria-describedby="em-topic-help em-topic-error" :aria-invalid="form.errors.topic_arn ? 'true' : undefined">
                    <p id="em-topic-help" class="form-field__help">Nur Meldungen dieses Themas nimmt der Shop an. Leer lassen heißt: Er nimmt keine an.</p>
                    <p id="em-topic-error" class="form-field__error">{{ form.errors.topic_arn }}</p>
                </div>

                <!-- Inside the settings form: no form of its own, and Enter searches rather than saves the settings. -->
                <div v-if="blockedSearchShown" class="form-field em-blocked-search" role="search">
                    <label class="form-field__label" for="em-blocked-q">Gesperrte Adresse suchen</label>
                    <div class="em-blocked-search__row">
                        <input id="em-blocked-q" v-model="blockedQuery" class="input" type="search" maxlength="190" autocomplete="off" spellcheck="false" placeholder="Adresse oder ein Teil davon" @keydown.enter.prevent="findBlocked">
                        <button class="btn btn--secondary" type="button" @click="findBlocked">Suchen</button>
                    </div>
                </div>
                <p v-if="blockedNote" class="adm-form__note em-blocked-note" role="status">{{ blockedNote }}</p>

                <p v-if="!(suppressionsTotal ?? suppressions.length)" class="adm-form__note">Keine Adresse gesperrt.</p>
                <div v-else-if="suppressions.length" class="adm-panel">
                    <table class="adm-table">
                        <caption class="visually-hidden">Gesperrte Adressen</caption>
                        <thead>
                            <tr>
                                <th scope="col">Adresse</th>
                                <th scope="col">Grund</th>
                                <th scope="col">Gemeldet</th>
                                <th scope="col"><span class="visually-hidden">Aktion</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in suppressions" :key="row.id">
                                <td data-label="Adresse">{{ row.email }}</td>
                                <td data-label="Grund">{{ row.reason }}<template v-if="row.detail"> ({{ row.detail }})</template></td>
                                <td data-label="Gemeldet">{{ row.at }}</td>
                                <td data-label="Aktion">
                                    <button class="btn btn--secondary btn--sm" type="button" :aria-busy="releasing === row.id ? 'true' : undefined" @click="askRelease(row)">Sperre aufheben</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </form>

        <AdminSaveBar :editor="editor" />

        <AdminConfirm
            v-model:open="liftOpen"
            :title="`Sperre für ${lifting?.email ?? ''} aufheben?`"
            :body="liftBody"
            confirm-label="Sperre aufheben"
            :busy="releasing !== null"
            @confirm="release"
        />
    </AdminPage>
</template>

<style scoped>
.em-blocked-search__row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.em-blocked-search__row .input {
    flex: 1 1 calc(24 * var(--ch-text));
    max-width: calc(40 * var(--ch-text));
}

.em-masked {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
}

.em-masked__value,
.em-secret {
    font-variant-numeric: tabular-nums;
}

.em-masked__value {
    color: var(--c-ink-2);
    letter-spacing: 0.04em;
}

.em-fixed {
    margin: 0;
    color: var(--c-ink-2);
}

.em-steps {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.em-step {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.em-step--ok .em-step__name {
    color: var(--c-ok);
}

.em-step--bad .em-step__name {
    color: var(--c-bad);
    font-weight: 600;
}

.em-step__detail {
    grid-column: 2;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

.em-dns__text {
    overflow-wrap: anywhere;
}

.em-dns__state--ok {
    color: var(--c-ok);
}

.em-dns__state--bad {
    color: var(--c-bad);
    font-weight: 600;
}
</style>
