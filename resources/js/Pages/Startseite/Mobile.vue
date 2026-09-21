<script setup lang="ts">
/**
 * The homepage, phone. Designed for the thumb, not squeezed from the desktop.
 *
 * Two real differences rather than a narrower grid: the selector sits in the lower two thirds of
 * the first screen so it is reachable one-handed, and the bestseller row is a scroll-snapping rail
 * rather than a stack — a phone user scrolling past four full-height cards never reaches the rest
 * of the page.
 */

import { Head, Link } from '@inertiajs/vue3'
import HeroScene from '../../Components/Art/HeroScene.vue'
import Icon from '../../Components/Art/Icon.vue'
import Photo from '../../Components/Media/Photo.vue'
import ProductCard from '../../Components/Product/ProductCard.vue'
import Scene from '../../Components/Art/Scene.vue'
import { useShared } from '../../composables/useShared'
import { PHOTOS } from '../../media/photos'
import type { StartseiteProps } from '../../types/pages'

defineProps<StartseiteProps>()

const shared = useShared()

const TRUST = [
    'Über 150 Modelle auf Lager',
    'Gutachten zu jeder Felge',
    'Versand aus Deutschland',
    'Komplettrad montiert & gewuchtet',
]

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

    <section class="mhero">
        <div class="mhero__art">
            <Photo :photo="PHOTOS.heroMobile" eager>
                <HeroScene layout="mobile" finish="graphite" :spokes="10" />
            </Photo>
        </div>
        <div class="mhero__scrim" />

        <div class="mhero__inner">
            <p class="t-micro mhero__eyebrow">RIMIFY-CHECK · FREIGABE GEPRÜFT</p>
            <h1 class="t-display mhero__title">
                Felgen, die zu deinem Auto passen.<br />
                <span class="mhero__accent">Garantiert.</span>
            </h1>
            <p class="t-body mhero__sub">
                Wähle dein Fahrzeug – wir zeigen dir nur Felgen, die dafür freigegeben sind.
            </p>

            <Link href="/felgen-suchen" class="btn btn--primary btn--block btn--lg mhero__cta">
                Fahrzeug wählen
            </Link>
        </div>
    </section>

    <section class="mtrust">
        <ul>
            <li v-for="item in TRUST" :key="item">
                <Icon name="check" :size="20" />
                {{ item }}
            </li>
        </ul>
    </section>

    <section class="section surface">
        <div class="wrap">
            <div class="between">
                <h2 class="t-h2">Bestseller aus {{ month }}</h2>
            </div>
            <div class="rail msection__rail">
                <ProductCard
                    v-for="card in bestsellers.slice(0, 6)"
                    :key="`${card.modelId}-${card.finishId}`"
                    :card="card"
                    :vehicle="shared.vehicle"
                />
            </div>
            <Link href="/felgen" class="btn btn--secondary btn--block">Alle Felgen ansehen</Link>
        </div>
    </section>

    <section class="section band">
        <div class="wrap">
            <h2 class="t-h2">Auto wählen, garantiert passende Felge finden</h2>
            <div class="mmakes">
                <Link
                    v-for="make in makes"
                    :key="make.make"
                    :href="`/felgen-suchen?marke=${encodeURIComponent(make.make)}`"
                    class="row-item"
                >
                    <span>{{ make.make }}</span>
                    <span class="data">{{ make.models }}</span>
                </Link>
            </div>
        </div>
    </section>

    <section class="section surface">
        <div class="wrap">
            <h2 class="t-h2">Entdecke die beliebtesten Felgenmarken</h2>
            <div class="mbrands">
                <Link
                    v-for="brand in brands"
                    :key="brand.slug"
                    :href="`/felgen?marke=${encodeURIComponent(brand.name)}`"
                    class="row-item"
                >
                    <span>{{ brand.name }}</span>
                    <Icon name="chevron-right" :size="20" />
                </Link>
            </div>
        </div>
    </section>

    <section class="section band">
        <div class="wrap">
            <h2 class="t-h2">Dein Vorteil: <span class="maccent">✓ RIMIFY-CHECK</span></h2>
            <p class="t-body">
                Mit RIMIFY CHECK prüfen wir die Kompatibilität zwischen Fahrzeug und Felge. So kannst
                du sicher sein, dass deine Wunschfelge zu deinem Fahrzeug passt und zugelassen ist.
            </p>

            <div class="rcheck-panel mcheck">
                <p class="rcheck-panel__head"><Icon name="check-circle" :size="20" /> RIMIFY-CHECK</p>
                <div class="mcheck__row">
                    <span class="micro">Fahrzeug</span>
                    <p class="mcheck__value">BMW M4 F82</p>
                </div>
                <div class="mcheck__row">
                    <span class="micro">Felge</span>
                    <p class="mcheck__value">Wheelforce CF.3</p>
                </div>
                <p class="mcheck__verdict">
                    <Icon name="check" :size="20" />
                    Freigegeben – keine Eintragung erforderlich
                </p>
            </div>

            <Link href="/rimify-check" class="btn btn--primary btn--block mcheck__cta">RIMIFY-CHECK</Link>
        </div>
    </section>

    <section class="section surface">
        <div class="wrap stack-4">
            <h2 class="t-h2">Warum RIMIFY?</h2>
            <article v-for="reason in REASONS" :key="reason.title" class="card">
                <h3 class="t-h3">{{ reason.title }}</h3>
                <p class="t-body">{{ reason.body }}</p>
            </article>
        </div>
    </section>

    <section class="section band">
        <div class="wrap stack-4">
            <h2 class="t-h2">Dein Felgenpaket</h2>

            <article class="card">
                <span class="micro">Lieferung</span>
                <ul class="mpack">
                    <li><Icon name="check" :size="20" /> Felgen</li>
                    <li><Icon name="check" :size="20" /> inkl. Anbauset &amp; ABE</li>
                </ul>
            </article>

            <article class="card card--lifted mpack__rec">
                <span class="tag tag--ok">EMPFOHLEN</span>
                <h3 class="t-h3">Komplettrad</h3>
                <ul class="mpack">
                    <li><Icon name="check" :size="20" /> inkl. Montage der Reifen auf die Felgen</li>
                    <li><Icon name="check" :size="20" /> inkl. Wuchten</li>
                    <li><Icon name="check" :size="20" /> inkl. Ventile &amp; Gewichte</li>
                </ul>
            </article>

            <Link href="/felgen-suchen" class="btn btn--primary btn--block">
                Jetzt Auto wählen und passende Felgen finden
            </Link>
        </div>
    </section>

    <section class="section surface">
        <div class="wrap stack-4">
            <h2 class="t-h2">Meistgestellte Fragen</h2>
            <Link href="/faq" class="btn btn--secondary btn--block">Alle Fragen ansehen</Link>

            <article class="card mhelp">
                <div class="mhelp__art">
                    <Photo :photo="PHOTOS.werkstatt">
                        <Scene name="werkstatt" :width="420" />
                    </Photo>
                </div>
                <div class="mhelp__body">
                    <h3 class="t-h3">Weitere Fragen oder Unterstützung benötigt?</h3>
                    <p class="t-body">Wir freuen uns von dir zu hören.</p>
                    <Link href="/kontakt" class="btn btn--secondary btn--block">Zum Kontaktformular</Link>
                </div>
            </article>
        </div>
    </section>
