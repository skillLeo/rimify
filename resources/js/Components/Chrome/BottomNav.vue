<script setup lang="ts">
/**
 * The phone's bottom bar: five destinations, always in reach, never hidden on scroll. The basket
 * carries its count. It sits above the safe area, and the page keeps room for it at the bottom so
 * nothing ends underneath.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Ui/Icon.vue'
import { isIconName, type IconName } from '../../icons'
import { useMenus, useShared } from '../../composables/useShared'

const shared = useShared()
const menus = useMenus()

const items = computed(() =>
    menus.value.mobile_bottom.map((item) => ({
        ...item,
        iconName: (item.icon && isIconName(item.icon) ? item.icon : 'home') as IconName,
        current: shared.value.routeName === item.routeName,
        isCart: item.routeName === 'warenkorb.index',
    }))
)
</script>

<template>
    <nav class="bnav until-lg" aria-label="Hauptnavigation">
        <Link
            v-for="item in items"
            :key="item.label"
            :href="item.href"
            class="bnav__item"
            :aria-current="item.current ? 'page' : undefined"
            prefetch
        >
            <span class="bnav__icon">
                <Icon :name="item.iconName" :size="24" />
                <span v-if="item.isCart && shared.cartCount > 0" class="badge badge--count bnav__badge" aria-hidden="true">{{ shared.cartCount }}</span>
            </span>
            <span class="bnav__label">{{ item.label }}</span>
            <span v-if="item.isCart && shared.cartCount > 0" class="visually-hidden">, {{ shared.cartCount }} Artikel</span>
        </Link>
    </nav>
</template>

<style scoped>
.bnav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-header);
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    height: calc(var(--bottomnav-h) + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--c-surface);
    border-top: 1px solid var(--c-line);
}

.bnav__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-4);
    min-height: 44px;
    color: var(--c-ink-2);
    text-decoration: none;
}

.bnav__item[aria-current='page'] {
    color: var(--c-blue);
}

/* Pointer-operated between 768 and 1023 px, where the bar is shown on a desktop document. */
@media (hover: hover) and (pointer: fine) {
    .bnav__item:hover {
        color: var(--c-ink);
    }
}

.bnav__icon {
    position: relative;
    display: inline-flex;
}

.bnav__badge {
    position: absolute;
    top: calc(-1 * var(--sp-4));
    right: calc(-1 * var(--sp-8));
}

.bnav__label {
    font-size: var(--fs-micro);
    line-height: var(--lh-micro);
    font-weight: 500;
}
</style>
