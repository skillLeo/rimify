<script setup lang="ts">
/**
 * What one Verwendungsbereich entry says, typed as the Gutachten prints it: the tyre sizes (`225/40
 * R18`, per axle), the Auflagen from the Auflagen-Katalog with what this document adds to them, the
 * Eintragung, the page it stands on — and, folded away because most rows need none of it, the
 * document's own limits (build period, width and ET range, centre bore).
 *
 * Used for adding rows and for changing one; the page owns the values.
 */

import { computed, ref, watch } from 'vue'
import Icon from '../../../Components/Admin/AdminIcon.vue'
import DateField from '../../../Components/Admin/DateField.vue'
import type { AxleValue, ConditionOption, RowForm } from '../../../types/admin/gutachten'
import { emptySize, parseTyre, sentIndex } from './rows'

const props = defineProps<{
    conditions: ConditionOption[]
    errors: Record<string, string | undefined>
    idPrefix: string
    pageCount: number | null
}>()

const emit = defineEmits<{ 'sizes-changed': [] }>()

const form = defineModel<RowForm>('form', { required: true })

/* A size is judged once its line is left, not from the first keystroke — or at once after a refusal. */
const left = ref(new Set<number>())

watch(
    () => props.errors,
    (errors) => {
        if (Object.keys(errors).length > 0) {
            left.value = new Set(form.value.tyre_sizes.map((_, index) => index))
        }
    }
)

function leave(index: number): void {
    left.value = new Set([...left.value, index])
}

const AXLES: { value: AxleValue; label: string }[] = [
    { value: 'ALL', label: 'Alle Achsen' },
    { value: 'FRONT', label: 'Vorderachse' },
    { value: 'REAR', label: 'Hinterachse' },
]

const LIMITS = ['build_from', 'build_to', 'width_min', 'width_max', 'et_min', 'et_max', 'centre_bore'] as const

/* Unfolded when the row has limits — and when one of them was refused, so the sentence is seen. */
const hasLimits = computed(() => LIMITS.some((key) => form.value[key] !== '') || LIMITS.some((key) => Boolean(props.errors[key])))

function id(name: string): string {
    return `${props.idPrefix}-${name}`
}

function err(key: string): string {
    return props.errors[key] ?? ''
}

function sizeError(index: number): string {
    const text = form.value.tyre_sizes[index]?.text ?? ''

    if (text.trim() !== '' && parseTyre(text) === null) {
        return left.value.has(index) ? 'Diese Reifengröße können wir nicht lesen. Schreib sie bitte so: 225/40 R18 oder 225/40 R18 92Y.' : ''
    }

    // The server counts only the sizes it was sent.
    const sent = sentIndex(form.value, index)

    return sent === null ? '' : (['width_mm', 'aspect', 'diameter', 'min_load_index', 'min_speed_symbol', 'axle'].map((f) => err(`tyre_sizes.${sent}.${f}`)).find(Boolean) ?? '')
}

function addSize(): void {
    const last = form.value.tyre_sizes[form.value.tyre_sizes.length - 1]
    form.value.tyre_sizes.push(emptySize(last?.axle ?? 'ALL'))
}

/* A removed line takes its sentences with it: the line now in its place was not what they were about. */
function removeSize(index: number): void {
    form.value.tyre_sizes.splice(index, 1)
    left.value = new Set([...left.value].filter((i) => i < index).concat([...left.value].filter((i) => i > index).map((i) => i - 1)))
    emit('sizes-changed')
}

function chosen(conditionId: number): boolean {
    return form.value.conditions.some((c) => c.id === conditionId)
}

function toggle(conditionId: number, on: boolean): void {
    if (on && !chosen(conditionId)) {
        form.value.conditions.push({ id: conditionId, note: '' })
    } else if (!on) {
        form.value.conditions = form.value.conditions.filter((c) => c.id !== conditionId)
    }
}

function noteOf(conditionId: number): { id: number; note: string } | undefined {
    return form.value.conditions.find((c) => c.id === conditionId)
}
</script>

