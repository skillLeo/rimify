<script setup lang="ts">
/**
 * The footer: how to reach a person, where the shop's pages are, and the legal lines a German
 * shop owes its customers. Payment and shipping marks appear here the day they are configured;
 * until then, none are drawn.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Ui/Icon.vue'
import { useConsent } from '../../composables/useConsent'
import { useShell } from '../../composables/useShell'
import { useMenus, useShared } from '../../composables/useShared'

const shared = useShared()
const menus = useMenus()
const consent = useConsent()
const shell = useShell()

const contact = computed(() => shared.value.contact)
const telHref = computed(() => `tel:${contact.value.phoneIntl.replace(/\s/g, '')}`)
const waHref = computed(() => `https://wa.me/${contact.value.whatsapp.replace(/[^\d]/g, '')}`)
const year = new Date().getFullYear()
</script>

<template>
    <footer class="footer dark">
        <div class="container">
            <div class="footer__grid">
                <div class="footer__brand">
                    <span class="brand">RIMIFY</span>
                    <p class="footer__claim">Felgen, deren Gutachten dein Fahrzeug nennt.</p>
                    <ul class="footer__contact">
                        <li>
                            <a :href="telHref" class="footer__contact-link num"><Icon name="phone" :size="20" />{{ contact.phone }}</a>
                        </li>
                        <li>
                            <!-- The official WhatsApp mark is never redrawn (DIRECTION §7); until the
                                 brand kit is in, the slot keeps the four rows aligned. -->
                            <a :href="waHref" class="footer__contact-link num" rel="noopener" target="_blank"><span class="footer__icon-slot" aria-hidden="true" />WhatsApp {{ contact.whatsapp }}</a>
                        </li>
                        <li>
                            <a :href="`mailto:${contact.email}`" class="footer__contact-link"><Icon name="mail" :size="20" />{{ contact.email }}</a>
                        </li>
                        <li class="footer__hours"><Icon name="clock" :size="20" />{{ contact.hours }}</li>
                    </ul>
                </div>

                <nav class="footer__col" aria-labelledby="ftr-shop">
                    <p id="ftr-shop" class="footer__title">Shop</p>
                    <ul>
                        <li v-for="item in menus.footer_shop" :key="item.label">
                            <Link :href="item.href" class="footer__link">{{ item.label }}</Link>
                        </li>
                    </ul>
                </nav>

                <nav class="footer__col" aria-labelledby="ftr-service">
                    <p id="ftr-service" class="footer__title">Service</p>
                    <ul>
                        <li v-for="item in menus.footer_service" :key="item.label">
                            <Link :href="item.href" class="footer__link">{{ item.label }}</Link>
                        </li>
                        <li><button class="footer__link footer__button" type="button" @click="shell.helpOpen.value = true">Tastenkürzel</button></li>
                    </ul>
                </nav>

                <nav class="footer__col" aria-labelledby="ftr-legal">
                    <p id="ftr-legal" class="footer__title">Rechtliches</p>
                    <ul>
                        <li v-for="item in menus.footer_legal" :key="item.label">
                            <Link :href="item.href" class="footer__link">{{ item.label }}</Link>
                        </li>
                        <li><button class="footer__link footer__button" type="button" @click="consent.openSettings()">Cookie-Einstellungen</button></li>
                    </ul>
                </nav>
            </div>

            <div class="footer__base">
                <span>Alle Preise inkl. gesetzl. MwSt., zzgl. Versandkosten.</span>
                <span class="num">© RIMIFY {{ year }}</span>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    padding-block: var(--sp-64) var(--sp-32);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.footer__grid {
    display: grid;
    gap: var(--sp-40);
}

.brand {
    font-size: var(--fs-h4);
    font-weight: 700;
    font-stretch: var(--wdth-display);
    letter-spacing: 0.04em;
    color: var(--c-surface);
}

.footer__claim {
    max-width: 32ch;
    margin: var(--sp-12) 0 var(--sp-24);
    color: var(--c-on-dark-2);
    font-size: var(--fs-body);
    line-height: var(--lh-body);
}

.footer__contact {
    display: grid;
    gap: var(--sp-4);
}

.footer__contact-link,
.footer__hours {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-8);
    min-height: 32px;
    color: var(--c-surface);
    text-decoration: none;
}

.footer__icon-slot {
    flex: none;
    width: 20px;
}

.footer__hours {
    color: var(--c-on-dark-2);
}

@media (hover: hover) and (pointer: fine) {
    .footer__contact-link:hover,
    .footer__link:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

.footer__title {
    margin-bottom: var(--sp-8);
    color: var(--c-surface);
    font-weight: 500;
}

.footer__col ul {
    display: grid;
}

.footer__link {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    color: var(--c-on-dark-2);
    text-decoration: none;
}

.footer__button {
    padding: 0;
    border: 0;
    background: transparent;
    font: inherit;
    cursor: pointer;
}

@media (pointer: coarse) {
    .footer__link,
    .footer__contact-link {
        min-width: 44px;
        min-height: 44px;
    }
}

.footer__base {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--sp-8) var(--sp-24);
    margin-top: var(--sp-48);
    padding-top: var(--sp-16);
    border-top: 1px solid var(--c-dark-2);
    color: var(--c-on-dark-2);
}

@media (min-width: 768px) {
    .footer__grid {
        grid-template-columns: minmax(0, 1.4fr) repeat(3, minmax(0, 1fr));
        gap: var(--sp-32);
    }
}
</style>
