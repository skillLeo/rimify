<script setup lang="ts">
/**
 * Gutachten › one document, to read: a released paper, or a draft for who may only look (a draft someone may edit opens the five
 * steps, Erfassung.vue). Its facts and PDF, its cars with their tyres — codes as short tags, the text on hover and in the
 * Auflagenverzeichnis, never the wall of repeated text the rows once printed (screen 11) — the preview of what the shop says, and
 * the way back: „Neue Fassung anlegen“.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, nextTick, ref, watch } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import AdminPage, { type AdminPageAction } from '../../../Components/Admin/AdminPage.vue'
import AdminLayout from '../../../Layouts/AdminLayout.vue'
import { decimal } from '../../../format'
import type { AdminGutachtenShowProps } from '../../../types/admin/gutachten'
import Auflagenverzeichnis from './Auflagenverzeichnis.vue'
import CountCard from './CountCard.vue'
import DeratingTable from './DeratingTable.vue'
import { deratingAbsent as absentLine, deratingShown as isDeratingShown } from './derating'
import DocumentExtras from './DocumentExtras.vue'
import PreviewSection from './Erfassung/PreviewSection.vue'
import ReleaseDialog from './ReleaseDialog.vue'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

interface ReadLine {
    id: number
    front: string
    rear: string
    kw: string | null
    codes: string[]
}

interface ReadCar {
    id: number
    car: string
    k: string | null
    wheel: string | null
    finish: string | null
    axle: string
    page: number | null
    lines: ReadLine[]
    codes: string[]
}

const props = defineProps<AdminGutachtenShowProps & { readView: ReadCar[]; carryFailed?: string | null }>()

const page = usePage()
const draft = computed(() => props.document.status === 'draft')

/** Every row of the document, across colours: what a release brings into the shop. */
const rowsTotal = computed(() => props.rowsTotal ?? 0)

const context = computed(() => {
    const cars = props.readView.length
    const said = cars === 1 ? '1 Fahrzeug' : `${decimal(cars, 0)} Fahrzeuge`

    return `${props.document.statusLabel} · ${said} · Fassung ${props.document.revision}`
})

function pageHref(n: number | null): string | null {
    return props.document.pdfUrl && n !== null ? `${props.document.pdfUrl}#page=${n}` : null
}

/* One code's text, on hover: the Auflagenverzeichnis below holds it whole. */
function codeHint(code: string): string {
    const entry = props.conditions.find((c) => c.code === code)

    return entry ? `${code} · ${entry.kindLabel}\n${entry.text}` : `${code}: im Auflagenverzeichnis nicht hinterlegt`
}

function lineText(line: ReadLine): string {
    if (line.front === '' || line.rear === '') {
        return line.front === '' ? `nur hinten ${line.rear}` : `nur vorne ${line.front}`
    }

    return line.front === line.rear ? line.front : `vorne ${line.front} · hinten ${line.rear}`
}

const releaseError = computed(() => ((page.props.errors ?? {}) as Record<string, string | undefined>).release ?? '')

/* ── Tragfähigkeit bei hoher Geschwindigkeit (his admin item 15, D-295) ──────── */

const deratingShown = computed(() => isDeratingShown(props.document.shape.tyre_index_source, props.derating.rows.length))
const deratingAbsent = computed(() => absentLine(props.document.shape.tyre_index_source, false))

const more = computed<AdminPageAction[]>(() => (props.document.pdfUrl ? [{ label: 'PDF öffnen', href: props.document.pdfUrl, external: true, icon: 'documents' }] : []))

/* ── Freigabe, for who may release and not edit ──────────────────────────────── */

const releaseOpen = ref(false)
/* „Ist alles erfasst?“ for a released document (D-227): answered once, read by the shop and the go-live check. */
const answerOpen = ref(false)

const releaseNote = computed(() => {
    if (rowsTotal.value === 0) {
        return 'Mit der Freigabe übernimmt der Shop die Angaben dieses Grundgutachtens für seine Nachträge. Eigene Zeilen hat es nicht.'
    }

    return rowsTotal.value === 1
        ? 'Mit der Freigabe gilt die Zeile sofort im Shop. Prüf sie vorher in der Vorschau unten.'
        : `Mit der Freigabe gelten alle ${decimal(rowsTotal.value, 0)} Zeilen auf einmal im Shop. Prüf sie vorher in der Vorschau unten.`
})

