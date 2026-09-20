<script setup lang="ts">
/**
 * Felgen suchen (Auto wählen) — desktop.
 *
 * PORTED VERBATIM from `design-reference/desktop/felgen-suchen.html`, the design's own shell.
 *
 * Read this before editing:
 *
 *  - Everything below is the design's markup, character for character, including every inline
 *    style. It is not "based on" the prototype; it IS the prototype. Do not tidy the inline styles
 *    into classes, do not extract components, do not reorder attributes, do not change a pixel
 *    value because it looks odd. All of that is measured.
 *  - The `data-mount` divs are intentionally empty. `shared/pages.js` fills each one at runtime
 *    with the real markup for that slot (the guided selector, the HSN/TSN selector, the
 *    Fahrzeugschein diagram). Filling one here by hand would put our markup back into the page and
 *    re-create exactly the drift this replaced. The `doc-toggle` mount is the one exception: the
 *    design ships the `.seg` buttons inside it as the pre-runtime state, so they are copied too.
 *  - The German copy is the design's. It is not translated, not rewritten, not corrected.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head } from '@inertiajs/vue3'
</script>

<template>
    <Head title="Auto wählen" />

    <main id="main">
    <div class="wrap" style="padding-top:80px;padding-bottom:96px">
            <h1 class="h2">Auto wählen, garantiert passende Felge finden</h1>
            <p class="body ink2" style="margin-top:10px;max-width:70ch">Zwei Wege – über die Fahrzeugdaten oder direkt über die Schlüsselnummern aus deinem Fahrzeugschein.</p>

            <div class="card raised pnl pad-l" style="max-width:1080px;margin-top:32px;display:grid;grid-template-columns:1fr 1px 1fr;gap:40px">
                <div>
                    <h2 class="h4" style="font-size:15px">Wähle dein Auto</h2>
                    <div style="margin-top:16px" data-mount="sel-guided"></div>
                </div>
                <div style="background:var(--line)"></div>
                <div>
                    <h2 class="h4" style="font-size:15px">Oder ganz einfach mit Fahrzeugschein</h2>
                    <div style="margin-top:16px" data-mount="sel-keys"></div>
                    <div style="margin-top:24px" data-mount="doc-toggle">
                        <div class="seg"><button data-v="neu" aria-pressed="true">Neuer Fahrzeugschein</button><button data-v="alt" aria-pressed="false">Alter Fahrzeugschein</button></div>
                    </div>
                    <div style="margin-top:16px;background:var(--wash);border-radius:12px;padding:20px">
                        <div data-mount="doc"></div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
