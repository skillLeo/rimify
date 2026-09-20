<script setup lang="ts">
/**
 * The device split. `isMobile` is decided on the server from the User-Agent, so the first frame
 * the server renders is already the frame the client hydrates to.
 *
 * The two variants are separate documents in the design, not one responsive layout, so this
 * chooses between them rather than letting CSS reshape one into the other.
 *
 * The layout is `PrototypeLayout`, which renders `<main id="main">` and nothing else. The admin
 * sidebar, top bar and module rail are NOT rendered here: they are `data-mount` slots inside the
 * page that `shared/admin.js` fills, and the site header and footer are written by `shared/app.js`
 * into the `#top` and `#bottom` divs in app.blade.php. Using the old `AdminLayout` would draw a
 * second, hand-written chrome over the design's own.
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
