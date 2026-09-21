<script setup lang="ts">
/**
 * Checkout on a phone: one column, the summary collapsed above the form so the total is visible
 * before the typing starts rather than after it.
 */

import { Head } from '@inertiajs/vue3'
import { ref } from 'vue'
import Icon from '../../Components/Art/Icon.vue'
import type { KasseProps } from '../../types/pages'

defineProps<KasseProps>()

const summaryOpen = ref(false)
</script>

<template>
    <Head title="Kasse" />

    <section class="section mko">
        <div class="wrap">
            <h1 class="t-h2">Kasse</h1>

            <div class="card mko__summary">
                <button class="acc__head" type="button" :aria-expanded="summaryOpen" @click="summaryOpen = !summaryOpen">
                    <span>Bestellung ansehen · {{ totals.total }}</span>
                    <Icon name="chevron-down" :size="20" />
                </button>

                <div v-if="summaryOpen" class="acc__body">
                    <div v-for="line in lines" :key="line.key" class="mko__line">
                        <span>{{ line.quantity }} × {{ line.title }}</span>
                        <span class="tabular">{{ line.lineTotal }}</span>
                    </div>
                    <hr class="hr" />
                    <div class="mko__line">
                        <span>Versand</span>
                        <span class="tabular">
                            {{ totals.freeShipping ? 'Kostenlos' : totals.shipping }}
                        </span>
                    </div>
                </div>
            </div>

            <form class="stack-4 mko__form" @submit.prevent>
                <div>
                    <label class="field-label" for="mko-mail">
                        E-Mail <span class="field-label__req">*</span>
                    </label>
                    <input id="mko-mail" class="field" type="email" autocomplete="email" />
                </div>
                <div>
                    <label class="field-label" for="mko-first">
                        Vorname <span class="field-label__req">*</span>
                    </label>
                    <input id="mko-first" class="field" autocomplete="given-name" />
                </div>
                <div>
                    <label class="field-label" for="mko-last">
                        Nachname <span class="field-label__req">*</span>
                    </label>
                    <input id="mko-last" class="field" autocomplete="family-name" />
                </div>
                <div>
                    <label class="field-label" for="mko-street">
                        Straße und Hausnummer <span class="field-label__req">*</span>
                    </label>
                    <input id="mko-street" class="field" autocomplete="address-line1" />
                </div>
                <div class="mko__pair">
                    <div>
                        <label class="field-label" for="mko-zip">
                            PLZ <span class="field-label__req">*</span>
                        </label>
                        <input id="mko-zip" class="field" inputmode="numeric" autocomplete="postal-code" />
                    </div>
                    <div>
                        <label class="field-label" for="mko-city">
                            Ort <span class="field-label__req">*</span>
                        </label>
                        <input id="mko-city" class="field" autocomplete="address-level2" />
                    </div>
                </div>
            </form>
        </div>
    </section>

    <div class="stickybar">
        <div>
            <span class="micro">Gesamt</span>
            <p class="price price--sm">{{ totals.total }}</p>
        </div>
        <button class="btn btn--primary mko__pay" type="button">Zahlungspflichtig bestellen</button>
    </div>
</template>

<style scoped>
.mko {
    padding-bottom: calc(var(--bottomnav-h) + 104px);
}

.mko__summary {
    margin-top: var(--s4);
    padding: 0 var(--s4);
}

.mko__line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--s3);
    font-size: 14px;
    padding-block: 6px;
}

.mko__form {
    margin-top: var(--s5);
}

.mko__pair {
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: var(--s3);
}

.mko__pay {
    margin-left: auto;
    font-size: 13px;
}

.stickybar .price {
    margin: 0;
}
</style>
