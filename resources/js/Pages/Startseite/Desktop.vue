<script setup lang="ts">
/**
 * The homepage, desktop. Nine sections, in the order the Figma fixes.
 *
 * It is the showpiece and it sets the language every other page inherits: the micro-label above a
 * value, one accent used three or four times, hairlines that stop short, and real data density.
 * Nothing on it is a placeholder — the bestseller rail, the make grid and the brand cards are all
 * live rows.
 */

import { Head, Link } from '@inertiajs/vue3'
import BrandBanner from '../../Components/Art/BrandBanner.vue'
import Car from '../../Components/Art/Car.vue'
import HeroScene from '../../Components/Art/HeroScene.vue'
import Icon from '../../Components/Art/Icon.vue'
import Photo from '../../Components/Media/Photo.vue'
import ProductCard from '../../Components/Product/ProductCard.vue'
import Scene from '../../Components/Art/Scene.vue'
import VehicleSelector from '../../Components/Vehicle/VehicleSelector.vue'
import { useShared } from '../../composables/useShared'
import { PHOTOS, brandPhoto } from '../../media/photos'
import type { StartseiteProps } from '../../types/pages'

defineProps<StartseiteProps>()

const shared = useShared()

const TRUST = [
    'Über 150 Modelle auf Lager',
    'Gutachten zu jeder Felge',
    'Versand aus Deutschland',
    'Komplettrad montiert & gewuchtet',
]

const BRAND_STRIP = ['BBS', 'YIDO', 'BORBET', 'OZ RACING', 'ALUTEC', 'rotiform']

const REASONS = [
    {
        title: 'Geprüfte Freigabe, kein Risiko',
        body: 'Jede Felge, die wir dir zeigen, ist für dein Fahrzeug durch ein Gutachten freigegeben. Auflagen nennen wir im Klartext – vor dem Kauf, nicht danach. Das Gutachten kannst du auf jeder Produktseite herunterladen.',
    },
    {
        title: 'Komplettrad, fertig montiert',
        body: 'Auf Wunsch ziehen wir die Reifen auf und wuchten die Räder bei uns im Haus. Du bekommst fertige Räder inklusive Ventilen, Anbauset und ABE – auspacken, anschrauben, losfahren.',
    },
    {
        title: 'Versand aus Deutschland',
        body: 'Über 150 Modelle liegen bei uns auf Lager. Bestellungen bis 14 Uhr gehen am selben Werktag raus, versichert mit DHL. Fragen beantworten wir am Telefon, nicht per Formularbrief.',
    },
]
</script>

