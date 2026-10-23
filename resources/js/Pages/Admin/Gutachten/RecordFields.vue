<script setup lang="ts">
/**
 * The record's shape beyond its number (the corrections memo §4): a Nachtrag's base — one of ours, or the
 * number of one we do not hold — and page 1's header: Anlage, Prüfbericht-Nr., Ausfertigung,
 * Benennungsnummer, Prüfort, Prüfdatum, Stand, and „gültig ab Fertigungsdatum“ (a month).
 *
 * The header is folded away while it is empty: most documents are entered without it first. A Nachtrag
 * without its base in our hands is said where it is chosen, as the record, the Abdeckung and the shop
 * will say it. How the document gives its tyres' index stays unfolded: the release asks for it (D-277).
 */

import { computed, onMounted, ref, watch } from 'vue'
import DateField from '../../../Components/Admin/DateField.vue'
import DocumentSelect from '../../../Components/Admin/DocumentSelect.vue'
import type { RecordShape } from '../../../types/admin/gutachten'

const props = defineProps<{
    kind: string
    errors: Record<string, string | undefined>
    /** The documents a Nachtrag may supplement. */
    supplementable: { value: number; label: string }[]
    idPrefix: string
}>()

const shape = defineModel<RecordShape>('shape', { required: true })

function id(name: string): string {
    return `${props.idPrefix}-${name}`
}

function err(key: string): string {
    return props.errors[key] ?? ''
}

const HEADER = ['annex', 'test_report_number', 'copy_number', 'designation_number', 'test_site', 'test_date', 'revision_date', 'valid_from_production', 'papers_correction', 'missing_annexes'] as const

/* Unfolded when anything in it is filled, or refused — opened by the page, never closed by it: a field
   emptied while typing does not fold the section away under the cursor (B-01). */
const more = ref<HTMLDetailsElement | null>(null)
const hasHeader = computed(() => HEADER.some((key) => shape.value[key] !== ''))
const refused = computed(() => HEADER.some((key) => Boolean(props.errors[key])))

function unfold(): void {
    if (more.value) {
        more.value.open = true
    }
}

onMounted(() => {
    if (hasHeader.value || refused.value) {
        unfold()
    }
})

watch(refused, (value) => {
    if (value) {
        unfold()
    }
}, { flush: 'pre' })
</script>