const releaseBody = computed(() => {
    const what = rowsTotal.value === 0
        ? 'Der Shop übernimmt danach die Angaben dieses Grundgutachtens für seine Nachträge.'
        : `${rowsTotal.value === 1 ? 'Die Zeile gilt' : `Alle ${decimal(rowsTotal.value, 0)} Zeilen gelten`} danach sofort im Shop.`

    return `${what} Angaben, Codes und Zeilen lassen sich dann nicht mehr ändern – eine Korrektur geht über „Neue Fassung anlegen“, und die neue Fassung ersetzt dieses Gutachten, sobald sie freigegeben ist.`
})

/* ── Neue Fassung (ADMIN-GEFUNDEN 510) ───────────────────────────────────────── */

const reviseOpen = ref(false)
const reviseBusy = ref(false)

function revise(): void {
    reviseBusy.value = true
    router.post(`/admin/gutachten/${props.document.id}/neue-fassung`, {}, {
        onFinish: () => {
            reviseBusy.value = false
            reviseOpen.value = false
        },
    })
}

/* The button that opened the dialog goes with the Freigabe: the keyboard lands on the document's new state. */
function focusState(): void {
    void nextTick(() => document.getElementById('gs-state-h')?.focus())
}

watch(
    () => props.document.status,
    (now, was) => {
        if (now === 'published' && was === 'draft') {
            focusState()
        }
    },
    { flush: 'post' },
)
</script>

