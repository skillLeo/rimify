<script setup lang="ts">
/**
 * Step 2, Felge (the brief §7, changed in v2): one paper is for one wheel in one size, so the step asks for exactly one
 * size — listed by dimension, its colours as dots beneath. Colours are not chosen: every colour of the size is covered.
 */

import { computed, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import { decimal, withUnit } from '../../../../format'
import { PAPER_WHEEL, WHEELS, sizeName } from '../gutachtenDemo'
import { useSketch } from '../gutachtenStore'

const { state, go } = useSketch()

const query = ref('DB8GT2')

const found = computed(() => {
    const q = query.value.trim().toLowerCase()

    return q === '' ? WHEELS : WHEELS.filter((wheel) => `${wheel.brand} ${wheel.model}`.toLowerCase().includes(q))
})

function choose(wheelId: string, sizeId: string): void {
    state.wheelId = wheelId
    state.sizeId = sizeId
}
</script>

<template>
    <section class="sk-step" aria-labelledby="sk-wheel-h">
        <h2 id="sk-wheel-h" class="adm-section__title" tabindex="-1">Für welche Felge gilt das Gutachten?</h2>
        <p class="adm-note">Ein Gutachten gilt für eine Felge in einer Größe. Wähl die Größe; ihre Farben gelten alle mit.</p>

        <div class="sk-wheel">
            <div class="form-field sk-wheel__search">
                <label class="form-field__label" for="sk-wheel-q">Felge suchen</label>
                <input id="sk-wheel-q" v-model="query" class="input" type="search" placeholder="Marke, Modell oder Radtyp" autocomplete="off">
            </div>

            <p class="sk-wheel__paper"><strong>Im Gutachten:</strong> {{ PAPER_WHEEL }}</p>

            <fieldset v-for="wheel in found" :key="wheel.id" class="sk-fieldset sk-wheel__model">
                <legend class="sk-wheel__name">{{ wheel.brand }} {{ wheel.model }}</legend>
                <label v-for="size in wheel.sizes" :key="size.id" class="sk-size" :class="{ 'sk-size--on': state.sizeId === size.id }">
                    <input class="sk-size__radio" type="radio" name="sk-size" :checked="state.sizeId === size.id" @change="choose(wheel.id, size.id)">
                    <span class="sk-size__text">
                        <span class="sk-size__dim">{{ sizeName(size) }} · Mittenloch {{ withUnit(decimal(size.bore, 1), 'mm') }}</span>
                        <span class="sk-size__colours">
                            <span v-for="colour in size.colours" :key="colour.name" class="sk-size__colour">
                                <span class="sk-dot" data-qa-ignore :style="{ '--swatch': colour.hex }" />
                                {{ colour.name }}
                            </span>
                            <span v-if="size.colours.length === 1" class="sk-size__only">nur in dieser Farbe</span>
                        </span>
                    </span>
                </label>
            </fieldset>

            <p v-if="found.length === 0" class="adm-note">Keine Felge gefunden. In der Skizze gibt es Borbet DB8GT2 und BBS LeMans.</p>

            <p class="adm-note sk-wheel__colours">
                Farben wählst du hier nicht. Das Gutachten gilt für jede Farbe dieser Größe, auch für eine, die später dazukommt.
            </p>
        </div>

        <div class="sk-actions">
            <button class="btn btn--secondary sk-actions__left" type="button" @click="go(0)">Zurück</button>
            <button class="btn btn--primary" type="button" @click="go(2)">
                Weiter: Fahrzeuge
                <Icon name="arrow-right" :size="20" />
            </button>
        </div>
    </section>
</template>

<style scoped>
.sk-wheel {
    display: grid;
    gap: var(--sp-16);
    max-width: var(--adm-form-max);
    margin-top: var(--sp-20);
}

.sk-wheel__search .input {
    max-width: calc(40 * var(--ch-text));
}

.sk-wheel__paper {
    margin: 0;
    padding: var(--sp-12) var(--sp-16);
    border-radius: var(--r-control);
    background: var(--c-band);
    font-size: var(--fs-small);
    line-height: var(--lh-small);
}

.sk-wheel__model {
    display: grid;
    gap: var(--sp-8);
}

.sk-wheel__name {
    margin-bottom: var(--sp-8);
    font-weight: 600;
}

.sk-size {
    display: flex;
    gap: var(--sp-12);
    align-items: flex-start;
    padding: var(--sp-12) var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
    cursor: pointer;
}

.sk-size--on {
    border-color: var(--c-blue);
    background: var(--c-blue-tint);
}

.sk-size__radio {
    margin-top: 3px;
}

.sk-size__text {
    display: grid;
    gap: var(--sp-4);
}

.sk-size__dim {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.sk-size__colours {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-4) var(--sp-12);
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.sk-size__colour {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-4);
}

.sk-size__only {
    color: var(--c-ink-3);
}

.sk-dot {
    width: 12px;
    height: 12px;
    border: 1px solid var(--c-line-2);
    border-radius: var(--r-round);
    background: var(--swatch, var(--c-ink-2));
}

.sk-wheel__colours {
    max-width: none;
}
</style>
