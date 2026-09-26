<script setup lang="ts">
/**
 * Every admin page, without exception: a header, a body, and — on a form — the save bar
 * (admin-shell.md §8).
 *
 * The header answers "what is this, and what can I make here": the page's one `<h1>`, one line of
 * context that states a fact about this page (a count, a state, a scope — never what the page is
 * for), exactly one primary action, and everything else behind *Weitere Aktionen*, destructive
 * items last, behind a hairline. Filters belong to the list in the body, never to the header.
 */

import { Head, Link } from '@inertiajs/vue3'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuRoot, DropdownMenuSeparator, DropdownMenuTrigger } from 'reka-ui'
import { computed } from 'vue'
import Icon from './AdminIcon.vue'
import type { AdminIconName } from '../../icons/admin'

export interface AdminPageAction {
    label: string
    /** A place to go … */
    href?: string
    /** … or a thing to do. */
    run?: () => void
    icon?: AdminIconName
    /** Sorted to the end, behind a hairline, its label in the failure colour. */
    danger?: boolean
}

const props = withDefaults(
    defineProps<{
        title: string
        /** Not optional: a title without context is a page that has not decided what it is. */
        context: string
        more?: AdminPageAction[]
        /** The viewer may look but not change: said once, above the body. */
        readOnly?: boolean
        /**
         * The Übersicht and the pages beneath it: title and grid 1440 px wide at most and centred in the
         * work area, so a wide screen never shows a half-empty band beside them (the brief).
         */
        dashboard?: boolean
    }>(),
    { more: () => [], readOnly: false, dashboard: false }
)

const safe = computed(() => props.more.filter((a) => !a.danger))
const danger = computed(() => props.more.filter((a) => a.danger))
</script>

<template>
    <Head :title="title" />

    <header class="adm-page__head" :class="{ 'adm-page__part--dash': dashboard }">
        <div class="adm-page__titles">
            <h1 class="adm-page__title">{{ title }}</h1>
            <p class="adm-page__context">{{ context }}</p>
        </div>

        <div v-if="$slots.primary || more.length" class="adm-page__actions">
            <DropdownMenuRoot v-if="more.length">
                <DropdownMenuTrigger class="btn btn--secondary adm-page__more">
                    Weitere Aktionen
                    <Icon name="chevron-down" :size="16" />
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuContent class="adm-menu" align="end" :side-offset="8">
                        <template v-for="action in safe" :key="action.label">
                            <DropdownMenuItem v-if="action.href" as-child>
                                <Link :href="action.href" class="adm-menu__item">
                                    <Icon v-if="action.icon" :name="action.icon" :size="20" />
                                    {{ action.label }}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem v-else class="adm-menu__item" @select="action.run?.()">
                                <Icon v-if="action.icon" :name="action.icon" :size="20" />
                                {{ action.label }}
                            </DropdownMenuItem>
                        </template>

                        <DropdownMenuSeparator v-if="safe.length && danger.length" class="adm-menu__sep" />

                        <DropdownMenuItem
                            v-for="action in danger"
                            :key="action.label"
                            class="adm-menu__item adm-menu__item--danger"
                            @select="action.run?.()"
                        >
                            <Icon v-if="action.icon" :name="action.icon" :size="20" />
                            {{ action.label }}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenuPortal>
            </DropdownMenuRoot>

            <slot name="primary" />
        </div>
    </header>

    <p v-if="readOnly" class="adm-page__readonly" :class="{ 'adm-page__part--dash': dashboard }">
        <Icon name="eye" :size="16" />
        Du kannst diese Seite ansehen, aber nicht ändern.
    </p>

    <div class="adm-page__body" :class="{ 'adm-page__part--dash': dashboard }">
        <slot />
    </div>
</template>
