<script setup lang="ts">
/** The tile while its data loads: the same six lines, at the same heights, in the same grid. */

import Skeleton from './Skeleton.vue'
</script>

<template>
    <div class="tile" aria-hidden="true">
        <Skeleton tile height="auto" class="tile__media" />
        <Skeleton width="38%" height="var(--lh-small)" />
        <Skeleton width="72%" height="var(--lh-body)" />
        <Skeleton width="48%" height="var(--lh-small)" />
        <Skeleton width="56%" height="var(--lh-small)" />
        <Skeleton width="60%" height="var(--lh-body)" style="margin-top: var(--sp-4)" />
        <Skeleton width="66%" height="var(--lh-micro)" />
    </div>
</template>
