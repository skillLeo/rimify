<script setup lang="ts">
/**
 * The toast.
 *
 * Confirmations only — never a failure, and never a conflict. Anything the customer needs to act
 * on stays on the page as a row or a panel, because a toast that scrolls away is a message nobody
 * can go back and read.
 *
 * It is polite, not assertive: adding a wheel to the basket should not interrupt a screen reader
 * mid-sentence.
 */

import { ref, watch } from 'vue'
import Icon from '../Art/Icon.vue'
import { useShared } from '../../composables/useShared'

const shared = useShared()
const message = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

watch(
    () => shared.value.flash?.toast ?? null,
    (next) => {
        if (next === null || next === '') {
            return
        }

        message.value = next

        if (timer !== undefined) {
            clearTimeout(timer)
        }

        timer = setTimeout(() => {
            message.value = null
        }, 4000)
    },
    { immediate: true }
)
</script>

<template>
    <div v-if="message" class="toast" role="status" aria-live="polite">
        <Icon name="check-circle" :size="20" />
        {{ message }}
        <button class="toast__close" type="button" aria-label="Schließen" @click="message = null">
            <Icon name="close" :size="20" />
        </button>
    </div>
</template>

<style scoped>
.toast__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-left: var(--space-2);
    background: transparent;
    border: 0;
    color: rgba(255, 255, 255, 0.72);
    cursor: pointer;
}

.toast__close:hover {
    color: #fff;
}
</style>
