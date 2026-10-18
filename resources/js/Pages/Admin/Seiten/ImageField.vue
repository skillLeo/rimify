<script setup lang="ts">
/**
 * An article's picture (his admin item 11, D-306): chosen with the panel's own file picker, uploaded at once
 * into our own storage (SeitenController::image), and shown as the article will show it. The picture's address
 * and size go into the block; its description is the block's own field below. Nothing reaches the shop until
 * the article is published.
 */

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import FilePick from '../../../Components/Admin/FilePick.vue'
import { xsrfToken } from '../../../lib/xsrf'

const props = withDefaults(
    defineProps<{
        id: string
        label: string
        help?: string
        pageId: number
        src: string
        alt?: string
        error?: string
        readonly?: boolean
    }>(),
    { help: '', alt: '', error: '', readonly: false }
)

const emit = defineEmits<{ uploaded: [image: { src: string; width: number | null; height: number | null }] }>()

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif'

const file = ref<File | null>(null)
const busy = ref(false)
const refusal = ref('')
/** The name of the file chosen here: the stored one is a generated name nobody would recognise. */
const uploadedName = ref('')

/** The line beside the button: the file just chosen by its own name; a picture kept from before, as kept. */
const current = computed(() => (props.src === '' ? '' : uploadedName.value || 'Bild ausgewählt'))

watch(file, (chosen) => {
    if (chosen !== null) {
        void upload(chosen)
    }
})

/*
 * The field belongs to its block (Bearbeiten.vue keys blocks by identity, not by place): a block removed while its
 * picture uploads takes the upload with it, so the answer can never land in a block that took its place (SEI-23).
 */
let pending: AbortController | null = null
let gone = false

onBeforeUnmount(() => {
    gone = true
    pending?.abort()
})

/** Why an upload was refused, where the answer is not the field's own validation (SEI-27). */
function failure(status: number): string {
    if (status === 419 || status === 401) {
        return 'Deine Anmeldung ist abgelaufen. Lade die Seite neu und wähl das Bild dann noch einmal.'
    }

    if (status === 403) {
        return 'Du darfst diesen Artikel nicht mehr bearbeiten. Frag jemanden mit dem Recht dazu.'
    }

    if (status === 413) {
        return 'Das Bild ist größer als 10 MB. Verkleinere es bitte und wähl es noch einmal.'
    }

    if (status === 429) {
        return 'Das waren viele Bilder in kurzer Zeit. Warte eine Minute und wähl es dann noch einmal.'
    }

    return 'Das Bild wurde nicht hochgeladen. Versuch es bitte noch einmal.'
}

async function upload(chosen: File): Promise<void> {
    if (busy.value) {
        return
    }

    busy.value = true
    refusal.value = ''
    const body = new FormData()
    body.append('image', chosen)
    pending = new AbortController()

    try {
        const response = await fetch(`/admin/seiten/${props.pageId}/bild`, {
            method: 'POST',
            body,
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': xsrfToken() },
            signal: pending.signal,
        })
        const answer = (await response.json().catch(() => ({}))) as { src?: unknown; width?: unknown; height?: unknown; errors?: Record<string, string[] | undefined> }

        if (gone) {
            return
        }

        if (response.ok && typeof answer.src === 'string') {
            uploadedName.value = chosen.name
            emit('uploaded', {
                src: answer.src,
                width: typeof answer.width === 'number' ? answer.width : null,
                height: typeof answer.height === 'number' ? answer.height : null,
            })
        } else {
            refusal.value = answer.errors?.image?.[0] ?? failure(response.status)
        }
    } catch {
        if (!gone) {
            refusal.value = 'Das Bild wurde nicht hochgeladen, die Verbindung ist abgebrochen. Versuch es bitte noch einmal.'
        }
    } finally {
        pending = null

        if (!gone) {
            busy.value = false
            // The line beside the button names the kept picture again, not the file that was sent.
            file.value = null
        }
    }
}

function refused(name: string): void {
    refusal.value = `„${name}“ kann der Artikel nicht zeigen. Wähl ein Bild im Format JPG, PNG, WebP oder AVIF.`
}
</script>

<template>
    <div class="form-field pg-image">
        <span :id="`${id}-label`" class="form-field__label">{{ label }}</span>

        <figure v-if="src" class="pg-image__frame">
            <img :src="src" :alt="alt" class="pg-image__img">
        </figure>

        <FilePick
            v-if="!readonly"
            :id="id"
            v-model="file"
            :accept="ACCEPT"
            :label="busy ? 'Wird hochgeladen …' : src ? 'Anderes Bild auswählen' : 'Bild auswählen'"
            :current="current"
            :disabled="busy"
            :invalid="Boolean(error || refusal)"
            :describedby="`${id}-label ${id}-help ${id}-err`"
            @refused="refused"
        />
        <p v-else-if="!src" class="pg-image__empty">Noch kein Bild.</p>

        <p v-if="help" :id="`${id}-help`" class="form-field__help">{{ help }}</p>
        <p :id="`${id}-err`" class="form-field__error" role="status">{{ refusal || error }}</p>
    </div>
</template>

<style scoped>
/* 8 px from the picture to its button, as from a table's last row to its buttons. */
.pg-image__frame {
    margin: 0 0 var(--sp-4);
    max-width: 100%;
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    overflow: hidden;
    background: var(--c-band);
}

.pg-image__img {
    display: block;
    width: 100%;
    height: auto;
}

.pg-image__empty {
    font-size: var(--fs-small);
    line-height: var(--lh-small);
    color: var(--c-ink-3);
}

.pg-image .form-field__error:empty {
    display: none;
}
</style>
