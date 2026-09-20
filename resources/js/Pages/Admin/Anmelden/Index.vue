<script setup lang="ts">
/**
 * The device split. `isMobile` is decided on the server from the User-Agent, so the first frame
 * the server renders is already the frame the client hydrates to.
 *
 * The two variants are separate documents in the design, not one responsive layout, so this
 * chooses between them rather than letting CSS reshape one into the other.
 *
 * The layout is `PrototypeLayout`, which renders `<main id="main">` and nothing else. The header
 * and footer are NOT rendered here: `shared/app.js` writes them into the `#top` and `#bottom`
 * divs in app.blade.php — and on this screen it leaves them empty, because the design's shell
 * marks `#bottom` as `hide` and the sign-in page carries no chrome at all.
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
