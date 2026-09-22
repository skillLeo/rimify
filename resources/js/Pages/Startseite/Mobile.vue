<script setup lang="ts">
/**
 * The homepage as an app screen (docs/design/sections/home.md, phone column).
 *
 * One column of blocks: the question and the panel that answers it, then evidence — the promise
 * row, the Gutachten story, the real catalogue as shelves, two shortcuts into it, the tyre label,
 * the calculator, the guides, a person to ask. Sections alternate surface and band by position
 * over the sections actually rendered (§0.3), so an absent block never leaves two bands touching.
 *
 * Same props as the desktop document; the split is presentation only.
 */

import { Head, Link, router } from '@inertiajs/vue3'
import { computed, ref } from 'vue'
import MobileLayout from '../../Layouts/MobileLayout.vue'
import FitmentTeaser from '../../Components/Home/FitmentTeaser.vue'
import GutachtenStory from '../../Components/Mobile/Home/GutachtenStory.vue'
import HeroFrame from '../../Components/Mobile/Home/HeroFrame.vue'
import KomplettradWheel from '../../Components/Mobile/Home/KomplettradWheel.vue'
import VehiclePanel from '../../Components/Mobile/Home/VehiclePanel.vue'
import ListRow from '../../Components/Mobile/ListRow.vue'
import Shelf from '../../Components/Mobile/Shelf.vue'
import Accordion from '../../Components/Ui/Accordion.vue'
import Icon from '../../Components/Ui/Icon.vue'
import ProductTile from '../../Components/Ui/ProductTile.vue'
import ProductTileSkeleton from '../../Components/Ui/ProductTileSkeleton.vue'
import TyreLabel, { type TyreClass } from '../../Components/Ui/TyreLabel.vue'
import { felgen, NNBSP } from '../../format'
import { isIconName, type IconName } from '../../icons'
import { useShared } from '../../composables/useShared'
import type { StartseiteProps } from '../../types/pages'
import { DESCRIPTION, TITLE } from './meta'

defineOptions({ layout: MobileLayout })

const props = defineProps<StartseiteProps>()

const shared = useShared()
const vehicle = computed(() => shared.value.vehicle)
const contact = computed(() => shared.value.contact)
const garage = computed(() => shared.value.garage ?? [])
const service = computed(() => shared.value.serviceStatus ?? null)

/* ── H2 ─────────────────────────────────────────────────────────────────────── */

/** The phone sentence from home.md, used while the CMS block only echoes the desktop one. */
const PHONE_SUBLINE = 'Nur Felgen, deren Gutachten dein Fahrzeug nennt – mit Reifengrößen und Auflagen.'

const title = computed(() => (vehicle.value ? `Felgen, die an deinen ${vehicle.value.short} dürfen.` : props.hero.title))
const subline = computed(() => {
    const mobile = props.hero.sublineMobile

    // A server that falls back to the desktop sentence would put five lines above the panel.
    return mobile && mobile !== props.hero.subline ? mobile : PHONE_SUBLINE
})

/** F1 for the shared vehicle, in the first paint; the listing's total is the same figure's fallback. */
const vehicleCount = computed(() => props.fitmentCount?.count ?? props.popular.total)

/** `1 passende Felge` · `9 passende Felgen` — `felgen()` with the adjective between the number and the noun. */
const passende = (count: number): string => felgen(count).replace(NNBSP, `${NNBSP}passende `)

/* ── H3 ─────────────────────────────────────────────────────────────────────── */

const promiseIcon = (name: string): IconName => (isIconName(name) ? name : 'check')

/* ── H5 ─────────────────────────────────────────────────────────────────────── */

const popularTitle = computed(() => (vehicle.value ? `Beliebt für deinen ${vehicle.value.short}` : props.popular.title ?? 'Beliebte Felgen'))
const popularLoading = ref(false)
const popularFailed = ref(false)

function switchTab(key: string): void {
    if (key === props.popular.active || popularLoading.value) {
        return
    }

    popularFailed.value = false
    router.get(
        '/',
        { beliebt: key },
        {
            only: ['popular'],
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => {
                popularLoading.value = true
            },
            onError: () => {
                popularFailed.value = true
            },
            onFinish: () => {
                popularLoading.value = false
            },
        }
    )
}

