<script setup lang="ts">
/**
 * The mobile bottom bar. Five items, with RIMIFY-CHECK raised out of the centre.
 *
 * Most of this traffic is on a phone, and the centre item is the brand's whole promise — so it is
 * put literally under the thumb, breaking the bar's top edge by 12px. It is the one element in the
 * system allowed to escape its container.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Art/Icon.vue'
import { isIconName, type IconName } from '../../art'
import { resolveHref, useMenus, useShared } from '../../composables/useShared'

const shared = useShared()
const menus = useMenus()

const items = computed(() =>
    menus.value.mobile_bottom.map((item) => ({
        ...item,
        target: resolveHref(item.href, item.behaviour, shared.value.vehicle !== null, '/felgen'),
        glyph: (item.icon !== null && isIconName(item.icon) ? item.icon : 'grid') as IconName,
        active: item.routeName !== null && item.routeName === shared.value.routeName,
        isCheck: item.routeName === 'check.index',
        isCart: item.routeName === 'warenkorb.index',
    }))
)
</script>

<template>
    <nav class="bnav" aria-label="Hauptnavigation">
        <template v-for="item in items" :key="item.label">
            <Link
                v-if="item.isCheck"
                :href="item.target"
                class="bnav__check"
                :aria-current="item.active ? 'page' : undefined"
            >
                <span class="bnav__check-dot"><Icon :name="item.glyph" :size="24" /></span>
                {{ item.label }}
            </Link>

            <Link
                v-else
                :href="item.target"
                class="bnav__item"
                :aria-current="item.active ? 'page' : undefined"
            >
                <Icon :name="item.glyph" :size="24" />
                {{ item.label }}
                <span v-if="item.isCart && shared.cartCount > 0" class="bnav__badge">
                    {{ shared.cartCount }}
                </span>
            </Link>
        </template>
    </nav>
</template>