<template>
    <AdminPage :title="document.label" :context="context" :more="more" :read-only="!can.edit && draft">
        <p v-if="carryFailed" class="adm-alert" role="alert">{{ carryFailed }}</p>

        <template v-if="can.release" #primary>
            <button class="btn btn--primary" type="button" :disabled="blockers.length > 0" @click="releaseOpen = true">
                <Icon name="publish" :size="20" />
                Freigeben
            </button>
        </template>
        <!-- The way back into a released document: a new revision, or the one already started (ADMIN-GEFUNDEN 510). -->
        <template v-else-if="document.status === 'published' && (revisionDraft || can.revise)" #primary>
            <a v-if="revisionDraft" class="btn btn--primary" :href="`/admin/gutachten/${revisionDraft.id}`">
                <Icon name="edit" :size="20" />
                Neue Fassung öffnen
            </a>
            <button v-else class="btn btn--primary" type="button" @click="reviseOpen = true">
                <Icon name="edit" :size="20" />
                Neue Fassung anlegen
            </button>
        </template>

        <!-- ── The state of the document ─────────────────────────────── -->
        <section class="gs-state" :class="{ 'gs-state--blocked': draft && blockers.length }" aria-labelledby="gs-state-h">
            <h2 id="gs-state-h" class="gs-state__title" tabindex="-1">
                <template v-if="draft && blockers.length">Noch nicht freigebbar</template>
                <template v-else-if="draft">Kann freigegeben werden</template>
                <template v-else>{{ document.statusLabel }}<template v-if="document.status === 'published' && document.validFrom"> seit {{ document.validFrom }}</template><template v-else-if="document.status !== 'published' && document.validTo"> seit {{ document.validTo }}</template></template>
            </h2>
            <ul v-if="draft && blockers.length" class="gs-state__list">
                <li v-for="line in blockers" :key="line">{{ line }}</li>
            </ul>
            <p v-else-if="draft" class="adm-note">{{ releaseNote }}</p>
            <p v-else-if="document.status === 'withdrawn'" class="adm-note">Dieses Dokument wurde zurückgezogen. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.</p>
            <p v-else-if="document.status === 'superseded'" class="adm-note">Eine neuere Fassung hat dieses Dokument ersetzt. Seine Zeilen sind nicht mehr im Shop; Bestellungen darauf bleiben erklärbar.</p>
            <p v-else-if="revisionDraft" class="adm-note">Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Fassung {{ revisionDraft.revision }} ist schon als Entwurf angelegt; sobald sie freigegeben ist, ersetzt sie diese Fassung.</p>
            <p v-else class="adm-note">Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Änderungen gehen über eine neue Fassung: Sie bringt alle Zeilen und Codes mit; sobald sie freigegeben ist, ersetzt sie diese Fassung.</p>
            <!-- D-227: a released document is read as partial until someone says what was entered — and the go-live check waits for it. -->
            <div v-if="document.status === 'published'" class="gs-complete" :class="{ 'gs-complete--open': !document.completeness }">
                <p class="adm-note">
                    <strong>Erfasst:</strong> {{ document.completenessLabel }}<template v-if="document.completenessBy || document.completenessAt"> · {{ [document.completenessBy, document.completenessAt].filter(Boolean).join(', ') }}</template>
                </p>
                <button v-if="can.answer" class="btn btn--secondary" type="button" @click="answerOpen = true">{{ document.completeness ? 'Antwort ändern' : 'Jetzt beantworten' }}</button>
            </div>
            <p v-if="openConflicts" class="adm-note">
                {{ openConflicts === 1 ? 'Eine Zeile widerspricht' : `${decimal(openConflicts, 0)} Zeilen widersprechen` }} einem anderen Gutachten. Bis unter
                <a href="/admin/konflikte">Konflikte</a> entschieden ist, sagt der Shop dort „Noch nicht bestätigt“.
            </p>
            <p v-if="releaseError" class="adm-alert" role="alert">{{ releaseError }}</p>
        </section>

        <!-- ── Facts ─────────────────────────────────────────────────── -->
        <section class="adm-section" aria-labelledby="gs-facts-h">
            <div class="adm-section__head">
                <h2 id="gs-facts-h" class="adm-section__title">Angaben</h2>
            </div>
            <dl class="adm-facts gs-facts">
                <div class="adm-facts__row"><dt>Art</dt><dd>{{ document.kindLabel }}<span v-if="document.demo" class="adm-tag adm-tag--neutral adm-demo">Demodaten</span></dd></div>
                <div v-if="document.kbaNumber" class="adm-facts__row"><dt>KBA-Nummer</dt><dd>{{ document.kbaNumber }}</dd></div>
                <div v-if="document.reportNumber" class="adm-facts__row"><dt>Gutachten-Nummer</dt><dd>{{ document.reportNumber }}</dd></div>
                <div v-if="document.approvalMark" class="adm-facts__row"><dt>Genehmigungszeichen</dt><dd>{{ document.approvalMark }}</dd></div>
                <div class="adm-facts__row"><dt>Aussteller</dt><dd>{{ document.issuer || '–' }}</dd></div>
                <div class="adm-facts__row"><dt>Ausgestellt am</dt><dd>{{ document.issuedOnLabel ?? '–' }}</dd></div>
                <div class="adm-facts__row"><dt>Seiten</dt><dd>{{ document.pageCount ?? '–' }}</dd></div>
                <div class="adm-facts__row"><dt>Fassung</dt><dd>{{ document.revision }}<template v-if="document.supersedesLabel"> · ersetzt {{ document.supersedesLabel }}</template></dd></div>
                <div v-if="document.supplementTo" class="adm-facts__row">
                    <dt>Nachtrag zu</dt>
                    <dd>
                        <a v-if="document.supplementTo.href" :href="document.supplementTo.href">{{ document.supplementTo.label }}</a>
                        <template v-else>{{ document.supplementTo.label }} – liegt uns nicht vor</template>
                        <span v-if="document.baseMissing" class="gs-sub">{{ document.baseMissing }}</span>
                    </dd>
                </div>
                <div v-for="entry in document.header" :key="entry.label" class="adm-facts__row"><dt>{{ entry.label }}</dt><dd>{{ entry.value }}</dd></div>
                <div v-if="document.scopeIncomplete" class="adm-facts__row">
                    <dt>Verwendungsbereich</dt>
                    <dd>{{ document.scopeIncomplete }}</dd>
                </div>
                <div class="adm-facts__row">
                    <dt>PDF</dt>
                    <dd>
                        <a v-if="document.pdfUrl" :href="document.pdfUrl" target="_blank" rel="noopener">PDF öffnen</a>
                        <template v-else-if="document.pdfMissing">Die Datei fehlt im Speicher. Lad das PDF über „Ändern“ neu hoch.</template>
                        <template v-else>Kein PDF hinterlegt</template>
                        <span v-for="twin in document.samePdf ?? []" :key="twin.href" class="gs-sub gs-same-pdf">
                            Dieselbe Datei liegt auch bei <a :href="twin.href">{{ twin.label }}</a> ({{ twin.status }}<template v-if="twin.demo">, Demodaten</template>).
                        </span>
                    </dd>
                </div>
            </dl>
        </section>

        <!-- ── The count of its Verwendungsbereich, from the PDF, before the rows (ADMIN-GEFUNDEN 511) ── -->
        <section v-if="draft || document.count" class="adm-section" aria-labelledby="gs-count-h">
            <div class="adm-section__head">
                <h2 id="gs-count-h" class="adm-section__title">Zählung</h2>
            </div>
            <CountCard :document-id="document.id" :stamp="stamps.document" :count="document.count ?? null" :editable="false" :page-count="document.pageCount" :rows="rowsTotal" />
        </section>

        <!-- ── Auflagenverzeichnis: the codes this document prints, with its own sentences ── -->
        <section class="adm-section" aria-labelledby="gs-conditions-h">
            <div class="adm-section__head">
                <h2 id="gs-conditions-h" class="adm-section__title">Auflagenverzeichnis</h2>
            </div>
            <p class="adm-note gs-lead">Die Zeilen nennen nur Codes. Was ein Code bedeutet, steht hier – so, wie dieses Gutachten ihn druckt.</p>
            <Auflagenverzeichnis
                :document-id="document.id"
                :conditions="conditions"
                :choices="choices"
                :unresolved="unresolved"
                :editable="false"
                :page-count="document.pageCount"
                :levels="levels"
                :levels-editable="can.levels === true"
                :level-floor-sentence="levelFloorSentence"
            />
        </section>

        <!-- ── What the document states beside its codes ─────────────── -->
        <section class="adm-section" aria-labelledby="gs-extras-h">
            <div class="adm-section__head">
                <h2 id="gs-extras-h" class="adm-section__title">Befestigung und Hinweise</h2>
            </div>
            <DocumentExtras :document-id="document.id" :fasteners="fasteners" :notices="notices" :reworks="reworks" :conditions="conditions" :editable="false" :page-count="document.pageCount" />
        </section>

        <!-- ── Its own table of tyre load at speed: whole where the document prints one, else one line (his item 15) ── -->
        <section v-if="deratingShown" class="adm-section" aria-labelledby="gs-derating-h">
            <div class="adm-section__head">
                <h2 id="gs-derating-h" class="adm-section__title">Tragfähigkeit bei hoher Geschwindigkeit</h2>
                <!-- A table the demo seed wrote carries the same tag as every other demo row. -->
                <span v-if="derating.seededFrom" class="adm-tag adm-tag--neutral">Demodaten</span>
            </div>
            <DeratingTable :document-id="document.id" :stamp="stamps.derating" :derating="derating" :editable="false" :page-count="document.pageCount" :required="false" />
        </section>
        <details v-else class="adm-section gs-fold">
            <summary class="gs-fold__summary">
                <h2 id="gs-derating-h" class="adm-section__title">Tragfähigkeit bei hoher Geschwindigkeit</h2>
                <span class="gs-fold__state">Keine Tabelle hinterlegt</span>
            </summary>
            <p class="adm-note">{{ deratingAbsent }}</p>
        </details>

        <!-- ── Its cars, each with its tyres: short tags, the text on hover and above ── -->
        <section class="adm-section" aria-labelledby="gs-rows-h">
            <div class="adm-section__head">
                <h2 id="gs-rows-h" class="adm-section__title" tabindex="-1">Fahrzeuge und Reifen</h2>
            </div>

            <p v-if="readView.length === 0" class="adm-note">Noch kein Fahrzeug.</p>

            <ul v-else class="gs-cars">
                <li v-for="car in readView" :key="car.id" class="gs-car">
                    <div class="gs-car__head">
                        <h3 class="gs-car__name">{{ car.car }}</h3>
                        <span v-if="car.finish" class="adm-tag adm-tag--neutral">nur {{ car.finish }}</span>
                        <span v-if="car.axle !== 'ALL'" class="adm-tag adm-tag--neutral">{{ car.axle === 'FRONT' ? 'nur Vorderachse' : 'nur Hinterachse' }}</span>
                        <a v-if="pageHref(car.page)" class="gs-car__page" :href="pageHref(car.page)!" target="_blank" rel="noopener">S. {{ car.page }}</a>
                        <span v-else-if="car.page" class="gs-car__page">S. {{ car.page }}</span>
                    </div>
                    <p class="gs-sub"><template v-if="car.k">Feld K {{ car.k }}</template><template v-if="car.k && car.wheel"> · </template><template v-if="car.wheel">{{ car.wheel }}</template></p>
                    <p v-if="car.lines.length === 0" class="gs-missing">Keine Reifengröße – im Shop nicht bestellbar</p>
                    <ul v-else class="gs-lines">
                        <li v-for="line in car.lines" :key="line.id" class="gs-readline">
                            <span class="gs-readline__tyres">{{ lineText(line) }}<template v-if="line.kw"> · {{ line.kw }} kW</template></span>
                            <span v-if="line.codes.length" class="gs-tags" translate="no">
                                <span v-for="code in line.codes" :key="code" class="gs-tag" :title="codeHint(code)">{{ code }}</span>
                            </span>
                        </li>
                    </ul>
                    <p v-if="car.codes.length" class="gs-general">
                        Allgemeine Codes:
                        <span class="gs-tags" translate="no"><span v-for="code in car.codes" :key="code" class="gs-tag" :title="codeHint(code)">{{ code }}</span></span>
                    </p>
                </li>
            </ul>
        </section>

        <PreviewSection />

        <ReleaseDialog v-if="can.release" v-model:open="releaseOpen" mode="release" :document="document" :rows="rowsTotal" :note="releaseBody" @done="focusState" />
        <ReleaseDialog v-if="can.answer" v-model:open="answerOpen" mode="answer" :document="document" :rows="rowsTotal" />

        <AdminConfirm
            v-if="can.revise"
            v-model:open="reviseOpen"
            title="Neue Fassung anlegen?"
            body="Die neue Fassung beginnt als Entwurf mit allen Angaben, Codes und Zeilen dieser Fassung. Im Shop gilt diese Fassung weiter, bis die neue freigegeben ist und sie ersetzt."
            confirm-label="Neue Fassung anlegen"
            :busy="reviseBusy"
            @confirm="revise"
        />
    </AdminPage>
