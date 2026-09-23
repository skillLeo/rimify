<script setup lang="ts">
/**
 * One row of a list: at least 56 px, the page margin at the sides, an inset divider, a chevron
 * when it navigates, and the whole row is the target. A row with an `href` is a real link (a
 * right-click or a long press still offers the URL); the navigation itself goes through the
 * router so the direction and any open sheet are handled first.
 */

import { router } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Ui/Icon.vue'
import type { IconName } from '../../icons'

const props = withDefaults(
    defineProps<{
        title?: string
        sub?: string
        /** A short value at the right edge — a count, a price, a distance. */
        meta?: string
        icon?: IconName
        /** Navigates through the router; `external` opens it as an ordinary link. */
        href?: string
        external?: boolean
        chevron?: boolean
        /** A row that does nothing on its own: plain content. */
        static?: boolean
        disabled?: boolean
        /** Let the caller navigate itself (after closing a sheet, say). */
        manual?: boolean
    }>(),
    { title: undefined, sub: undefined, meta: undefined, icon: undefined, href: undefined, external: false, chevron: undefined, static: false, disabled: false, manual: false }
)

const emit = defineEmits<{ (e: 'activate', href: string | undefined): void }>()

const tag = computed(() => (props.href ? 'a' : props.static ? 'div' : 'button'))
const showChevron = computed(() => props.chevron ?? (props.href !== undefined && !props.external))

function onClick(event: MouseEvent): void {
    if (props.disabled) {
        event.preventDefault()

        return
    }

    if (props.href === undefined) {
        emit('activate', undefined)

        return
    }

    if (props.external || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
    }

    event.preventDefault()
    emit('activate', props.href)

    if (!props.manual) {
        router.visit(props.href)
    }
}

function onPress(): void {
    if (props.href && !props.external && !props.disabled) {
        router.prefetch(props.href, { method: 'get' }, { cacheFor: 30_000 })
    }
}
</script>

<template>
    <component
        :is="tag"
        class="mrow"
        :class="{ 'm-press': !static, 'mrow--disabled': disabled }"
        :href="href"
        :type="tag === 'button' ? 'button' : undefined"
        :rel="external ? 'noopener' : undefined"
        :aria-disabled="disabled ? 'true' : undefined"
        @pointerdown="onPress"
        @click="onClick"
    >
        <span v-if="icon || $slots.leading" class="mrow__lead">
            <slot name="leading"><Icon v-if="icon" :name="icon" :size="24" /></slot>
        </span>

        <span class="mrow__body">
            <span class="mrow__text">
                <span class="mrow__title"><slot>{{ title }}</slot></span>
                <span v-if="sub || $slots.sub" class="mrow__sub small muted"><slot name="sub">{{ sub }}</slot></span>
            </span>

            <span v-if="meta || $slots.trailing" class="mrow__meta small num muted"><slot name="trailing">{{ meta }}</slot></span>
            <Icon v-if="showChevron" name="chevron-right" :size="20" class="mrow__chev" />
        </span>
    </component>
</template>

<style scoped>
.mrow {
    display: flex;
    align-items: stretch;
    gap: var(--sp-12);
    width: 100%;
    min-height: 56px;
    padding: 0 0 0 var(--page-margin);
    border: 0;
    background: transparent;
    color: var(--c-ink);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}

div.mrow {
    cursor: default;
}

.mrow--disabled {
    color: var(--c-ink-3);
    cursor: not-allowed;
}

.mrow__lead {
    flex: none;
    display: inline-flex;
    align-items: center;
    color: var(--c-ink-2);
}

/* The divider starts where the text starts, so a list reads as one column. */
.mrow__body {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--sp-12);
    min-width: 0;
    padding: var(--sp-8) var(--page-margin) var(--sp-8) 0;
    border-bottom: 1px solid var(--c-line);
}

.mrow__text {
    flex: 1;
    display: grid;
    gap: var(--sp-4);
    min-width: 0;
}

.mrow__title {
    font-weight: 500;
    overflow-wrap: anywhere;
}

.mrow__meta {
    flex: none;
    white-space: nowrap;
}

.mrow__chev {
    flex: none;
    color: var(--c-ink-3);
}

@media (hover: hover) and (pointer: fine) {
    .mrow:not(.mrow--disabled):not(div):hover {
        background: var(--c-band);
    }
}
</style>
