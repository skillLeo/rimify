<script setup lang="ts">
/**
 * „Gutachten anfordern“: the request to a wheel brand, written and ready — subject and text from the
 * server, both editable — opened in the admin's own e-mail program. The brand's address is theirs to
 * fill in there: the shop keeps no contacts. Opening it records the gap as „angefordert“ (with the
 * brand, if one was chosen); copying the text records nothing, since nothing has been sent yet.
 */

import { ref, watch } from 'vue'
import Dialog from '../../../Components/Ui/Dialog.vue'
import type { DemandGap } from '../../../types/admin/uebersicht'
import { mailtoHref } from './mailto'

const props = defineProps<{ gap: DemandGap | null; brands: { id: number; name: string }[] }>()

const emit = defineEmits<{ requested: [gap: DemandGap, brandId: number | null] }>()

const open = defineModel<boolean>('open', { default: false })

const brand = ref('')
const subject = ref('')
const body = ref('')
const copied = ref(false)

watch(open, (value) => {
    if (value && props.gap) {
        brand.value = ''
        subject.value = props.gap.mail.subject
        body.value = props.gap.mail.body
        copied.value = false
    }
})

function mailto(): string {
    return mailtoHref(subject.value, body.value)
}

async function copy(): Promise<void> {
    try {
        await navigator.clipboard.writeText(`${subject.value}\n\n${body.value}`)
        copied.value = true
        window.setTimeout(() => (copied.value = false), 2000)
    } catch {
        copied.value = false
    }
}

function sent(): void {
    if (props.gap) {
        emit('requested', props.gap, brand.value === '' ? null : Number(brand.value))
    }

    open.value = false
}
</script>

<template>
    <Dialog
        v-model:open="open"
        title="Gutachten anfordern"
        :description="gap ? `Für ${gap.title}. Die E-Mail öffnet sich in deinem E-Mail-Programm, die Adresse der Marke trägst du dort ein.` : undefined"
        content-class="adm-dialog"
    >
        <div class="rq">
            <div class="form-field">
                <label class="form-field__label" for="demand-brand">Bei welcher Marke fragst du an?</label>
                <select id="demand-brand" v-model="brand" class="input">
                    <option value="">Noch offen</option>
                    <option v-for="b in brands" :key="b.id" :value="String(b.id)">{{ b.name }}</option>
                </select>
                <span class="form-field__help">Die Marke steht dann bei der Lücke, damit niemand dieselbe Anfrage zweimal schickt.</span>
            </div>

            <div class="form-field">
                <label class="form-field__label" for="demand-subject">Betreff</label>
                <input id="demand-subject" v-model="subject" class="input" type="text" autocomplete="off">
            </div>

            <div class="form-field">
                <label class="form-field__label" for="demand-body">Text</label>
                <textarea id="demand-body" v-model="body" class="input rq__body" rows="12" spellcheck="true" />
            </div>
        </div>

        <template #actions>
            <button class="btn btn--secondary" type="button" @click="copy">
                {{ copied ? 'Kopiert' : 'Text kopieren' }}
            </button>
            <a class="btn btn--primary" :href="mailto()" @click="sent">In E-Mail-Programm öffnen</a>
        </template>
        <p class="visually-hidden" aria-live="polite">{{ copied ? 'Betreff und Text sind kopiert.' : '' }}</p>
    </Dialog>
</template>

<style scoped>
.rq {
    display: grid;
    gap: var(--sp-16);
}

.rq__body {
    min-height: 240px;
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    resize: vertical;
}
</style>
