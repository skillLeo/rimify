<script setup lang="ts">
/**
 * The design specimen: every token and every component in every state, on one page, so that a
 * component is reviewed once here before any page is built on it. Local and test only.
 */

import { Head } from '@inertiajs/vue3'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { ref } from 'vue'
import AppLayout from '../../Layouts/AppLayout.vue'
import Accordion from '../../Components/Ui/Accordion.vue'
import Dialog from '../../Components/Ui/Dialog.vue'
import Icon from '../../Components/Ui/Icon.vue'
import Kbd from '../../Components/Ui/Kbd.vue'
import Picture from '../../Components/Ui/Picture.vue'
import ProductTile from '../../Components/Ui/ProductTile.vue'
import ProductTileSkeleton from '../../Components/Ui/ProductTileSkeleton.vue'
import SpecCallout from '../../Components/Ui/SpecCallout.vue'
import TyreLabel from '../../Components/Ui/TyreLabel.vue'
import VerdictBadge from '../../Components/Ui/VerdictBadge.vue'
import { ICON_NAMES } from '../../icons'
import { euro, withUnit } from '../../format'
import hero from '../../images/hero.json'
import type { ProductCardProp, VehicleProp, VerdictStatus } from '../../types/rimify'

defineOptions({ layout: AppLayout })

defineProps<{ cards: ProductCardProp[] }>()

const dialogOpen = ref(false)
const drawerOpen = ref(false)
const sheetOpen = ref(false)
const frameReady = ref(false)
const busy = ref(false)

const COLOURS = [
    ['c-ink', 'Text'], ['c-ink-2', 'Text, sekundär'], ['c-ink-3', 'Text, tertiär'],
    ['c-line', 'Trennlinie'], ['c-line-2', 'Rahmen, stark'], ['c-surface', 'Fläche'], ['c-band', 'Band'],
    ['c-dark', 'Dunkles Band'], ['c-dark-2', 'Dunkel, sekundär'], ['c-on-dark-2', 'Text auf dunkel'],
    ['c-blue', 'Aktion'], ['c-blue-hover', 'Aktion, hover'], ['c-blue-press', 'Aktion, gedrückt'], ['c-blue-tint', 'Aktion, Fläche'],
    ['c-ok', 'Freigegeben'], ['c-ok-tint', 'Freigegeben, Fläche'], ['c-warn', 'Mit Auflagen'], ['c-warn-tint', 'Mit Auflagen, Fläche'],
    ['c-bad', 'Nicht freigegeben'], ['c-bad-tint', 'Nicht freigegeben, Fläche'], ['c-unk', 'Unbekannt'], ['c-unk-tint', 'Unbekannt, Fläche'],
    ['c-star', 'Bewertung'],
] as const

const TYPE = [
    ['display', 'Display · 64/68 · 700 · 112 %'], ['h1', 'H1 · 48/54 · 700 · 110 %'], ['h2', 'H2 · 36/42 · 700 · 110 %'],
    ['h3', 'H3 · 24/30 · 600'], ['h4', 'H4 · 20/28 · 600'], ['body-l', 'Body L · 18/28'], ['body', 'Body · 16/24'],
    ['small', 'Small · 14/20'], ['micro', 'Micro · 12/16'],
] as const

const SPACE = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128]

const VERDICTS: VerdictStatus[] = ['PERMITTED', 'CONDITIONAL', 'NOT_PERMITTED', 'UNKNOWN']

const FAQ = [
    { id: 1, title: 'Woher weiß RIMIFY, welche Felge an mein Auto darf?', body: 'Aus dem Gutachten. Jede Felge hat ein Gutachten oder eine ABE, in der die freigegebenen Fahrzeuge mit Typ und Genehmigungsnummer stehen. Wir lesen genau diese Liste und zeigen dir nur Felgen, in deren Liste dein Fahrzeug steht.' },
    { id: 2, title: 'Was bedeutet „Mit Auflagen“?', body: 'Die Felge ist freigegeben, aber das Gutachten nennt Bedingungen – zum Beispiel bestimmte Reifengrößen, Radschrauben oder eine Eintragung in die Fahrzeugpapiere. Wir schreiben dir jede Auflage als Satz dazu.' },
    { id: 3, title: 'Wo finde ich HSN und TSN?', body: 'In der Zulassungsbescheinigung Teil I: die HSN in Feld 2.1, die TSN in den ersten drei Zeichen von Feld 2.2.' },
]

