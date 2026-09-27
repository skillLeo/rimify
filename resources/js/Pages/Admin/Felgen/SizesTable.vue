<script setup lang="ts">
/**
 * The sizes of one Felge as a table of fields: one row per size, typed the German way (`8,5`, `66,6`,
 * `189,00`). A size an approval document names keeps its measurements and its finish — they are what
 * the Gutachten approves — so those fields are read-only and the row cannot be removed; price, stock,
 * SKU and EAN stay open (WheelEditor).
 *
 * Below 768 px each row is a card of labelled fields (the admin table's own pattern).
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

function isLocked(size: SizeForm): boolean {
    return size.id !== null && props.locked.includes(size.id)
}

function err(index: number, field: string): string {
    return props.errors[`configs.${index}.${field}`] ?? ''
}

function rowError(index: number): string {
    return ['finish', 'diameter', 'width', 'et', 'bolt_holes', 'bolt_circle', 'bore', 'sku', 'ean', 'kba', 'price', 'stock', 'weight_g']
        .map((field) => err(index, field))
        .filter(Boolean)
        .join(' ')
}

function docs(size: SizeForm): SizeDocument[] {
    return size.id === null ? [] : (props.documents[String(size.id)] ?? [])
}

function id(index: number, field: string): string {
    return `fe-size-${index}-${field}`
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
                    <td data-label="Ausführung">
                        <label class="visually-hidden" :for="id(index, 'finish')">Ausführung, Zeile {{ index + 1 }}</label>
                        <select
                            :id="id(index, 'finish')"
                            v-model="size.finish"
                            class="input fe-in fe-in--finish"
                            :disabled="readonly || isLocked(size)"
                            :aria-invalid="err(index, 'finish') ? 'true' : undefined"
                        >
                            <option v-for="finish in finishes" :key="finish.key" :value="finish.key">{{ finish.name || 'Neue Ausführung' }}</option>
                        </select>
                    </td>
                    <td data-label="Ø Zoll">
                        <label class="visually-hidden" :for="id(index, 'diameter')">Durchmesser in Zoll, Zeile {{ index + 1 }}</label>
                        <input :id="id(index, 'diameter')" v-model="size.diameter" class="input fe-in fe-in--xs" type="text" inputmode="decimal" :readonly="readonly || isLocked(size)" :aria-invalid="err(index, 'diameter') ? 'true' : undefined">
                    </td>
                    <td data-label="Breite Zoll">
                        <label class="visually-hidden" :for="id(index, 'width')">Breite in Zoll, Zeile {{ index + 1 }}</label>
                        <input :id="id(index, 'width')" v-model="size.width" class="input fe-in fe-in--xs" type="text" inputmode="decimal" :readonly="readonly || isLocked(size)" :aria-invalid="err(index, 'width') ? 'true' : undefined">
                    </td>
                    <td data-label="ET mm">
                        <label class="visually-hidden" :for="id(index, 'et')">Einpresstiefe in Millimetern, Zeile {{ index + 1 }}</label>
                        <input :id="id(index, 'et')" v-model="size.et" class="input fe-in fe-in--xs" type="text" inputmode="numeric" :readonly="readonly || isLocked(size)" :aria-invalid="err(index, 'et') ? 'true' : undefined">
                    </td>
                    <td data-label="Lochzahl">
                        <label class="visually-hidden" :for="id(index, 'bolt_holes')">Lochzahl, Zeile {{ index + 1 }}</label>
                        <select :id="id(index, 'bolt_holes')" v-model.number="size.bolt_holes" class="input fe-in fe-in--xs" :disabled="readonly || isLocked(size)">
                            <option v-for="n in boltHoles" :key="n" :value="n">{{ n }}</option>
                        </select>
                    </td>
                    <td data-label="Lochkreis mm">
                        <label class="visually-hidden" :for="id(index, 'bolt_circle')">Lochkreis in Millimetern, Zeile {{ index + 1 }}</label>
                        <input :id="id(index, 'bolt_circle')" v-model="size.bolt_circle" class="input fe-in fe-in--s" type="text" inputmode="decimal" :readonly="readonly || isLocked(size)" :aria-invalid="err(index, 'bolt_circle') ? 'true' : undefined">
                    </td>
                    <td data-label="MLB mm">
                        <label class="visually-hidden" :for="id(index, 'bore')">Mittenlochbohrung in Millimetern, Zeile {{ index + 1 }}</label>
                        <input :id="id(index, 'bore')" v-model="size.bore" class="input fe-in fe-in--s" type="text" inputmode="decimal" :readonly="readonly || isLocked(size)" :aria-invalid="err(index, 'bore') ? 'true' : undefined">
                    </td>
                    <td data-label="SKU">
                        <label class="visually-hidden" :for="id(index, 'sku')">SKU, Zeile {{ index + 1 }}</label>
                        <input :id="id(index, 'sku')" v-model="size.sku" class="input fe-in fe-in--sku" type="text" maxlength="64" spellcheck="false" :readonly="readonly" :aria-invalid="err(index, 'sku') ? 'true' : undefined">
                    </td>
                    <td data-label="Preis €" class="num">
                        <label class="visually-hidden" :for="id(index, 'price')">Preis je Felge in Euro, Zeile {{ index + 1 }}</label>
                        <input :id="id(index, 'price')" v-model="size.price" class="input fe-in fe-in--s num" type="text" inputmode="decimal" :readonly="readonly" :aria-invalid="err(index, 'price') ? 'true' : undefined">
                    </td>
                    <td data-label="Bestand" class="num">
                        <label class="visually-hidden" :for="id(index, 'stock')">Bestand, Zeile {{ index + 1 }}</label>
                        <input :id="id(index, 'stock')" v-model.number="size.stock" class="input fe-in fe-in--xs num" type="number" min="0" step="1" :readonly="readonly" :aria-invalid="err(index, 'stock') ? 'true' : undefined">
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
                        <button
                            class="adm-iconbtn"
                            type="button"
                            :disabled="isLocked(size)"
                            :aria-label="isLocked(size) ? `Zeile ${index + 1} steht in einem Gutachten und bleibt` : `Zeile ${index + 1} entfernen`"
                            :title="isLocked(size) ? 'Steht in einem Gutachten' : 'Entfernen'"
                            @click="emit('remove', index)"
                        >
                            <Icon name="delete" :size="20" />
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        <ul v-if="sizes.some((_, index) => rowError(index))" class="fe-sizes__errors" role="alert">
            <template v-for="(size, index) in sizes" :key="size.key">
                <li v-if="rowError(index)">Zeile {{ index + 1 }}: {{ rowError(index) }}</li>
            </template>
        </ul>
    </div>
</template>

<style scoped>
/* A grid of fields, not a list to read: tight cells, so every column — Freigaben included — stays in
   view at 1280 px and up rather than scrolling off the edge. */
.fe-sizes__table th,
.fe-sizes__table td {
    padding-inline: var(--sp-4);
}

.fe-sizes__table th:first-child,
.fe-sizes__table td:first-child {
    padding-left: 0;
}

.fe-sizes__table td {
    padding-block: var(--sp-4);
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
    font-size: var(--fs-micro);
}

.fe-in.num {
    text-align: right;
}

.fe-in[readonly] {
    background: var(--c-band);
    color: var(--c-ink-2);
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