</template>

<style scoped>
.gs-state {
    display: grid;
    gap: var(--sp-8);
    max-width: var(--adm-form-max);
    margin-bottom: var(--sp-32);
    padding: var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.gs-state--blocked {
    background: var(--c-warn-tint);
}

.gs-state__title {
    margin: 0;
    font-size: var(--fs-h4);
    line-height: var(--lh-h4);
}

.gs-state__list {
    margin: 0;
    padding-left: var(--sp-20);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.gs-complete {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8) var(--sp-16);
}

.gs-complete--open .adm-note {
    color: var(--c-warn);
}

.gs-state .adm-alert {
    margin: 0;
}

.gs-facts {
    max-width: var(--adm-form-max);
}

.gs-group__title {
    margin: 0 0 var(--sp-8);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
    overflow-wrap: anywhere;
}

.gs-sub {
    display: block;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

/* A code the document's list does not hold: the row is UNKNOWN until it does. */
.gs-undefined {
    color: var(--c-bad);
}

.gs-lead {
    margin-bottom: var(--sp-12);
}

/* A section with nothing to show folded to its heading and its state (his item 15): open, it says why. */
.gs-fold__summary {
    min-height: var(--adm-control-h);
    padding-block: var(--sp-8);
    cursor: pointer;
}

.gs-fold__summary .adm-section__title {
    display: inline;
}

.gs-fold__state {
    margin-left: var(--sp-12);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.gs-fold[open] .gs-fold__summary {
    margin-bottom: var(--sp-12);
}

.gs-missing {
    color: var(--c-ink-2);
}

/* „S. 2“ is a target of its own on a phone: 44 px. */
@media (max-width: 767px) {
    .gs-table td[data-label='Seite'] a {
        display: inline-flex;
        align-items: center;
        min-width: var(--adm-control-h-lg);
        min-height: var(--adm-control-h-lg);
    }
}

.gs-verdicts {
    display: grid;
    gap: 0;
    max-width: var(--adm-form-max);
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.gs-verdict__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8);
}

.gs-verdict__wheel {
    font-weight: 500;
}

.gs-verdict__ok {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.gs-verdict__groups {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.gs-verdict__line {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
}

.gs-cars {
    display: grid;
    gap: var(--sp-16);
    margin: 0;
    padding: 0;
    list-style: none;
}

.gs-car {
    display: grid;
    gap: var(--sp-8);
    padding-block: var(--sp-12);
    border-top: 1px solid var(--c-line);
}

.gs-car__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
}

.gs-car__name {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    overflow-wrap: anywhere;
}

.gs-car__page {
    margin-left: auto;
    font-size: var(--fs-small);
}

.gs-lines {
    display: grid;
    gap: var(--sp-4);
    margin: 0;
    padding: 0;
    list-style: none;
}

.gs-readline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-12);
}

.gs-readline__tyres {
    font-variant-numeric: tabular-nums;
}

.gs-tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: var(--sp-4);
}

.gs-tag {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding-inline: var(--sp-8);
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 600;
    white-space: nowrap;
}

.gs-general {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: 0;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}
</style>