const listingLabel = computed(() =>
    vehicle.value && vehicleCount.value !== null ? `${passende(vehicleCount.value)} anzeigen` : 'Alle Felgen ansehen'
)

/* ── H6 ─────────────────────────────────────────────────────────────────────── */

/* A size with no wheel at all is not a tile; one with no permitted wheel for the car is greyed with
   its count and is not a link — never struck (home-overhaul.md §0.6). */
const sizes = computed(() =>
    props.sizes
        .filter((s) => s.count > 0)
        .map((s) => {
            const fitting = vehicle.value ? s.fitting : null

            return {
                ...s,
                none: fitting === 0,
                line: fitting === null ? felgen(s.count) : passende(fitting),
            }
        })
)
const brandRows = computed(() => {
    const cells: (StartseiteProps['brands'][number] | null)[] = [...props.brands]

    while (cells.length % 3 !== 0) {
        cells.push(null)
    }

    return cells
})

/* ── H7 ─────────────────────────────────────────────────────────────────────── */

const tyre = computed(() => props.komplettrad.tyre)
const komplettradHref = computed(() => (vehicle.value ? '/felgen' : '/felgen-suchen'))

/* ── H9 ─────────────────────────────────────────────────────────────────────── */

const plz = ref('')
const partnerState = ref<'idle' | 'busy' | 'failed'>('idle')

