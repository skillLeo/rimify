<script setup lang="ts">
/**
 * Step 5, Freigeben (the brief §7): everything at a glance — one line per car group, gaps flagged, a click back to the
 * empty cell. What used to stand in two banners is asked here, where it is decided: the cars whose data has no
 * documented provenance, the codes nobody has described, how the paper gives load index and speed symbol, and whether
 * the whole paper is entered (D-227, three answers, no default). „Freigeben" goes through the release door as today: it
 * names what is still open, and an undescribed code is one of those things (Phase 0, difference 2).
 */

import { computed, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { PRINTED_ONLY, WHEELS, carCount, documented, kwRange, provenanceLabel, sizeName, type DemoCar } from '../gutachtenDemo'
import { cellDone, cellSummary, undescribedCodes, unreadableLines } from '../gutachtenSketch'
import { useSketch, type LiSource } from '../gutachtenStore'
import { readTyre } from '../tyreInput'
import CodeDefine from './CodeDefine.vue'

const store = useSketch()
const { state } = store

const describing = ref<string | null>(null)

const size = computed(() => {
    const wheel = WHEELS.find((w) => w.id === state.wheelId)

    return wheel?.sizes.find((s) => s.id === state.sizeId) ?? wheel?.sizes[0]
})

const groups = computed(() => store.chosenGroups())
const empty = computed(() => groups.value.filter((group) => !cellDone(store.cellOf(group.id))))
const codes = computed(() => undescribedCodes(groups.value.map((group) => store.cellOf(group.id)), state.codes))

const unproven = computed<DemoCar[]>(() => groups.value.flatMap((group) => store.carsOf(group)).filter((car) => !documented(car.provenance)))
const unconfirmed = computed(() => unproven.value.filter((car) => !state.checked.includes(car.id)))

/* The suggestion for load index and speed symbol, read from the tyres entered: never chosen for staff. */
const sizesEntered = computed(() =>
    groups.value.flatMap((group) => {
        const cell = store.cellOf(group.id)

        return cell.tyres.map((line) => line.text)
    }),
)
const withoutIndex = computed(() => sizesEntered.value.filter((text) => {
    const tyre = readTyre(text)

    return tyre === null || tyre.li === null || tyre.si === null
}).length)
const suggestion = computed<LiSource>(() => (sizesEntered.value.length > 0 && withoutIndex.value === 0 ? 'document' : 'papers'))

const LI_SOURCES: { value: LiSource; label: string }[] = [
    { value: 'document', label: 'Bei jeder Reifengröße' },
    { value: 'papers', label: 'Mit einem Verweis auf die Fahrzeugpapiere' },
    { value: 'table', label: 'In einer Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit' },
]

const blockers = computed(() => {
    const out: string[] = []

    if (state.number.trim() === '') {
        out.push('Die Nummer des Gutachtens fehlt (Schritt 1).')
    }

    if (groups.value.length === 0) {
        out.push('Keine Fahrzeuggruppe übernommen (Schritt 3).')
    }

    for (const group of groups.value.filter((g) => store.carsOf(g).length === 0)) {
        out.push(`${group.sales} (${group.type}) verknüpft kein Fahrzeug (Schritt 3).`)
    }

    const unreadable = groups.value.reduce((n, g) => n + unreadableLines(store.cellOf(g.id)).length, 0)

    if (unreadable) {
        out.push(`${unreadable === 1 ? 'Eine Reifenzeile ist' : `${unreadable} Reifenzeilen sind`} leer oder nicht lesbar (Schritt 4).`)
    }

    if (empty.value.length) {
        out.push(empty.value.length === 1 ? '1 Fahrzeuggruppe hat noch keine Reifen.' : `${empty.value.length} Fahrzeuggruppen haben noch keine Reifen.`)
    }

    if (codes.value.length) {
        out.push(`${codes.value.length === 1 ? 'Ein Code ist' : `${codes.value.length} Codes sind`} noch ohne Beschreibung: ${codes.value.join(', ')}.`)
    }

    if (unconfirmed.value.length) {
        out.push(`${unconfirmed.value.length === 1 ? 'Ein Fahrzeug hat' : `${unconfirmed.value.length} Fahrzeuge haben`} keine belegte Herkunft.`)
    }

    if (state.liSource === null) {
        out.push('Noch offen: wie das Gutachten Lastindex und Geschwindigkeitssymbol angibt.')
    }

    if (state.complete === null) {
        out.push('Noch offen: ob das Gutachten vollständig erfasst ist.')
    } else if (state.complete === 'teilweise' && state.missing.trim() === '') {
        out.push('Noch offen: was vom Gutachten noch nicht erfasst ist.')
    }

    return out
})

function jump(groupId: string): void {
    state.cell = groupId
    store.go(3)
}
</script>

<template>
    <section class="sk-step" aria-labelledby="sk-release-h">
        <template v-if="!state.released">
            <h2 id="sk-release-h" class="adm-section__title" tabindex="-1">Prüfen und freigeben</h2>
            <p class="adm-note">Alle Fahrzeuggruppen auf einen Blick. Lücken sind markiert; ein Klick führt zurück zum Eintragen.</p>

            <p v-if="empty.length" class="sk-gap">
                <Icon name="warning" :size="20" />
                {{ empty.length === 1 ? '1 Fahrzeuggruppe hat' : `${empty.length} Fahrzeuggruppen haben` }} noch keine Reifen.
                <button class="sk-link" type="button" @click="jump(empty[0]?.id ?? '')">Jetzt eintragen</button>
            </p>

            <div class="adm-panel sk-matrix">
                <table class="adm-table">
                    <caption class="visually-hidden">Fahrzeuggruppen und ihre Reifen</caption>
                    <thead>
                        <tr>
                            <th scope="col">Fahrzeuggruppe</th>
                            <th scope="col" class="num">Fahrzeuge</th>
                            <th scope="col">{{ size ? sizeName(size) : '' }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="group in groups" :key="group.id">
                            <td data-label="Fahrzeuggruppe"><span class="adm-table__key">{{ group.sales }} ({{ group.type }})</span><span class="adm-table__sub">{{ group.approvals.join(', ') }} · {{ kwRange(group.kwMin, group.kwMax) }}</span></td>
                            <td class="num" data-label="Fahrzeuge">{{ store.carsOf(group).length }}</td>
                            <td data-label="Reifen">
                                <button class="sk-cellbtn" :class="{ 'sk-cellbtn--empty': !cellDone(store.cellOf(group.id)) }" type="button" @click="jump(group.id)">
                                    {{ cellSummary(store.cellOf(group.id)) }}
                                    <span v-if="store.cellOf(group.id).copiedFrom" class="adm-tag adm-tag--neutral">kopiert von {{ store.cellOf(group.id).copiedFrom }}</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="sk-checks">
                <section v-if="unproven.length" class="sk-check" aria-labelledby="sk-prov-h">
                    <h3 id="sk-prov-h" class="sk-check__title">Fahrzeuge ohne belegte Herkunft</h3>
                    <p class="adm-note">Zur Freigabe müssen die Daten jedes Fahrzeugs aus einem Import oder aus einem Gutachten stammen oder von Hand geprüft sein.</p>
                    <ul class="sk-check__list">
                        <li v-for="car in unproven" :key="car.id" class="sk-check__item">
                            <span><strong>{{ car.name }}</strong> · HSN/TSN {{ car.hsn }}/{{ car.tsn }} · {{ provenanceLabel(car.provenance) }}</span>
                            <button v-if="!state.checked.includes(car.id)" class="btn btn--secondary" type="button" @click="state.checked.push(car.id)">Daten geprüft</button>
                            <span v-else class="sk-done"><Icon name="check" :size="16" /> geprüft</span>
                        </li>
                    </ul>
                </section>

                <section v-if="codes.length || describing" class="sk-check" aria-labelledby="sk-open-h">
                    <h3 id="sk-open-h" class="sk-check__title">Codes ohne Beschreibung</h3>
                    <p class="adm-note">Der Shop zeigt eine Auflage als ganzen Satz. Ohne Beschreibung hätte er keinen.</p>
                    <ul class="sk-check__list">
                        <li v-for="code in codes" :key="code" class="sk-check__item">
                            <span class="sk-code sk-code--open">{{ code }}</span>
                            <span class="sk-check__page">{{ PRINTED_ONLY[code] ? `im PDF auf Seite ${PRINTED_ONLY[code]?.page}` : '' }}</span>
                            <button v-if="describing !== code" class="btn btn--secondary" type="button" @click="describing = code">{{ code }} beschreiben</button>
                            <div v-else class="sk-check__form">
                                <CodeDefine :code="code" :id-prefix="`sk-release-${code}`" @done="describing = null" @cancel="describing = null" />
                            </div>
                        </li>
                    </ul>
                </section>

                <fieldset class="sk-fieldset sk-check">
                    <legend class="sk-check__title">Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol an?</legend>
                    <label v-for="option in LI_SOURCES" :key="option.value" class="check">
                        <input v-model="state.liSource" type="radio" name="sk-li-release" :value="option.value">
                        <span>{{ option.label }}<span v-if="option.value === suggestion" class="adm-tag adm-tag--neutral sk-suggest">Vorschlag</span></span>
                    </label>
                    <p class="form-field__help">
                        Vorschlag aus den eingetragenen Reifen: {{ withoutIndex === 0 ? 'Alle nennen Lastindex und Symbol.' : `${withoutIndex} von ${sizesEntered.length} Reifen ohne Lastindex oder Symbol.` }}
                        Entscheidend ist, was im Gutachten steht.
                    </p>
                </fieldset>

                <fieldset class="sk-fieldset sk-check">
                    <legend class="sk-check__title">Ist das Gutachten vollständig erfasst?</legend>
                    <label class="check">
                        <input v-model="state.complete" type="radio" name="sk-complete" value="ja" aria-describedby="sk-complete-ja">
                        <span>Ja, alle Zeilen des Gutachtens sind erfasst</span>
                    </label>
                    <p id="sk-complete-ja" class="form-field__help sk-check__then">Ein Fahrzeug, das hier nicht steht, ist im Shop dann „nicht freigegeben“.</p>
                    <label class="check">
                        <input v-model="state.complete" type="radio" name="sk-complete" value="teilweise" aria-describedby="sk-complete-teil">
                        <span>Noch nicht vollständig</span>
                    </label>
                    <p id="sk-complete-teil" class="form-field__help sk-check__then">Ein Fahrzeug, das hier nicht steht, ist im Shop dann „noch nicht bestätigt“.</p>
                    <div v-if="state.complete === 'teilweise'" class="form-field sk-check__missing">
                        <label class="form-field__label" for="sk-missing">Was fehlt noch?</label>
                        <input id="sk-missing" v-model="state.missing" class="input" type="text" maxlength="255" placeholder="z. B. Anlagen 1–15">
                    </div>
                    <label class="check">
                        <input v-model="state.complete" type="radio" name="sk-complete" value="unbekannt" aria-describedby="sk-complete-unb">
                        <span>Weiß ich nicht</span>
                    </label>
                    <p id="sk-complete-unb" class="form-field__help sk-check__then">Wie „Noch nicht vollständig“: Ein Fahrzeug, das hier nicht steht, ist „noch nicht bestätigt“.</p>
                </fieldset>
            </div>

            <div class="sk-release">
                <div v-if="blockers.length" class="sk-release__open" role="status">
                    <p class="sk-check__title">Noch offen vor der Freigabe</p>
                    <ul>
                        <li v-for="line in blockers" :key="line">{{ line }}</li>
                    </ul>
                </div>
                <div class="sk-actions">
                    <button class="btn btn--secondary sk-actions__left" type="button" @click="store.go(3)">Zurück</button>
                    <button class="btn btn--primary" type="button" :disabled="blockers.length > 0" @click="state.released = true">
                        <Icon name="publish" :size="20" />
                        Freigeben
                    </button>
                </div>
            </div>
        </template>

        <template v-else>
            <h2 id="sk-release-h" class="adm-section__title" tabindex="-1">Freigegeben</h2>
            <p class="adm-note">So sieht das Gutachten nach der Freigabe aus: die Codes kurz, ihr Text beim Darüberfahren mit der Maus. Ändern geht über eine neue Fassung; bis sie freigegeben ist, nutzt der Shop die alte.</p>

            <div class="adm-panel">
                <table class="adm-table sk-read">
                    <caption class="visually-hidden">Verwendungsbereich</caption>
                    <thead>
                        <tr>
                            <th scope="col">Fahrzeuggruppe</th>
                            <th scope="col">Reifen</th>
                            <th scope="col">Allgemeine Codes</th>
                            <th scope="col" class="num">Seite</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="group in groups" :key="group.id">
                            <td data-label="Fahrzeuggruppe"><span class="adm-table__key">{{ group.sales }} ({{ group.type }})</span><span class="adm-table__sub">{{ group.approvals.join(', ') }} · {{ kwRange(group.kwMin, group.kwMax) }} · {{ carCount(store.carsOf(group).length) }}</span></td>
                            <td data-label="Reifen">
                                <ul class="sk-read__tyres">
                                    <li v-for="line in store.cellOf(group.id).tyres" :key="line.id">
                                        <span class="sk-read__size">{{ line.text }}</span>
                                        <span v-if="line.kw" class="sk-count">{{ kwRange(line.kw.replace('-', '–')) }}</span>
                                        <span class="sk-codes"><span v-for="code in line.codes" :key="code" class="sk-code" :title="store.codeOf(code)?.text ?? ''">{{ code }}</span></span>
                                    </li>
                                    <li v-for="pair in store.cellOf(group.id).pairs" :key="pair.id">
                                        <span class="sk-read__size">vorne {{ pair.front }} · hinten {{ pair.rear }}</span>
                                        <span class="sk-codes"><span v-for="code in pair.codes" :key="code" class="sk-code" :title="store.codeOf(code)?.text ?? ''">{{ code }}</span></span>
                                    </li>
                                </ul>
                            </td>
                            <td data-label="Allgemeine Codes"><span class="sk-codes"><span v-for="code in store.cellOf(group.id).general" :key="code" class="sk-code" :title="store.codeOf(code)?.text ?? ''">{{ code }}</span></span></td>
                            <td class="num" data-label="Seite">{{ store.cellOf(group.id).page || '–' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="sk-actions">
                <button class="btn btn--secondary sk-actions__left" type="button" @click="state.released = false">Zurück zur Eingabe</button>
                <button class="btn btn--primary" type="button" @click="state.released = false; store.go(0)">
                    <Icon name="edit" :size="20" />
                    Neue Fassung anlegen
                </button>
            </div>
        </template>
    </section>
</template>

<style scoped>
.sk-gap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    margin: var(--sp-16) 0;
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-warn-tint);
    color: var(--c-ink);
}

.sk-matrix {
    margin-top: var(--sp-16);
}

.sk-cellbtn {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8);
    padding: var(--sp-4) var(--sp-8);
    border: 0;
    border-radius: var(--r-control);
    background: none;
    color: var(--c-blue);
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.sk-cellbtn--empty {
    background: var(--c-warn-tint);
    color: var(--c-ink);
    font-weight: 600;
}

.sk-checks {
    display: grid;
    gap: var(--sp-24);
    max-width: var(--adm-form-max);
    margin-top: var(--sp-32);
}

.sk-check {
    display: grid;
    gap: var(--sp-8);
}

.sk-check__title {
    margin: 0;
    font-weight: 600;
}

.sk-check__list {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.sk-check__item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-8) var(--sp-12);
    padding: var(--sp-8) 0;
    border-bottom: 1px solid var(--c-line);
}

.sk-check__list {
    border-top: 1px solid var(--c-line);
}

.sk-check__form {
    flex-basis: 100%;
}

.sk-check__page {
    flex: 1;
    color: var(--c-ink-3);
    font-size: var(--fs-small);
}

.sk-check__then {
    margin: calc(var(--sp-4) * -1) 0 var(--sp-4) var(--sp-24);
}

.sk-done {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
    color: var(--c-ok);
    font-weight: 600;
}

.sk-check__missing {
    margin-left: var(--sp-24);
}

.sk-suggest {
    margin-left: var(--sp-8);
}

.sk-release {
    margin-top: var(--sp-32);
}

.sk-release__open {
    max-width: var(--adm-form-max);
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
}

.sk-release__open ul {
    margin: var(--sp-8) 0 0;
    padding-left: var(--sp-20);
    list-style: disc;
}

.sk-read__tyres {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    list-style: none;
}

.sk-read__tyres li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-4) var(--sp-8);
}

.sk-read__size {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}
</style>
