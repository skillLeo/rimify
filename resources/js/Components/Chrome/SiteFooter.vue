<script setup lang="ts">
/**
 * The black footer. Four columns on desktop, stacked on the phone.
 *
 * Social glyphs are monochrome white at 70% opacity, NOT the coloured circular brand badges in the
 * client's Figma — coloured badges are on the banned list, and four brand colours beside a single
 * accent is exactly what makes a page read as templated.
 */

import { Link } from '@inertiajs/vue3'
import { useMenus } from '../../composables/useShared'

const menus = useMenus()
const year = new Date().getFullYear()
</script>

<template>
    <footer class="ftr">
        <div class="ftr__cols">
            <div>
                <span class="wordmark">RIMIFY</span>
                <p class="ftr__company">
                    RIMIFY — Felgen und Kompletträder<br />
                    mit geprüfter Freigabe für dein Fahrzeug.
                </p>
                <div class="ftr__social" aria-label="RIMIFY in sozialen Netzwerken">
                    <a href="#" aria-label="Facebook" class="ftr__glyph">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                            <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6A22 22 0 0 0 14.3 3.5c-2.4 0-4 1.45-4 4.1v2.3H7.6V13h2.7v8Z" />
                        </svg>
                    </a>
                    <a href="#" aria-label="TikTok" class="ftr__glyph">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                            <path d="M15.6 3h-2.7v12.1a2.3 2.3 0 1 1-1.9-2.26V10.1a5 5 0 1 0 4.6 5V8.8a6.1 6.1 0 0 0 3.5 1.1V7.2a3.6 3.6 0 0 1-3.5-3.6Z" />
                        </svg>
                    </a>
                    <a href="#" aria-label="Instagram" class="ftr__glyph">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                            <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" />
                            <circle cx="12" cy="12" r="4" />
                            <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                        </svg>
                    </a>
                    <a href="#" aria-label="WhatsApp" class="ftr__glyph">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                            <path d="M12 3a8.6 8.6 0 0 0-7.3 13.2L3.5 21l4.95-1.15A8.6 8.6 0 1 0 12 3Zm4.6 12.1c-.2.55-1.15 1.05-1.6 1.1-.45.05-.9.25-3-.65a10.5 10.5 0 0 1-4.3-3.85c-.3-.5-.85-1.5-.8-2.45.05-.95.6-1.4.8-1.6.2-.2.45-.25.6-.25h.45c.15 0 .35-.05.55.4l.75 1.85c.05.15.1.3 0 .45l-.35.45c-.1.15-.25.3-.1.55a7.8 7.8 0 0 0 3.45 2.95c.25.1.4.1.55-.05l.65-.75c.15-.2.3-.15.5-.1l1.75.85c.2.1.35.15.4.25.05.1.05.5-.15 1.05Z" />
                        </svg>
                    </a>
                </div>
            </div>

            <div>
                <p class="ftr__head">Seiten</p>
                <ul class="ftr__list">
                    <li v-for="item in menus.footer_pages" :key="item.label">
                        <Link :href="item.href">{{ item.label }}</Link>
                    </li>
                </ul>
            </div>

            <div>
                <p class="ftr__head">Rechtliches</p>
                <ul class="ftr__list">
                    <li v-for="item in menus.footer_legal" :key="item.label">
                        <Link :href="item.href">{{ item.label }}</Link>
                    </li>
                </ul>
            </div>

            <div>
                <p class="ftr__news-title">Verpasse keine Angebote!</p>
                <p class="ftr__news-sub">Jetzt für Newsletter anmelden und profitieren.</p>
                <form class="ftr__news" @submit.prevent>
                    <label class="visually-hidden" for="ftr-mail">E-Mail*</label>
                    <input id="ftr-mail" class="field" type="email" placeholder="E-Mail*" />
                    <button class="btn btn--primary btn--block" type="submit">Senden</button>
                </form>
            </div>
        </div>

        <div class="ftr__base">
            <span class="ftr__copy">© RIMIFY {{ year }}</span>
        </div>
    </footer>
</template>

<style scoped>
.ftr__company {
    margin: var(--s3) 0 var(--s4);
    font-size: 14px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.62);
    max-width: 42ch;
}

.ftr__social {
    display: flex;
    gap: var(--s3);
}

.ftr__glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-left: -12px;
    color: #fff;
    opacity: 0.7;
    transition: opacity var(--d-hover) var(--ease);
}

.ftr__glyph:hover {
    opacity: 1;
}

.ftr__news-title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
}

.ftr__news-sub {
    margin: 4px 0 var(--s3);
    font-size: 14px;
    color: rgba(255, 255, 255, 0.62);
}

.ftr__news {
    display: grid;
    gap: var(--s2);
}

.ftr__base {
    justify-content: center;
}

.ftr__copy {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);
}
</style>