async function findPartners(): Promise<void> {
    if (!/^\d{5}$/.test(plz.value)) {
        return
    }

    partnerState.value = 'busy'

    try {
        const response = await fetch(`/api/v1/partners?plz=${plz.value}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
        partnerState.value = response.ok ? 'idle' : 'failed'
    } catch {
        partnerState.value = 'failed'
    }
}

/* ── H11 ────────────────────────────────────────────────────────────────────── */

const faqItems = computed(() => props.faq.slice(0, 5).map((f) => ({ id: f.id, title: f.question, body: f.answer })))
const statusLine = computed(() => service.value?.label ?? contact.value.hours)
const telHref = computed(() => `tel:${contact.value.phoneIntl.replace(/\s/g, '')}`)
const waHref = computed(() => `https://wa.me/${contact.value.whatsapp.replace(/\D/g, '')}`)

/* ── Rhythm: band / surface and section / section--tight by position (§0.3) ── */

const rendered = computed(() => {
    const list: { id: string; on: boolean; dark?: boolean }[] = [
        { id: 'h4', on: true },
        { id: 'h5', on: true },
        { id: 'h6', on: sizes.value.length > 0 || props.brands.length > 0 },
        { id: 'h7', on: tyre.value !== null, dark: true },
        { id: 'h8', on: true },
        { id: 'h9', on: props.partners.enabled },
        { id: 'h10', on: props.guides.length > 0 },
        { id: 'h11', on: true },
    ]

    // Padding alternates over every rendered section; the tone alternates over the light ones,
    // so the dark band sits between a band and a surface without breaking either rhythm.
    const out: Record<string, string> = {}
    let position = 0
    let light = 0

    for (const s of list) {
        if (!s.on) {
            continue
        }

        const padding = position % 2 === 0 ? 'section' : 'section--tight'
        let tone = 'dark'

        if (!s.dark) {
            tone = light % 2 === 0 ? 'band' : 'surface'
            light++
        }

        // Everything below the fold skips layout and paint until it scrolls near — a tap in the
        // panel then never relays out the story, the shelves and the calculator underneath.
        out[s.id] = `${tone} ${padding} home-below`
        position++
    }

    return out
})

const cls = (id: string): string => rendered.value[id] ?? 'surface section'
</script>

<template>
    <Head :title="TITLE">
        <meta name="description" :content="DESCRIPTION" head-key="description" />
    </Head>

    <!-- H2 · The question, and the panel that answers it. -->
    <section id="h2" data-section="H2" class="home-hero band" aria-labelledby="h2-title">
        <div class="container">
            <h1 id="h2-title" class="h1 home-hero__title">{{ title }}</h1>
            <p class="body-l muted home-hero__sub">{{ subline }}</p>

            <div class="home-hero__panel">
                <VehiclePanel :makes="selector.makes" :total="vehicleCount" :garage="garage" />
            </div>

            <div v-if="hero.product" class="home-hero__frame">
                <HeroFrame :product="hero.product" />
            </div>
        </div>
    </section>

    <!-- H3 · Four facts, promising nothing beyond their titles. -->
    <section v-if="promises.length" id="h3" data-section="H3" class="home-promises" aria-label="Was RIMIFY zusagt">
        <ul class="container home-promises__list">
            <li v-for="item in promises" :key="item.title" class="home-promises__item">
                <Icon :name="promiseIcon(item.icon)" :size="20" />
                <span class="home-promises__title">{{ item.title }}</span>
                <span class="small muted">{{ item.text }}</span>
            </li>
        </ul>
    </section>

    <!-- H4 · How RIMIFY reads the Gutachten. -->
    <section id="h4" data-section="H4" :class="cls('h4')" aria-labelledby="h4-title">
        <div class="container">
            <h2 id="h4-title" class="h2 home-h2">Wir lesen das Gutachten. Du bekommst die Antwort.</h2>
            <GutachtenStory :stats="hero.stats" />
        </div>
    </section>

    <!-- H5 · The real catalogue, one row, and what the visitor looked at last. -->
    <section id="h5" data-section="H5" :class="cls('h5')" aria-labelledby="h5-title">
        <div class="container">
            <h2 id="h5-title" class="h2 home-h2">{{ popularTitle }}</h2>

            <div v-if="popular.tabs.length" class="tabs__list home-tabs" role="tablist" aria-label="Auswahl">
                <button
                    v-for="tab in popular.tabs"
                    :key="tab.key"
                    class="tabs__trigger"
                    type="button"
                    role="tab"
                    :aria-selected="tab.key === popular.active"
                    :data-state="tab.key === popular.active ? 'active' : 'inactive'"
                    @click="switchTab(tab.key)"
                >
                    {{ tab.label }}
                </button>
            </div>
        </div>

        <div :aria-busy="popularLoading ? 'true' : undefined">
            <Shelf v-if="popularLoading && popular.cards.length === 0" bare hide-head title="Beliebte Felgen" width="62vw" list-label="Felgen werden geladen">
                <li v-for="n in 4" :key="n"><ProductTileSkeleton /></li>
            </Shelf>

            <Shelf v-else-if="popular.cards.length" bare hide-head :title="popularTitle" width="62vw" list-label="Felgen">
                <li v-for="(card, i) in popular.cards" :key="`${card.modelId}-${card.finishId}`">
                    <ProductTile :card="card" :vehicle="vehicle" :eager="i < 2" compare />
                </li>
            </Shelf>

            <div v-else class="container empty">
                <p class="empty__title">In dieser Auswahl ist gerade nichts.</p>
                <p class="empty__text">Schau bei Beliebt oder Neu, oder sieh dir alle Felgen an.</p>
            </div>
        </div>

        <div class="container home-h5__foot">
            <div v-if="popularFailed" class="notice notice--bad">
                <Icon name="warning" :size="20" />
                <div class="home-notice__body">
                    <p>Die Felgen lassen sich gerade nicht laden.</p>
                    <button class="btn btn--secondary btn--sm" type="button" @click="popularFailed = false; switchTab(popular.active)">Erneut versuchen</button>
                </div>
            </div>
            <Link href="/felgen" class="btn btn--secondary btn--block" prefetch>{{ listingLabel }}</Link>
        </div>

        <!-- H5b · Only when the session has history. -->
        <div v-if="recentlyViewed.length" id="h5b" data-section="H5b" class="home-h5b">
            <Shelf bare title="Zuletzt angesehen" width="62vw" :heading-level="2">
                <li v-for="card in recentlyViewed.slice(0, 12)" :key="`rv-${card.modelId}-${card.finishId}`">
                    <ProductTile :card="card" :vehicle="vehicle" />
                </li>
            </Shelf>
        </div>
    </section>

    <!-- H6 · Two shortcuts into the catalogue. -->
    <section v-if="rendered.h6" id="h6" data-section="H6" :class="cls('h6')" aria-labelledby="h6-title">
        <div class="container">
            <h2 id="h6-title" class="h2 home-h2">{{ sizes.length ? 'Nach Zollgröße' : 'Nach Marke' }}</h2>
        </div>

        <Shelf v-if="sizes.length" bare hide-head title="Nach Zollgröße" width="96px" list-label="Zollgrößen">
            <li v-for="size in sizes" :key="size.inch">
                <!-- Greyed, never hidden, never struck: nothing of this size is permitted on the chosen car. -->
                <span v-if="size.none" class="size-tile size-tile--none" aria-disabled="true">
                    <span class="display num size-tile__n">{{ size.inch }}</span>
                    <span class="small quiet">Zoll</span>
                    <span class="small num quiet">{{ size.line }}</span>
                </span>
                <Link v-else :href="size.href" class="size-tile m-press">
                    <span class="display num size-tile__n">{{ size.inch }}</span>
                    <span class="small muted">Zoll</span>
                    <span class="small num muted">{{ size.line }}</span>
                </Link>
            </li>
        </Shelf>

        <div v-if="brands.length" class="container home-brands">
            <h2 v-if="sizes.length" class="h2 home-h2">Nach Marke</h2>
            <ul class="brand-grid" aria-label="Felgenmarken">
                <li v-for="(brand, i) in brandRows" :key="brand ? brand.slug : `empty-${i}`" class="brand-grid__cell">
                    <!-- Named by content, "BORBET 1 Felge": the logo's brand from a hidden span, so the visible count is part of the name. -->
                    <Link v-if="brand" :href="brand.href" class="brand-grid__link m-press">
                        <span v-if="brand.logo" class="brand-mark" :style="{ maskImage: `url(${brand.logo})` }" aria-hidden="true" />
                        <span v-if="brand.logo" class="visually-hidden">{{ brand.name }}</span>
                        <span v-else class="h4 brand-grid__name">{{ brand.name }}</span>
                        <span class="micro quiet num">{{ felgen(brand.count) }}</span>
                    </Link>
                </li>
            </ul>
        </div>
    </section>

    <!-- H7 · The one dark band: what a Komplettrad is, and its tyre's regulated facts. -->
    <section v-if="tyre" id="h7" data-section="H7" :class="cls('h7')" aria-labelledby="h7-title">
        <div class="container home-komplett">
            <h2 id="h7-title" class="h2 home-h2">Kompletträder&nbsp;– <br />montiert und gewuchtet.</h2>
            <p class="body-l home-komplett__text">Felge und Reifen kommen fertig montiert und gewuchtet bei dir an – mit dem Gutachten für dein Fahrzeug.</p>

            <KomplettradWheel class="home-komplett__wheel" />

            <TyreLabel
                :title="tyre.title"
                :fuel="tyre.fuel as TyreClass"
                :wet="tyre.wet as TyreClass"
                :noise-db="tyre.noiseDb"
                :noise-class="tyre.noiseClass"
                :eprel-id="tyre.eprelId"
                class="home-komplett__label"
            />

            <Link :href="komplettradHref" class="btn btn--light btn--block" prefetch>Kompletträder für mein Fahrzeug</Link>
        </div>
    </section>

    <!-- H8 · The calculator, and the line that says it is arithmetic, not approval. -->
    <section id="h8" data-section="H8" :class="cls('h8')" aria-labelledby="h8-title">
        <div class="container">
            <h2 id="h8-title" class="h2 home-h2">Was ändert sich mit der neuen Größe?</h2>
            <p class="body muted home-lead">Vergleiche deine aktuelle Größe mit einer neuen. Die Zeichnung zeigt von oben, wie weit die Felge wandert.</p>
            <FitmentTeaser :prefill="calculator.prefill" :vehicle="vehicle" layout="phone" />
        </div>
    </section>

    <!-- H9 · Fitting partners, behind the flag. -->
    <section v-if="partners.enabled" id="h9" data-section="H9" :class="cls('h9')" aria-labelledby="h9-title">
        <div class="container home-partners">
            <div class="home-partners__head">
                <h2 id="h9-title" class="h2 home-h2">Montage in deiner Nähe</h2>
                <span v-if="partners.demo" class="badge">Beispieldaten</span>
            </div>
            <form class="home-partners__form" @submit.prevent="findPartners">
                <div class="form-field">
                    <label class="form-field__label" for="plz">Postleitzahl</label>
                    <input id="plz" v-model="plz" class="input num" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code" enterkeyhint="search">
                    <p class="form-field__error">
                        <template v-if="partnerState === 'failed'">Die Partnersuche ist gerade nicht erreichbar.</template>
                    </p>
                </div>
                <button class="btn btn--primary btn--block" type="submit" :aria-disabled="!/^\d{5}$/.test(plz) ? 'true' : undefined" :aria-busy="partnerState === 'busy' ? 'true' : undefined">
                    {{ /^\d{5}$/.test(plz) ? 'Partner finden' : 'Postleitzahl eingeben' }}
                </button>
            </form>
            <p class="body muted">Gib deine Postleitzahl ein – wir zeigen dir die drei nächsten Montagepartner.</p>
        </div>
    </section>

    <!-- H10 · Three real articles. -->
    <section v-if="guides.length" id="h10" data-section="H10" :class="cls('h10')" aria-labelledby="h10-title">
        <div class="container">
            <h2 id="h10-title" class="h2 home-h2">Wissen, bevor du kaufst</h2>
        </div>
        <Shelf bare hide-head title="Wissen, bevor du kaufst" width="78vw" list-label="Ratgeber">
            <li v-for="guide in guides" :key="guide.slug">
                <Link :href="`/ratgeber/${guide.slug}`" class="guide m-press" prefetch>
                    <span class="h4 guide__title">{{ guide.title }}</span>
                    <span class="small quiet num">{{ guide.minutes }} Min. Lesezeit</span>
                </Link>
            </li>
        </Shelf>
    </section>

    <!-- H11 · A person to ask, and the five questions most people ask. -->
    <section id="h11" data-section="H11" :class="cls('h11')" aria-labelledby="h11-title">
        <div class="container">
            <h2 id="h11-title" class="h2 home-h2">Fragen zur Passform? Wir schauen mit dir drauf.</h2>
            <p class="small home-status" :class="{ 'home-status--open': service?.open }">{{ statusLine }}</p>
        </div>

        <div class="home-contact">
            <ListRow icon="phone" :title="contact.phone" :href="telHref" external :chevron="false" />
            <ListRow :title="`WhatsApp: ${contact.whatsapp}`" :href="waHref" external :chevron="false">
                <template #leading><span class="home-contact__slot" aria-hidden="true" /></template>
            </ListRow>
            <ListRow icon="mail" :title="contact.email" :href="`mailto:${contact.email}`" external :chevron="false" />
            <ListRow icon="clock" :title="contact.hours" static />
        </div>

        <div class="container home-faq">
            <Accordion v-if="faqItems.length" :items="faqItems" :level="3" />
            <p v-else class="body muted">Die häufigsten Fragen beantworten wir gerade neu.</p>
            <Link href="/faq" class="btn btn--secondary btn--block home-faq__all" prefetch>Alle Fragen ansehen</Link>
        </div>
    </section>
</template>

<style scoped>
.home-h2 {
    max-width: 22ch;
}

/* Rendered when near the viewport; the placeholder size keeps the scrollbar honest meanwhile. */
.home-below {
    content-visibility: auto;
    contain-intrinsic-size: auto 800px;
}

.home-lead {
    max-width: 54ch;
    margin: var(--sp-12) 0 var(--sp-24);
}

/* ── H2 ─────────────────────────────────────────────────────────────────────── */

.home-hero {
    padding: var(--sp-24) 0 var(--sp-40);
}

.home-hero__title {
    max-width: 14ch;
}

.home-hero__sub {
    max-width: 54ch;
    margin-top: var(--sp-12);
}

.home-hero__panel {
    margin-top: var(--sp-20);
}

.home-hero__frame {
    margin-top: var(--sp-32);
}

/* ── H3 ─────────────────────────────────────────────────────────────────────── */

.home-promises {
    padding: var(--sp-24) 0;
    border-top: 1px solid var(--c-line);
}

.home-promises__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-20) var(--gutter);
}

/* Rows pack to the top, so the shorter item's title sits level with its neighbour's. */
.home-promises__item {
    display: grid;
    align-content: start;
    gap: var(--sp-4);
    justify-items: start;
    color: var(--c-ink);
}

.home-promises__item svg {
    color: var(--c-ink-2);
    margin-bottom: var(--sp-4);
}

.home-promises__title {
    font-weight: 600;
}

/* ── H5 ─────────────────────────────────────────────────────────────────────── */

.home-tabs {
    margin: var(--sp-24) 0;
}

#h5 > .container + div,
#h5 .home-h2 + div {
    margin-top: var(--sp-24);
}

