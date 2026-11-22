<script setup lang="ts">
/**
 * A1 of the operator's brief of 22.11.2026 (D-509), behind the D6 switch: one dropdown in place of the diameter chips, the
 * set tiles and the version tiles — „Ausführung“ for Nur Felgen, „Kombination“ for Kompletträder. A native select, so the
 * keyboard, the screen reader and the phone's own picker work as they do everywhere. It lists only what the page's
 * configurator offers — the versions a released paper approves for the car, and the sets its papers name — and shows the
 * rest disabled with its reason; it chooses nothing by itself: the page calls the configurator's own select functions.
 */
export interface DimensionOption {
    value: string
    text: string
    disabled?: boolean
}

export interface DimensionGroupView {
    label: string
    options: DimensionOption[]
}

defineProps<{
    id: string
    label: string
    groups: DimensionGroupView[]
    modelValue: string | null
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onChange(event: Event): void {
    emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
    <div class="form-field dimension-select" data-d6-select>
        <label class="form-field__label" :for="id">{{ label }}</label>
        <select :id="id" class="input dimension-select__input" :value="modelValue ?? ''" @change="onChange">
            <option v-if="modelValue === null" value="" disabled>Bitte wählen</option>
            <optgroup v-for="group in groups" :key="group.label" :label="group.label">
                <option v-for="option in group.options" :key="option.value" :value="option.value" :disabled="option.disabled" translate="no">{{ option.text }}</option>
            </optgroup>
        </select>
    </div>
</template>

<style scoped>
.dimension-select__input {
    inline-size: 100%;
    font-variant-numeric: tabular-nums;
}
</style>