<template>
    <Head title="Felgen mit geprüfter Freigabe" />

    <!-- 1 · Hero. The LCP element: painted, never faded in. The photograph sits over the drawn
         scene, and falls back to it if the URL is blocked or dead. -->
    <section class="hero">
        <div class="hero__art">
            <Photo :photo="PHOTOS.heroDesktop" eager>
                <HeroScene layout="desktop" finish="graphite" :spokes="10" />
            </Photo>
        </div>
        <div class="hero__scrim" />

        <div class="hero__inner">
            <div>
                <p class="t-micro hero__eyebrow rise rise-1">RIMIFY-CHECK · FREIGABE GEPRÜFT</p>
                <h1 class="t-display hero__title rise rise-2">
                    Felgen, die zu deinem Auto passen.<br />
                    <span class="hero__accent">Garantiert.</span>
                </h1>
                <p class="t-body hero__sub rise rise-3">
                    Wähle dein Fahrzeug – wir zeigen dir nur Felgen, die dafür freigegeben sind.
                </p>
            </div>

            <div class="card card--lifted hero__card rise rise-3">
                <div class="hero__cardbar">
                    <span class="t-ui">Fahrzeug wählen</span>
                </div>
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

        <ul class="hero__trust">
            <li v-for="item in TRUST" :key="item">
                <Icon name="check" :size="20" />
                {{ item }}
            </li>
        </ul>
    </section>

    <!-- 2 · Brand strip. Wordmarks only; no logos we do not have. -->
    <section class="strip">
        <div class="wrap strip__inner">
            <span v-for="brand in BRAND_STRIP" :key="brand" class="strip__name">{{ brand }}</span>
        </div>
    </section>

    <!-- 3 · Brands -->
    <section class="section surface">
        <div class="wrap">
            <h2 class="t-h2">Entdecke die beliebtesten Felgenmarken</h2>
            <div class="brandgrid">
                <article v-for="brand in brands" :key="brand.slug" class="brandcard">
                    <!-- The photograph is the ground; the drawn wheel and wordmark composite on
                         top of it, so the card keeps its identity whichever layer renders. -->
                    <div class="brandcard__art">
                        <Photo :photo="brandPhoto(brand.slug)" class="brandcard__photo">
                            <span />
                        </Photo>
                        <BrandBanner
                            class="brandcard__banner"
                            :brand="brand.name"
                            :spokes="brand.spokes"
                            :width="620"
                        />
                    </div>
                    <div class="brandcard__body">
                        <p class="brandcard__stock">Über 150 Modelle auf Lager und sofort lieferbar</p>
                        <Link :href="`/felgen?marke=${encodeURIComponent(brand.name)}`" class="btn btn--quiet">
                            Felgen ansehen →
                        </Link>
                    </div>
                </article>
            </div>
        </div>
    </section>

    <!-- 4 · The make grid, straight from the vehicle table. -->
    <section class="section band">
        <div class="wrap">
            <h2 class="t-h2">Auto wählen, garantiert passende Felge finden</h2>
            <div class="makegrid">
                <Link
                    v-for="make in makes"
                    :key="make.make"
                    :href="`/felgen-suchen?marke=${encodeURIComponent(make.make)}`"
                    class="makecard"
                >
                    <span class="makecard__name">{{ make.make }}</span>
                    <span class="data makecard__count">{{ make.models }} Modelle</span>
                </Link>
            </div>
            <Link href="/felgen-suchen" class="btn btn--quiet makegrid__all">Alle Marken anzeigen →</Link>
        </div>
    </section>

    <!-- 5 · Bestsellers -->
    <section class="section surface">
        <div class="wrap">
            <div class="between section__head">
                <h2 class="t-h2">Bestseller aus {{ month }}</h2>
                <Link href="/felgen" class="btn btn--quiet">Alle Felgen ansehen →</Link>
            </div>
            <div class="grid-cards">
                <ProductCard
                    v-for="card in bestsellers.slice(0, 4)"
                    :key="`${card.modelId}-${card.finishId}`"
                    :card="card"
                    :vehicle="shared.vehicle"
                />
            </div>
        </div>
    </section>

    <!-- 6 · The RIMIFY-CHECK promise, with a worked example. -->
    <section class="section band">
        <div class="wrap checkblock">
            <div>
                <h2 class="t-h2">
                    Dein Vorteil: <span class="checkblock__accent">✓ RIMIFY-CHECK</span>
                </h2>
                <p class="t-body">
                    Mit RIMIFY CHECK prüfen wir die Kompatibilität zwischen Fahrzeug und Felge. So
                    kannst du sicher sein, dass deine Wunschfelge zu deinem Fahrzeug passt und
                    zugelassen ist.
                </p>

                <div class="rcheck-panel checkblock__panel">
                    <p class="rcheck-panel__head"><Icon name="check-circle" :size="20" /> RIMIFY-CHECK</p>
                    <dl class="checkblock__rows">
                        <div>
                            <dt class="micro">Fahrzeug</dt>
                            <dd class="checkblock__value">BMW M4 F82</dd>
                        </div>
                        <div>
                            <dt class="micro">Felge</dt>
                            <dd class="checkblock__value">Wheelforce CF.3</dd>
                        </div>
                    </dl>
                    <p class="checkblock__verdict">
                        <Icon name="check" :size="20" />
                        Freigegeben – keine Eintragung erforderlich
                    </p>
                </div>

                <Link href="/rimify-check" class="btn btn--primary checkblock__cta">RIMIFY-CHECK</Link>
            </div>

            <div class="checkblock__art">
                <Photo :photo="PHOTOS.checkBlock">
                    <Car variant="white" finish="silver" :spokes="5" :width="760" />
                </Photo>
            </div>
        </div>
    </section>

    <!-- 7 · Why RIMIFY -->
    <section class="section surface">
        <div class="wrap">
            <h2 class="t-h2">Warum RIMIFY?</h2>
            <div class="reasons">
                <article v-for="reason in REASONS" :key="reason.title" class="card reasons__item">
                    <h3 class="t-h3">{{ reason.title }}</h3>
                    <p class="t-body">{{ reason.body }}</p>
                </article>
            </div>
        </div>
    </section>

    <!-- 8 · The package comparison -->
    <section class="section band">
        <div class="wrap">
            <h2 class="t-h2">Dein Felgenpaket</h2>
            <div class="packages">
                <article class="card packages__item">
                    <span class="micro">Lieferung</span>
                    <ul class="packages__list">
                        <li><Icon name="check" :size="20" /> Felgen</li>
                        <li><Icon name="check" :size="20" /> inkl. Anbauset &amp; ABE</li>
                    </ul>
                </article>

                <article class="card card--lifted packages__item packages__item--rec">
                    <span class="tag tag--ok packages__pill">EMPFOHLEN</span>
                    <h3 class="t-h3">Komplettrad</h3>
                    <ul class="packages__list">
                        <li><Icon name="check" :size="20" /> inkl. Montage der Reifen auf die Felgen</li>
                        <li><Icon name="check" :size="20" /> inkl. Wuchten</li>
                        <li><Icon name="check" :size="20" /> inkl. Ventile &amp; Gewichte</li>
                    </ul>
                </article>

                <div class="packages__art">
                    <Photo :photo="PHOTOS.lager">
                        <Scene name="lager" :width="560" />
                    </Photo>
                </div>
            </div>

            <Link href="/felgen-suchen" class="btn btn--primary packages__cta">
                Jetzt Auto wählen und passende Felgen finden
            </Link>
        </div>
    </section>

    <!-- 9 · The FAQ teaser sits on /faq, linked from here. -->
    <section class="section surface">
        <div class="wrap faqblock">
            <div>
                <h2 class="t-h2">Meistgestellte Fragen</h2>
                <Link href="/faq" class="btn btn--secondary">Alle Fragen ansehen</Link>
            </div>

            <article class="card faqblock__help">
                <div class="faqblock__art">
                    <Photo :photo="PHOTOS.werkstatt">
                        <Scene name="werkstatt" :width="520" />
                    </Photo>
                </div>
                <div class="faqblock__body">
                    <h3 class="t-h3">Weitere Fragen oder Unterstützung benötigt?</h3>
                    <p class="t-body">Wir freuen uns von dir zu hören.</p>
                    <Link href="/kontakt" class="btn btn--secondary">Zum Kontaktformular</Link>
                </div>
            </article>
        </div>
    </section>
