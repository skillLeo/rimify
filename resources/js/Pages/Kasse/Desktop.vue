<script setup lang="ts">
/**
 * Checkout. Guest only.
 *
 * `Zahlungspflichtig bestellen` is the exact wording on the final button, and it is not a style
 * choice: German distance-selling law requires the button to state that the order carries an
 * obligation to pay. `Jetzt kaufen` is not a lawful substitute.
 */

import { Head } from '@inertiajs/vue3'
import BasketLines from '../../Components/Basket/BasketLines.vue'
import Icon from '../../Components/Art/Icon.vue'
import type { KasseProps } from '../../types/pages'

defineProps<KasseProps>()
</script>

<template>
    <Head title="Kasse" />

    <section class="section">
        <div class="wrap">
            <h1 class="t-h1">Kasse</h1>

            <div class="split ko__split">
                <form class="stack-5" @submit.prevent>
                    <fieldset class="card ko__group">
                        <legend class="t-h3">Kontakt</legend>
                        <div class="ko__grid">
                            <div>
                                <label class="field-label" for="ko-mail">
                                    E-Mail <span class="field-label__req">*</span>
                                </label>
                                <input id="ko-mail" class="field" type="email" autocomplete="email" />
                            </div>
                            <div>
                                <label class="field-label" for="ko-tel">Telefon</label>
                                <input id="ko-tel" class="field" type="tel" autocomplete="tel" />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset class="card ko__group">
                        <legend class="t-h3">Lieferadresse</legend>
                        <div class="ko__grid">
                            <div>
                                <label class="field-label" for="ko-first">
                                    Vorname <span class="field-label__req">*</span>
                                </label>
                                <input id="ko-first" class="field" autocomplete="given-name" />
                            </div>
                            <div>
                                <label class="field-label" for="ko-last">
                                    Nachname <span class="field-label__req">*</span>
                                </label>
                                <input id="ko-last" class="field" autocomplete="family-name" />
                            </div>
                            <div class="ko__wide">
                                <label class="field-label" for="ko-street">
                                    Straße <span class="field-label__req">*</span>
                                </label>
                                <input id="ko-street" class="field" autocomplete="address-line1" />
                            </div>
                            <div>
                                <label class="field-label" for="ko-nr">
                                    Hausnummer <span class="field-label__req">*</span>
                                </label>
                                <input id="ko-nr" class="field" />
                            </div>
                            <div>
                                <label class="field-label" for="ko-zip">
                                    PLZ <span class="field-label__req">*</span>
                                </label>
                                <input id="ko-zip" class="field" inputmode="numeric" autocomplete="postal-code" />
                            </div>
                            <div class="ko__wide">
                                <label class="field-label" for="ko-city">
                                    Ort <span class="field-label__req">*</span>
                                </label>
                                <input id="ko-city" class="field" autocomplete="address-level2" />
                            </div>
                        </div>
                    </fieldset>
                </form>

                <aside class="card ko__summary">
                    <h2 class="t-h3">Deine Bestellung</h2>
                    <BasketLines :lines="lines" readonly />

                    <dl class="ko__rows">
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

                    <div class="ko__total">
                        <span class="t-ui">Gesamt</span>
                        <span class="price">{{ totals.total }}</span>
                    </div>
                    <p class="price-note">inkl. {{ totals.tax }} MwSt.</p>

                    <button class="btn btn--primary btn--block btn--lg ko__pay" type="button">
                        Zahlungspflichtig bestellen
                    </button>

                    <p class="ko__ssl">
                        <Icon name="lock" :size="20" />
                        <span class="micro">SSL gesichert</span>
                    </p>
                </aside>
            </div>
        </div>
    </section>
</template>

<style scoped>
.ko__split {
    margin-top: var(--space-5);
}

.ko__group {
    border: 0;
    margin: 0;
}

.ko__group legend {
    padding: 0;
    margin-bottom: var(--space-4);
}

.ko__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
}

.ko__wide {
    grid-column: span 2;
}

.ko__rows {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-4) 0;
}

.ko__rows div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
    font-size: 15px;
}

.ko__rows dt {
    color: var(--ink2);
}

.ko__rows dd {
    margin: 0;
    font-weight: 700;
}

.ko__total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-top: var(--space-4);
}

.ko__pay {
    margin-top: var(--space-4);
}

.ko__ssl {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    margin: var(--space-4) 0 0;
    color: var(--ink3);
}
</style>
