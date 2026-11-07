<script setup lang="ts">
/**
 * „68B beschreiben“: a code of this paper, described once (the Gutachten rework §4.5). The text as printed, and the kind, one
 * required select with no default (D-381): it is what makes a code act — an Abnahme derives the Eintragung, a body form filters
 * the cars, a tyre limit narrows the tyres — so a person chooses it. For the four kinds that need it, the one value. The level
 * stays optional, with its floor. Saved through the paper's own Auflagenverzeichnis, as before.
 */

import { focusRefused } from '../../../../composables/admin/focusRefused'
import { router, useForm } from '@inertiajs/vue3'
import { computed, onMounted, ref, watch } from 'vue'
import { stampHeaders } from '../../../../composables/admin/useDirtyForm'
import type { DocumentConditionView } from '../../../../types/admin/gutachten'
import { useEntry, useGutachtenPage } from './entryStore'

const props = defineProps<{
    /** The code to describe; empty for a new one typed into the panel. */
    code: string
    idPrefix: string
}>()

const emit = defineEmits<{ done: [code: string]; cancel: [] }>()

const store = useEntry()
const page = useGutachtenPage()
const existing = computed<DocumentConditionView | undefined>(() => page.props.conditions.find((c) => c.code === props.code))
const kinds = computed(() => page.props.choices.kinds)

/* Typed, then closed without saving or cancelling — a click beside the popover, another tab: it is here again on reopening. */
const draftKey = `code:${props.code}`
const draft = store.drafts.get(draftKey) as { fields: Record<string, unknown>; level: string } | undefined

const form = useForm({
    code: props.code,
    kind: existing.value?.kind ?? '',
    shop_colour: existing.value?.shopColour ?? 'green',
    text_de: existing.value?.text ?? '',
    source_page: (existing.value?.page ?? '') as number | string,
    body_forms: [...(existing.value?.bodyForms ?? [])] as string[],
    drive: existing.value?.drive ?? { mode: 'only' as 'only' | 'not', drive: '' },
    max_axle_load_kg: (existing.value?.maxAxleLoadKg ?? '') as number | string,
    axle: (existing.value?.axle ?? '') as string,
    ...(draft?.fields ?? {}),
})

const level = ref<string>(draft?.level ?? existing.value?.level ?? '')

watch([() => form.data(), level], ([fields, chosen]) => {
    store.drafts.set(draftKey, { fields, level: chosen })
}, { deep: true })

function cancel(): void {
    store.drafts.delete(draftKey)
    emit('cancel')
}
const help = computed(() => kinds.value.find((k) => k.value === form.kind)?.help ?? '')
const errors = computed(() => form.errors as Record<string, string | undefined>)
const levels = computed(() => page.props.levels ?? [])

const floor = computed(() => (form.kind === 'abnahme' || form.kind === 'karosseriearbeit' ? 'auflage' : 'hinweis'))

watch(floor, (now) => {
    if (now === 'auflage' && level.value === 'hinweis') {
        level.value = 'auflage'
    }
})

const root = ref<HTMLFormElement | null>(null)

onMounted(() => root.value?.querySelector<HTMLElement>('input, textarea')?.focus())

async function save(): Promise<void> {
    if (form.processing) {
        return
    }

    // After the lines on their way: their answer would otherwise bring back a list from before this code.
    await store.settled()

    const url = `/admin/gutachten/${store.state.documentId}/auflagen`
    const options = {
        preserveScroll: true,
        preserveState: true,
        only: ['conditions', 'unresolved', 'entry', 'blockers', 'errors', 'flash'],
        onError: () => focusRefused(root.value),
        onSuccess: () => {
            const code = form.code.trim()
            const saved = page.props.conditions.find((c) => c.code === code)

            // How loud it is in the shop, where someone chose: a save of its own, as on a released paper (#23, D-104).
            if (saved && level.value !== '' && level.value !== saved.level) {
                router.put(`${url}/${saved.id}/stufe`, { level: level.value }, { preserveScroll: true, preserveState: true, only: ['conditions', 'flash'] })
            }

            store.drafts.delete(draftKey)
            emit('done', code)
        },
    }

    form.transform((data) => ({
        code: data.code,
        kind: data.kind,
        text_de: data.text_de,
        source_page: data.source_page === '' ? null : Number(data.source_page),
        body_forms: data.kind === 'karosserieform' ? data.body_forms : null,
        drive: data.kind === 'antrieb' ? data.drive : null,
        max_axle_load_kg: data.kind === 'reifen_tragfaehigkeit' && data.max_axle_load_kg !== '' ? Number(data.max_axle_load_kg) : null,
        axle: data.kind === 'reifen_achse' ? data.axle : null,
        shop_colour: data.shop_colour,
    }))

    if (existing.value) {
        form.put(`${url}/${existing.value.id}`, { ...options, headers: stampHeaders(existing.value.stamp) })
    } else {
        form.post(url, options)
    }
}
</script>

