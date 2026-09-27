<script setup lang="ts">
/**
 * The sizes of one Felge as a table of fields: one row per size, typed the German way (`8,5`, `66,6`,
 * `189,00`). A size an approval document names keeps its measurements and its finish — they are what
 * the Gutachten approves — so those are shown as plain figures, not fields, and the row cannot be
 * removed; price, stock and SKU stay open (WheelEditor).
 *
 * A row's refusals are listed under the table, each field pointing at its row's sentence. Below 768 px
 * each row is a card of labelled fields (the admin table's own pattern).
 */

import Icon from '../../../Components/Admin/AdminIcon.vue'
import type { FinishForm, SizeDocument, SizeForm } from '../../../types/admin/felgen'

const props = defineProps<{
    finishes: FinishForm[]
    documents: Record<string, SizeDocument[]>
    /** Ids of the sizes some fitment row names. */
    locked: number[]
    errors: Record<string, string | undefined>
    readonly: boolean
    boltHoles: number[]
}>()

const sizes = defineModel<SizeForm[]>('sizes', { required: true })

const emit = defineEmits<{ remove: [index: number] }>()

const FIELDS = ['finish', 'diameter', 'width', 'et', 'bolt_holes', 'bolt_circle', 'bore', 'sku', 'ean', 'kba', 'price', 'stock', 'weight_g']

function isLocked(size: SizeForm): boolean {
    return size.id !== null && props.locked.includes(size.id)
}

function err(index: number, field: string): string {
    return props.errors[`configs.${index}.${field}`] ?? ''
}

function rowError(index: number): string {
    return FIELDS.map((field) => err(index, field))
        .filter(Boolean)
        .join(' ')
}

function docs(size: SizeForm): SizeDocument[] {
    return size.id === null ? [] : (props.documents[String(size.id)] ?? [])
}

function finishName(key: string): string {
    return props.finishes.find((finish) => finish.key === key)?.name ?? '–'
}

function id(index: number, field: string): string {
    return `fe-size-${index}-${field}`
}

/** Every field of a row names the row's refusal, so a screen reader hears it on the field. */
function describedBy(index: number): string | undefined {
    return rowError(index) ? `fe-size-${index}-err` : undefined
}
</script>

