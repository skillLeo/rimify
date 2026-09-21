<script setup lang="ts">
/**
 * The homepage.
 *
 * It leads with the tool, not with a picture: the first thing below the header is the question
 * this shop exists to answer — which wheels are approved for your car — and the form that answers
 * it. Everything after that is evidence: real facts with numbers behind them, the real catalogue,
 * a worked example of the verdict, and the answers to the questions people actually ask.
 *
 * One page for every width. The layout reflows at 640 / 900 / 1200px; nothing is served twice.
 */

import { Head, Link } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Icon from '../../Components/Art/Icon.vue'
import ProductCard from '../../Components/Product/ProductCard.vue'
import VehicleSelector from '../../Components/Vehicle/VehicleSelector.vue'
import { useShared } from '../../composables/useShared'
import type { StartseiteProps } from '../../types/pages'

defineOptions({ layout: AppLayout })

defineProps<StartseiteProps>()

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle)
const contact = computed(() => shared.value.contact)

const openFaq = ref<number | null>(null)

/*
 * What the two packages actually contain, as a comparison rather than as two marketing cards:
 * the difference between them is a list of work steps, and a list reads best as a table.
 */
const PACKAGE_ROWS = [
    { label: 'Felgen mit Gutachten', felgen: true, komplett: true },
    { label: 'Anbauset und ABE', felgen: true, komplett: true },
    { label: 'Reifen montiert', felgen: false, komplett: true },
    { label: 'Gewuchtet', felgen: false, komplett: true },
    { label: 'Ventile und Gewichte', felgen: false, komplett: true },
]
</script>

