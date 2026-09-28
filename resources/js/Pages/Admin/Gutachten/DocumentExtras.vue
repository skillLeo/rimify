<script setup lang="ts">
/**
 * What a document states beside its codes (the corrections memo §4): the Befestigungsmittel it names —
 * thread, seat, torque, shaft — the duties it always states (Pflichthinweise: the torque check after 50 km,
 * the TPMS note, the papers), and the millimetres of each „Nacharbeit mit Maßen“ code, per vehicle type and
 * axle. Entered as the PDF prints them while the document is a draft; the shop shows them with the verdict.
 *
 * Each list is read first: its form opens from its own button, and an entry is taken away from its „⋯“
 * menu after a confirm — as in the Auflagenverzeichnis above it.
 */

import { router, usePage } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import { computed, reactive, ref } from 'vue'
import AdminConfirm from '../../../Components/Admin/AdminConfirm.vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import { MENU_ROOM } from '../../../composables/admin/menu'
import { useFocusAfter } from '../../../composables/admin/useFocusAfter'
import { withUnit } from '../../../format'
import type { DocumentConditionView, FastenerView, NoticeView, ReworkView } from '../../../types/admin/gutachten'

type List = 'fastener' | 'notice' | 'rework'

const props = defineProps<{
    documentId: number
    fasteners: FastenerView[]
    notices: NoticeView[]
    reworks: ReworkView[]
    conditions: DocumentConditionView[]
    editable: boolean
    pageCount: number | null
}>()

const page = usePage()
const focus = useFocusAfter()
const base = computed(() => `/admin/gutachten/${props.documentId}`)
const busy = ref(false)
/** Which list's form is open, and which one's was sent last: its sentences, not another's. */
const open = ref<List | null>(null)
const sent = ref<List | null>(null)

const PATH: Record<List, string> = { fastener: 'befestigungsmittel', notice: 'hinweise', rework: 'nacharbeit' }
const FIRST: Record<List, string> = { fastener: 'dx-f-number', notice: 'dx-n-text-de', rework: 'dx-r-document-condition-id' }
const OPENER: Record<List, string> = { fastener: 'dx-f-open', notice: 'dx-n-open', rework: 'dx-r-open' }
const AXLE: Record<string, string> = { FRONT: 'Vorderachse', REAR: 'Hinterachse', ALL: 'Alle Achsen' }

/* Its own error bag: the Auflagenverzeichnis above uses the same field names (text_de, source_page). */
const BAG = 'angaben'

const bag = computed<Record<string, string>>(() => {
    const raw: unknown = (page.props.errors as Record<string, unknown> | undefined)?.[BAG]

    return raw !== null && typeof raw === 'object' ? (raw as Record<string, string>) : {}
})

function err(list: List, field: string): string {
    return sent.value === list ? (bag.value[field] ?? '') : ''
}

/** The codes whose millimetres are entered here. */
const reworkCodes = computed(() => props.conditions.filter((c) => c.kind === 'nacharbeitsprofil'))

const blankFastener = () => ({ number: '', thread: '', seat: '', torque_nm: '' as number | '', shaft_length_mm: '' as number | '', article_number: '', vehicle_types: '' })
const blankNotice = () => ({ text_de: '', source_page: '' as number | '' })
const blankRework = () => ({ document_condition_id: null as number | null, vehicle_type: '', axle: 'ALL', from_mm: '', to_mm: '', flare_mm: '' })

const fastener = reactive(blankFastener())
const notice = reactive(blankNotice())
const rework = reactive(blankRework())

function openForm(list: List): void {
    open.value = list
    sent.value = null
    focus.request(FIRST[list], { scroll: true })
}

function closeForm(list: List): void {
    open.value = null
    sent.value = null
    focus.request(OPENER[list])
}

function add(list: List): void {
    if (busy.value) {
        return
    }

    const data = { fastener, notice, rework }[list] as Record<string, string | number | null>

    busy.value = true
    sent.value = list
    router.post(`${base.value}/${PATH[list]}`, { ...data }, {
        preserveScroll: true,
        preserveState: true,
        errorBag: BAG,
        onSuccess: () => {
            sent.value = null
            Object.assign(fastener, list === 'fastener' ? blankFastener() : {})
            Object.assign(notice, list === 'notice' ? blankNotice() : {})
            Object.assign(rework, list === 'rework' ? { ...blankRework(), document_condition_id: rework.document_condition_id } : {})
            // The form stays open for the next entry of the same list: a document lists several.
            focus.request(FIRST[list])
        },
        onError: (refused: Record<string, string>) => {
            const field = Object.keys(refused)[0] ?? ''
            focus.request([`dx-${list[0]}-${field.replace(/_/g, '-')}`, FIRST[list]])
        },
        onFinish: () => {
            busy.value = false
        },
    })
}

