<script setup lang="ts">
/**
 * Warenkorb — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/warenkorb.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The
 * Komplettrad list and the blue RIMIFY-GARANTIE panel stack one under the other instead of
 * sharing a two-column grid; the guarantee's wordmark loses its line break and its four points
 * run down one column; the order summary is a `pad-s` card rather than a `pad` card inside a
 * `spread`. None of that can be reached from the desktop markup with media queries, which is why
 * the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, and the `data-mount` divs stay empty for `shared/pages2.js` to fill. Any visual fix
 * belongs in the shared CSS/JS, never in new markup added here.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Warenkorb" />

    <main id="main">
    <div class="wrap" style="padding:24px 16px 56px">
            <h1 class="h2">Warenkorb</h1>

            <div style="margin-top:20px" data-mount="cart-lines"></div>

            <h2 class="h4" style="margin-top:32px">Räder kommen im Komplettrad</h2>
            <div style="margin-top:12px;display:flex;flex-direction:column;gap:10px">
                <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#1A44D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="bl" style="font:400 14px/1.4 Lato,sans-serif">inkl. Montage der Reifen auf die Felgen</span></div>
                <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#1A44D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="bl" style="font:400 14px/1.4 Lato,sans-serif">inkl. Anbauset &amp; ABE</span></div>
                <div class="row" style="gap:10px"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#1A44D4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="bl" style="font:400 14px/1.4 Lato,sans-serif">inkl. Wuchten</span></div>
            </div>

            <div style="background:var(--blue);border-radius:12px;padding:18px;margin-top:20px">
                <div class="row" style="gap:12px">
                    <svg width="26" height="26" viewBox="0 0 20 20" fill="none" style="flex:none"><circle cx="10" cy="10" r="10" fill="#fff"/><path d="M5.8 10.3l2.7 2.7 5.7-5.9" stroke="#1A44D4" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <strong style="font:700 15px/1.2 Lato,sans-serif;color:#fff">RIMIFY-GARANTIE</strong>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
                    <div class="row" style="gap:8px;color:#fff"><svg width="14" height="14" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 13px/1.3 Lato,sans-serif">Garantierte Passgenauigkeit</span></div>
                    <div class="row" style="gap:8px;color:#fff"><svg width="14" height="14" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 13px/1.3 Lato,sans-serif">Express Versand</span></div>
                    <div class="row" style="gap:8px;color:#fff"><svg width="14" height="14" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 13px/1.3 Lato,sans-serif">Gutachten zu jeder Felge</span></div>
                    <div class="row" style="gap:8px;color:#fff"><svg width="14" height="14" viewBox="0 0 18 18" fill="none" style="flex:none"><path d="M3.5 9.4l3.4 3.4 7.6-7.9" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:400 13px/1.3 Lato,sans-serif">Montiert und gewuchtet</span></div>
                </div>
            </div>

            <div data-mount="cart-options"></div>

            <div class="wash row" style="margin-top:28px;gap:14px;padding:16px">
                <span class="bl" style="display:flex"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2h11.6v9.6H2.5zM14.1 9.4h4.2l3.2 3.2v3.2h-7.4M6.5 20a2 2 0 100-4 2 2 0 000 4zM17.5 20a2 2 0 100-4 2 2 0 000 4z"/></svg></span>
                <div><div style="font:700 14px/1 Lato,sans-serif">Lieferung</div>
                    <div class="ink2 mono" style="margin-top:4px">voraussichtlich 21.11.2025</div></div>
            </div>

            <h2 class="h4" style="margin-top:32px">Deine Bestellung</h2>
            <div class="card raised pad-s" style="margin-top:14px" data-mount="cart-sum"></div>
        </div>
    </main>
</template>