<template>
    <div class="rsf">
        <div v-if="kind === 'NACHTRAG'" class="form-field">
            <label class="form-field__label" :for="id('base')">Nachtrag zu</label>
            <DocumentSelect
                :id="id('base')"
                v-model="shape.supplement_to_id"
                :options="supplementable"
                none-label="Einem Gutachten, das uns nicht vorliegt"
                :invalid="Boolean(err('supplement_to_id'))"
                :describedby="`${id('base')}-help ${id('base')}-err`"
            />
            <div v-if="shape.supplement_to_id === null" class="form-field rsf-base-number">
                <label class="form-field__label" :for="id('base-number')">Nummer des Grundgutachtens</label>
                <input
                    :id="id('base-number')"
                    v-model="shape.supplement_to_number"
                    class="input rsf-short"
                    type="text"
                    maxlength="64"
                    spellcheck="false"
                    placeholder="z. B. ABE 53841"
                    :aria-invalid="err('supplement_to_number') ? 'true' : undefined"
                    :aria-describedby="`${id('base')}-help ${id('base')}-err`"
                >
            </div>
            <p :id="`${id('base')}-help`" class="form-field__help">
                Liegt das Grundgutachten nicht vor, sagen der Datensatz, die Abdeckung und der Shop: Dieser Nachtrag allein ist nicht die ganze Freigabe.
            </p>
            <p :id="`${id('base')}-err`" class="form-field__error">{{ err('supplement_to_id') || err('supplement_to_number') }}</p>
        </div>

        <!-- D-277: read off the document, asked before release — it decides whether a car's top speed is needed. -->
        <fieldset class="rsf-group">
            <legend class="form-field__label">Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol der Reifen an?</legend>
            <label class="check">
                <input :id="id('index-document')" v-model="shape.tyre_index_source" type="radio" :name="id('index')" value="document" :aria-describedby="`${id('index')}-help ${id('index')}-err`">
                <span>Bei jeder Reifengröße, etwa 245/35 R19 93Y</span>
            </label>
            <label class="check">
                <input v-model="shape.tyre_index_source" type="radio" :name="id('index')" value="papers" :aria-describedby="`${id('index')}-help ${id('index')}-err`">
                <span>Mit einem Verweis auf die Fahrzeugpapiere, etwa „Der erforderliche Geschwindigkeits-/Lastindex ist den Fahrzeugpapieren zu entnehmen.“</span>
            </label>
            <label class="check">
                <input v-model="shape.tyre_index_source" type="radio" :name="id('index')" value="table" :aria-describedby="`${id('index')}-help ${id('index')}-err`">
                <span>In einer Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit, etwa 210 bis 300&nbsp;km/h für V, W und Y</span>
            </label>
            <p :id="`${id('index')}-help`" class="form-field__help">
                Steht im Verwendungsbereich oder in den Auflagen. Ohne Antwort ist keine Freigabe möglich. Druckt das Gutachten eine solche Tabelle, wähl die Tabelle – auch wenn es zusätzlich auf die Fahrzeugpapiere verweist. Steht das Geschwindigkeitssymbol nur bei manchen Größen, wähl den Verweis auf die Fahrzeugpapiere.
            </p>
            <p :id="`${id('index')}-err`" class="form-field__error">{{ err('tyre_index_source') }}</p>
        </fieldset>

        <details ref="more" class="rsf-more">
            <summary class="rsf-more__summary">Weitere Angaben von Seite 1</summary>
            <div class="rsf-pair">
                <div class="form-field">
                    <label class="form-field__label" :for="id('annex')">Anlage</label>
                    <input :id="id('annex')" v-model="shape.annex" class="input" type="text" maxlength="64" :aria-invalid="err('annex') ? 'true' : undefined" :aria-describedby="`${id('annex')}-err`">
                    <p :id="`${id('annex')}-err`" class="form-field__error">{{ err('annex') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('report')">Prüfbericht-Nr.</label>
                    <input :id="id('report')" v-model="shape.test_report_number" class="input" type="text" maxlength="64" spellcheck="false" :aria-invalid="err('test_report_number') ? 'true' : undefined" :aria-describedby="`${id('report')}-err`">
                    <p :id="`${id('report')}-err`" class="form-field__error">{{ err('test_report_number') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('copy')">Ausfertigung</label>
                    <input :id="id('copy')" v-model="shape.copy_number" class="input" type="text" maxlength="32" :aria-invalid="err('copy_number') ? 'true' : undefined" :aria-describedby="`${id('copy')}-err`">
                    <p :id="`${id('copy')}-err`" class="form-field__error">{{ err('copy_number') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('designation')">Benennungsnummer</label>
                    <input :id="id('designation')" v-model="shape.designation_number" class="input" type="text" maxlength="64" spellcheck="false" :aria-invalid="err('designation_number') ? 'true' : undefined" :aria-describedby="`${id('designation')}-err`">
                    <p :id="`${id('designation')}-err`" class="form-field__error">{{ err('designation_number') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('site')">Prüfort</label>
                    <input :id="id('site')" v-model="shape.test_site" class="input" type="text" maxlength="120" :aria-invalid="err('test_site') ? 'true' : undefined" :aria-describedby="`${id('site')}-err`">
                    <p :id="`${id('site')}-err`" class="form-field__error">{{ err('test_site') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('test-date')">Prüfdatum</label>
                    <DateField :id="id('test-date')" v-model="shape.test_date" :invalid="Boolean(err('test_date'))" :describedby="`${id('test-date')}-err`" />
                    <p :id="`${id('test-date')}-err`" class="form-field__error">{{ err('test_date') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('revision')">Stand</label>
                    <DateField :id="id('revision')" v-model="shape.revision_date" :invalid="Boolean(err('revision_date'))" :describedby="`${id('revision')}-err`" />
                    <p :id="`${id('revision')}-err`" class="form-field__error">{{ err('revision_date') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('production')">Gültig ab Fertigungsdatum</label>
                    <input
                        :id="id('production')"
                        v-model="shape.valid_from_production"
                        class="input rsf-short"
                        type="text"
                        maxlength="7"
                        inputmode="decimal"
                        placeholder="03.2021"
                        :aria-invalid="err('valid_from_production') ? 'true' : undefined"
                        :aria-describedby="`${id('production')}-help ${id('production')}-err`"
                    >
                    <p :id="`${id('production')}-help`" class="form-field__help">Monat und Jahr. Eine Felge, die davor gefertigt wurde, deckt das Dokument nicht – der Shop sagt das dazu.</p>
                    <p :id="`${id('production')}-err`" class="form-field__error">{{ err('valid_from_production') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('papers')">Berichtigung der Fahrzeugpapiere</label>
                    <select
                        :id="id('papers')"
                        v-model="shape.papers_correction"
                        class="input"
                        :aria-invalid="err('papers_correction') ? 'true' : undefined"
                        :aria-describedby="`${id('papers')}-help ${id('papers')}-err`"
                    >
                        <option value="">Steht nicht im Dokument</option>
                        <option value="not_required">Nicht erforderlich (§&nbsp;15 FZV)</option>
                        <option value="required">Erforderlich</option>
                    </select>
                    <p :id="`${id('papers')}-help`" class="form-field__help">
                        Was das Dokument selbst sagt, etwa Punkt 10 der ABE 53841. „Nicht erforderlich“ sieht der Kunde als eigene Zeile. Ein Nachtrag ohne eigene Angabe übernimmt es, sobald sein Grundgutachten freigegeben ist.
                    </p>
                    <p :id="`${id('papers')}-err`" class="form-field__error">{{ err('papers_correction') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('annexes')">Fehlende Anlagen</label>
                    <input
                        :id="id('annexes')"
                        v-model="shape.missing_annexes"
                        class="input rsf-short"
                        type="text"
                        maxlength="64"
                        placeholder="z. B. 1–15"
                        :aria-invalid="err('missing_annexes') ? 'true' : undefined"
                        :aria-describedby="`${id('annexes')}-help ${id('annexes')}-err`"
                    >
                    <p :id="`${id('annexes')}-help`" class="form-field__help">
                        Anlagen des Verwendungsbereichs, die uns nicht vorliegen. Solange hier etwas steht, bekommt ein Fahrzeug, das die vorliegenden Seiten nicht nennen, im Shop den Hinweis, dass die Anlage noch nicht vorliegt – kein „Nicht freigegeben“.
                    </p>
                    <p :id="`${id('annexes')}-err`" class="form-field__error">{{ err('missing_annexes') }}</p>
                </div>
            </div>
        </details>
    </div>
</template>

<style scoped>
.rsf {
    display: grid;
    gap: var(--sp-16);
}

.rsf .form-field__error:empty {
    display: none;
}

.rsf-short {
    max-width: 24ch;
}

.rsf-base-number {
    margin-top: var(--sp-8);
}

.rsf-group {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    border: 0;
}

.rsf-more {
    display: grid;
    gap: var(--sp-12);
}

.rsf-more__summary {
    min-height: var(--adm-control-h);
    padding-block: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    cursor: pointer;
}

.rsf-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-16);
    margin-top: var(--sp-12);
}

@media (pointer: coarse) {
    .rsf-more__summary {
        min-height: var(--adm-control-h-lg);
    }
}

@media (max-width: 767px) {
    .rsf-pair {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