const vehicle: VehicleProp = {
    id: 1, make: 'BMW', model: '3er', variant: '3er Coupé (E46) 320Ci', label: 'BMW 3er Coupé (E46) 320Ci', short: 'BMW 3er',
    hsn: '0005', tsn: '582', keyNumbers: '0005/582', buildWindow: '1999–2006',
}

const conditionalCard = (card: ProductCardProp): ProductCardProp => ({
    ...card,
    fitment: { status: 'CONDITIONAL', requiresEntry: true, conditions: ['Nur mit den angegebenen Radschrauben zulässig.', 'Eintragung in die Fahrzeugpapiere erforderlich.'] },
})

function simulateBusy(): void {
    busy.value = true
    setTimeout(() => (busy.value = false), 1800)
}
</script>

<template>
    <Head title="Design" />

    <div class="container specimen">
        <header class="specimen__head">
            <h1 class="h1">Design-System</h1>
            <p class="body-l muted prose">Jeder Token und jede Komponente in jedem Zustand. Was hier freigegeben ist, wird auf den Seiten verbaut – nichts anderes.</p>
        </header>

        <!-- Colour -->
        <section class="specimen__section" aria-labelledby="s-colour">
            <h2 id="s-colour" class="h2">Farbe</h2>
            <ul class="swatches">
                <li v-for="[token, role] in COLOURS" :key="token" class="swatch">
                    <span class="swatch__chip" :style="{ background: `var(--${token})` }" />
                    <span class="small">{{ role }}</span>
                    <span class="micro quiet num">--{{ token }}</span>
                </li>
            </ul>
        </section>

        <!-- Type -->
        <section class="specimen__section" aria-labelledby="s-type">
            <h2 id="s-type" class="h2">Schrift</h2>
            <dl class="type-scale">
                <template v-for="[cls, note] in TYPE" :key="cls">
                    <dt class="small quiet num">{{ note }}</dt>
                    <dd :class="cls">Felgen, die an dein Auto dürfen.</dd>
                </template>
            </dl>
            <p class="body prose" style="margin-top: var(--sp-24)">
                Die Kraftfahrzeug-Zulassungsbescheinigung Teil I nennt in Feld 2.1 die Herstellerschlüsselnummer und in Feld 2.2 die
                Typschlüsselnummer. Ein Reifendruckkontrollsystem ist seit November 2014 für neu zugelassene Pkw Pflicht.
                Preise wie <span class="num">{{ euro(123400) }}</span>, Maße wie <span class="num">{{ withUnit('72,6', 'mm') }}</span> und Größen wie
                <span class="num">{{ withUnit('8,5', 'J') }} × 19 · {{ withUnit('ET', '35') }} · {{ withUnit('LK', '5 × 120') }}</span> laufen in Tabellenziffern.
            </p>
        </section>

        <!-- Space, radius, elevation -->
        <section class="specimen__section" aria-labelledby="s-space">
            <h2 id="s-space" class="h2">Abstand, Radius, Ebenen</h2>
            <div class="spaces">
                <div v-for="n in SPACE" :key="n" class="space">
                    <span class="space__bar" :style="{ width: `var(--sp-${n})` }" />
                    <span class="micro quiet num">{{ n }}</span>
                </div>
            </div>
            <div class="samples" style="margin-top: var(--sp-32)">
                <div class="sample sample--control"><span class="small">4 px · Controls</span></div>
                <div class="sample sample--tile"><span class="small">8 px · Kacheln, Dialoge</span></div>
                <div class="sample sample--e1"><span class="small">--e-1 · Header</span></div>
                <div class="sample sample--e2"><span class="small">--e-2 · Menüs, Popover</span></div>
                <div class="sample sample--e3"><span class="small">--e-3 · Dialoge</span></div>
            </div>
        </section>

        <!-- Icons -->
        <section class="specimen__section" aria-labelledby="s-icons">
            <h2 id="s-icons" class="h2">Icons</h2>
            <ul class="icons">
                <li v-for="name in ICON_NAMES" :key="name" class="icons__item">
                    <Icon :name="name" :size="24" />
                    <span class="micro quiet">{{ name }}</span>
                </li>
            </ul>
        </section>

        <!-- Buttons -->
        <section class="specimen__section" aria-labelledby="s-buttons">
            <h2 id="s-buttons" class="h2">Buttons</h2>
            <div class="row">
                <button class="btn btn--primary" type="button">147 passende Felgen anzeigen</button>
                <button class="btn btn--secondary" type="button">Fahrzeug ändern</button>
                <button class="btn btn--ghost" type="button">Entfernen</button>
                <button class="btn btn--primary" type="button" disabled>Fahrzeug wählen</button>
                <button class="btn btn--primary" type="button" :aria-busy="busy ? 'true' : undefined" @click="simulateBusy">Wird geprüft</button>
            </div>
            <div class="row">
                <button class="btn btn--primary btn--sm" type="button">Klein</button>
                <button class="btn btn--secondary btn--sm" type="button">Klein</button>
                <button class="btn btn--primary btn--lg" type="button">Groß – In den Warenkorb</button>
                <button class="icon-btn" type="button" aria-label="Suchen"><Icon name="search" :size="24" /></button>
                <button class="link" type="button">Wo finde ich HSN und TSN?</button>
            </div>
            <div class="row dark specimen__dark">
                <button class="btn btn--light" type="button">Kompletträder für mein Fahrzeug</button>
                <button class="btn btn--outline-light" type="button">Was ein Komplettrad ist</button>
            </div>
        </section>

        <!-- Fields -->
        <section class="specimen__section" aria-labelledby="s-fields">
            <h2 id="s-fields" class="h2">Felder</h2>
            <div class="fields">
                <div class="form-field">
                    <label class="form-field__label" for="sp-text">Marke</label>
                    <input id="sp-text" class="input" type="text" placeholder="z. B. BMW" />
                    <span class="form-field__help">Wie in der Zulassungsbescheinigung.</span>
                    <span class="form-field__error" />
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="sp-hsn">HSN</label>
                    <input id="sp-hsn" class="input input--code" type="text" inputmode="numeric" maxlength="4" value="0005" />
                    <span class="form-field__help">Feld 2.1</span>
                    <span class="form-field__error" />
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="sp-err">TSN</label>
                    <input id="sp-err" class="input input--code" type="text" value="5" aria-invalid="true" aria-describedby="sp-err-msg" />
                    <span class="form-field__help">Feld 2.2, die ersten drei Zeichen</span>
                    <span id="sp-err-msg" class="form-field__error"><Icon name="warning" :size="16" /> Die TSN hat drei Zeichen.</span>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="sp-select">Modell</label>
                    <select id="sp-select" class="input">
                        <option>3er Coupé (E46)</option>
                        <option>3er Limousine (E46)</option>
                        <option>3er Touring (E46)</option>
                    </select>
                    <span class="form-field__help" />
                    <span class="form-field__error" />
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="sp-dis">Fahrzeug</label>
                    <input id="sp-dis" class="input" type="text" disabled placeholder="Erst Modell wählen" />
                    <span class="form-field__help" />
                    <span class="form-field__error" />
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="sp-search">Suche</label>
                    <div class="input-group">
                        <span class="input-group__icon"><Icon name="search" :size="20" /></span>
                        <input id="sp-search" class="input" type="search" placeholder="Felge, Marke oder Größe" />
                    </div>
                    <span class="form-field__help" />
                    <span class="form-field__error" />
                </div>
            </div>
            <div class="row" style="margin-top: var(--sp-16)">
                <label class="check"><input type="checkbox" checked /> Ohne Eintragung</label>
                <label class="check"><input type="radio" name="sp-r" checked /> Felgen</label>
                <label class="check"><input type="radio" name="sp-r" /> Kompletträder</label>
            </div>
        </section>

        <!-- Chips, badges, verdicts -->
        <section class="specimen__section" aria-labelledby="s-chips">
            <h2 id="s-chips" class="h2">Chips, Badges, Freigaben</h2>
            <div class="chip-row">
                <button class="chip" type="button">17 Zoll</button>
                <button class="chip chip--on" type="button" aria-pressed="true">18 Zoll</button>
                <button class="chip chip--struck" type="button" aria-disabled="true">20 Zoll</button>
                <button class="chip" type="button">BMW 3er Coupé <Icon name="close" :size="16" /></button>
            </div>
            <div class="row" style="margin-top: var(--sp-16)">
                <span class="badge">Neu</span>
                <span class="badge badge--count">3</span>
                <span class="stock stock--in">Auf Lager</span>
                <span class="stock stock--low">Nur noch 4</span>
                <span class="stock stock--out">Ausverkauft</span>
                <Kbd :keys="['K']" modifier /> <Kbd :keys="['/']" />
            </div>
            <div class="row" style="margin-top: var(--sp-16)">
                <VerdictBadge v-for="status in VERDICTS" :key="status" :status="status" />
            </div>
            <div class="row" style="margin-top: var(--sp-8)">
                <VerdictBadge v-for="status in VERDICTS" :key="status" :status="status" size="lg" />
            </div>
        </section>

        <!-- Tiles -->
        <section class="specimen__section" aria-labelledby="s-tiles">
            <h2 id="s-tiles" class="h2">Produktkachel</h2>
            <div class="tile-grid">
                <ProductTile v-for="(card, i) in cards.slice(0, 2)" :key="card.finishId" :card="card" :eager="i === 0" compare />
                <ProductTile v-if="cards[2]" :card="{ ...cards[2], fitment: { status: 'PERMITTED', requiresEntry: false, conditions: [] } }" :vehicle="vehicle" compare />
                <ProductTile v-if="cards[3]" :card="conditionalCard(cards[3])" :vehicle="vehicle" compare />
            </div>
            <div class="tile-grid" style="margin-top: var(--sp-32)" role="group" aria-label="Ladezustand">
                <ProductTileSkeleton v-for="n in 4" :key="n" />
            </div>
        </section>

        <!-- Callout -->
        <section class="specimen__section" aria-labelledby="s-callout">
            <h2 id="s-callout" class="h2">Maßangabe im Foto</h2>
            <div class="frame specimen__frame" :class="{ 'is-ready': frameReady }">
                <Picture :image="hero" alt="Ein schwarzer Sportwagen mit blauer Leichtmetallfelge, von vorn und tief aufgenommen" sizes="(min-width: 1024px) 880px, 100vw" class="specimen__photo" @loaded="frameReady = true" />
                <SpecCallout label="Breite × Durchmesser" value="8,5 J × 19" :x="8" :y="14" :tx="46" :ty="52" />
                <SpecCallout label="Einpresstiefe" value="ET 35" :x="70" :y="20" :tx="58" :ty="46" />
                <SpecCallout label="Lochkreis" value="LK 5 × 120" :x="66" :y="72" :tx="55" :ty="60" />
            </div>
            <button class="btn btn--secondary btn--sm" type="button" style="margin-top: var(--sp-16)" @click="frameReady = !frameReady">
                {{ frameReady ? 'Linien zurücksetzen' : 'Linien einzeichnen' }}
            </button>
        </section>

        <!-- Tabs and accordion -->
        <section class="specimen__section" aria-labelledby="s-tabs">
            <h2 id="s-tabs" class="h2">Tabs und Akkordeon</h2>
            <TabsRoot default-value="beliebt" class="tabs">
                <TabsList class="tabs__list" aria-label="Auswahl">
                    <TabsTrigger value="beliebt" class="tabs__trigger">Beliebt</TabsTrigger>
                    <TabsTrigger value="neu" class="tabs__trigger">Neu</TabsTrigger>
                    <TabsTrigger value="preis" class="tabs__trigger">Bis 200 €</TabsTrigger>
                </TabsList>
                <TabsContent value="beliebt" class="tabs__content"><p class="muted">Die meistgekauften Felgen der letzten 30 Tage.</p></TabsContent>
                <TabsContent value="neu" class="tabs__content"><p class="muted">Neu im Sortiment.</p></TabsContent>
                <TabsContent value="preis" class="tabs__content"><p class="muted">Alles unter 200 € pro Felge.</p></TabsContent>
            </TabsRoot>
            <div class="specimen__faq">
                <Accordion :items="FAQ" />
            </div>
        </section>

        <!-- Table and specs -->
        <section class="specimen__section" aria-labelledby="s-table">
            <h2 id="s-table" class="h2">Tabelle und Daten</h2>
            <div class="table-scroll" role="region" aria-label="Gutachten-Auszug (Beispiel)" tabindex="0">
                <table class="table table--rows">
                    <thead>
                        <tr><th>Hersteller</th><th>Handelsname</th><th>Typ</th><th>Genehmigung</th><th class="num">Reifen</th></tr>
                    </thead>
                    <tbody>
                        <tr aria-current="true"><td>BMW</td><td>3er Coupé</td><td>346C</td><td>e1*2001/116*0136*</td><td class="num">225/40 R18</td></tr>
                        <tr><td>BMW</td><td>3er Touring</td><td>346L</td><td>e1*98/14*0090*</td><td class="num">225/45 R17</td></tr>
                        <tr><td>Audi</td><td>A4 Avant</td><td>B8</td><td>e1*2001/116*0430*</td><td class="num">245/40 R18</td></tr>
                    </tbody>
                </table>
            </div>
            <dl class="specs specimen__specs">
                <dt>Felgenbreite</dt><dd>{{ withUnit('8,5', 'J') }}</dd>
                <dt>Durchmesser</dt><dd>{{ withUnit(19, 'Zoll') }}</dd>
                <dt>Einpresstiefe</dt><dd>{{ withUnit('ET', '35') }}</dd>
                <dt>Lochkreis</dt><dd>{{ withUnit(5, '× 120') }}</dd>
                <dt>Mittenlochbohrung</dt><dd>{{ withUnit('72,6', 'mm') }}</dd>
            </dl>
        </section>

        <!-- Tyre label -->
        <section class="specimen__section" aria-labelledby="s-tyre">
            <h2 id="s-tyre" class="h2">EU-Reifenlabel</h2>
            <TyreLabel fuel="B" wet="A" :noise-db="71" noise-class="B" title="Continental PremiumContact 7 · 225/45 R18 95Y" />
        </section>

        <!-- Overlays -->
        <section class="specimen__section" aria-labelledby="s-overlays">
            <h2 id="s-overlays" class="h2">Dialog, Drawer, Sheet, Hinweise</h2>
            <div class="row">
                <button class="btn btn--secondary" type="button" @click="dialogOpen = true">Dialog öffnen</button>
                <button class="btn btn--secondary" type="button" @click="drawerOpen = true">Drawer öffnen</button>
                <button class="btn btn--secondary" type="button" @click="sheetOpen = true">Sheet öffnen</button>
            </div>
            <div class="notices">
                <div class="notice"><Icon name="info" :size="20" /><p>Die Erkennung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen.</p></div>
                <div class="notice notice--warn"><Icon name="warning" :size="20" /><p>Für dieses Fahrzeug haben wir noch keine Felge mit Gutachten.</p></div>
                <div class="notice notice--bad"><Icon name="close" :size="20" /><p>Die Bestellung wurde nicht ausgelöst. Bitte versuche es erneut oder wähle eine andere Zahlungsart.</p></div>
                <div class="notice notice--ok"><Icon name="check" :size="20" /><p>Dein Fahrzeug ist gespeichert.</p></div>
            </div>
            <div class="empty">
                <Icon name="cart" :size="24" />
                <p class="empty__title">Noch keine Felgen im Warenkorb</p>
                <p class="empty__text">Wähle dein Fahrzeug, dann zeigen wir dir nur Felgen mit Gutachten dafür.</p>
                <button class="btn btn--primary" type="button">Fahrzeug wählen</button>
            </div>
        </section>

        <Dialog v-model:open="dialogOpen" title="Fahrzeug entfernen?" description="Dein Warenkorb bleibt erhalten. Die Freigaben werden neu geprüft, sobald du ein Fahrzeug wählst.">
            <template #actions>
                <button class="btn btn--secondary" type="button" @click="dialogOpen = false">Abbrechen</button>
                <button class="btn btn--primary" type="button" @click="dialogOpen = false">Fahrzeug entfernen</button>
            </template>
        </Dialog>

        <Dialog v-model:open="drawerOpen" variant="drawer" title="Menü">
            <nav aria-label="Menü">
                <a class="menu__item" href="/felgen">Felgen</a>
                <a class="menu__item" href="/rimify-check">RIMIFY-Check</a>
                <a class="menu__item" href="/faq">FAQ</a>
                <a class="menu__item" href="/kontakt">Kontakt</a>
            </nav>
        </Dialog>

        <Dialog v-model:open="sheetOpen" variant="sheet" title="Dein Fahrzeug">
            <p class="h4">BMW 3er Coupé (E46) 320Ci</p>
            <p class="small muted num">0005/582 · 1999–2006</p>
            <template #actions>
                <button class="btn btn--secondary btn--block" type="button" @click="sheetOpen = false">Fahrzeug entfernen</button>
                <button class="btn btn--primary btn--block" type="button" @click="sheetOpen = false">Fahrzeug ändern</button>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.specimen {
    padding-block: var(--sp-48) var(--sp-96);
}