<template>
    <Head title="Felgen mit geprüfter Freigabe" />

    <!-- 1 · The fold: the question, and the form that answers it. -->
    <section class="home-hero">
        <div class="wrap home-hero__grid">
            <div class="home-hero__copy">
                <h1 class="t-display">Felgen, die zu deinem Auto passen. Garantiert.</h1>
                <p class="t-lead home-hero__lead">
                    Wähle dein Fahrzeug – wir zeigen dir nur Felgen, die dafür freigegeben sind.
                </p>

                <dl class="home-hero__facts">
                    <div>
                        <dt class="micro">Freigabe</dt>
                        <dd>Gutachten zu jeder Felge</dd>
                    </div>
                    <div>
                        <dt class="micro">Lager</dt>
                        <dd>Über 150 Modelle</dd>
                    </div>
                    <div>
                        <dt class="micro">Versand</dt>
                        <dd>Bis 14 Uhr bestellt, am selben Werktag raus</dd>
                    </div>
                </dl>
            </div>

            <!-- With a vehicle already chosen, the fold says so and offers the next step instead
                 of asking the question again. -->
            <div v-if="vehicle" class="card home-hero__panel">
                <span class="micro">Dein Fahrzeug</span>
                <p class="t-h2 home-hero__vehicle">{{ vehicle.label }}</p>
                <p class="data">{{ vehicle.keyNumbers }} · {{ vehicle.buildWindow }}</p>
                <div class="home-hero__actions">
                    <Link href="/felgen" class="btn btn--primary btn--lg">Passende Felgen anzeigen</Link>
                    <Link href="/felgen-suchen" class="btn btn--secondary btn--lg">Fahrzeug ändern</Link>
                </div>
            </div>

            <div v-else class="card home-hero__panel">
                <VehicleSelector
                    :makes="makes"
                    :models="[]"
                    :variants="[]"
                    :selected-make="null"
                    :selected-model="null"
                    base-path="/felgen-suchen"
                    compact
                />
            </div>
        </div>
    </section>

    <!-- 2 · How to reach a person, and what happens after the order. Real numbers only. -->
    <section class="home-trust" aria-label="Service">
        <div class="wrap home-trust__row">
            <a v-if="contact" class="home-trust__item" :href="`tel:${contact.phoneIntl.replace(/\s/g, '')}`">
                <Icon name="phone" :size="20" />
                <span>
                    <strong class="tabular">{{ contact.phone }}</strong>
                    <span class="home-trust__sub">{{ contact.hours }}</span>
                </span>
            </a>
            <div class="home-trust__item">
                <Icon name="truck" :size="20" />
                <span>
                    <strong>Versand aus Deutschland</strong>
                    <span class="home-trust__sub">versichert mit DHL</span>
                </span>
            </div>
            <div class="home-trust__item">
                <Icon name="document" :size="20" />
                <span>
                    <strong>Gutachten als PDF</strong>
                    <span class="home-trust__sub">auf jeder Produktseite</span>
                </span>
            </div>
            <div class="home-trust__item">
                <Icon name="shield" :size="20" />
                <span>
                    <strong>14 Tage Widerrufsrecht</strong>
                    <span class="home-trust__sub">auf unmontierte Ware</span>
                </span>
            </div>
        </div>
    </section>

    <!-- 3 · Bestsellers: the real catalogue. -->
    <section class="section">
        <div class="wrap">
            <div class="between home-head">
                <h2 class="t-h2">Bestseller aus {{ month }}</h2>
                <Link href="/felgen" class="btn btn--quiet">Alle Felgen</Link>
            </div>
            <div class="grid-cards">
                <ProductCard
                    v-for="card in bestsellers.slice(0, 4)"
                    :key="`${card.modelId}-${card.finishId}`"
                    :card="card"
                    :vehicle="vehicle"
                />
            </div>
        </div>
    </section>

    <!-- 4 · Two ways into the catalogue: by the car, or by the wheel brand. -->
    <section class="section-dense band">
        <div class="wrap home-browse">
            <div>
                <h2 class="t-h2">Nach Automarke</h2>
                <ul class="home-list">
                    <li v-for="make in makes" :key="make.make">
                        <Link :href="`/felgen-suchen?marke=${encodeURIComponent(make.make)}`" class="home-list__link">
                            <span>{{ make.make }}</span>
                            <span class="data">{{ make.models }} Modelle</span>
                        </Link>
                    </li>
                </ul>
            </div>

            <div>
                <h2 class="t-h2">Nach Felgenmarke</h2>
                <ul class="home-list">
                    <li v-for="brand in brands" :key="brand.slug">
                        <Link :href="`/felgen?marke=${encodeURIComponent(brand.name)}`" class="home-list__link">
                            <span>{{ brand.name }}</span>
                            <Icon name="chevron-right" :size="20" />
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    </section>

    <!-- 5 · The verdict, shown with a worked example rather than described. -->
    <section class="section">
        <div class="wrap home-check">
            <div>
                <h2 class="t-h2">So prüft RIMIFY-CHECK</h2>
                <p class="t-body home-check__body">
                    Mit RIMIFY-CHECK prüfen wir die Kompatibilität zwischen Fahrzeug und Felge. So
                    kannst du sicher sein, dass deine Wunschfelge zu deinem Fahrzeug passt und
                    zugelassen ist.
                </p>
                <Link href="/rimify-check" class="btn btn--secondary home-check__cta">
                    RIMIFY-CHECK starten
                </Link>
            </div>

            <div class="rcheck-panel home-check__panel">
                <p class="rcheck-panel__head"><Icon name="check-circle" :size="20" /> RIMIFY-CHECK</p>
                <dl class="home-check__rows">
                    <div>
                        <dt class="micro">Fahrzeug</dt>
                        <dd>BMW M4 F82</dd>
                    </div>
                    <div>
                        <dt class="micro">Felge</dt>
                        <dd>Wheelforce CF.3</dd>
                    </div>
                    <div>
                        <dt class="micro">Größe</dt>
                        <dd class="data">9,0J × 19 · ET 29</dd>
                    </div>
                </dl>
                <p class="home-check__verdict">
                    <Icon name="check" :size="20" />
                    Freigegeben – keine Eintragung erforderlich
                </p>
            </div>
        </div>
    </section>

    <!-- 6 · What arrives: the two packages, compared line by line. -->
    <section class="section-dense band">
        <div class="wrap"><div class="home-narrow">
            <h2 class="t-h2">Dein Felgenpaket</h2>
            <p class="t-body home-pack__lead">
                Auf Wunsch ziehen wir die Reifen auf und wuchten die Räder bei uns im Haus –
                auspacken, anschrauben, losfahren.
            </p>

            <table class="table home-pack">
                <thead>
                    <tr>
                        <th scope="col">Leistung</th>
                        <th scope="col" class="home-pack__col">Felgen</th>
                        <th scope="col" class="home-pack__col">Komplettrad</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in PACKAGE_ROWS" :key="row.label">
                        <th scope="row" class="home-pack__row">{{ row.label }}</th>
                        <td class="home-pack__col">
                            <Icon v-if="row.felgen" name="check" :size="20" label="enthalten" />
                            <span v-else class="quiet" aria-label="nicht enthalten">–</span>
                        </td>
                        <td class="home-pack__col">
                            <Icon v-if="row.komplett" name="check" :size="20" label="enthalten" />
                            <span v-else class="quiet" aria-label="nicht enthalten">–</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <Link href="/felgen-suchen" class="btn btn--primary home-pack__cta">
                Jetzt Auto wählen und passende Felgen finden
            </Link>
        </div></div>
    </section>

    <!-- 7 · The questions people actually ask, answered in place. -->
    <section v-if="faq.length" class="section">
        <div class="wrap"><div class="home-narrow">
            <div class="between home-head">
                <h2 class="t-h2">Meistgestellte Fragen</h2>
                <Link href="/faq" class="btn btn--quiet">Alle Fragen</Link>
            </div>

            <div v-for="entry in faq" :key="entry.id" class="acc">
                <button
                    class="acc__head"
                    type="button"
                    :aria-expanded="openFaq === entry.id"
                    :aria-controls="`faq-${entry.id}`"
                    @click="openFaq = openFaq === entry.id ? null : entry.id"
                >
                    {{ entry.question }}
                    <Icon :name="openFaq === entry.id ? 'minus' : 'plus'" :size="20" />
                </button>
                <div v-show="openFaq === entry.id" :id="`faq-${entry.id}`" class="acc__body">
                    {{ entry.answer }}
                </div>
            </div>
        </div></div>
    </section>
