<script setup lang="ts">
/**
 * The product frame.
 *
 * RIMIFY has no photography of its own yet, and the two dishonest ways to fill this box are both
 * off the table: a stock photograph of a different wheel (the customer is buying a specific part
 * number), and a drawing presented as though it were a photograph.
 *
 * So the frame shows the technical drawing of the wheel — spoke count and finish are real, they
 * come from the catalogue row — and says plainly, under the drawing, that the photograph is still
 * to come. The day the client's photographs arrive this component swaps the drawing for an <img>
 * and the caption disappears.
 *
 * The frame is a size container: a caption that fits a 560px gallery collides with the drawing in
 * a 140px card on a phone, so the caption shortens by the frame's own width, not the viewport's.
 */

import Wheel from '../Art/Wheel.vue'
import type { Finish } from '../../art'

withDefaults(
    defineProps<{
        spokes: number
        finish: Finish | string
        size?: number
        /** The gallery frame carries the caption; a 72px basket thumbnail does not. */
        note?: boolean
    }>(),
    { size: 320, note: true }
)
</script>

<template>
    <span class="pphoto">
        <span class="pphoto__art">
            <Wheel :spokes="spokes" :finish="finish" :size="size" />
        </span>
        <span v-if="note" class="pphoto__note">
            Foto folgt<span class="pphoto__kind"> · Technische Darstellung</span>
        </span>
    </span>
</template>

<style scoped>
.pphoto {
    container-type: inline-size;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    width: 100%;
    height: 100%;
}

.pphoto__art {
    display: grid;
    place-items: center;
    min-height: 0;
    padding: 10% 10% 4%;
}

.pphoto__art :deep(svg) {
    width: 100%;
    height: 100%;
    max-height: 100%;
    object-fit: contain;
}

/* A caption under the drawing, never on top of it. */
.pphoto__note {
    padding: 0 var(--space-3) var(--space-3);
    font-size: var(--text-small);
    color: var(--ink3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

@container (max-width: 240px) {
    .pphoto__kind {
        display: none;
    }

    .pphoto__note {
        padding: 0 var(--space-2) var(--space-2);
    }
}
</style>