</template>

<style scoped>
.hero__title {
    margin: var(--s3) 0 var(--s4);
    color: #fff;
}

/* The one place a second blue appears, and it is a tint of the same hue, not a second brand
   colour: the accent half of the headline. */
.hero__accent {
    color: #8fa6ff;
}

.hero__sub {
    color: rgba(255, 255, 255, 0.82);
    font-size: 18px;
}

.hero__card {
    padding: 0;
    overflow: hidden;
}

.hero__cardbar {
    padding: var(--s3) var(--s4);
    background: var(--ground);
}

.hero__card :deep(.vsel) {
    padding: var(--s4);
}

.hero__trust {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--s4);
    max-width: var(--page-max);
    margin: 0 auto;
    padding: 0 var(--gutter) var(--s7);
    list-style: none;
}

.hero__trust li {
    display: flex;
    align-items: center;
    gap: var(--s2);
    color: rgba(255, 255, 255, 0.86);
    font-size: 14px;
    font-weight: 700;
}

.strip {
    background: var(--black);
    padding-block: var(--s4);
}

.strip__inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--s5);
}

.strip__name {
    color: rgba(255, 255, 255, 0.55);
    font-size: 17px;
    font-weight: 900;
    font-style: italic;
    letter-spacing: -0.01em;
}