</template>

<style scoped>
/* ── Fold ─────────────────────────────────────────────────────────────────── */

.home-hero {
    padding-block: var(--space-7) var(--space-6);
    background: var(--surface);
    border-bottom: 1px solid var(--line);
}

.home-hero__grid {
    display: grid;
    gap: var(--space-6);
    align-items: start;
}

.home-hero__lead {
    margin-top: var(--space-4);
    color: var(--ink2);
}

.home-hero__facts {
    display: grid;
    gap: var(--space-4);
    margin: var(--space-6) 0 0;
}

.home-hero__facts dd {
    margin: var(--space-1) 0 0;
    font-weight: 700;
}

.home-hero__panel {
    min-width: 0;
}

.home-hero__vehicle {
    margin: var(--space-2) 0 var(--space-1);
}

.home-hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-5);
}

@media (min-width: 640px) {
    .home-hero__facts {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1200px) {
    .home-hero {
        padding-block: var(--space-8);
    }

    .home-hero__grid {
        grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
        gap: var(--space-7);
    }

    .home-hero__facts {
        grid-template-columns: 1fr;
    }
}

/* ── Service facts ────────────────────────────────────────────────────────── */

.home-trust {
    background: var(--surface);
    border-bottom: 1px solid var(--line);
}

/* A phone scrolls the row sideways rather than stacking four lines of reassurance. */
.home-trust__row {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(220px, 1fr);
    gap: var(--space-5);
    overflow-x: auto;
    padding-block: var(--space-4);
    scrollbar-width: none;
}

.home-trust__row::-webkit-scrollbar {
    display: none;
}

.home-trust__item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
}

.home-trust__item :deep(svg) {
    flex: none;
    color: var(--ink2);
    margin-top: 2px;
}

.home-trust__item strong {
    display: block;
    font-size: var(--text-body);
}

.home-trust__sub {
    display: block;
    font-size: var(--text-small);
    color: var(--ink2);
}

@media (min-width: 1200px) {
    .home-trust__row {
        grid-auto-flow: row;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        overflow: visible;
    }
}

/* ── Shared section head ──────────────────────────────────────────────────── */

.home-head {
    margin-bottom: var(--space-5);
}

/* ── Browse lists ─────────────────────────────────────────────────────────── */

.home-browse {
    display: grid;
    gap: var(--space-7);
}

.home-list {
    display: grid;
    gap: 0;
    margin: var(--space-4) 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line);
}

.home-list__link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    min-height: 52px;
    padding-inline: var(--space-1);
    border-bottom: 1px solid var(--line);
    color: var(--ink);
    font-weight: 700;
    text-decoration: none;
    transition: color var(--duration-instant) var(--ease-standard);
}

.home-list__link :deep(svg) {
    color: var(--ink3);
}

@media (hover: hover) and (pointer: fine) {
    .home-list__link:hover {
        color: var(--blue);
    }
}

@media (min-width: 640px) {
    .home-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        column-gap: var(--space-6);
    }
}

@media (min-width: 1200px) {
    .home-browse {
        grid-template-columns: 7fr 5fr;
    }

    .home-browse > div:last-child .home-list {
        grid-template-columns: 1fr;
    }
}

/* ── RIMIFY-CHECK ─────────────────────────────────────────────────────────── */

.home-check {
    display: grid;
    gap: var(--space-6);
    align-items: center;
}

.home-check__body {
    margin-top: var(--space-3);
    color: var(--ink2);
}

.home-check__cta {
    margin-top: var(--space-5);
}

.home-check__rows {
    display: grid;
    gap: var(--space-4);
    margin: var(--space-4) 0;
}

.home-check__rows dd {
    margin: var(--space-1) 0 0;
    font-weight: 700;
}

.home-check__verdict {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--bline);
    color: var(--ok);
    font-size: var(--text-small);
    font-weight: 700;
}

@media (min-width: 640px) {
    .home-check__rows {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 900px) {
    .home-check {
        grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
        gap: var(--space-7);
    }
}

/* Narrower reading measure, but the SAME left edge as every other section. */
.home-narrow {
    max-width: 880px;
}

/* ── Package comparison ───────────────────────────────────────────────────── */

.home-pack__lead {
    margin: var(--space-3) 0 var(--space-5);
    color: var(--ink2);
}

.home-pack {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-md);
    overflow: hidden;
    border-collapse: separate;
    border-spacing: 0;
}

.home-pack__row {
    font-size: var(--text-body);
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
    color: var(--ink);
    background: transparent;
    border-bottom: 1px solid var(--line-s);
    padding: var(--space-3);
    text-align: left;
}

.home-pack__col {
    width: 26%;
    text-align: center;
}

.home-pack__col :deep(svg) {
    margin-inline: auto;
    color: var(--ok);
}

.home-pack__cta {
    margin-top: var(--space-5);
}
</style>
