<script setup lang="ts">
/**
 * The device split. `isMobile` is decided on the server from the User-Agent, so the first frame
 * the server renders is already the frame the client hydrates to.
 *
 * The two variants are separate documents in the design, not one responsive layout, so this
 * chooses between them rather than letting CSS reshape one into the other.
 *
 * The layout is `PrototypeLayout`, which renders `<main id="main">` and nothing else — NOT
 * `AdminLayout`. In the design the admin panel's sidebar, top bar and module rail are part of the
 * page's own markup (`.adm` / `.adm-side` / `.adm-top` / `.adm-rail`), filled at runtime by
 * `shared/admin.js`. A Vue layout of our own would draw a second, hand-written panel frame over
 * the design's.
 */

import PrototypeLayout from '../../../Layouts/PrototypeLayout.vue'
import Desktop from './Desktop.vue'
import Mobile from './Mobile.vue'
import { useShared } from '../../../composables/useShared'

defineOptions({ layout: PrototypeLayout })

const shared = useShared()
</script>

<template>
    <component :is="shared.isMobile ? Mobile : Desktop" />
</template>