</template>

<style scoped>
.mhero {
    position: relative;
    background: var(--black);
    color: #fff;
    overflow: hidden;
    min-height: 78vh;
    display: flex;
    align-items: flex-end;
}

.mhero__art,
.mhero__scrim {
    position: absolute;
    inset: 0;
}

.mhero__art :deep(svg) {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.mhero__scrim {
    background: linear-gradient(
        180deg,
        rgba(4, 6, 10, 0.5) 0%,
        rgba(4, 6, 10, 0.72) 48%,
        rgba(4, 6, 10, 0.94) 100%
    );
}

/* The selector sits in the lower two thirds so it is reachable one-handed. */
.mhero__inner {
    position: relative;
    padding: var(--s8) var(--gutter-m) var(--s7);
}

.mhero__eyebrow {
    color: rgba(255, 255, 255, 0.72);
}

.mhero__title {
    margin: var(--s2) 0 var(--s3);
    color: #fff;
}

.mhero__accent {
    color: #8fa6ff;
}

.mhero__sub {
    color: rgba(255, 255, 255, 0.82);
}

.mhero__cta {
    margin-top: var(--s5);
}

.mtrust {
    background: var(--black);
    padding: 0 var(--gutter-m) var(--s6);
}

.mtrust ul {
    display: grid;
    gap: var(--s2);
    margin: 0;
    padding: 0;
    list-style: none;
}

.mtrust li {
    display: flex;
    align-items: center;
    gap: var(--s2);
    color: rgba(255, 255, 255, 0.86);
    font-size: 14px;
    font-weight: 700;
}

.msection__rail {
    margin-block: var(--s4);
}

.mmakes,
.mbrands {
    display: grid;
    gap: var(--s2);
    margin-top: var(--s4);
}

.maccent {
    color: var(--blue);
}

.mcheck {
    margin-top: var(--s4);
}

.mcheck__row + .mcheck__row {
    margin-top: var(--s3);
}

.mcheck__value {
    margin: 2px 0 0;
    font-size: 15px;
    font-weight: 700;
}

.mcheck__verdict {
    display: flex;
    align-items: center;
    gap: var(--s2);
    margin: var(--s3) 0 0;
    padding-top: var(--s3);
    border-top: 1px solid var(--bline);
    color: var(--ok);
    font-size: 14px;
    font-weight: 700;
}

.mcheck__cta {
    margin-top: var(--s4);
}

.mpack {
    display: grid;
    gap: var(--s2);
    margin: var(--s3) 0 0;
    padding: 0;
    list-style: none;
    font-size: 15px;
}

.mpack li {
    display: flex;
    align-items: flex-start;
    gap: var(--s2);
    color: var(--ink2);
}

.mpack :deep(svg) {
    color: var(--ok);
    flex: none;
}

.mpack__rec h3 {
    margin: var(--s2) 0 0;
}

.mhelp {
    padding: 0;
    overflow: hidden;
}

.mhelp__art {
    position: relative;
    aspect-ratio: 16 / 10;
    overflow: hidden;
}

.mhelp__body {
    padding: var(--s4);
}

.mhelp__body h3 {
    margin: 0 0 var(--s2);
}
</style>
