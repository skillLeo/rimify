<script setup lang="ts">
/**
 * Kontakt — mobile.
 *
 * PORTED VERBATIM from `design-reference/mobile/kontakt.html`.
 *
 * This is a DIFFERENT DOCUMENT from the desktop page, not a responsive variant of it. The desktop
 * page puts the form in the left column of a two-column grid and the contact details on the right;
 * here the order is reversed — address block and workshop scene first, the form beneath as a
 * `.card.raised.pad-s` with stacked full-width labels rather than two `.grid2` rows, and the legal
 * links sit outside the form at the very bottom. None of that can be reached from the desktop
 * markup with media queries, which is why the design ships two files and so do we.
 *
 * The same rules apply as on the desktop page: the markup is the design's, character for
 * character, the `scene-werkstatt` slot stays empty for `shared/pages2.js` to fill at runtime, and
 * the `kontakt-form` section is handed to the same runtime with the shell's own markup inside it.
 *
 * If something looks wrong on screen, the fix belongs in the shared CSS/JS — never in new markup
 * added to this file.
 */

import { Head, usePage } from '@inertiajs/vue3'

// Contact details come from config/rimify.php through KontaktController (decisions log D-023).
const contact = usePage<{ contact: { email: string; phone: string } }>().props.contact
</script>

<template>
    <Head title="Kontakt" />

    <main id="main">
    <div class="wrap" style="padding:32px 16px 56px">
            <section>
                <h1 class="h2" style="text-align:center">Kontaktiere uns</h1>
                <p class="body ink2" style="margin-top:14px;text-align:center">Fragen zur Passgenauigkeit, zu einer Bestellung oder zu einem Gutachten? Schreib uns oder ruf einfach an – wir antworten in der Regel noch am selben Werktag.</p>

                <div style="margin-top:24px;display:flex;flex-direction:column;gap:18px;align-items:center">
                    <div class="row" style="gap:12px">
                        <span class="bl" style="display:flex"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.2 5.2h17.6v13.6H3.2zM3.8 6.4L12 12.6l8.2-6.2"/></svg></span>
                        <a :href="`mailto:${contact.email}`" class="tap" style="font:700 16px/1 Lato,sans-serif;color:var(--ink)">{{ contact.email }}</a>
                    </div>
                    <div class="row" style="gap:12px;align-items:flex-start">
                        <span class="bl" style="display:flex"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5.3 4h3.6l1.5 3.6-2.2 1.7a12.2 12.2 0 005.6 5.6l1.7-2.2 3.6 1.5v3.6c0 .7-.6 1.3-1.3 1.2C9.4 18.4 5.6 14.6 4.1 5.3 4 4.6 4.6 4 5.3 4z"/></svg></span>
                        <div><div style="font:700 16px/1 Lato,sans-serif;font-variant-numeric:tabular-nums">{{ contact.phone }}</div>
                            <div class="ink3" style="font:400 13px/1 Lato,sans-serif;margin-top:5px">Mo-Fr: 9:00 - 18:00 Uhr</div></div>
                    </div>
                </div>

                <h2 class="h4" style="margin-top:24px;text-align:center">Wir freuen uns von dir zu hören.</h2>
                <div style="margin-top:16px;border-radius:12px;overflow:hidden" data-mount="scene-werkstatt"></div>
            </section>

            <section class="card raised pad-s" style="margin-top:28px" data-mount="kontakt-form">
                <h2 class="h3">Sende uns eine Nachricht</h2>
                <label class="flabel" style="margin-top:18px">Vollständiger Name<span class="req">*</span></label><input class="field" required>
                <label class="flabel" style="margin-top:14px">Firma</label><input class="field">
                <label class="flabel" style="margin-top:14px">E-Mail<span class="req">*</span></label><input class="field" type="email" required>
                <label class="flabel" style="margin-top:14px">Telefon</label><input class="field" type="tel">
                <label class="flabel" style="margin-top:14px">Nachricht<span class="req">*</span></label><textarea class="field" required></textarea>
                <p class="ink3" style="font:400 12px/1.5 Lato,sans-serif;margin-top:10px">Pflichtfelder mit * markiert.</p>
                <div style="height:78px;background:var(--field);border-radius:8px;margin-top:14px;display:flex;align-items:center;gap:12px;padding:0 16px">
                    <span class="ink3" style="display:flex"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 2.8v5.1c0 4.7-3.1 8-7.5 9.3-4.4-1.3-7.5-4.6-7.5-9.3V5.8L12 3z"/></svg></span>
                    <div><div class="micro">Sicherheitsprüfung</div>
                        <div class="ink3" style="font:400 12px/1.4 Lato,sans-serif;margin-top:4px">Automatisch geprüft – kein Klick nötig.</div></div>
                </div>
                <button class="btn btn-p btn-full" style="margin-top:18px" data-send>Senden</button>
            </section>

            <div class="row" style="gap:18px;margin-top:24px;flex-wrap:wrap;justify-content:center">
                <a href="rechtliches.html?t=impressum" class="ink2 tap" style="font:400 13px/1 Lato,sans-serif">Impressum</a>
                <a href="rechtliches.html?t=datenschutz" class="ink2 tap" style="font:400 13px/1 Lato,sans-serif">Datenschutz</a>
                <a href="rechtliches.html?t=versand" class="ink2 tap" style="font:400 13px/1 Lato,sans-serif">Versandinformationen</a>
            </div>
        </div>
    </main>
</template>
