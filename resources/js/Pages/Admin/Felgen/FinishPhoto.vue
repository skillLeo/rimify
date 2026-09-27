<script setup lang="ts">
/**
 * One finish's photograph: shown, replaced or taken off — its own request, beside the form's save,
 * so a photograph is never lost to an unsaved form or held back by one.
 *
 * The sentence a screen reader hears is required: the server refuses a photograph without it
 * (WheelImageRequest). A generated drawing (the demo set) says it is one.
 */

import { router, usePage } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import Picture from '../../../Components/Ui/Picture.vue'
import type { FinishImage } from '../../../types/admin/felgen'

const props = defineProps<{
    modelId: number
    finishId: number
    finishName: string
    image: FinishImage | null
    editable: boolean
    /** The model's full name, for the suggested alt text. */
    title: string
}>()

const page = usePage()
const open = ref(false)
const file = ref<File | null>(null)
const alt = ref('')
const busy = ref(false)
const mine = ref(false)
const idBase = computed(() => `fe-photo-${props.finishId}`)

const errors = computed(() => {
    if (!mine.value) {
        return { image: '', alt: '' }
    }

    const bag = (page.props.errors ?? {}) as Record<string, string | undefined>

    return { image: bag.image ?? '', alt: bag.alt ?? '' }
})

function start(): void {
    open.value = true
    alt.value = props.image && !props.image.placeholder ? props.image.alt : `${props.title} in ${props.finishName}, Ansicht von vorn`
}

function pick(event: Event): void {
    const input = event.target as HTMLInputElement

    file.value = input.files?.[0] ?? null
}

function upload(): void {
    if (file.value === null || busy.value) {
        return
    }

    busy.value = true
    mine.value = true
    router.post(
        `/admin/felgen/${props.modelId}/ausfuehrungen/${props.finishId}/foto`,
        { image: file.value, alt: alt.value },
        {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                open.value = false
                file.value = null
                mine.value = false
            },
            onFinish: () => {
                busy.value = false
            },
        }
    )
}

function remove(): void {
    busy.value = true
    router.delete(`/admin/felgen/${props.modelId}/ausfuehrungen/${props.finishId}/foto`, {
        preserveScroll: true,
        onFinish: () => {
            busy.value = false
        },
    })
}
</script>

<template>
    <div class="fe-photo">
        <div class="fe-photo__frame" :class="{ 'fe-photo__frame--empty': !image }">
            <Picture v-if="image" :image="image.manifest" :alt="image.alt" sizes="96px" />
            <span v-else class="fe-photo__none">Kein Foto</span>
        </div>

        <div class="fe-photo__text">
            <p class="fe-photo__state">
                <template v-if="!image">Der Shop zeigt die Umrisszeichnung, bis ein Foto hochgeladen ist.</template>
                <template v-else-if="image.placeholder">Platzhalterbild der Demodaten – kein Produktfoto.</template>
                <template v-else>{{ image.alt }}</template>
            </p>

            <div v-if="editable && !open" class="fe-photo__actions">
                <button class="btn btn--secondary" type="button" :disabled="busy" @click="start">{{ image && !image.placeholder ? 'Foto ersetzen' : 'Foto hochladen' }}</button>
                <button v-if="image && !image.placeholder" class="btn btn--ghost" type="button" :disabled="busy" @click="remove">Foto entfernen</button>
            </div>

            <div v-if="open" class="fe-photo__form">
                <div class="form-field">
                    <label class="form-field__label" :for="`${idBase}-file`">Foto (JPEG, PNG, WebP oder AVIF, höchstens 10 MB)</label>
                    <input
                        :id="`${idBase}-file`"
                        class="input fe-photo__file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        :aria-invalid="errors.image ? 'true' : undefined"
                        :aria-describedby="`${idBase}-file-err`"
                        @change="pick"
                    >
                    <p :id="`${idBase}-file-err`" class="form-field__error">{{ errors.image }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="`${idBase}-alt`">Was zeigt das Foto?</label>
                    <input
                        :id="`${idBase}-alt`"
                        v-model="alt"
                        class="input"
                        type="text"
                        maxlength="200"
                        :aria-invalid="errors.alt ? 'true' : undefined"
                        :aria-describedby="`${idBase}-alt-help ${idBase}-alt-err`"
                    >
                    <p :id="`${idBase}-alt-help`" class="form-field__help">Diesen Satz hört, wer das Foto nicht sehen kann.</p>
                    <p :id="`${idBase}-alt-err`" class="form-field__error">{{ errors.alt }}</p>
                </div>
                <div class="fe-photo__actions">
                    <button class="btn btn--primary" type="button" :disabled="busy || file === null" :aria-busy="busy ? 'true' : undefined" @click="upload">Hochladen</button>
                    <button class="btn btn--ghost" type="button" :disabled="busy" @click="open = false">Abbrechen</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.fe-photo {
    display: grid;
    grid-template-columns: 96px minmax(0, 1fr);
    gap: var(--sp-16);
    align-items: start;
}

.fe-photo__frame {
    width: 96px;
    height: 96px;
    overflow: hidden;
    border-radius: var(--r-control);
    background: var(--c-band);
}

.fe-photo__frame :deep(.picture) {
    width: 100%;
    height: 100%;
}

.fe-photo__frame--empty {
    display: grid;
    place-items: center;
    border: 1px dashed var(--c-line-2);
    background: var(--c-surface);
}

.fe-photo__none {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    color: var(--c-ink-3);
}

.fe-photo__text {
    display: grid;
    gap: var(--sp-12);
    min-width: 0;
}

.fe-photo__state {
    margin: 0;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-2);
    overflow-wrap: anywhere;
}

.fe-photo__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.fe-photo__form {
    display: grid;
    gap: var(--sp-12);
}

.fe-photo__file {
    padding-block: var(--sp-8);
    height: auto;
}

.fe-photo .form-field__error:empty {
    display: none;
}

@media (max-width: 767px) {
    .fe-photo {
        grid-template-columns: 72px minmax(0, 1fr);
        gap: var(--sp-12);
    }

    .fe-photo__frame {
        width: 72px;
        height: 72px;
    }

    .fe-photo__actions .btn {
        min-height: var(--adm-control-h-lg);
    }
}
</style>