.home-h5__foot {
    display: grid;
    gap: var(--sp-16);
    margin-top: var(--sp-24);
}

.home-notice__body {
    display: grid;
    gap: var(--sp-8);
    justify-items: start;
}

.home-h5b {
    margin-top: var(--sp-64);
}

/* ── H6 ─────────────────────────────────────────────────────────────────────── */

#h6 .home-h2 {
    margin-bottom: var(--sp-24);
}

.size-tile {
    display: grid;
    align-content: end;
    gap: var(--sp-4);
    min-height: 96px;
    padding: var(--sp-12);
    border-radius: var(--r-tile);
    background: var(--c-surface);
    color: var(--c-ink);
    text-decoration: none;
    transition: color var(--d-1) var(--ease-std);
}

.size-tile__n {
    white-space: nowrap;
}

.size-tile:active .size-tile__n {
    color: var(--c-blue-press);
}

@media (hover: hover) and (pointer: fine) {
    .size-tile:hover .size-tile__n {
        color: var(--c-blue);
    }
}

.size-tile--none {
    cursor: not-allowed;
}

.size-tile--none .size-tile__n {
    color: var(--c-ink-3);
}

.home-brands {
    margin-top: var(--sp-40);
}

.brand-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1px;
    background: var(--c-line);
}