<template>
    <div class="rf">
        <div class="rf-pair">
            <div class="form-field">
                <label class="form-field__label" :for="id('axle')">Achse</label>
                <select :id="id('axle')" v-model="form.axle" class="input" :aria-invalid="err('axle') ? 'true' : undefined" :aria-describedby="`${id('axle')}-err`">
                    <option v-for="axle in AXLES" :key="axle.value" :value="axle.value">{{ axle.label }}</option>
                </select>
                <p :id="`${id('axle')}-err`" class="form-field__error">{{ err('axle') }}</p>
            </div>
            <div class="form-field">
                <label class="form-field__label" :for="id('page')">Seite im Gutachten <span class="rf-optional">(optional)</span></label>
                <input
                    :id="id('page')"
                    v-model.number="form.source_page"
                    class="input"
                    type="number"
                    min="1"
                    :max="pageCount ?? undefined"
                    inputmode="numeric"
                    :aria-invalid="err('source_page') ? 'true' : undefined"
                    :aria-describedby="`${id('page')}-err`"
                >
                <p :id="`${id('page')}-err`" class="form-field__error">{{ err('source_page') }}</p>
            </div>
        </div>

        <fieldset class="rf-group">
            <legend class="form-field__label">Reifengrößen</legend>
            <p v-if="err('tyre_sizes')" class="form-field__error">{{ err('tyre_sizes') }}</p>
            <div v-for="(size, index) in form.tyre_sizes" :key="index" class="rf-size">
                <div class="form-field rf-size__text">
                    <label class="visually-hidden" :for="id(`size-${index}`)">Reifengröße {{ index + 1 }}</label>
                    <input
                        :id="id(`size-${index}`)"
                        v-model="size.text"
                        class="input"
                        type="text"
                        placeholder="225/40 R18"
                        spellcheck="false"
                        autocomplete="off"
                        @blur="leave(index)"
                        :aria-invalid="sizeError(index) ? 'true' : undefined"
                        :aria-describedby="`${id(`size-${index}`)}-err`"
                    >
                </div>
                <div class="form-field rf-size__axle">
                    <label class="visually-hidden" :for="id(`size-${index}-axle`)">Achse der Reifengröße {{ index + 1 }}</label>
                    <select :id="id(`size-${index}-axle`)" v-model="size.axle" class="input">
                        <option v-for="axle in AXLES" :key="axle.value" :value="axle.value">{{ axle.label }}</option>
                    </select>
                </div>
                <button v-if="form.tyre_sizes.length > 1" class="adm-iconbtn" type="button" :aria-label="`Reifengröße ${index + 1} entfernen`" @click="removeSize(index)">
                    <Icon name="close" :size="20" />
                </button>
                <p :id="`${id(`size-${index}`)}-err`" class="form-field__error rf-size__err">{{ sizeError(index) }}</p>
            </div>
            <p class="form-field__help">Nennt das Gutachten einen Mindest-Lastindex oder ein Geschwindigkeitssymbol, steht es hinter der Größe: 245/35 R19 93Y oder 245/35 R19 93.</p>
            <div>
                <button class="btn btn--ghost" type="button" @click="addSize">
                    <Icon name="plus" :size="20" />
                    Reifengröße hinzufügen
                </button>
            </div>
        </fieldset>

        <fieldset class="rf-group">
            <legend class="form-field__label">Auflagen</legend>
            <p v-if="conditions.length === 0" class="form-field__help">Der Auflagen-Katalog ist leer.</p>
            <div v-for="condition in conditions" :key="condition.id" class="rf-cond">
                <label class="rf-check">
                    <input type="checkbox" :checked="chosen(condition.id)" @change="toggle(condition.id, ($event.target as HTMLInputElement).checked)">
                    <span>{{ condition.text }}</span>
                </label>
                <div v-if="noteOf(condition.id)" class="form-field rf-cond__note">
                    <label class="form-field__label" :for="id(`cond-${condition.id}`)">Zusatz aus diesem Gutachten <span class="rf-optional">(optional)</span></label>
                    <input :id="id(`cond-${condition.id}`)" v-model="noteOf(condition.id)!.note" class="input" type="text" maxlength="300" placeholder="z. B. Nur an der Hinterachse.">
                </div>
            </div>
        </fieldset>

        <div class="rf-group">
            <label class="rf-check">
                <input v-model="form.requires_entry" type="checkbox" :aria-invalid="err('requires_entry') ? 'true' : undefined" :aria-describedby="`${id('entry-flag')}-err`">
                <span>Eintragung in die Fahrzeugpapiere erforderlich</span>
            </label>
            <p :id="`${id('entry-flag')}-err`" class="form-field__error">{{ err('requires_entry') }}</p>
            <div v-if="form.requires_entry" class="form-field">
                <label class="form-field__label" :for="id('entry')">Hinweis zur Eintragung <span class="rf-optional">(optional)</span></label>
                <input :id="id('entry')" v-model="form.entry_note" class="input" type="text" maxlength="500" placeholder="z. B. Abnahme nach § 19 Abs. 3 StVZO." :aria-invalid="err('entry_note') ? 'true' : undefined" :aria-describedby="`${id('entry')}-err`">
                <p :id="`${id('entry')}-err`" class="form-field__error">{{ err('entry_note') }}</p>
            </div>
        </div>

        <details class="rf-more" :open="hasLimits">
            <summary class="rf-more__summary">Grenzen aus dem Gutachten</summary>
            <p class="form-field__help">Nur ausfüllen, wenn das Gutachten sie für diese Zeile nennt. Leer heißt: keine eigene Grenze.</p>
            <div class="rf-pair">
                <div class="form-field">
                    <label class="form-field__label" :for="id('from')">Baujahr ab</label>
                    <DateField :id="id('from')" v-model="form.build_from" :invalid="Boolean(err('build_from'))" :describedby="`${id('from')}-err`" />
                    <p :id="`${id('from')}-err`" class="form-field__error">{{ err('build_from') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('to')">Baujahr bis</label>
                    <DateField :id="id('to')" v-model="form.build_to" :invalid="Boolean(err('build_to'))" :describedby="`${id('to')}-err`" />
                    <p :id="`${id('to')}-err`" class="form-field__error">{{ err('build_to') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('wmin')">Breite von (Zoll)</label>
                    <input :id="id('wmin')" v-model="form.width_min" class="input" type="text" inputmode="decimal" placeholder="8" :aria-invalid="err('width_min') ? 'true' : undefined" :aria-describedby="`${id('wmin')}-err`">
                    <p :id="`${id('wmin')}-err`" class="form-field__error">{{ err('width_min') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('wmax')">Breite bis (Zoll)</label>
                    <input :id="id('wmax')" v-model="form.width_max" class="input" type="text" inputmode="decimal" placeholder="9" :aria-invalid="err('width_max') ? 'true' : undefined" :aria-describedby="`${id('wmax')}-err`">
                    <p :id="`${id('wmax')}-err`" class="form-field__error">{{ err('width_max') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('emin')">ET von (mm)</label>
                    <input :id="id('emin')" v-model="form.et_min" class="input" type="text" inputmode="numeric" placeholder="30" :aria-invalid="err('et_min') ? 'true' : undefined" :aria-describedby="`${id('emin')}-err`">
                    <p :id="`${id('emin')}-err`" class="form-field__error">{{ err('et_min') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('emax')">ET bis (mm)</label>
                    <input :id="id('emax')" v-model="form.et_max" class="input" type="text" inputmode="numeric" placeholder="45" :aria-invalid="err('et_max') ? 'true' : undefined" :aria-describedby="`${id('emax')}-err`">
                    <p :id="`${id('emax')}-err`" class="form-field__error">{{ err('et_max') }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="id('bore')">Mittenlochbohrung laut Gutachten (mm)</label>
                    <input :id="id('bore')" v-model="form.centre_bore" class="input" type="text" inputmode="decimal" placeholder="66,6" :aria-invalid="err('centre_bore') ? 'true' : undefined" :aria-describedby="`${id('bore')}-err`">
                    <p :id="`${id('bore')}-err`" class="form-field__error">{{ err('centre_bore') }}</p>
                </div>
            </div>
        </details>
    </div>
</template>

<style scoped>
.rf {
    display: grid;
    gap: var(--sp-24);
}

.rf .form-field__error:empty {
    display: none;
}

.rf-optional {
    font-weight: 400;
    color: var(--c-ink-3);
}

.rf-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-16);
}

.rf-group {
    display: grid;
    gap: var(--sp-8);
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
}

.rf-group legend {
    margin-bottom: var(--sp-8);
    padding: 0;
}

.rf-size {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 14ch) auto;
    align-items: center;
    gap: var(--sp-8);
}

.rf-size__err {
    grid-column: 1 / -1;
}

.rf-cond {
    display: grid;
    gap: var(--sp-8);
}

.rf-cond__note {
    padding-left: var(--sp-32);
}

.rf-check {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-8);
    min-height: var(--adm-control-h);
    padding-block: var(--sp-4);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    cursor: pointer;
}

.rf-check input {
    flex: none;
    width: 20px;
    height: 20px;
    margin: 0;
    accent-color: var(--c-ink);
}

.rf-more {
    display: grid;
    gap: var(--sp-12);
}

.rf-more__summary {
    min-height: var(--adm-control-h);
    padding-block: var(--sp-8);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    font-weight: 500;
    cursor: pointer;
}

.rf-more[open] .rf-pair {
    margin-top: var(--sp-12);
}

/* A finger needs the larger target. */
@media (pointer: coarse) {
    .rf-more__summary {
        min-height: var(--adm-control-h-lg);
    }
}

@media (max-width: 767px) {
    .rf-pair {
        grid-template-columns: minmax(0, 1fr);
    }

    .rf-size {
        grid-template-columns: minmax(0, 1fr) auto;
    }

    .rf-size__axle {
        grid-column: 1;
    }

    .rf-check {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