.section__head {
    margin-bottom: var(--s5);
}

.brandgrid,
.reasons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s5);
    margin-top: var(--s5);
}

.reasons {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.brandcard {
    background: var(--surface);
    border-radius: var(--r-card);
    box-shadow: var(--sh-1);
    overflow: hidden;
}

.brandcard__art {
    position: relative;
    aspect-ratio: 16 / 9;
    background: var(--black);
}

.brandcard__photo :deep(.photo) {
    position: absolute;
    inset: 0;
}

/* The drawn banner rides on top of the photograph. Its own gradient ground is what shows when
   the photograph is off or fails, so the card never loses the wordmark. */
.brandcard__banner {
    position: absolute;
    inset: 0;
}

.brandcard__banner :deep(svg) {
    width: 100%;
    height: 100%;
}

.brandcard__art:has(.photo) .brandcard__banner :deep(rect:first-of-type) {
    opacity: 0.35;
}

.checkblock__art,
.packages__art,
.faqblock__art {
    position: relative;
    overflow: hidden;
    border-radius: var(--r-card);
}

.checkblock__art {
    aspect-ratio: 16 / 10;
}

.packages__art {
    aspect-ratio: 4 / 3;
}

.faqblock__art {
    aspect-ratio: 16 / 10;
}

.brandcard__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s3);
    padding: var(--s4);
}

.brandcard__stock {
    margin: 0;
    font-size: 14px;
    color: var(--ink2);
}

.makegrid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--s3);
    margin: var(--s5) 0 var(--s4);
}

.makecard {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--s3);
    min-height: 64px;
    padding: var(--s3) var(--s4);
    background: var(--surface);
    border-radius: var(--r-card);
    box-shadow: var(--sh-1);
    color: inherit;
    text-decoration: none;
    transition: box-shadow var(--d-state) var(--ease);
}

.makecard:hover {
    box-shadow: var(--sh-2);
}

.makecard__name {
    font-size: 16px;
    font-weight: 700;
}

.makegrid__all {
    padding-inline: 0;
}

.checkblock {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--s7);
    align-items: center;
}

.checkblock__accent {
    color: var(--blue);
}

.checkblock__panel {
    margin-top: var(--s5);
}

.checkblock__rows {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--s4);
    margin: var(--s3) 0;
}

.checkblock__rows dd {
    margin: 2px 0 0;
    font-size: 15px;
    font-weight: 700;
}

.checkblock__verdict {
    display: flex;
    align-items: center;
    gap: var(--s2);
    margin: 0;
    padding-top: var(--s3);
    border-top: 1px solid var(--bline);
    color: var(--ok);
    font-size: 14px;
    font-weight: 700;
}

.checkblock__cta {
    margin-top: var(--s5);
}

.reasons__item h3 {
    margin: 0 0 var(--s2);
}

.packages {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--s5);
    margin: var(--s5) 0;
    align-items: start;
}

.packages__item {
    position: relative;
}

.packages__pill {
    position: absolute;
    top: calc(var(--s4) * -1);
    left: var(--s5);
}

.packages__list {
    display: grid;
    gap: var(--s2);
    margin: var(--s3) 0 0;
    padding: 0;
    list-style: none;
    font-size: 15px;
}

.packages__list li {
    display: flex;
    align-items: flex-start;
    gap: var(--s2);
    color: var(--ink2);
}

.packages__list :deep(svg) {
    color: var(--ok);
    flex: none;
}

.packages__art {
    border-radius: var(--r-card);
    overflow: hidden;
}

.faqblock {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--s6);
    align-items: center;
}

.faqblock__help {
    padding: 0;
    overflow: hidden;
}

.faqblock__body {
    padding: var(--s5);
}

.faqblock__body h3 {
    margin: 0 0 var(--s2);
}
</style>