.brand-grid__cell {
    display: grid;
    min-height: 96px;
    background: var(--c-band);
}

.brand-grid__link {
    display: grid;
    place-items: center;
    gap: var(--sp-4);
    padding: var(--sp-12);
    color: var(--c-ink-2);
    text-decoration: none;
    text-align: center;
}

.brand-grid__name {
    overflow-wrap: anywhere;
}

.brand-mark {
    width: 96px;
    height: 32px;
    background-color: var(--c-ink-2);
    mask-position: center;
    mask-size: contain;
    mask-repeat: no-repeat;
}

@media (hover: hover) and (pointer: fine) {
    .brand-grid__link:hover {
        color: var(--c-ink);
    }

    .brand-grid__link:hover .brand-mark {
        background-color: var(--c-ink);
    }
}

/* ── H7 ─────────────────────────────────────────────────────────────────────── */

.home-komplett {
    display: grid;
    gap: var(--sp-16);
}

.home-komplett__text {
    max-width: 40ch;
    color: var(--c-on-dark-2);
}

/* The grid's 16 px plus this margin: `--sp-32` above and below the wheel. */
.home-komplett__wheel {
    margin-block: var(--sp-16);
}

.home-komplett__label {
    width: 100%;
    margin-bottom: var(--sp-16);
}

