<script setup lang="ts">
/**
 * The footer.
 *
 * Its job is to answer the three questions a German shopper checks before paying: who is behind
 * this shop, how do I reach a person, and what happens if I want to send it back. So the first
 * column is a real phone number with real hours rather than a row of reassuring icons — a claim
 * with a number behind it is worth more than four claims without one.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Art/Icon.vue'
import { useMenus, useShared } from '../../composables/useShared'

const shared = useShared()
const menus = useMenus()
const contact = computed(() => shared.value.contact)
const telHref = computed(() => `tel:${(contact.value?.phoneIntl ?? '').replace(/\s/g, '')}`)
const year = new Date().getFullYear()
</script>

<template>
    <footer class="ftr">
        <div class="ftr__cols">
            <div>
                <span class="wordmark wordmark--light">RIMIFY</span>
                <p class="ftr__company">
                    Felgen und Kompletträder mit geprüfter Freigabe für dein Fahrzeug.
                </p>

                <template v-if="contact">
                    <p class="ftr__head">Wir sind erreichbar</p>
                    <a class="ftr__phone" :href="telHref">
                        <Icon name="phone" :size="20" />
                        {{ contact.phone }}
                    </a>
                    <p class="ftr__hours">{{ contact.hours }}</p>
                    <a class="ftr__mail" :href="`mailto:${contact.email}`">{{ contact.email }}</a>
                </template>
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
                <p class="ftr__head">Kauf bei RIMIFY</p>
                <ul class="ftr__list ftr__facts">
                    <li>
                        <Icon name="truck" :size="20" />
                        Versand aus Deutschland, versichert mit DHL
                    </li>
                    <li>
                        <Icon name="document" :size="20" />
                        Gutachten zu jeder Felge als PDF
                    </li>
                    <li>
                        <Icon name="shield" :size="20" />
                        14 Tage Widerrufsrecht auf unmontierte Ware
                    </li>
                </ul>
            </div>
        </div>

        <div class="ftr__base">
            <span>© RIMIFY {{ year }}</span>
            <span>Alle Preise inkl. MwSt., zzgl. Versand</span>
        </div>
    </footer>
</template>

<style scoped>
.ftr__company {
    margin: var(--space-3) 0 var(--space-5);
    max-width: 38ch;
}

.ftr__phone {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    font-size: var(--text-h3);
    font-weight: 700;
    color: var(--on-dark);
    text-decoration: none;
    font-variant-numeric: tabular-nums;
}

.ftr__hours {
    margin-top: var(--space-1);
}

.ftr__mail {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    text-decoration: underline;
}

.ftr__facts {
    gap: var(--space-3);
}

.ftr__facts li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
}

.ftr__facts :deep(svg) {
    flex: none;
    color: var(--on-dark-2);
}
</style>
