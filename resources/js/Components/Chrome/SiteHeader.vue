<script setup lang="ts">
/**
 * The black header and the vehicle-context state machine.
 *
 * `headerMode` arrives from the server in the first Inertia response and nothing here recomputes
 * it (R-08). That is why the white box and the blue bar can never both appear, and why the header
 * is correct on first paint rather than rendering plain and swapping a frame later — a header that
 * corrects itself tells the customer the site is unsure which car they chose.
 */

import { Link } from '@inertiajs/vue3'
import { computed } from 'vue'
import Icon from '../Art/Icon.vue'
import { resolveHref, useMenus, useShared } from '../../composables/useShared'

const shared = useShared()
const menus = useMenus()

const vehicle = computed(() => shared.value.vehicle)
const mode = computed(() => shared.value.headerMode)
const listingHref = computed(() => '/felgen')

const items = computed(() =>
    menus.value.header.map((item) => ({
        ...item,
        target: resolveHref(item.href, item.behaviour, vehicle.value !== null, listingHref.value),
    }))
)

defineEmits<{ (e: 'open-menu'): void; (e: 'open-vehicle'): void }>()
</script>

<template>
    <!-- State three. Used where the page is NOT about buying: it offers a way back into the
         listing rather than restating the vehicle a second time inside the black bar. -->
    <div v-if="mode === 'BLUE_BAR' && vehicle" class="vbar">
        <div class="vbar__inner">
            <span>Gewähltes Fahrzeug: {{ vehicle.short }}</span>
            <span aria-hidden="true">|</span>
            <Link :href="listingHref" class="vbar__link">Felgen anzeigen</Link>
        </div>
    </div>

    <header class="hdr">
        <div class="hdr__bar">
            <button
                class="hdr__icon mobile-only"
                type="button"
                aria-label="Menü öffnen"
                @click="$emit('open-menu')"
            >
                <Icon name="menu" :size="24" />
            </button>

            <Link href="/" class="wordmark" aria-label="RIMIFY — Startseite">RIMIFY</Link>

            <!-- State two: the white box, inside the buying process only. -->
            <button
                v-if="mode === 'WHITE_BOX' && vehicle"
                class="hdr__vbox"
                type="button"
                @click="$emit('open-vehicle')"
            >
                <span class="hdr__vbox-label">Gewähltes Fahrzeug:</span>
                <span class="hdr__vbox-name">
                    <span class="desktop-only">{{ vehicle.label }}</span>
                    <span class="mobile-only">{{ vehicle.short }}</span>
                    <span class="hdr__vbox-keys desktop-only">({{ vehicle.keyNumbers }})</span>
                </span>
            </button>

            <nav class="hdr__nav" aria-label="Hauptnavigation">
                <Link
                    v-for="item in items"
                    :key="item.label"
                    :href="item.target"
                    class="hdr__link"
                    :aria-current="shared.routeName === item.routeName ? 'page' : undefined"
                >
                    {{ item.label }}
                </Link>
            </nav>

            <Link href="/warenkorb" class="hdr__cart" aria-label="Warenkorb">
                <Icon name="cart" :size="24" />
                <span class="hdr__cart-label">Warenkorb</span>
                <span v-if="shared.cartCount > 0" class="hdr__badge">{{ shared.cartCount }}</span>
            </Link>
        </div>
    </header>
</template>

<style scoped>
.hdr__vbox {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    margin-left: var(--s4);
    padding: 10px var(--s3);
    background: var(--surface);
    border: 0;
    border-radius: var(--r-btn);
    cursor: pointer;
    text-align: left;
    /* It must never wrap to two lines and never push the cart off a 390px screen. */
    min-width: 0;
    max-width: 46vw;
}

.hdr__vbox-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--ink2);
    line-height: 1.1;
}

.hdr__vbox-name {
    display: flex;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.hdr__vbox-keys {
    font-family: var(--mono);
    font-weight: 500;
    color: var(--ink2);
}

.hdr__cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    position: relative;
    min-width: 44px;
    min-height: 44px;
    margin-left: var(--s3);
    color: #fff;
    text-decoration: none;
}

.hdr__cart-label {
    font-size: 11px;
    font-weight: 700;
}

.vbar__link {
    color: #fff;
    text-decoration: underline;
}

@media (max-width: 720px) {
    .hdr__cart-label {
        display: none;
    }

    .hdr__vbox {
        margin-left: auto;
    }
}
</style>