<template>
    <div class="adm-panel fe-sizes">
        <table class="adm-table fe-sizes__table">
            <caption class="visually-hidden">Größen dieser Felge</caption>
            <thead>
                <tr>
                    <th scope="col">Ausführung</th>
                    <th scope="col">Ø Zoll</th>
                    <th scope="col">Breite Zoll</th>
                    <th scope="col">ET mm</th>
                    <th scope="col">Lochzahl</th>
                    <th scope="col">Lochkreis mm</th>
                    <th scope="col">MLB mm</th>
                    <th scope="col">SKU</th>
                    <th scope="col" class="num">Preis €</th>
                    <th scope="col" class="num">Bestand</th>
                    <th scope="col">Freigaben</th>
                    <th v-if="!readonly" scope="col"><span class="visually-hidden">Entfernen</span></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(size, index) in sizes" :key="size.key" :class="{ 'fe-sizes__row--bad': rowError(index) }">
                    <!-- A size a Gutachten names: its measurements as figures, never as fields. -->
                    <template v-if="isLocked(size) || readonly">
                        <td data-label="Ausführung"><span class="fe-fixed">{{ finishName(size.finish) }}</span></td>
                        <td data-label="Ø Zoll" class="fe-fixed">{{ size.diameter }}</td>
                        <td data-label="Breite Zoll" class="fe-fixed">{{ size.width }}</td>
                        <td data-label="ET mm" class="fe-fixed">{{ size.et }}</td>
                        <td data-label="Lochzahl" class="fe-fixed">{{ size.bolt_holes }}</td>
                        <td data-label="Lochkreis mm" class="fe-fixed">{{ size.bolt_circle }}</td>
                        <td data-label="MLB mm" class="fe-fixed">{{ size.bore }}</td>
                    </template>
                    <template v-else>
                        <td data-label="Ausführung">
                            <label class="visually-hidden" :for="id(index, 'finish')">Ausführung, Zeile {{ index + 1 }}</label>
                            <select :id="id(index, 'finish')" v-model="size.finish" class="input fe-in fe-in--finish" :aria-invalid="err(index, 'finish') ? 'true' : undefined" :aria-describedby="describedBy(index)">
                                <option v-for="finish in finishes" :key="finish.key" :value="finish.key">{{ finish.name || 'Neue Ausführung' }}</option>
                            </select>
                        </td>
                        <td data-label="Ø Zoll">
                            <label class="visually-hidden" :for="id(index, 'diameter')">Durchmesser in Zoll, Zeile {{ index + 1 }}</label>
                            <input :id="id(index, 'diameter')" v-model="size.diameter" class="input fe-in fe-in--xs" type="text" inputmode="decimal" :aria-invalid="err(index, 'diameter') ? 'true' : undefined" :aria-describedby="describedBy(index)">
                        </td>
                        <td data-label="Breite Zoll">
                            <label class="visually-hidden" :for="id(index, 'width')">Breite in Zoll, Zeile {{ index + 1 }}</label>
                            <input :id="id(index, 'width')" v-model="size.width" class="input fe-in fe-in--xs" type="text" inputmode="decimal" :aria-invalid="err(index, 'width') ? 'true' : undefined" :aria-describedby="describedBy(index)">
                        </td>
                        <td data-label="ET mm">
                            <label class="visually-hidden" :for="id(index, 'et')">Einpresstiefe in Millimetern, Zeile {{ index + 1 }}</label>
                            <!-- `text`: an ET can be negative, and a phone's number pad has no minus. -->
                            <input :id="id(index, 'et')" v-model="size.et" class="input fe-in fe-in--xs" type="text" inputmode="text" :aria-invalid="err(index, 'et') ? 'true' : undefined" :aria-describedby="describedBy(index)">
                        </td>
                        <td data-label="Lochzahl">
                            <label class="visually-hidden" :for="id(index, 'bolt_holes')">Lochzahl, Zeile {{ index + 1 }}</label>
                            <select :id="id(index, 'bolt_holes')" v-model.number="size.bolt_holes" class="input fe-in fe-in--xs" :aria-describedby="describedBy(index)">
                                <option v-for="n in boltHoles" :key="n" :value="n">{{ n }}</option>
                            </select>
                        </td>
                        <td data-label="Lochkreis mm">
                            <label class="visually-hidden" :for="id(index, 'bolt_circle')">Lochkreis in Millimetern, Zeile {{ index + 1 }}</label>
                            <input :id="id(index, 'bolt_circle')" v-model="size.bolt_circle" class="input fe-in fe-in--s" type="text" inputmode="decimal" :aria-invalid="err(index, 'bolt_circle') ? 'true' : undefined" :aria-describedby="describedBy(index)">
                        </td>
                        <td data-label="MLB mm">
                            <label class="visually-hidden" :for="id(index, 'bore')">Mittenlochbohrung in Millimetern, Zeile {{ index + 1 }}</label>
                            <input :id="id(index, 'bore')" v-model="size.bore" class="input fe-in fe-in--s" type="text" inputmode="decimal" :aria-invalid="err(index, 'bore') ? 'true' : undefined" :aria-describedby="describedBy(index)">
                        </td>
                    </template>
                    <td data-label="SKU">
                        <template v-if="readonly"><span class="fe-fixed">{{ size.sku }}</span></template>
                        <template v-else>
                            <label class="visually-hidden" :for="id(index, 'sku')">SKU, Zeile {{ index + 1 }}</label>
                            <input :id="id(index, 'sku')" v-model="size.sku" class="input fe-in fe-in--sku" type="text" maxlength="64" spellcheck="false" :aria-invalid="err(index, 'sku') ? 'true' : undefined" :aria-describedby="describedBy(index)">
                        </template>
                    </td>
                    <td data-label="Preis €" class="num">
                        <template v-if="readonly"><span class="fe-fixed">{{ size.price }}</span></template>
                        <template v-else>
                            <label class="visually-hidden" :for="id(index, 'price')">Preis je Felge in Euro, Zeile {{ index + 1 }}</label>
                            <input :id="id(index, 'price')" v-model="size.price" class="input fe-in fe-in--s num" type="text" inputmode="decimal" :aria-invalid="err(index, 'price') ? 'true' : undefined" :aria-describedby="describedBy(index)">
                        </template>
                    </td>
                    <td data-label="Bestand" class="num">
                        <template v-if="readonly"><span class="fe-fixed">{{ size.stock }}</span></template>
                        <template v-else>
                            <label class="visually-hidden" :for="id(index, 'stock')">Bestand, Zeile {{ index + 1 }}</label>
                            <input :id="id(index, 'stock')" v-model.number="size.stock" class="input fe-in fe-in--xs num" type="number" min="0" step="1" :aria-invalid="err(index, 'stock') ? 'true' : undefined" :aria-describedby="describedBy(index)">
                        </template>
                    </td>
                    <td data-label="Freigaben" class="fe-sizes__docs">
                        <template v-if="size.id === null">–</template>
                        <template v-else-if="docs(size).length">
                            <span v-for="doc in docs(size)" :key="doc.id" class="fe-doc">{{ doc.label }}</span>
                        </template>
                        <span v-else class="adm-tag adm-tag--warn">Noch keine</span>
                        <span v-if="isLocked(size)" class="fe-sizes__lock">
                            <Icon name="lock" :size="16" />
                            Maße aus dem Gutachten
                        </span>
                    </td>
                    <td v-if="!readonly" class="fe-sizes__remove">
                        <button v-if="!isLocked(size)" class="adm-iconbtn" type="button" :aria-label="`Zeile ${index + 1} entfernen`" title="Entfernen" @click="emit('remove', index)">
                            <Icon name="delete" :size="20" />
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        <ul v-if="sizes.some((_, index) => rowError(index))" class="fe-sizes__errors">
            <template v-for="(size, index) in sizes" :key="size.key">
                <li v-if="rowError(index)" :id="`fe-size-${index}-err`">Zeile {{ index + 1 }}: {{ rowError(index) }}</li>
            </template>
        </ul>
    </div>
