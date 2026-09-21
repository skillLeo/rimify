<script setup lang="ts">
/**
 * The basket.
 *
 * The empty state is designed rather than defaulted: an empty basket is a page people reach by
 * accident, and it should send them somewhere rather than apologise.
 */

import { Head, Link } from '@inertiajs/vue3'
import BasketLines from '../../Components/Basket/BasketLines.vue'
import Icon from '../../Components/Art/Icon.vue'
import type { BasketProps } from '../../types/pages'

defineProps<BasketProps>()
</script>

<template>
    <Head title="Warenkorb" />

    <section class="section">
        <div class="wrap">
            <h1 class="t-h1">Warenkorb</h1>

            <div v-if="lines.length > 0" class="split cart__split">
                <div class="card cart__lines">
                    <BasketLines :lines="lines" />
                </div>

                <aside class="card cart__summary">
                    <h2 class="t-h3">Zusammenfassung</h2>

                    <dl class="cart__rows">
                        <div>
                            <dt>Zwischensumme</dt>
                            <dd class="tabular">{{ totals.subtotal }}</dd>
                        </div>
                        <div>
                            <dt>Versand</dt>
                            <dd class="tabular">
                                {{ totals.freeShipping ? 'Kostenlos' : totals.shipping }}
                            </dd>
                        </div>
                    </dl>

                    <hr class="hr" />

                    <div class="cart__total">
                        <span class="t-ui">Gesamt</span>
                        <span class="price">{{ totals.total }}</span>
                    </div>
                    <p class="price-note">inkl. {{ totals.tax }} MwSt.</p>

                    <Link href="/kasse" class="btn btn--primary btn--block btn--lg cart__go">
                        Zur Kasse
                    </Link>

                    <p class="cart__ssl">
                        <Icon name="lock" :size="20" />
                        <span class="micro">SSL gesichert</span>
                    </p>
                </aside>
            </div>

            <div v-else class="state">
                <Icon name="cart" :size="24" />
                <p class="state__title">Dein Warenkorb ist leer.</p>
                <p class="t-body">
                    Wähle dein Fahrzeug – wir zeigen dir anschließend nur Felgen, die dafür
                    freigegeben sind.
                </p>
                <Link href="/felgen-suchen" class="btn btn--primary">Fahrzeug wählen</Link>
            </div>
        </div>
    </section>
</template>

<style scoped>
.cart__split {
    margin-top: var(--space-5);
}

.cart__lines {
    padding: var(--space-3) var(--space-4);
}

.cart__rows {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-4) 0;
}

.cart__rows div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    font-size: 15px;
}

.cart__rows dt {
    color: var(--ink2);
}

.cart__rows dd {
    margin: 0;
    font-weight: 700;
}

.cart__total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-top: var(--space-4);
}

.cart__go {
    margin-top: var(--space-4);
}

.cart__ssl {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    margin: var(--space-4) 0 0;
    color: var(--ink3);
}
</style>