.specimen__head {
    display: grid;
    gap: var(--sp-16);
    margin-bottom: var(--sp-64);
}

.specimen__section {
    display: grid;
    gap: var(--sp-24);
    justify-items: start;
    padding-block: var(--sp-48);
    border-top: 1px solid var(--c-line);
}

.specimen__section > .swatches,
.specimen__section > .type-scale,
.specimen__section > .icons,
.specimen__section > .fields,
.specimen__section > .tile-grid,
.specimen__section > .table-scroll,
.specimen__section > .tabs,
.specimen__section > .specimen__frame {
    justify-self: stretch;
}

.specimen__faq {
    width: 100%;
    max-width: 760px;
    margin-top: var(--sp-16);
}

.specimen__specs {
    width: 100%;
    max-width: 480px;
    margin-top: var(--sp-32);
}

.row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-12);
}

.specimen__dark {
    padding: var(--sp-24);
    border-radius: var(--r-tile);
}

.swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--sp-16);
}

.swatch {
    display: grid;
    gap: var(--sp-4);
}

.swatch__chip {
    display: block;
    height: 56px;
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
}

.type-scale {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--sp-8) var(--sp-24);
}

.type-scale dt {
    margin-top: var(--sp-16);
}

.spaces {
    display: grid;
    gap: var(--sp-8);
}