/* ── H9 ─────────────────────────────────────────────────────────────────────── */

.home-partners {
    display: grid;
    gap: var(--sp-16);
}

.home-partners__head {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
}

.home-partners__form {
    display: grid;
    gap: var(--sp-12);
}

/* ── H10 ────────────────────────────────────────────────────────────────────── */

#h10 .home-h2 {
    margin-bottom: var(--sp-24);
}

/* No box on a band: the title and the reading time stand on the section, separated by space. */
.guide {
    display: grid;
    align-content: start;
    gap: var(--sp-8);
    height: 100%;
    min-height: 44px;
    color: var(--c-ink);
    text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
    .guide:hover .guide__title {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
}

/* ── H11 ────────────────────────────────────────────────────────────────────── */

.home-status {
    display: flex;
    align-items: center;
    gap: var(--sp-8);
    margin-top: var(--sp-16);
    font-weight: 500;
    color: var(--c-ink-3);
}

.home-status::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: var(--r-round);
    background: currentColor;
}

.home-status--open {
    color: var(--c-ok);
}

.home-contact {
    margin-top: var(--sp-16);
}

.home-contact__slot {
    display: block;
    width: 24px;
    height: 24px;
}

.home-faq {
    margin-top: var(--sp-32);
}

.home-faq__all {
    margin-top: var(--sp-24);
}
</style>