</template>

<style scoped>
.fe-sizes__table td {
    vertical-align: middle;
}

.fe-in {
    height: var(--adm-control-h);
    padding-inline: var(--sp-8);
    font-variant-numeric: tabular-nums;
}

.fe-in--xs {
    width: 7ch;
}

.fe-in--s {
    width: 9ch;
}

.fe-in--finish {
    width: 16ch;
}

.fe-in--sku {
    width: 22ch;
}

.fe-in.num {
    text-align: right;
}

/* A measurement a Gutachten fixes: the figure, as the table would show any figure. */
.fe-fixed {
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
}

.fe-sizes__row--bad td {
    background: var(--c-bad-tint);
}

.fe-sizes__docs {
    min-width: 12ch;
}

.fe-doc {
    display: inline-block;
    margin: 0 var(--sp-4) var(--sp-4) 0;
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 500;
    white-space: nowrap;
}

.fe-sizes__lock {
    display: flex;
    align-items: center;
    gap: var(--sp-4);
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
    white-space: nowrap;
}

.fe-sizes__remove {
    width: 44px;
}

.fe-sizes__errors {
    margin: var(--sp-12) 0 0;
    padding: var(--sp-12) var(--sp-16) var(--sp-12) var(--sp-32);
    border-radius: var(--r-control);
    background: var(--c-bad-tint);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

/* A grid of fields, not a list to read: tight cells, so every column — Freigaben included — stays in
   view from 1280 px rather than scrolling off the edge. The phone's cards keep the table's own rhythm. */
@media (min-width: 768px) {
    /* Not 0 on the first column: the panel scrolls sideways, and its edge would clip a focus ring. */
    .fe-sizes__table th,
    .fe-sizes__table td {
        padding-inline: var(--sp-4);
    }

    .fe-sizes__table td {
        padding-block: var(--sp-4);
    }
}

@media (max-width: 767px) {
    .fe-in,
    .fe-in--xs,
    .fe-in--s,
    .fe-in--finish,
    .fe-in--sku {
        width: 100%;
        height: var(--adm-control-h-lg);
    }
}
</style>
