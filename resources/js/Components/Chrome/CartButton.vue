<script setup lang="ts">
/**
 * The basket in a phone header, left of the menu (the client's #13, D-122): the cart icon with the number of items in
 * it, the same count the desktop header shows. Its name says the number, so it is heard as well as seen; the badge
 * itself is hidden from assistive technology.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Ui/Icon.vue'
import { useShared } from '../../composables/useShared'

const shared = useShared()
const count = computed(() => shared.value.cartCount ?? 0)
</script>

<template>
    <Link href="/warenkorb" class="icon-btn cart-btn" :aria-label="count > 0 ? `Warenkorb, ${count} Artikel` : 'Warenkorb'" prefetch>
        <Icon name="cart" :size="24" />
        <span v-if="count > 0" class="badge badge--count cart-btn__n" aria-hidden="true">{{ count }}</span>
    </Link>
</template>

<style scoped>
.cart-btn {
    position: relative;
}

.cart-btn__n {
    position: absolute;
    top: 2px;
    right: 0;
}
</style>
