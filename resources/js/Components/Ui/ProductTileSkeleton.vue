<script setup lang="ts">
/**
 * The tile while its data loads: the same lines, at the same heights, in the same grid, and the
 * CTA's block where the CTA will be — so the row does not move when the cards arrive.
 */

import Skeleton from './Skeleton.vue'
</script>

<template>
    <div class="tile tile--skeleton" aria-hidden="true">
        <Skeleton tile height="auto" class="tile__media" />
        <Skeleton width="38%" height="var(--lh-small)" />
        <Skeleton width="72%" height="var(--lh-body)" />
        <Skeleton width="48%" height="var(--lh-small)" />
        <Skeleton width="56%" height="var(--lh-small)" />
        <Skeleton width="60%" height="var(--lh-body)" class="tile__skeleton-price" />
        <Skeleton width="66%" height="var(--lh-micro)" />
        <div class="tile__actions">
            <span class="skeleton tile__skeleton-cta" />
        </div>
    </div>
</template>

<style scoped>
.tile__skeleton-price {
    margin-top: var(--sp-4);
}

.tile__skeleton-cta {
    display: block;
    width: 140px;
    height: 36px;
}

@media (pointer: coarse) {
    .tile__skeleton-cta {
        height: 48px;
    }
}
</style>
