<script setup lang="ts">
/**
 * F5 — the Fahrzeugschein scan: one photo, read on the customer's own device (`useOcr`), and the two
 * key numbers read from the text by `lib/fahrzeugschein`. What was read is shown for confirmation and
 * can be edited before it is used; nothing is used unread.
 *
 * This component only emits: `confirm` with the two numbers, `failed` when nothing could be read.
 * The selector puts them into its own HSN and TSN fields.
 */

import { nextTick, ref, useId } from 'vue'
import Icon from '../Ui/Icon.vue'
import { useOcr } from '../../composables/useOcr'
import { cleanHsn, cleanTsn, isHsn, isTsn, parseKeyNumbers } from '../../lib/fahrzeugschein'

const emit = defineEmits<{
    confirm: [value: { hsn: string; tsn: string }]
    failed: []
}>()

type Phase = 'idle' | 'busy' | 'confirm' | 'failed'

const id = useId()
const phase = ref<Phase>('idle')
const hsn = ref('')
const tsn = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const hsnField = ref<HTMLInputElement | null>(null)
const ocr = useOcr()

function pick(): void {
    fileInput.value?.click()
}

async function onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    // Cleared at once, so the same photo can be taken again after a failure.
    input.value = ''

    if (file === undefined) {
        return
    }

    phase.value = 'busy'

    try {
        const text = await ocr.read(file)
        const found = parseKeyNumbers(text)

        if (found.hsn === null && found.tsn === null) {
            fail()

            return
        }

        hsn.value = found.hsn ?? ''
        tsn.value = found.tsn ?? ''
        phase.value = 'confirm'
        await nextTick()
        hsnField.value?.focus()
    } catch {
        fail()
    }
}

function fail(): void {
    phase.value = 'failed'
    ocr.dispose()
    emit('failed')
}

function reset(): void {
    phase.value = 'idle'
}

function confirm(): void {
    if (!isHsn(hsn.value) || !isTsn(tsn.value)) {
        return
    }

    emit('confirm', { hsn: hsn.value, tsn: tsn.value })
    phase.value = 'idle'
}

function onHsn(event: Event): void {
    hsn.value = cleanHsn((event.target as HTMLInputElement).value)
}

function onTsn(event: Event): void {
    tsn.value = cleanTsn((event.target as HTMLInputElement).value)
}

</script>

<template>
    <div class="scan">
        <label :for="`${id}-file`" class="visually-hidden">Foto der Zulassungsbescheinigung Teil I</label>
        <input
            :id="`${id}-file`"
            ref="fileInput"
            class="visually-hidden"
            type="file"
            accept="image/*"
            capture="environment"
            tabindex="-1"
            @change="onFile"
        />

        <template v-if="phase !== 'confirm'">
            <button
                class="btn btn--secondary btn--block"
                type="button"
                :aria-busy="phase === 'busy' ? 'true' : undefined"
                :disabled="phase === 'busy'"
                @click="pick"
            >
                <Icon name="camera" :size="20" />
                Fahrzeugschein fotografieren
            </button>

            <p class="small quiet scan__privacy">
                Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.
            </p>

            <p v-if="phase === 'busy'" class="small muted scan__status" role="status">Erkennung läuft …</p>

            <p v-if="phase === 'failed'" class="notice scan__failed" role="alert">
                Wir konnten HSN und TSN nicht lesen. Trag sie bitte von Hand ein.
            </p>
        </template>

        <div v-else class="scan__confirm">
            <p class="label">Stimmt das?</p>

            <div class="scan__keys">
                <div class="form-field">
                    <label class="form-field__label" :for="`${id}-hsn`">HSN (Feld 2.1)</label>
                    <input
                        :id="`${id}-hsn`"
                        ref="hsnField"
                        class="input input--code"
                        :value="hsn"
                        inputmode="numeric"
                        maxlength="4"
                        autocomplete="off"
                        enterkeyhint="next"
                        :aria-invalid="hsn !== '' && !isHsn(hsn) ? 'true' : undefined"
                        @input="onHsn"
                    />
                </div>
                <div class="form-field">
                    <label class="form-field__label" :for="`${id}-tsn`">TSN (Feld 2.2)</label>
                    <input
                        :id="`${id}-tsn`"
                        class="input input--code"
                        :value="tsn"
                        maxlength="3"
                        autocapitalize="characters"
                        autocomplete="off"
                        enterkeyhint="done"
                        :aria-invalid="tsn !== '' && !isTsn(tsn) ? 'true' : undefined"
                        @input="onTsn"
                    />
                </div>
            </div>

            <div class="scan__actions">
                <button
                    class="btn btn--secondary"
                    type="button"
                    :disabled="!isHsn(hsn) || !isTsn(tsn)"
                    @click="confirm"
                >
                    Übernehmen
                </button>
                <button class="link small" type="button" @click="reset">Noch einmal fotografieren</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.scan {
    display: grid;
    gap: var(--sp-12);
}

.scan__privacy {
    margin: 0;
}

.scan__status {
    margin: 0;
}

.scan__failed {
    margin: 0;
}

.scan__confirm {
    display: grid;
    gap: var(--sp-12);
}

.scan__keys {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--gutter);
}

.scan__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-16);
}
</style>
