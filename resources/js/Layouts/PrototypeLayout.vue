<script setup lang="ts">
/**
 * The page frame — and now deliberately nothing at all.
 *
 * This used to render `<main id="main">` for every page. That was wrong for five of the
 * thirty-four: the design's mobile admin shells carry `<main id="main" style="padding-bottom:0">`
 * and mobile kasse `padding-bottom:40px`, cancelling the 96px that `components.css` reserves for
 * the phone's bottom bar on screens that do not have one. A layout cannot express that — the tag
 * differs per page AND per device, and Inertia resolves the layout before the device is known —
 * so each page now carries its own <main>, copied from its shell like the rest of its markup.
 *
 * What remains is a passthrough. It is kept rather than deleted because it is the one place a
 * document-level wrapper could go if the design ever grows one, and because removing it would
 * mean editing seventeen Index files to say nothing.
 *
 * The header, the blue vehicle bar, the footer and the bottom bar are NOT here and never were:
 * `shared/app.js` writes them into the `#top` and `#bottom` divs in app.blade.php.
 */
</script>

<template>
    <slot />
</template>