.space {
    display: flex;
    align-items: center;
    gap: var(--sp-12);
}

.space__bar {
    display: block;
    height: 12px;
    background: var(--c-blue);
}

.samples {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-24);
}

.sample {
    display: grid;
    place-items: center;
    width: 180px;
    height: 100px;
    background: var(--c-surface);
}

.sample--control {
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-control);
}

.sample--tile {
    background: var(--c-band);
    border-radius: var(--r-tile);
}

.sample--e1 {
    box-shadow: var(--e-1);
}

.sample--e2 {
    border-radius: var(--r-tile);
    box-shadow: var(--e-2);
}

.sample--e3 {
    border-radius: var(--r-tile);
    box-shadow: var(--e-3);
}

.icons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: var(--sp-16);
}

.icons__item {
    display: grid;
    justify-items: center;
    gap: var(--sp-8);
    padding: var(--sp-12) 0;
}

.fields {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--sp-24);
}

.specimen__frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    max-width: 880px;
    overflow: hidden;
    border-radius: var(--r-tile);
    background: var(--c-dark-2);
}

.specimen__photo {
    position: absolute;
    inset: 0;
}

.notices {
    display: grid;
    gap: var(--sp-12);
    max-width: 640px;
}

@media (min-width: 768px) {
    .type-scale {
        grid-template-columns: 220px minmax(0, 1fr);
        align-items: baseline;
    }

    .type-scale dt {
        margin-top: 0;
    }
}
</style>