/* ── Taking one away: from its menu, after a confirm ───────────────────────── */

const removing = ref<{ list: List; id: number; label: string } | null>(null)
const confirmOpen = computed({
    get: () => removing.value !== null,
    set: (value: boolean) => {
        if (!value) {
            removing.value = null
        }
    },
})

const TITLE: Record<List, string> = { fastener: 'Befestigungsmittel entfernen?', notice: 'Hinweis entfernen?', rework: 'Maß entfernen?' }

function remove(): void {
    const target = removing.value

    if (target === null || busy.value) {
        return
    }

    busy.value = true
    router.delete(`${base.value}/${PATH[target.list]}/${target.id}`, {
        preserveScroll: true,
        preserveState: true,
        errorBag: BAG,
        onFinish: () => {
            busy.value = false
            removing.value = null
            focus.request([OPENER[target.list], `dx-${target.list[0]}-h`])
        },
    })
}
</script>

<template>
    <div class="dx">
        <!-- ── Befestigungsmittel ─────────────────────────────── -->
        <section class="dx-list" aria-labelledby="dx-f-h">
            <h3 id="dx-f-h" class="dx-list__title" tabindex="-1">Befestigungsmittel</h3>
            <div v-if="fasteners.length" class="adm-panel">
                <table class="adm-table">
                    <caption class="visually-hidden">Befestigungsmittel dieses Gutachtens</caption>
                    <thead>
                        <tr>
                            <th scope="col">Nr.</th>
                            <th scope="col">Gewinde und Sitz</th>
                            <th scope="col" class="num">Anzugsmoment</th>
                            <th scope="col" class="num">Schaft</th>
                            <th scope="col">Für</th>
                            <th v-if="editable" scope="col"><span class="visually-hidden">Aktionen</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="f in fasteners" :key="f.id">
                            <td data-label="Nr."><span class="adm-table__key" translate="no">{{ f.number }}</span></td>
                            <td data-label="Gewinde und Sitz">
                                {{ f.thread }} · {{ f.seat }}
                                <span v-if="f.articleNumber" class="adm-table__sub">Artikel {{ f.articleNumber }}</span>
                            </td>
                            <td data-label="Anzugsmoment" class="num">{{ f.torqueNm === null ? '–' : withUnit(f.torqueNm, 'Nm') }}</td>
                            <td data-label="Schaft" class="num">{{ f.shaftLengthMm === null ? '–' : withUnit(f.shaftLengthMm, 'mm') }}</td>
                            <td data-label="Für">{{ f.vehicleTypes ?? 'Alle Fahrzeugtypen' }}</td>
                            <td v-if="editable" data-label="Aktionen" data-phone="menu">
                                <DropdownMenuRoot>
                                    <DropdownMenuTrigger :data-focus="`dx-f-more-${f.id}`" class="adm-iconbtn" :disabled="busy" :aria-label="`Aktionen für Befestigungsmittel ${f.number}`">
                                        <Icon name="more" :size="20" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuContent class="adm-menu" align="end" :side-offset="4" :collision-padding="MENU_ROOM" @close-auto-focus="focus.onMenuClose">
                                            <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="removing = { list: 'fastener', id: f.id, label: `${f.number} · ${f.thread}` }">
                                                <Icon name="delete" :size="20" />
                                                Entfernen
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuRoot>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p v-else class="adm-note">Keine eingetragen.</p>

            <div v-if="editable && open !== 'fastener'">
                <button id="dx-f-open" class="btn btn--secondary" type="button" :disabled="busy" @click="openForm('fastener')">
                    <Icon name="plus" :size="20" />
                    Befestigungsmittel hinzufügen
                </button>
            </div>
            <form v-if="editable && open === 'fastener'" class="dx-form" novalidate @submit.prevent="add('fastener')">
                <div class="dx-grid">
                    <div class="form-field">
                        <label class="form-field__label" for="dx-f-number">Nr.</label>
                        <input id="dx-f-number" v-model="fastener.number" class="input" type="text" maxlength="16" placeholder="S01" :aria-invalid="err('fastener', 'number') ? 'true' : undefined" aria-describedby="dx-f-number-err">
                        <p id="dx-f-number-err" class="form-field__error">{{ err('fastener', 'number') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="dx-f-thread">Gewinde</label>
                        <input id="dx-f-thread" v-model="fastener.thread" class="input" type="text" maxlength="32" placeholder="M14x1,25" :aria-invalid="err('fastener', 'thread') ? 'true' : undefined" aria-describedby="dx-f-thread-err">
                        <p id="dx-f-thread-err" class="form-field__error">{{ err('fastener', 'thread') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="dx-f-seat">Sitz</label>
                        <input id="dx-f-seat" v-model="fastener.seat" class="input" type="text" maxlength="48" placeholder="Kegelbund 60°" :aria-invalid="err('fastener', 'seat') ? 'true' : undefined" aria-describedby="dx-f-seat-err">
                        <p id="dx-f-seat-err" class="form-field__error">{{ err('fastener', 'seat') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="dx-f-torque-nm">Anzugsmoment (Nm)</label>
                        <input id="dx-f-torque-nm" v-model="fastener.torque_nm" class="input" type="text" maxlength="6" inputmode="numeric" :aria-invalid="err('fastener', 'torque_nm') ? 'true' : undefined" aria-describedby="dx-f-torque-nm-err">
                        <p id="dx-f-torque-nm-err" class="form-field__error">{{ err('fastener', 'torque_nm') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="dx-f-shaft-length-mm">Schaftlänge (mm)</label>
                        <input id="dx-f-shaft-length-mm" v-model="fastener.shaft_length_mm" class="input" type="text" maxlength="6" inputmode="numeric" :aria-invalid="err('fastener', 'shaft_length_mm') ? 'true' : undefined" aria-describedby="dx-f-shaft-length-mm-err">
                        <p id="dx-f-shaft-length-mm-err" class="form-field__error">{{ err('fastener', 'shaft_length_mm') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="dx-f-article-number">Artikelnummer <span class="dx-optional">(optional)</span></label>
                        <input id="dx-f-article-number" v-model="fastener.article_number" class="input" type="text" maxlength="64">
                    </div>
                    <div class="form-field dx-wide">
                        <label class="form-field__label" for="dx-f-vehicle-types">Für diese Fahrzeugtypen <span class="dx-optional">(optional, leer: alle)</span></label>
                        <input id="dx-f-vehicle-types" v-model="fastener.vehicle_types" class="input" type="text" maxlength="255" placeholder="3C, 4C">
                    </div>
                </div>
                <div class="dx-actions">
                    <button class="btn btn--primary" type="submit" :disabled="busy" :aria-busy="busy && sent === 'fastener' ? 'true' : undefined">Speichern</button>
                    <button class="btn btn--ghost" type="button" :disabled="busy" @click="closeForm('fastener')">Schließen</button>
                </div>
            </form>
        </section>

        <!-- ── Pflichthinweise ─────────────────────────────────── -->
        <section class="dx-list" aria-labelledby="dx-n-h">
            <h3 id="dx-n-h" class="dx-list__title" tabindex="-1">Pflichthinweise</h3>
            <p class="adm-note">Was das Gutachten immer sagt – etwa das Nachziehen der Radschrauben nach 50 km. Der Shop zeigt es bei jeder Freigabe.</p>
            <ul v-if="notices.length" class="dx-notices">
                <li v-for="n in notices" :key="n.id" class="dx-notice">
                    <span>{{ n.text }}<span v-if="n.page" class="dx-page"> · S. {{ n.page }}</span></span>
                    <DropdownMenuRoot v-if="editable">
                        <DropdownMenuTrigger :data-focus="`dx-n-more-${n.id}`" class="adm-iconbtn" :disabled="busy" aria-label="Aktionen für diesen Hinweis">
                            <Icon name="more" :size="20" />
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuContent class="adm-menu" align="end" :side-offset="4" :collision-padding="MENU_ROOM" @close-auto-focus="focus.onMenuClose">
                                <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="removing = { list: 'notice', id: n.id, label: n.text }">
                                    <Icon name="delete" :size="20" />
                                    Entfernen
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
                    </DropdownMenuRoot>
                </li>
            </ul>
            <div v-if="editable && open !== 'notice'">
                <button id="dx-n-open" class="btn btn--secondary" type="button" :disabled="busy" @click="openForm('notice')">
                    <Icon name="plus" :size="20" />
                    Hinweis hinzufügen
                </button>
            </div>
            <form v-if="editable && open === 'notice'" class="dx-form" novalidate @submit.prevent="add('notice')">
                <div class="form-field">
                    <label class="form-field__label" for="dx-n-text-de">Hinweis, als ganzer Satz</label>
                    <textarea id="dx-n-text-de" v-model="notice.text_de" class="input dx-area" rows="2" maxlength="1000" :aria-invalid="err('notice', 'text_de') ? 'true' : undefined" aria-describedby="dx-n-text-de-err" />
                    <p id="dx-n-text-de-err" class="form-field__error">{{ err('notice', 'text_de') }}</p>
                </div>
                <div class="form-field dx-narrow">
                    <label class="form-field__label" for="dx-n-source-page">Seite <span class="dx-optional">(optional)</span></label>
                    <input id="dx-n-source-page" v-model.number="notice.source_page" class="input" type="number" min="1" :max="pageCount ?? undefined" inputmode="numeric" :aria-invalid="err('notice', 'source_page') ? 'true' : undefined" aria-describedby="dx-n-source-page-err">
                    <p id="dx-n-source-page-err" class="form-field__error">{{ err('notice', 'source_page') }}</p>
                </div>
                <div class="dx-actions">
                    <button class="btn btn--primary" type="submit" :disabled="busy" :aria-busy="busy && sent === 'notice' ? 'true' : undefined">Speichern</button>
                    <button class="btn btn--ghost" type="button" :disabled="busy" @click="closeForm('notice')">Schließen</button>
                </div>
            </form>
        </section>

        <!-- ── Nacharbeit mit Maßen ───────────────────────────── -->
        <section v-if="reworkCodes.length || reworks.length" class="dx-list" aria-labelledby="dx-r-h">
            <h3 id="dx-r-h" class="dx-list__title" tabindex="-1">Nacharbeit mit Maßen</h3>
            <div v-if="reworks.length" class="adm-panel">
                <table class="adm-table">
                    <caption class="visually-hidden">Maße der Nacharbeit</caption>
                    <thead>
                        <tr>
                            <th scope="col">Code</th>
                            <th scope="col">Fahrzeugtyp</th>
                            <th scope="col">Achse</th>
                            <th scope="col">Maß</th>
                            <th v-if="editable" scope="col"><span class="visually-hidden">Aktionen</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in reworks" :key="r.id">
                            <td data-label="Code"><span class="adm-table__key" translate="no">{{ r.code }}</span></td>
                            <td data-label="Fahrzeugtyp">{{ r.vehicleType }}</td>
                            <td data-label="Achse">{{ AXLE[r.axle] }}</td>
                            <td data-label="Maß">
                                {{ r.measure }}
                                <span v-if="r.note" class="adm-table__sub">{{ r.note }}</span>
                            </td>
                            <td v-if="editable" data-label="Aktionen" data-phone="menu">
                                <DropdownMenuRoot>
                                    <DropdownMenuTrigger :data-focus="`dx-r-more-${r.id}`" class="adm-iconbtn" :disabled="busy" :aria-label="`Aktionen für das Maß ${r.code}, ${r.vehicleType}`">
                                        <Icon name="more" :size="20" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuContent class="adm-menu" align="end" :side-offset="4" :collision-padding="MENU_ROOM" @close-auto-focus="focus.onMenuClose">
                                            <DropdownMenuItem class="adm-menu__item adm-menu__item--danger" @select="removing = { list: 'rework', id: r.id, label: `${r.code} · ${r.vehicleType} · ${r.measure}` }">
                                                <Icon name="delete" :size="20" />
                                                Entfernen
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuRoot>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="editable && reworkCodes.length && open !== 'rework'">
                <button id="dx-r-open" class="btn btn--secondary" type="button" :disabled="busy" @click="openForm('rework')">
                    <Icon name="plus" :size="20" />
                    Maß hinzufügen
                </button>
            </div>
            <form v-if="editable && reworkCodes.length && open === 'rework'" class="dx-form" novalidate @submit.prevent="add('rework')">
                <div class="dx-grid">
                    <div class="form-field">
                        <label class="form-field__label" for="dx-r-document-condition-id">Code</label>
                        <select id="dx-r-document-condition-id" v-model="rework.document_condition_id" class="input" :aria-invalid="err('rework', 'document_condition_id') ? 'true' : undefined" aria-describedby="dx-r-document-condition-id-err">
                            <option :value="null" disabled>Bitte wählen</option>
                            <option v-for="c in reworkCodes" :key="c.id" :value="c.id">{{ c.code }}</option>
                        </select>
                        <p id="dx-r-document-condition-id-err" class="form-field__error">{{ err('rework', 'document_condition_id') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="dx-r-vehicle-type">Fahrzeugtyp</label>
                        <input id="dx-r-vehicle-type" v-model="rework.vehicle_type" class="input" type="text" maxlength="64" placeholder="3C" :aria-invalid="err('rework', 'vehicle_type') ? 'true' : undefined" aria-describedby="dx-r-vehicle-type-err">
                        <p id="dx-r-vehicle-type-err" class="form-field__error">{{ err('rework', 'vehicle_type') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="dx-r-axle">Achse</label>
                        <select id="dx-r-axle" v-model="rework.axle" class="input">
                            <option value="ALL">Alle Achsen</option>
                            <option value="FRONT">Vorderachse</option>
                            <option value="REAR">Hinterachse</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="dx-r-from-mm">Von (mm)</label>
                        <input id="dx-r-from-mm" v-model="rework.from_mm" class="input" type="text" inputmode="decimal" maxlength="6" :aria-invalid="err('rework', 'from_mm') ? 'true' : undefined" aria-describedby="dx-r-from-mm-err">
                        <p id="dx-r-from-mm-err" class="form-field__error">{{ err('rework', 'from_mm') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="dx-r-to-mm">Bis (mm)</label>
                        <input id="dx-r-to-mm" v-model="rework.to_mm" class="input" type="text" inputmode="decimal" maxlength="6" :aria-invalid="err('rework', 'to_mm') ? 'true' : undefined" aria-describedby="dx-r-to-mm-err">
                        <p id="dx-r-to-mm-err" class="form-field__error">{{ err('rework', 'to_mm') }}</p>
                    </div>
                    <div class="form-field">
                        <label class="form-field__label" for="dx-r-flare-mm">Aufweitung (mm)</label>
                        <input id="dx-r-flare-mm" v-model="rework.flare_mm" class="input" type="text" inputmode="decimal" maxlength="5" :aria-invalid="err('rework', 'flare_mm') ? 'true' : undefined" aria-describedby="dx-r-flare-mm-err">
                        <p id="dx-r-flare-mm-err" class="form-field__error">{{ err('rework', 'flare_mm') }}</p>
                    </div>
                </div>
                <div class="dx-actions">
                    <button class="btn btn--primary" type="submit" :disabled="busy" :aria-busy="busy && sent === 'rework' ? 'true' : undefined">Speichern</button>
                    <button class="btn btn--ghost" type="button" :disabled="busy" @click="closeForm('rework')">Schließen</button>
                </div>
            </form>
        </section>

        <AdminConfirm
            v-model:open="confirmOpen"
            :title="removing ? TITLE[removing.list] : ''"
            :body="removing ? `„${removing.label}“ wird aus diesem Gutachten entfernt. Das Protokoll hält fest, wer es war.` : ''"
            confirm-label="Entfernen"
            :busy="busy"
            @confirm="remove"
        />
    </div>
</template>

<style scoped>
.dx {
    display: grid;
    gap: var(--sp-24);
}

.dx-list {
    display: grid;
    gap: var(--sp-12);
}

.dx-list__title {
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    font-weight: 600;
}

.dx-form {
    display: grid;
    gap: var(--sp-12);
    max-width: var(--adm-form-max);
}

.dx-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--sp-12) var(--sp-16);
}

.dx-wide {
    grid-column: 1 / -1;
}

.dx-narrow {
    max-width: 16ch;
}

.dx-area {
    min-height: calc(var(--adm-control-h) * 2);
    resize: vertical;
}

.dx-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.dx-form .form-field__error:empty {
    display: none;
}

.dx-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.dx-notices {
    display: grid;
    gap: 0;
    max-width: var(--adm-form-max);
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--c-line);
}

.dx-notice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-12);
    padding-block: var(--sp-8);
    border-bottom: 1px solid var(--c-line);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.dx-page {
    color: var(--c-ink-3);
}

@media (max-width: 767px) {
    .dx-grid {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