<template>
    <form ref="root" class="ef-define" novalidate @submit.prevent="save">
        <div v-if="!code" class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-code`">Code</label>
            <input :id="`${idPrefix}-code`" v-model="form.code" class="input ef-define__code" type="text" maxlength="32" spellcheck="false" :aria-invalid="errors.code ? 'true' : undefined">
            <p class="form-field__error">{{ errors.code }}</p>
        </div>
        <p v-else-if="errors.code" class="adm-alert" role="alert">{{ errors.code }}</p>

        <div class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-text`">Text, wie im Gutachten gedruckt</label>
            <textarea :id="`${idPrefix}-text`" v-model="form.text_de" class="input ef-define__text" rows="4" :aria-invalid="errors.text_de ? 'true' : undefined" />
            <p class="form-field__error">{{ errors.text_de }}</p>
        </div>

        <div class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-kind`">Was bewirkt der Code?</label>
            <select :id="`${idPrefix}-kind`" v-model="form.kind" class="input" :aria-invalid="errors.kind ? 'true' : undefined">
                <option value="" disabled>Bitte wählen</option>
                <option v-for="kind in kinds" :key="kind.value" :value="kind.value">{{ kind.label }}</option>
            </select>
            <p v-if="help" class="form-field__help">{{ help }}</p>
            <p class="form-field__error">{{ errors.kind }}</p>
        </div>

        <fieldset v-if="form.kind === 'karosserieform'" class="ef-fieldset form-field">
            <legend class="form-field__label">Für welche Karosserieformen?</legend>
            <label v-for="body in page.props.choices.bodyForms" :key="body" class="check"><input v-model="form.body_forms" type="checkbox" :value="body"> {{ body }}</label>
            <p class="form-field__error">{{ errors.body_forms }}</p>
        </fieldset>

        <div v-if="form.kind === 'antrieb'" class="ef-define__pair">
            <div class="form-field">
                <label class="form-field__label" :for="`${idPrefix}-drive-mode`">Gilt</label>
                <select :id="`${idPrefix}-drive-mode`" v-model="form.drive.mode" class="input">
                    <option value="only">nur mit</option>
                    <option value="not">nicht mit</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-field__label" :for="`${idPrefix}-drive`">Antrieb</label>
                <select :id="`${idPrefix}-drive`" v-model="form.drive.drive" class="input" :aria-invalid="errors['drive.drive'] ? 'true' : undefined">
                    <option value="" disabled>Bitte wählen</option>
                    <option v-for="drive in page.props.choices.drives" :key="drive" :value="drive">{{ drive }}</option>
                </select>
                <p class="form-field__error">{{ errors['drive.drive'] ?? errors.drive }}</p>
            </div>
        </div>

        <div v-if="form.kind === 'reifen_tragfaehigkeit'" class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-kg`">Zulässige Achslast in kg</label>
            <input :id="`${idPrefix}-kg`" v-model="form.max_axle_load_kg" class="input ef-define__code" type="text" inputmode="numeric" :aria-invalid="errors.max_axle_load_kg ? 'true' : undefined">
            <p class="form-field__error">{{ errors.max_axle_load_kg }}</p>
        </div>

        <div v-if="form.kind === 'reifen_achse'" class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-axle`">Achse</label>
            <select :id="`${idPrefix}-axle`" v-model="form.axle" class="input" :aria-invalid="errors.axle ? 'true' : undefined">
                <option value="" disabled>Bitte wählen</option>
                <option value="FRONT">Nur Vorderachse</option>
                <option value="REAR">Nur Hinterachse</option>
            </select>
            <p class="form-field__error">{{ errors.axle }}</p>
        </div>

        <div class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-page`">Seite im Gutachten <span class="ef-optional">(optional)</span></label>
            <input :id="`${idPrefix}-page`" v-model="form.source_page" class="input ef-define__code" type="text" inputmode="numeric" :aria-invalid="errors.source_page ? 'true' : undefined">
            <p class="form-field__error">{{ errors.source_page }}</p>
        </div>

        <div class="form-field">
            <label class="form-field__label" :for="`${idPrefix}-colour`">Farbe im Shop</label>
            <select :id="`${idPrefix}-colour`" v-model="form.shop_colour" class="input">
                <option value="green">Grün</option>
                <option value="yellow">Gelb</option>
            </select>
            <p class="form-field__help">Nur die Farbe des Hinweises „Mit Auflagen“. Was der Shop sagt, ändert sich dadurch nicht.</p>
        </div>

        <fieldset v-if="levels.length" class="ef-fieldset form-field">
            <legend class="form-field__label">Einstufung im Shop <span class="ef-optional">(optional)</span></legend>
            <div class="ef-define__levels">
                <label v-for="option in levels" :key="option.value" class="adm-chip">
                    <input v-model="level" class="visually-hidden" type="radio" :name="`${idPrefix}-level`" :value="option.value" :disabled="floor === 'auflage' && option.value === 'hinweis'">
                    {{ option.label }}
                </label>
            </div>
            <p v-if="floor === 'auflage'" class="form-field__help">Eine Abnahme oder Arbeit an der Karosserie ist immer mindestens eine Auflage.</p>
        </fieldset>

        <p v-if="errors._stamp" class="adm-alert" role="alert">{{ errors._stamp }}</p>

        <div class="ef-define__actions">
            <button class="btn btn--secondary" type="button" @click="cancel">Abbrechen</button>
            <button class="btn btn--primary" type="submit" :disabled="form.processing" :aria-busy="form.processing ? 'true' : undefined">Speichern</button>
        </div>
    </form>
</template>

<style scoped>
.ef-define {
    display: grid;
    gap: var(--sp-12);
}

.ef-define__code {
    max-width: calc(16 * var(--ch-text));
}

.ef-define__text {
    min-height: 96px;
    resize: vertical;
}

.ef-define__levels {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--sp-8);
}

.ef-define__levels .adm-chip:has(input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
}

.ef-define__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--sp-8);
}

.ef-define .form-field__error:empty {
    display: none;
}

</style>
